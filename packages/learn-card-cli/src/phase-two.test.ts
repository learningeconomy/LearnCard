import { describe, expect, it, vi } from 'vitest';
import { consentUrl } from './consent-contract';
import { personalizeClaimButton, validateDomains } from './embed';
import { PRODUCTION_NETWORK, STAGING_NETWORK } from './project';
import { closeWebhookReceiver, loadWebhookModule, webhookConfig } from './webhook';

describe('consent URL', () => {
    it('encodes both parameters and selects the app for the network', () => {
        for (const [network, origin] of [
            [PRODUCTION_NETWORK, 'https://learncard.app'],
            [STAGING_NETWORK, 'https://staging.learncard.ai'],
            ['http://localhost:4000/trpc', 'https://learncard.app'],
        ]) {
            const url = new URL(
                consentUrl('lc:network:contract?a&b', 'https://example.com/cb?a=1&b=2', network!)
            );
            expect(url.origin).toBe(origin);
            expect(url.searchParams.get('uri')).toBe('lc:network:contract?a&b');
            expect(url.searchParams.get('returnTo')).toBe('https://example.com/cb?a=1&b=2');
        }
    });
});

describe('embed helpers', () => {
    it('uses the network domain/origin validator, including its error message', () => {
        expect(validateDomains('http://localhost:3000, example.com')).toEqual([
            'http://localhost:3000',
            'example.com',
        ]);
        for (const invalid of [
            '',
            'https://example.com/path',
            'file://example.com',
            'https://*.example.com',
        ]) {
            expect(() => validateDomains(invalid)).toThrow(/Must be a valid/);
        }
    });
    it('substitutes keys safely, including replacement and script-closing characters', () => {
        const html = personalizeClaimButton("pk_$&'</script>", 'http://localhost:4000/api');
        expect(html).not.toContain('PUBLISHABLE_KEY_PLACEHOLDER');
        expect(html).toContain("pk_$&'\\u003c/script>");
        expect(html).toContain('http://localhost:4000/api');
        expect(html).toContain('LearnCard.init(');
    });
});

describe('canonical webhook helpers', () => {
    it('resolves trusted DID and port from the project with explicit overrides', () => {
        const env = { PORT: '9000', EXPECTED_NETWORK_DID: 'did:key:project' };
        expect(webhookConfig(env, {}, {})).toEqual({ port: 9000, expectedDid: 'did:key:project' });
        expect(
            webhookConfig(
                env,
                { port: '9001' },
                { PORT: '9002', EXPECTED_NETWORK_DID: 'did:key:runtime' }
            )
        ).toEqual({ port: 9001, expectedDid: 'did:key:runtime' });
        expect(() => webhookConfig({}, { port: '0' }, {})).toThrow('Port must be');
    });
    it('closes connections even when verification never completes', async () => {
        const { createWebhookReceiver } = await loadWebhookModule();
        let started!: () => void;
        const verifying = new Promise<void>(resolve => {
            started = resolve;
        });
        const server = createWebhookReceiver({
            invoke: {
                verifyPresentation: () => {
                    started();
                    return new Promise(() => {});
                },
            },
        });
        await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
        const address = server.address();
        if (!address || typeof address === 'string') throw new Error('Expected TCP address');
        const request = fetch(`http://127.0.0.1:${address.port}`, {
            method: 'POST',
            headers: { Authorization: 'Bearer pending' },
            body: '{}',
        }).catch(() => undefined);
        await verifying;
        await closeWebhookReceiver(server);
        await request;
        expect(server.listening).toBe(false);
    });
    it('rejects invalid authentication and payloads, and acknowledges duplicate events once', async () => {
        const { createWebhookReceiver } = await loadWebhookModule();
        const verifyPresentation = vi.fn().mockResolvedValue({ errors: [] });
        const server = createWebhookReceiver({ invoke: { verifyPresentation } }, 'did:key:trusted');
        const log = vi.spyOn(console, 'log').mockImplementation(() => {});
        await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
        const address = server.address();
        if (!address || typeof address === 'string') throw new Error('Expected TCP address');
        const url = `http://127.0.0.1:${address.port}`;
        const token = (iss: string): string =>
            `header.${Buffer.from(JSON.stringify({ iss })).toString('base64url')}.signature`;
        const post = (body: string, bearer = token('did:key:trusted')) =>
            fetch(url, {
                method: 'POST',
                headers: { Authorization: `Bearer ${bearer}` },
                body,
            });
        try {
            expect((await fetch(url, { method: 'POST' })).status).toBe(401);
            expect((await post('{}', token('did:key:other'))).status).toBe(403);
            verifyPresentation.mockResolvedValueOnce({ errors: ['invalid signature'] });
            expect((await post('{}')).status).toBe(401);
            expect((await post('{')).status).toBe(400);
            expect((await post('{}')).status).toBe(400);
            const data = { inbox: { issuanceId: 'same-id', status: 'PENDING' } };
            const delivered = JSON.stringify({ type: 'ISSUANCE_DELIVERED', data });
            expect((await post(delivered)).status).toBe(200);
            expect((await post(delivered)).status).toBe(200);
            expect((await post(JSON.stringify({ type: 'ISSUANCE_CLAIMED', data }))).status).toBe(
                200
            );
            expect(log).toHaveBeenCalledTimes(2);
            expect(verifyPresentation).toHaveBeenCalledWith(expect.any(String), {
                proofFormat: 'jwt',
            });
        } finally {
            log.mockRestore();
            await new Promise<void>((resolve, reject) =>
                server.close(error => (error ? reject(error) : resolve()))
            );
        }
    });
    it('extracts only bearer credentials', async () => {
        const { extractBearer } = await loadWebhookModule();
        expect(extractBearer('Bearer abc.def.ghi')).toBe('abc.def.ghi');
        expect(extractBearer('bearer   token')).toBe('token');
        for (const invalid of [undefined, null, [], 'Basic abc', 'Bearer', 'Bearer a b']) {
            expect(extractBearer(invalid)).toBeUndefined();
        }
    });
    it('deduplicates retries without conflating delivered and claimed', async () => {
        const { webhookDedupeKey } = await loadWebhookModule();
        const data = { inbox: { issuanceId: 'abc' } };
        expect(webhookDedupeKey({ type: 'ISSUANCE_DELIVERED', data })).toBe(
            'ISSUANCE_DELIVERED:abc'
        );
        expect(webhookDedupeKey({ type: 'ISSUANCE_CLAIMED', data })).toBe('ISSUANCE_CLAIMED:abc');
        for (const invalid of [
            null,
            {},
            { type: 'OTHER', data },
            { type: 'ISSUANCE_DELIVERED', data: { inbox: {} } },
        ]) {
            expect(webhookDedupeKey(invalid)).toBeUndefined();
        }
    });
});

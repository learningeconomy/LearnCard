import { describe, expect, it } from 'vitest';
import { createVerifierHandler } from './handler';
import { createLabCredential, ISSUER, issuerPublicKey, encode, fixture } from '../web/fixture';
import { prepareLabPresentation } from '../web/presentation';
import { ISSUER_JWK, QUERY } from './contract';

const ORIGIN = 'https://verifier.example';
const post = (path: string, cookie?: string, body?: unknown, origin = ORIGIN) =>
    new Request(`${ORIGIN}${path}`, {
        method: 'POST',
        headers: {
            Origin: origin,
            'Content-Type': 'application/json',
            ...(cookie ? { Cookie: cookie } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
const start = async (handler: ReturnType<typeof createVerifierHandler>, cookie?: string) => {
    const response = await handler(post('/api/request', cookie));
    expect(response.status).toBe(200);
    expect(response.headers.get('Set-Cookie')).toContain('Secure; HttpOnly; SameSite=Strict');
    return {
        request: (await response.json()).request,
        cookie: response.headers.get('Set-Cookie')!.split(';')[0],
    };
};
const present = async (
    request: { protocol: string; data: Record<string, unknown> },
    origin = ORIGIN
) => {
    const credential = await createLabCredential();
    const prepared = await prepareLabPresentation(
        { requestId: 'test', selectedEntryId: credential.id, request, origin },
        credential
    );
    return JSON.parse(await prepared.approve());
};

describe('independent browser verifier', () => {
    it('pins the public fixture contract and verifies a real independent request/response without leaking payloads', async () => {
        expect(ISSUER_JWK.x).toBe(encode(issuerPublicKey));
        expect(ISSUER_JWK.kid).toBe(`${ISSUER}#${ISSUER.slice('did:key:'.length)}`);
        expect(QUERY.credentials[0].meta?.vct_values).toEqual([fixture.template.vct]);
        const handler = createVerifierHandler(ORIGIN);
        const { request, cookie } = await start(handler);
        const response = await present(request);
        const verified = await handler(post('/api/verify', cookie, response));
        expect(verified.status).toBe(200);
        expect(await verified.json()).toEqual({
            verified: true,
            verifier: '@openeudi/openid4vp 0.18.0',
            fields: ['Course name', 'Completion date'],
        });
        expect((await handler(post('/api/verify', cookie, response))).status).toBe(409);
    });

    it.each(['nonce', 'origin', 'issuer'] as const)(
        'rejects wrong %s without returning a library error or credential',
        async change => {
            const handler = createVerifierHandler(ORIGIN);
            const { request, cookie } = await start(handler);
            if (change === 'nonce') request.data.nonce = 'wrong-nonce';
            const response = await present(
                request,
                change === 'origin' ? 'https://wrong.example' : ORIGIN
            );
            if (change === 'issuer') {
                const compact = response.data.vp_token.course_completion[0] as string;
                const dot = compact.indexOf('.');
                const header = JSON.parse(atob(compact.slice(0, dot)));
                header.kid = 'untrusted-issuer-key';
                response.data.vp_token.course_completion[0] =
                    btoa(JSON.stringify(header)).replace(/=/g, '') + compact.slice(dot);
            }
            const verified = await handler(post('/api/verify', cookie, response));
            expect(verified.status).toBe(422);
            expect(await verified.json()).toEqual({
                error: 'The returned credential could not be verified.',
            });
        }
    );

    it('keeps simultaneous browsers separate, replaces stale sessions and consumes cancellation', async () => {
        const handler = createVerifierHandler(ORIGIN);
        const a = await start(handler);
        const b = await start(handler);
        expect(a.request.data.nonce).not.toBe(b.request.data.nonce);
        const response = await present(a.request);
        expect((await handler(post('/api/verify', b.cookie, response))).status).toBe(422);
        expect((await handler(post('/api/cancel', a.cookie))).status).toBe(200);
        expect((await handler(post('/api/verify', a.cookie, response))).status).toBe(409);
        const previous = await start(handler);
        await start(handler, previous.cookie);
        expect((await handler(post('/api/cancel', previous.cookie))).status).toBe(409);
    });

    it('expires requests and rejects cross-origin, missing-session and oversized submissions', async () => {
        let time = 1_000;
        const handler = createVerifierHandler(ORIGIN, () => time);
        const { cookie } = await start(handler);
        expect(
            (await handler(post('/api/verify', cookie, {}, 'https://wrong.example'))).status
        ).toBe(403);
        expect((await handler(post('/api/verify', undefined, {}))).status).toBe(409);
        expect((await handler(post('/api/verify', cookie, 'x'.repeat(65_536)))).status).toBe(413);
        const fresh = await start(handler);
        time += 300_000;
        expect((await handler(post('/api/verify', fresh.cookie, {}))).status).toBe(409);
    });
});

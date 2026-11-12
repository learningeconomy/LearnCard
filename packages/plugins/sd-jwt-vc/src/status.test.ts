import { afterEach, describe, expect, it, vi } from 'vitest';
import { deflateSync } from 'node:zlib';
import { SignJWT, generateKeyPair, exportJWK } from 'jose';
import { SDJwtVcInstance } from '@sd-jwt/sd-jwt-vc';
import { verifySdJwtVc } from './verify';
import type { SdJwtVcDependentLearnCard } from './types';
import { createEd25519KbSigner } from './signer';
import { sha256Hasher } from './hasher';
import { randomSalt } from './salt';

const URI = 'https://issuer.example.test/status/1';
const ISSUER = 'did:web:issuer.example.test';
afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
});

const setup = async (value = 0) => {
    const pair = await generateKeyPair('EdDSA', { extractable: true });
    const signer = await createEd25519KbSigner({ privateJwk: await exportJWK(pair.privateKey) });
    const publicJwk = await exportJWK(pair.publicKey);
    const now = new Date();
    const seconds = Math.floor(now.getTime() / 1000);
    const learnCard = {
        invoke: {
            resolveDid: async () => ({
                id: ISSUER,
                verificationMethod: [{ id: `${ISSUER}#key`, publicKeyJwk: publicJwk }],
                assertionMethod: [`${ISSUER}#key`],
            }),
        },
    };
    const trusted = learnCard as unknown as SdJwtVcDependentLearnCard;
    const instance = new SDJwtVcInstance({
        hasher: sha256Hasher,
        hashAlg: 'sha-256',
        saltGenerator: randomSalt,
        signer,
        signAlg: 'EdDSA',
    });
    const issue = (overrides: Record<string, unknown> = {}) =>
        instance.issue(
            {
                iss: ISSUER,
                iat: seconds,
                exp: seconds + 3600,
                vct: 'https://example.test/course',
                status: { status_list: { uri: URI, idx: 1 } },
                course_name: 'Course',
                ...overrides,
            },
            { _sd: ['course_name'] },
            { header: { kid: `${ISSUER}#key` } }
        );
    const payload = {
        iss: ISSUER,
        sub: URI,
        iat: seconds,
        exp: seconds + 300,
        ttl: 30,
        status_list: { bits: 2, lst: deflateSync(Buffer.from([value << 2])).toString('base64url') },
    };
    const token = (overrides: Record<string, unknown> = {}, header: Record<string, unknown> = {}) =>
        new SignJWT({ ...payload, ...overrides })
            .setProtectedHeader({ alg: 'EdDSA', typ: 'statuslist+jwt', ...header })
            .sign(pair.privateKey);
    const fetcher = vi.fn(
        async () =>
            new Response(await token(), {
                headers: { 'Content-Type': 'application/statuslist+jwt' },
            })
    );
    vi.stubGlobal('fetch', fetcher);
    const verify = async (overrides: Record<string, unknown> = {}) =>
        verifySdJwtVc(trusted, await issue(overrides), { now: () => now });
    return { pair, learnCard: trusted, now, seconds, issue, token, payload, fetcher, verify };
};

describe('explicit authenticated token status checking', () => {
    it('rejects extra personal data hidden inside a status metadata container', async () => {
        const s = await setup();
        const result = await s.verify({
            status: { status_list: { uri: URI, idx: 1, sensitive_claim: 'Not approved' } },
        });
        expect(result.errors.join()).toContain('status_check_failed:');
        expect(s.fetcher).not.toHaveBeenCalled();
    });
    it('aborts a status request after five seconds', async () => {
        const s = await setup();
        const credential = await s.issue();
        const fetcher = vi.fn<typeof fetch>(
            (_input, init) =>
                new Promise<Response>((_resolve, reject) => {
                    init?.signal?.addEventListener(
                        'abort',
                        () => reject(new DOMException('Aborted', 'AbortError')),
                        { once: true }
                    );
                })
        );
        vi.stubGlobal('fetch', fetcher);
        vi.useFakeTimers();
        const pending = verifySdJwtVc(s.learnCard, credential);
        await vi.waitFor(() => expect(fetcher).toHaveBeenCalledOnce());
        await vi.advanceTimersByTimeAsync(5000);
        expect((await pending).errors.join()).toContain('status_check_failed:');
    });

    it('rejects a freshness deadline crossed while processing the response', async () => {
        const s = await setup();
        const compact = await s.issue();
        let reads = 0;
        const result = await verifySdJwtVc(s.learnCard, compact, {
            now: () => new Date(s.now.getTime() + (++reads >= 3 ? 60_000 : 0)),
        });
        expect(result.errors.join()).toContain('status_check_failed:');
        expect(result.statusList).toBeUndefined();
    });

    it.each([
        { bits: 1, idx: 8, value: 1 },
        { bits: 2, idx: 6, value: 2 },
        { bits: 4, idx: 3, value: 10 },
        { bits: 8, idx: 1, value: 163 },
    ])(
        'matches the draft-21 B9 A3 vector at a byte boundary ($bits bits)',
        async ({ bits, idx, value }) => {
            const s = await setup();
            s.fetcher.mockResolvedValueOnce(
                new Response(await s.token({ status_list: { bits, lst: 'eNrbuRgAAhcBXQ' } }), {
                    headers: { 'Content-Type': 'application/statuslist+jwt' },
                })
            );
            const result = await s.verify({ status: { status_list: { uri: URI, idx } } });
            expect(result.statusList?.value).toBe(value);
            expect(result.checks).toContain('credential_status');
        }
    );
    it('rejects a bad credential signature before contacting its status provider', async () => {
        const s = await setup();
        const pieces = (await s.issue()).split('.');
        const payload = JSON.parse(Buffer.from(pieces[1]!, 'base64url').toString());
        payload.vct = 'https://attacker.example.test/course';
        pieces[1] = Buffer.from(JSON.stringify(payload)).toString('base64url');
        const result = await verifySdJwtVc(s.learnCard, pieces.join('.'));
        expect(result.errors.join()).toContain('signature_invalid:');
        expect(s.fetcher).not.toHaveBeenCalled();
    });
    it('bounds freshness when optional exp and ttl are absent', async () => {
        const s = await setup();
        s.fetcher.mockResolvedValueOnce(
            new Response(await s.token({ exp: undefined, ttl: undefined }), {
                headers: { 'Content-Type': 'application/statuslist+jwt' },
            })
        );
        const result = await s.verify();
        expect(result.statusList?.validUntil).toBe(s.now.getTime() + 60_000);
    });
    it('rejects an incorrect response content type or redirected response', async () => {
        const s = await setup();
        const signed = await s.token();
        s.fetcher.mockResolvedValueOnce(
            new Response(signed, { headers: { 'Content-Type': 'application/json' } })
        );
        expect((await s.verify()).errors.join()).toContain('status_check_failed:');
        const redirected = new Response(signed, {
            headers: { 'Content-Type': 'application/statuslist+jwt' },
        });
        Object.defineProperty(redirected, 'redirected', { value: true });
        s.fetcher.mockResolvedValueOnce(redirected);
        expect((await s.verify()).errors.join()).toContain('status_check_failed:');
    });

    it.each([
        { value: 0, error: undefined },
        { value: 1, error: 'status_revoked' },
        { value: 2, error: 'status_suspended' },
        { value: 3, error: 'status_unsupported' },
    ])(
        'handles authenticated status $value separately from signature errors',
        async ({ value, error }) => {
            const s = await setup(value);
            const result = await s.verify();
            expect(result.checks).toContain('issuer_signature');
            expect(result.checks).toContain('credential_status');
            expect(result.statusList?.value).toBe(value);
            expect(result.statusList?.validUntil).toBe(s.now.getTime() + 30_000);
            expect(result.errors).toEqual(
                error ? [expect.stringMatching(new RegExp('^' + error + ':'))] : []
            );
            expect(s.fetcher).toHaveBeenCalledWith(
                URI,
                expect.objectContaining({
                    credentials: 'omit',
                    referrerPolicy: 'no-referrer',
                    redirect: 'error',
                    cache: 'no-store',
                })
            );
        }
    );
    it('fetches fresh status for valid → suspended → valid → revoked transitions', async () => {
        const s = await setup();
        const credential = await s.issue();
        for (const value of [0, 2, 0, 1]) {
            s.fetcher.mockImplementationOnce(
                async () =>
                    new Response(
                        await s.token({
                            status_list: {
                                bits: 2,
                                lst: deflateSync(Buffer.from([value << 2])).toString('base64url'),
                            },
                        }),
                        { headers: { 'Content-Type': 'application/statuslist+jwt' } }
                    )
            );
            const result = await verifySdJwtVc(s.learnCard, credential, { now: () => s.now });
            expect(result.statusList?.value).toBe(value);
            expect(result.errors.length).toBe(value ? 1 : 0);
        }
        expect(s.fetcher).toHaveBeenCalledTimes(4);
    });
    it('does not fetch a status list for an expired credential', async () => {
        const s = await setup();
        const result = await s.verify({ exp: s.seconds - 120 });
        expect(result.errors.join()).toContain('expired');
        expect(s.fetcher).not.toHaveBeenCalled();
    });
    it('keeps transport failures distinct and recovers on retry', async () => {
        const s = await setup();
        s.fetcher.mockRejectedValueOnce(new Error('offline'));
        expect((await s.verify()).errors).toEqual([
            'status_check_failed: Credential status unavailable or invalid',
        ]);
        expect((await s.verify()).errors).toEqual([]);
    });
    it('does not treat an explicitly skipped check as checked status', async () => {
        const s = await setup();
        const result = await verifySdJwtVc(s.learnCard, await s.issue(), { skipStatusCheck: true });
        expect(result.statusList).toBeUndefined();
        expect(result.checks).not.toContain('credential_status');
        expect(result.warnings.join()).toContain('status_check_skipped');
        expect(s.fetcher).not.toHaveBeenCalled();
    });
    it.each([
        { sub: URI + '/other' },
        { iss: 'did:web:attacker.example.test' },
        { iat: 0 },
        { iat: 'now' },
        { iat: 9999999999 },
        { exp: 0 },
        { exp: 'later' },
        { ttl: 0 },
        { ttl: '60' },
        { aud: 'someone-else' },
        { nbf: 9999999999 },
        { status_list: { bits: 3, lst: 'eNoDAAAAAAE' } },
        { status_list: { bits: 2, lst: 'invalid' } },
    ])('rejects signed but invalid or stale status claims: %j', async overrides => {
        const s = await setup();
        s.fetcher.mockImplementationOnce(
            async () =>
                new Response(await s.token(overrides), {
                    headers: { 'Content-Type': 'application/statuslist+jwt' },
                })
        );
        expect((await s.verify()).errors.join()).toContain('status_check_failed:');
    });
    it.each([{ typ: 'dc+sd-jwt' }, { alg: 'none' }, { crit: ['unexpected'], unexpected: true }])(
        'rejects status header confusion: %j',
        async header => {
            const s = await setup();
            let signed = await s.token();
            const parts = signed.split('.');
            parts[0] = Buffer.from(
                JSON.stringify({ alg: 'EdDSA', typ: 'statuslist+jwt', ...header })
            ).toString('base64url');
            signed = parts.join('.');
            s.fetcher.mockResolvedValueOnce(
                new Response(signed, { headers: { 'Content-Type': 'application/statuslist+jwt' } })
            );
            expect((await s.verify()).errors.join()).toContain('status_check_failed:');
        }
    );
    it('rejects a status token signed by a different key', async () => {
        const s = await setup();
        const other = await generateKeyPair('EdDSA');
        const signed = await new SignJWT(s.payload)
            .setProtectedHeader({ alg: 'EdDSA', typ: 'statuslist+jwt' })
            .sign(other.privateKey);
        s.fetcher.mockResolvedValueOnce(
            new Response(signed, { headers: { 'Content-Type': 'application/statuslist+jwt' } })
        );
        expect((await s.verify()).errors.join()).toContain('status_check_failed:');
    });
    it.each([
        null,
        {},
        { other: {} },
        { status_list: { uri: URI, idx: -1 } },
        { status_list: { uri: URI, idx: 4 } },
        { status_list: { uri: 'http://issuer.example.test/status', idx: 1 } },
        { status_list: { uri: 'https://127.0.0.1/status', idx: 1 } },
        { status_list: { uri: 'https://localhost/status', idx: 1 } },
    ])('rejects an unsupported status reference: %j', async status => {
        const s = await setup();
        expect((await s.verify({ status })).errors.join()).toContain('status_check_failed:');
    });
    it.each([401, 500])('rejects an unsuccessful status response %s', async code => {
        const s = await setup();
        s.fetcher.mockResolvedValueOnce(new Response('Unavailable', { status: code }));
        expect((await s.verify()).errors.join()).toContain('status_check_failed:');
    });
    it('rejects oversized transport and decompressed lists', async () => {
        const s = await setup();
        s.fetcher.mockResolvedValueOnce(
            new Response('a'.repeat(256 * 1024 + 1), {
                headers: { 'Content-Type': 'application/statuslist+jwt' },
            })
        );
        expect((await s.verify()).errors.join()).toContain('status_check_failed:');
        s.fetcher.mockResolvedValueOnce(
            new Response(
                await s.token({
                    status_list: {
                        bits: 1,
                        lst: deflateSync(Buffer.alloc(2 * 1024 * 1024 + 1)).toString('base64url'),
                    },
                }),
                { headers: { 'Content-Type': 'application/statuslist+jwt' } }
            )
        );
        expect((await s.verify()).errors.join()).toContain('status_check_failed:');
    });
});

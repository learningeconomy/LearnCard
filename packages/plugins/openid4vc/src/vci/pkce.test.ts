import {
    computeS256Challenge,
    generatePkcePair,
    PkceError,
    verifyPkce,
} from './pkce';

describe('generatePkcePair', () => {
    it('returns a fresh verifier + S256 challenge', async () => {
        const pair = await generatePkcePair();

        expect(pair.method).toBe('S256');
        expect(pair.verifier.length).toBeGreaterThanOrEqual(43);
        expect(pair.challenge.length).toBeGreaterThanOrEqual(43);

        // Challenge MUST be the base64url SHA-256 of the verifier.
        expect(await computeS256Challenge(pair.verifier)).toBe(pair.challenge);
    });

    it('produces RFC 7636-compliant character set (unreserved only)', async () => {
        const pair = await generatePkcePair();
        expect(pair.verifier).toMatch(/^[A-Za-z0-9_-]+$/);
        expect(pair.challenge).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('produces different pairs on repeat calls (entropy sanity check)', async () => {
        const a = await generatePkcePair();
        const b = await generatePkcePair();
        expect(a.verifier).not.toBe(b.verifier);
        expect(a.challenge).not.toBe(b.challenge);
    });

    it('rejects byteLength below 24 or above 96', async () => {
        await expect(generatePkcePair({ byteLength: 16 })).rejects.toBeInstanceOf(PkceError);
        await expect(generatePkcePair({ byteLength: 200 })).rejects.toMatchObject({
            code: 'invalid_verifier',
        });
    });

    it('honors a larger byteLength for higher-entropy scenarios', async () => {
        const pair = await generatePkcePair({ byteLength: 64 });
        // 64 bytes → ~86 base64url chars.
        expect(pair.verifier.length).toBeGreaterThanOrEqual(86);
    });
});

describe('computeS256Challenge', () => {
    // Test vector from RFC 7636 Appendix B:
    //   verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
    //   challenge = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"
    it('matches the RFC 7636 Appendix B test vector', async () => {
        const vector = {
            verifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
            challenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
        };

        expect(await computeS256Challenge(vector.verifier)).toBe(vector.challenge);
    });

    it('rejects verifiers shorter than 24 chars', async () => {
        await expect(computeS256Challenge('too-short')).rejects.toMatchObject({
            code: 'invalid_verifier',
        });
    });
});

describe('verifyPkce', () => {
    it('returns true for a matching verifier+challenge pair', async () => {
        const pair = await generatePkcePair();
        expect(await verifyPkce(pair)).toBe(true);
    });

    it('returns false when the verifier does not match the challenge', async () => {
        const a = await generatePkcePair();
        const b = await generatePkcePair();
        expect(
            await verifyPkce({ verifier: a.verifier, challenge: b.challenge })
        ).toBe(false);
    });

    it('throws for unsupported methods', async () => {
        const pair = await generatePkcePair();
        await expect(
            verifyPkce({
                verifier: pair.verifier,
                challenge: pair.challenge,
                method: 'plain' as unknown as 'S256',
            })
        ).rejects.toMatchObject({ code: 'unsupported_method' });
    });
});

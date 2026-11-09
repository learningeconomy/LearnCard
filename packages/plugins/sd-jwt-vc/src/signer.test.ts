import { describe, expect, it, vi } from 'vitest';
import { base64url, generateKeyPair, exportJWK, compactVerify, type JWK } from 'jose';
import { createEd25519KbSigner, createJoseVerifier } from './signer';

describe('portable Android Ed25519 operations', () => {
    it.each(
        [[], ['sign'], ['encrypt'], ['verify', 'sign'], ['verify', 'verify'], 'verify'].map(
            keyOps => ({ keyOps })
        )
    )(
        'rejects issuer key operations that cannot import as a public verification key: $keyOps',
        async ({ keyOps }) => {
            const pair = await generateKeyPair('EdDSA', { extractable: true });
            const publicJwk = await exportJWK(pair.publicKey);
            await expect(
                createJoseVerifier({ ...publicJwk, key_ops: keyOps } as JWK, 'EdDSA')
            ).rejects.toMatchObject({ code: 'verification_method_not_found' });
        }
    );

    it('honors an explicit verify operation without using Ed25519 WebCrypto', async () => {
        const pair = await generateKeyPair('EdDSA', { extractable: true });
        const sign = await createEd25519KbSigner({ privateJwk: await exportJWK(pair.privateKey) });
        const input = `${base64url.encode('{"alg":"EdDSA"}')}.${base64url.encode('{"iss":"issuer"}')}`;
        const signature = await sign(input);
        const publicJwk = { ...(await exportJWK(pair.publicKey)), key_ops: ['verify'] };
        const imported = vi
            .spyOn(crypto.subtle, 'importKey')
            .mockRejectedValue(new DOMException('Unsupported algorithm', 'NotSupportedError'));
        try {
            const verifier = await createJoseVerifier(publicJwk, 'EdDSA');
            expect(await verifier.verifier(input, signature)).toBe(true);
            expect(imported).not.toHaveBeenCalled();
        } finally {
            imported.mockRestore();
        }
    });

    it('signs and verifies without WebCrypto Ed25519 and still rejects tampering/algorithm substitution', async () => {
        const pair = await generateKeyPair('EdDSA', { extractable: true });
        const privateJwk = await exportJWK(pair.privateKey);
        const publicJwk = await exportJWK(pair.publicKey);
        const input = `${base64url.encode(JSON.stringify({ alg: 'EdDSA', typ: 'kb+jwt' }))}.${base64url.encode(JSON.stringify({ nonce: 'n', aud: 'origin:https://example.com' }))}`;
        const imported = vi
            .spyOn(crypto.subtle, 'importKey')
            .mockRejectedValue(new DOMException('Unsupported algorithm', 'NotSupportedError'));
        let signature: string;
        try {
            const sign = await createEd25519KbSigner({ privateJwk });
            signature = await sign(input);
            const verify = await createJoseVerifier(publicJwk, 'EdDSA');
            expect(await verify.verifier(input, signature)).toBe(true);
            expect(await verify.verifier(`${input}x`, signature)).toBe(false);
            expect(
                await verify.verifier(
                    `${base64url.encode('{"alg":"HS256"}')}.${input.split('.')[1]}`,
                    signature
                )
            ).toBe(false);
            await expect(
                sign(`${base64url.encode('{"alg":"HS256"}')}.${input.split('.')[1]}`)
            ).rejects.toMatchObject({ code: 'kb_jwt_invalid' });
            expect(imported).not.toHaveBeenCalled();
        } finally {
            imported.mockRestore();
        }
        // Independent JOSE verification of the exact signing input.
        await expect(
            compactVerify(`${input}.${signature!}`, pair.publicKey)
        ).resolves.toBeDefined();
    });
});

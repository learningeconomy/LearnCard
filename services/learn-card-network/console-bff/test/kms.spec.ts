import { describe, it, expect } from 'vitest';
import { createPublicKey, createHash, verify as nodeVerify } from 'crypto';

import { LocalKeyManagementService } from '@kms/local';
import { getKeyManagementService } from '@kms/factory';

const verifyEs256 = (jwk: JsonWebKey, data: Uint8Array, signature: Uint8Array): boolean => {
    const publicKey = createPublicKey({ key: jwk as any, format: 'jwk' });

    return nodeVerify('SHA256', data, { key: publicKey, dsaEncoding: 'ieee-p1363' }, signature);
};

describe('LocalKeyManagementService', () => {
    it('generates a P-256 signing key and exports a public JWK', async () => {
        const kms = new LocalKeyManagementService();
        const ref = await kms.generateSigningKey({ tenantId: 'lef', alias: 'root' });

        expect(ref.provider).toBe('local');
        expect(ref.algorithm).toBe('ES256');
        expect(ref.keyId).toBeTruthy();
        expect(ref.alias).toBe('root');

        const jwk = await kms.getPublicKeyJwk(ref);

        expect(jwk.kty).toBe('EC');
        expect(jwk.crv).toBe('P-256');
    });

    it('produces verifiable ES256 signatures and never exposes the private key', async () => {
        const kms = new LocalKeyManagementService();
        const ref = await kms.generateSigningKey({ tenantId: 'lef', alias: 'root' });

        const data = createHash('sha256').update('educationos').digest();
        const signature = await kms.sign(ref, data);
        const jwk = await kms.getPublicKeyJwk(ref);

        expect(signature.length).toBe(64);
        expect(verifyEs256(jwk, data, signature)).toBe(true);
        expect((jwk as Record<string, unknown>).d).toBeUndefined();
    });

    it('rotates a key without changing the keyId and invalidates the old public key', async () => {
        const kms = new LocalKeyManagementService();
        const ref = await kms.generateSigningKey({ tenantId: 'lef', alias: 'root' });
        const originalJwk = await kms.getPublicKeyJwk(ref);

        const rotated = await kms.rotateKey(ref);
        const rotatedJwk = await kms.getPublicKeyJwk(rotated);

        expect(rotated.keyId).toBe(ref.keyId);
        expect(rotated.alias).toBe(ref.alias);
        expect(rotated.version).not.toBe(ref.version);
        expect(rotatedJwk.x).not.toBe(originalJwk.x);

        const data = createHash('sha256').update('rotated').digest();
        const signature = await kms.sign(rotated, data);

        expect(verifyEs256(rotatedJwk, data, signature)).toBe(true);
        expect(verifyEs256(originalJwk, data, signature)).toBe(false);
    });

    it('throws when signing with a deleted key', async () => {
        const kms = new LocalKeyManagementService();
        const ref = await kms.generateSigningKey({ tenantId: 'lef', alias: 'root' });

        await kms.deleteKey(ref);

        await expect(kms.sign(ref, new Uint8Array([1, 2, 3]))).rejects.toThrow();
    });
});

describe('getKeyManagementService', () => {
    it('defaults to the local provider', () => {
        expect(getKeyManagementService({} as NodeJS.ProcessEnv).provider).toBe('local');
    });

    it('selects the aws provider when configured', () => {
        expect(
            getKeyManagementService({ KMS_PROVIDER: 'aws' } as unknown as NodeJS.ProcessEnv)
                .provider
        ).toBe('aws-kms');
    });

    it('throws on an unknown provider', () => {
        expect(() =>
            getKeyManagementService({ KMS_PROVIDER: 'vault' } as unknown as NodeJS.ProcessEnv)
        ).toThrow();
    });
});

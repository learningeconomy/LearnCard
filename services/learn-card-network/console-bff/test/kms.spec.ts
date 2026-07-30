import { describe, it, expect } from 'vitest';
import { createPublicKey, createHash, verify as nodeVerify } from 'crypto';
import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

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

describe('LocalKeyManagementService persistence', () => {
    const tmpFile = () => join(mkdtempSync(join(tmpdir(), 'lc-kms-')), 'nested', 'local-kms.json');

    it('resolves a key issued by a previous process when persisted', async () => {
        const persistPath = tmpFile();

        const first = new LocalKeyManagementService({ persistPath });
        const ref = await first.generateSigningKey({ tenantId: 'lef', alias: 'root' });
        const data = new Uint8Array([1, 2, 3, 4]);
        const signature = await first.sign(ref, data);

        const restarted = new LocalKeyManagementService({ persistPath });

        expect(restarted.hasKey(ref)).toBe(true);

        const jwk = await restarted.getPublicKeyJwk(ref);

        expect(verifyEs256(jwk, data, signature)).toBe(true);
    });

    it('loses the key across restart when not persisted, which is what wedges a durable ref', async () => {
        const ephemeral = new LocalKeyManagementService();
        const ref = await ephemeral.generateSigningKey({ tenantId: 'lef', alias: 'root' });

        expect(new LocalKeyManagementService().hasKey(ref)).toBe(false);
    });

    it('adopts a stale ref in place, keeping keyId so the directory entry stays valid', async () => {
        const persistPath = tmpFile();
        const orphanRef = await new LocalKeyManagementService().generateSigningKey({
            tenantId: 'lef',
            alias: 'root',
        });

        const fresh = new LocalKeyManagementService({ persistPath });

        expect(fresh.hasKey(orphanRef)).toBe(false);

        const adopted = await fresh.adoptKey(orphanRef);

        expect(adopted.keyId).toBe(orphanRef.keyId);
        expect(adopted.version).not.toBe(orphanRef.version);
        expect(fresh.hasKey(adopted)).toBe(true);

        const data = new Uint8Array([9, 9, 9]);
        const signature = await fresh.sign(adopted, data);

        expect(verifyEs256(await fresh.getPublicKeyJwk(adopted), data, signature)).toBe(true);
        expect(new LocalKeyManagementService({ persistPath }).hasKey(adopted)).toBe(true);
    });

    it('refuses persistence in production', () => {
        const previous = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        try {
            expect(() => new LocalKeyManagementService({ persistPath: tmpFile() })).toThrow(
                /dev-only/i
            );
        } finally {
            process.env.NODE_ENV = previous;
        }
    });
});

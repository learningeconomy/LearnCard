import { randomUUID, generateKeyPairSync, sign as nodeSign, KeyObject } from 'crypto';

import type { GenerateKeyParams, KeyManagementService, KmsAlgorithm, ManagedKeyRef } from './types';

type StoredKey = {
    tenantId: string;
    algorithm: KmsAlgorithm;
    version: string;
    privateKey: KeyObject;
    publicKey: KeyObject;
};

// Dev/test only: private keys live in process memory and never touch a real HSM.
// Production deployments MUST use a KMS-backed KeyManagementService (see aws.ts).
export class LocalKeyManagementService implements KeyManagementService {
    readonly provider = 'local';

    private readonly store = new Map<string, StoredKey>();

    async generateSigningKey({
        tenantId,
        alias,
        algorithm = 'ES256',
    }: GenerateKeyParams): Promise<ManagedKeyRef> {
        const keyId = randomUUID();
        const version = randomUUID();

        const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });

        this.store.set(keyId, { tenantId, algorithm, version, privateKey, publicKey });

        return { provider: this.provider, tenantId, keyId, alias, algorithm, version };
    }

    async getPublicKeyJwk(ref: ManagedKeyRef): Promise<JsonWebKey> {
        const stored = this.require(ref);

        return stored.publicKey.export({ format: 'jwk' });
    }

    async sign(ref: ManagedKeyRef, data: Uint8Array): Promise<Uint8Array> {
        const stored = this.require(ref);

        return nodeSign('SHA256', data, { key: stored.privateKey, dsaEncoding: 'ieee-p1363' });
    }

    async rotateKey(ref: ManagedKeyRef): Promise<ManagedKeyRef> {
        const stored = this.require(ref);
        const version = randomUUID();

        const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });

        this.store.set(ref.keyId, { ...stored, version, privateKey, publicKey });

        return { ...ref, version };
    }

    async deleteKey(ref: ManagedKeyRef): Promise<void> {
        this.store.delete(ref.keyId);
    }

    private require(ref: ManagedKeyRef): StoredKey {
        const stored = this.store.get(ref.keyId);

        if (!stored) throw new Error(`Unknown local KMS key: ${ref.keyId}`);

        return stored;
    }
}

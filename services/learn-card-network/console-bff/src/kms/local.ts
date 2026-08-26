import {
    randomUUID,
    generateKeyPairSync,
    sign as nodeSign,
    createPrivateKey,
    createPublicKey,
    KeyObject,
} from 'crypto';

type CryptoJsonWebKey = {
    [key: string]: unknown;
    kty?: string;
    crv?: string;
    alg?: string;
    d?: string;
    x?: string;
    y?: string;
    n?: string;
    e?: string;
};
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';

import type { GenerateKeyParams, KeyManagementService, KmsAlgorithm, ManagedKeyRef } from './types';

type StoredKey = {
    tenantId: string;
    algorithm: KmsAlgorithm;
    version: string;
    privateKey: KeyObject;
    publicKey: KeyObject;
};

type SerializedKey = {
    tenantId: string;
    algorithm: KmsAlgorithm;
    version: string;
    privateKeyJwk: CryptoJsonWebKey;
};

export type LocalKeyManagementServiceOptions = {
    /**
     * Absolute or cwd-relative file used to persist keys across restarts.
     *
     * The managed-key *directory* (Mongo) is durable, so an in-memory-only key
     * store leaves every previously-issued keyRef permanently unresolvable after a
     * restart — and JIT will not re-mint for an already-known subject. Persisting
     * keeps the two stores' lifetimes aligned.
     */
    persistPath?: string;
};

// Dev/test only: private keys live in process memory (and, when persistPath is set,
// in a plaintext file). Production deployments MUST use a KMS-backed
// KeyManagementService (see aws.ts).
export class LocalKeyManagementService implements KeyManagementService {
    readonly provider = 'local';

    private readonly store = new Map<string, StoredKey>();

    private readonly persistPath?: string;

    constructor(options: LocalKeyManagementServiceOptions = {}) {
        if (options.persistPath && process.env.NODE_ENV === 'production') {
            throw new Error(
                'LocalKeyManagementService persistence is dev-only and must not be enabled in production.'
            );
        }

        this.persistPath = options.persistPath;
        this.load();
    }

    private load(): void {
        if (!this.persistPath || !existsSync(this.persistPath)) return;

        const raw = JSON.parse(readFileSync(this.persistPath, 'utf8')) as Record<
            string,
            SerializedKey
        >;

        for (const [keyId, entry] of Object.entries(raw)) {
            const privateKey = createPrivateKey({ key: entry.privateKeyJwk, format: 'jwk' });

            this.store.set(keyId, {
                tenantId: entry.tenantId,
                algorithm: entry.algorithm,
                version: entry.version,
                privateKey,
                publicKey: createPublicKey(privateKey),
            });
        }
    }

    private persist(): void {
        if (!this.persistPath) return;

        const serialized: Record<string, SerializedKey> = {};

        for (const [keyId, stored] of this.store.entries()) {
            serialized[keyId] = {
                tenantId: stored.tenantId,
                algorithm: stored.algorithm,
                version: stored.version,
                privateKeyJwk: { ...stored.privateKey.export({ format: 'jwk' }) },
            };
        }

        mkdirSync(dirname(this.persistPath), { recursive: true });
        writeFileSync(this.persistPath, JSON.stringify(serialized), { mode: 0o600 });
    }

    async generateSigningKey({
        tenantId,
        alias,
        algorithm = 'ES256',
    }: GenerateKeyParams): Promise<ManagedKeyRef> {
        const keyId = randomUUID();
        const version = randomUUID();

        const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });

        this.store.set(keyId, { tenantId, algorithm, version, privateKey, publicKey });
        this.persist();

        return { provider: this.provider, tenantId, keyId, alias, algorithm, version };
    }

    /** Whether this store can actually resolve a ref (a persisted ref may outlive its key). */
    hasKey(ref: ManagedKeyRef): boolean {
        return this.store.has(ref.keyId);
    }

    /**
     * Re-key an existing ref in place, keeping its keyId so the durable directory
     * entry (and therefore the managed DID and any granted roles) stays valid.
     */
    async adoptKey(ref: ManagedKeyRef): Promise<ManagedKeyRef> {
        const version = randomUUID();
        const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });

        this.store.set(ref.keyId, {
            tenantId: ref.tenantId,
            algorithm: ref.algorithm,
            version,
            privateKey,
            publicKey,
        });
        this.persist();

        return { ...ref, version };
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

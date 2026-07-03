import { createPublicKey } from 'crypto';

import type { GenerateKeyParams, KeyManagementService, ManagedKeyRef } from './types';

type KmsClientLike = {
    send: (command: unknown) => Promise<any>;
};

type AwsKmsModule = {
    KMSClient: new (config?: unknown) => KmsClientLike;
    CreateKeyCommand: new (input: unknown) => unknown;
    CreateAliasCommand: new (input: unknown) => unknown;
    UpdateAliasCommand: new (input: unknown) => unknown;
    GetPublicKeyCommand: new (input: unknown) => unknown;
    SignCommand: new (input: unknown) => unknown;
    ScheduleKeyDeletionCommand: new (input: unknown) => unknown;
};

async function loadSdk(): Promise<AwsKmsModule> {
    return (await import('@aws-sdk/client-kms')) as unknown as AwsKmsModule;
}

// KMS returns ECDSA signatures DER-encoded; JWS / did:web JsonWebKey2020 require the
// fixed-width r‖s (IEEE P1363) form. P-256 => two 32-byte integers.
function derToP1363(der: Uint8Array): Uint8Array {
    let offset = 2;
    if (der[1]! & 0x80) offset = 2 + (der[1]! & 0x7f);

    const readInt = (start: number): { value: Uint8Array; next: number } => {
        const length = der[start + 1]!;
        let vStart = start + 2;
        let vLen = length;
        while (vLen > 0 && der[vStart] === 0x00) {
            vStart += 1;
            vLen -= 1;
        }
        return { value: der.slice(vStart, vStart + vLen), next: start + 2 + length };
    };

    const r = readInt(offset);
    const s = readInt(r.next);

    const out = new Uint8Array(64);
    out.set(r.value, 32 - r.value.length);
    out.set(s.value, 64 - s.value.length);

    return out;
}

function aliasFor(tenantId: string, alias: string): string {
    return `alias/educationos/${tenantId}/${alias}`;
}

export class AwsKmsKeyManagementService implements KeyManagementService {
    readonly provider = 'aws-kms';

    private clientPromise?: Promise<{ client: KmsClientLike; sdk: AwsKmsModule }>;

    constructor(private readonly config: { region?: string } = {}) {}

    private async getClient(): Promise<{ client: KmsClientLike; sdk: AwsKmsModule }> {
        if (!this.clientPromise) {
            this.clientPromise = loadSdk().then(sdk => ({
                sdk,
                client: new sdk.KMSClient(this.config.region ? { region: this.config.region } : {}),
            }));
        }

        return this.clientPromise;
    }

    async generateSigningKey({ tenantId, alias }: GenerateKeyParams): Promise<ManagedKeyRef> {
        const { client, sdk } = await this.getClient();

        const created = await client.send(
            new sdk.CreateKeyCommand({
                KeySpec: 'ECC_NIST_P256',
                KeyUsage: 'SIGN_VERIFY',
                Tags: [{ TagKey: 'tenantId', TagValue: tenantId }],
            })
        );

        const keyId = created.KeyMetadata.KeyId as string;

        await client.send(
            new sdk.CreateAliasCommand({
                AliasName: aliasFor(tenantId, alias),
                TargetKeyId: keyId,
            })
        );

        return { provider: this.provider, tenantId, keyId, algorithm: 'ES256' };
    }

    async getPublicKeyJwk(ref: ManagedKeyRef): Promise<JsonWebKey> {
        const { client, sdk } = await this.getClient();

        const result = await client.send(new sdk.GetPublicKeyCommand({ KeyId: ref.keyId }));

        const der = Buffer.from(result.PublicKey as Uint8Array);

        return createPublicKey({ key: der, format: 'der', type: 'spki' }).export({ format: 'jwk' });
    }

    async sign(ref: ManagedKeyRef, data: Uint8Array): Promise<Uint8Array> {
        const { client, sdk } = await this.getClient();

        const result = await client.send(
            new sdk.SignCommand({
                KeyId: ref.keyId,
                Message: data,
                MessageType: 'RAW',
                SigningAlgorithm: 'ECDSA_SHA_256',
            })
        );

        return derToP1363(Buffer.from(result.Signature as Uint8Array));
    }

    async rotateKey(ref: ManagedKeyRef): Promise<ManagedKeyRef> {
        const { client, sdk } = await this.getClient();

        const created = await client.send(
            new sdk.CreateKeyCommand({
                KeySpec: 'ECC_NIST_P256',
                KeyUsage: 'SIGN_VERIFY',
                Tags: [{ TagKey: 'tenantId', TagValue: ref.tenantId }],
            })
        );

        const keyId = created.KeyMetadata.KeyId as string;

        await client.send(
            new sdk.UpdateAliasCommand({
                AliasName: aliasFor(ref.tenantId, ref.keyId),
                TargetKeyId: keyId,
            })
        );

        return { ...ref, keyId };
    }

    async deleteKey(ref: ManagedKeyRef): Promise<void> {
        const { client, sdk } = await this.getClient();

        await client.send(
            new sdk.ScheduleKeyDeletionCommand({ KeyId: ref.keyId, PendingWindowInDays: 7 })
        );
    }
}

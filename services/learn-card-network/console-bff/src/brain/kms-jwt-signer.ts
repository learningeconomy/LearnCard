import type { KeyManagementService, ManagedKeyRef } from '@kms';

const b64url = (input: Buffer | string): string => Buffer.from(input).toString('base64url');

export type SignJwtParams = {
    did: string;
    keyRef: ManagedKeyRef;
    payload: Record<string, unknown>;
};

export class KmsJwtSigner {
    constructor(private readonly kms: KeyManagementService) {}

    async sign({ did, keyRef, payload }: SignJwtParams): Promise<string> {
        const header = { alg: 'ES256', typ: 'JWT', kid: `${did}#key-1` };
        const signingInput = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`;

        // KeyManagementService.sign applies SHA-256 internally (local nodeSign('SHA256', ...) and
        // KMS ECDSA_SHA_256 with MessageType RAW), so the raw signing input is passed, not a digest.
        const signature = await this.kms.sign(keyRef, Buffer.from(signingInput));

        return `${signingInput}.${b64url(Buffer.from(signature))}`;
    }
}

export type KmsAlgorithm = 'ES256';

export type ManagedKeyRef = {
    provider: string;
    tenantId: string;
    keyId: string;
    algorithm: KmsAlgorithm;
    version?: string;
};

export type GenerateKeyParams = {
    tenantId: string;
    alias: string;
    algorithm?: KmsAlgorithm;
};

export interface KeyManagementService {
    readonly provider: string;

    generateSigningKey(params: GenerateKeyParams): Promise<ManagedKeyRef>;

    getPublicKeyJwk(ref: ManagedKeyRef): Promise<JsonWebKey>;

    sign(ref: ManagedKeyRef, data: Uint8Array): Promise<Uint8Array>;

    rotateKey(ref: ManagedKeyRef): Promise<ManagedKeyRef>;

    deleteKey(ref: ManagedKeyRef): Promise<void>;
}

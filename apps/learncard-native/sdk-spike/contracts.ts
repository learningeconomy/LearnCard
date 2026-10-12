import type { initLearnCard } from '@learncard/init';
import type { generateEncryptedFieldsArray } from '../../../packages/plugins/learn-cloud/src/helpers';
import type { decryptWithPassword } from '../../../packages/sss-key-manager/src/crypto';
import type { encryptShareForTransfer } from '../../../packages/sss-key-manager/src/qr-crypto';

export type SpikeWallet = Awaited<ReturnType<typeof initLearnCard>>;
export type SignedCredential = Awaited<ReturnType<SpikeWallet['invoke']['issueCredential']>>;
export type UnsignedCredential = Parameters<SpikeWallet['invoke']['issueCredential']>[0];
export interface VerificationResult {
    errors: unknown[];
}
export interface SpikeVectors {
    issuerSeed: string;
    holderSeed: string;
    issuerDid: string;
    holderDid: string;
    fixtures: {
        id: string;
        signed: SignedCredential;
        unsigned: UnsignedCredential;
        webVerification: VerificationResult;
    }[];
    encrypted: Awaited<ReturnType<SpikeWallet['invoke']['createDagJwe']>>;
    cleartext: Parameters<SpikeWallet['invoke']['createDagJwe']>[0];
    indexRecord: Parameters<typeof generateEncryptedFieldsArray>[1];
    encryptedIndexFields: string[];
    recovery: {
        deviceShare: string;
        authShare: string;
        publicPassword: string;
        recoveryPhrase: string;
        encryptedRecovery: {
            ciphertext: string;
            iv: string;
            salt: string;
            kdfParams: Parameters<typeof decryptWithPassword>[4];
        };
    };
    transfer: {
        recipientJwk: JsonWebKey;
        recipientPublicKey: string;
        encryptedShare: Awaited<ReturnType<typeof encryptShareForTransfer>>;
    };
}
export interface StagingState {
    environment: string;
    expiresAt: number;
    issuerSeed: string;
    holderSeed: string;
    issuerProfileId: string;
    holderProfileId: string;
    recordId: string;
    holderSigningDid?: string;
    holderProfileDid?: string;
    incomingCredential?: SignedCredential;
    incomingUri?: string;
    outgoingUnsigned?: UnsignedCredential;
    outgoingUri?: string;
}
export type LiveVectors = Required<Omit<StagingState, 'issuerSeed' | 'outgoingUri'>>;
export interface StagingOutput {
    initialization: Record<string, boolean>;
    exchange: {
        outgoingUri: string;
        outgoingCredential: SignedCredential;
        [key: string]: boolean | string | SignedCredential;
    };
}
export interface StagingGlobal {
    webkit?: {
        messageHandlers?: {
            stagingTransport?: {
                postMessage: (message: {
                    url: string;
                    method: string;
                    headers: Record<string, string>;
                    body: string;
                }) => Promise<{ status: number; body: string; contentType: string }>;
            };
        };
    };
}

import type { ReadableDeliveryRecipient } from '@learncard/types';

export interface DeliveryKeyBinding {
    profileId: string;
    domain: string;
    version: number;
}

export interface DeliveryKeyEnvelope {
    provider: 'kms-v1' | 'local-v1';
    ciphertext: string;
}

export interface DeliveryRecord extends DeliveryKeyBinding, DeliveryKeyEnvelope {
    provisionId: string;
    ownerProfileId: string;
    agentProfileId: string;
    agentDid: string;
    displayName: string;
    enabled: boolean;
    disclosureVersion: ReadableDeliveryRecipient['disclosureVersion'];
}

export interface DeliveryKeyCustody {
    encrypt: (key: string, binding: DeliveryKeyBinding) => Promise<DeliveryKeyEnvelope>;
    decrypt: (envelope: DeliveryKeyEnvelope, binding: DeliveryKeyBinding) => Promise<string>;
}

export interface DeliveryVerificationChecks {
    proof: 'valid' | 'invalid' | 'unavailable';
    status: 'valid' | 'invalid' | 'unavailable' | 'not_applicable';
    dates: 'valid' | 'invalid';
}

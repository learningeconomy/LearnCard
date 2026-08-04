import type { JWE } from '@learncard/types';

import type { AgentNetworkWallet } from '../helpers/learnCard.helpers';

export type EncryptedJsonEnvelopeV1 = {
    __learnCardAiAgentEncrypted: true;
    version: 1;
    format: 'dag-jwe';
    kid: string;
    recipientDid: string;
    jwe: JWE;
};

export type EncryptedPayloadV1<T> = { aad: string; value: T };

export type EncryptionService = {
    encryptJson: <T>(value: T, aad: string) => Promise<EncryptedJsonEnvelopeV1>;
    decryptJson: <T>(value: EncryptedJsonEnvelopeV1, aad: string) => Promise<T>;
    decryptLegacyOrEnvelope: <T>(
        value: T | EncryptedJsonEnvelopeV1,
        aad: string
    ) => Promise<{ value: T; legacyPlaintext: boolean }>;
};

export const isEncryptedEnvelope = (value: unknown): value is EncryptedJsonEnvelopeV1 =>
    Boolean(
        value &&
            typeof value === 'object' &&
            '__learnCardAiAgentEncrypted' in value &&
            value.__learnCardAiAgentEncrypted === true &&
            'version' in value &&
            value.version === 1 &&
            'format' in value &&
            value.format === 'dag-jwe' &&
            'kid' in value &&
            typeof value.kid === 'string' &&
            'recipientDid' in value &&
            typeof value.recipientDid === 'string' &&
            'jwe' in value &&
            value.jwe &&
            typeof value.jwe === 'object'
    );

export const createFieldAad = ({
    collectionName,
    ownerDid,
    stableRecordId,
    fieldPath,
}: {
    collectionName: string;
    ownerDid: string;
    stableRecordId: string;
    fieldPath: string;
}): string =>
    `collection:${collectionName}:owner:${ownerDid}:id:${stableRecordId}:field:${fieldPath}:v1`;

export const createLearnCardDagJweEncryptionService = ({
    keyId,
    getWallet,
}: {
    keyId: string;
    getWallet: () => Promise<AgentNetworkWallet>;
}): EncryptionService => {
    const service: EncryptionService = {
        encryptJson: async (value, aad) => {
            const wallet = await getWallet();
            const recipientDid = wallet.id.did('key');
            const jwe = await wallet.invoke.createDagJwe({ aad, value }, [recipientDid]);

            return {
                __learnCardAiAgentEncrypted: true,
                version: 1,
                format: 'dag-jwe',
                kid: keyId,
                recipientDid,
                jwe,
            };
        },
        decryptJson: async <T>(envelope: EncryptedJsonEnvelopeV1, aad: string): Promise<T> => {
            const wallet = await getWallet();
            const decrypted = await wallet.invoke.decryptDagJwe<EncryptedPayloadV1<T>>(
                envelope.jwe
            );

            if (decrypted.aad !== aad)
                throw new Error('Encrypted AI Agent field metadata mismatch.');

            return decrypted.value;
        },
        decryptLegacyOrEnvelope: async (value, aad) => {
            if (!isEncryptedEnvelope(value)) return { value, legacyPlaintext: true };

            return {
                value: await service.decryptJson(value, aad),
                legacyPlaintext: false,
            };
        },
    };

    return service;
};

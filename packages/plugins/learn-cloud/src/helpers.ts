import { CredentialRecord, JWE, EncryptedCredentialRecord } from '@learncard/types';
import stringify from 'json-stringify-deterministic';
import pbkdf2Hmac from 'pbkdf2-hmac';

import { LearnCloudDependentLearnCard } from './types';

export const hash = async (
    learnCard: LearnCloudDependentLearnCard,
    message: string
): Promise<string> => {
    const crypto = learnCard.invoke.crypto();

    const uint8Message = new TextEncoder().encode(message);

    const pk = learnCard.id.keypair('secp256k1').d;
    const hmacKey = await pbkdf2Hmac(pk, 'salt', 1000, 32);
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        hmacKey,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const digestBuffer = await crypto.subtle.sign('HMAC', cryptoKey, uint8Message);

    const digestArray = Array.from(new Uint8Array(digestBuffer));

    return digestArray.map(byte => (byte as any).toString(16).padStart(2, '0')).join('');
};

export const generateJWE = async (
    learnCard: LearnCloudDependentLearnCard,
    learnCloudDid: string,
    item: any
): Promise<JWE> => {
    return learnCard.invoke.getDIDObject().createDagJWE(item, [learnCard.id.did(), learnCloudDid]);
};

export const decryptJWE = async <T>(
    learnCard: LearnCloudDependentLearnCard,
    jwe: JWE
): Promise<T> => {
    return learnCard.invoke.getDIDObject().decryptDagJWE(jwe) as any;
};

export const generateEncryptedFieldsArray = async (
    learnCard: LearnCloudDependentLearnCard,
    record: CredentialRecord,
    unencryptedFields: string[] = []
): Promise<string[]> => {
    const entries = Object.entries(record);

    return (
        await Promise.all(
            entries.map(async ([key, value]) => {
                if (!unencryptedFields.includes(key)) {
                    const result = await hash(learnCard, `${key}:${stringify(value)}`);

                    return result;
                }

                return '';
            })
        )
    ).filter(Boolean);
};

export const generateEncryptedRecord = async (
    learnCard: LearnCloudDependentLearnCard,
    record: CredentialRecord,
    unencryptedFields: string[] = []
): Promise<Omit<EncryptedCredentialRecord, 'id'>> => {
    const encryptedRecord = await learnCard.invoke
        .getDIDObject()
        .createDagJWE(record, [learnCard.id.did()]);

    const fields = await generateEncryptedFieldsArray(learnCard, record, unencryptedFields);

    const unencryptedEntries = Object.fromEntries(
        Object.entries(record).filter(([key]) => unencryptedFields.includes(key))
    );

    return { ...unencryptedEntries, encryptedRecord, fields };
};

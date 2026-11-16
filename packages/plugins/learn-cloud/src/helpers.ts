import { JWE, EncryptedRecord } from '@learncard/types';
import stringify from 'json-stringify-deterministic';
import pbkdf2Hmac from 'pbkdf2-hmac';

import { LearnCloudDependentLearnCard } from './types';

export const hash = async (
    learnCard: LearnCloudDependentLearnCard,
    message: string
): Promise<string> => {
    const lcHash = await learnCard.invoke.hash?.(message, 'PBKDF2-HMAC-SHA256');

    if (lcHash) return lcHash;

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
    return learnCard.invoke.createDagJwe(item, [learnCloudDid]);
};

export const decryptJWE = async <T>(
    learnCard: LearnCloudDependentLearnCard,
    jwe: JWE
): Promise<T> => {
    return learnCard.invoke.decryptDagJwe<T>(jwe);
};

export const generateEncryptedFieldsArray = async (
    learnCard: LearnCloudDependentLearnCard,
    record: Record<string, any>,
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
    record: Record<string, any>,
    unencryptedFields: string[] = []
): Promise<EncryptedRecord> => {
    const encryptedRecord = await learnCard.invoke.createDagJwe(record);

    const fields = await generateEncryptedFieldsArray(learnCard, record, unencryptedFields);

    const unencryptedEntries = Object.fromEntries(
        Object.entries(record).filter(([key]) => unencryptedFields.includes(key))
    );

    return { ...unencryptedEntries, encryptedRecord, fields };
};

const isOperatorValue = (value: unknown): value is Record<string, unknown> =>
    Boolean(value) &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value as object).length > 0 &&
    Object.keys(value as object).every(key => ['$ne', '$nin', '$in'].includes(key));

/**
 * Builds the server filter for an index query. Encrypted fields are matched by hash, so
 * `$ne`/`$nin` become `fields.$nin` and `$in` becomes a `fields.$in` clause; unencrypted
 * fields keep the plain operator. Equality-only queries produce exactly the filter they
 * always have (`fields.$in` over every equality hash), so existing callers are unchanged.
 */
export const generateIndexQuery = async (
    learnCard: LearnCloudDependentLearnCard,
    query: Record<string, unknown>,
    unencryptedFields: string[] = []
): Promise<Record<string, unknown>> => {
    const equality: Record<string, unknown> = {};
    const unencrypted: Record<string, unknown> = {};
    const excluded: string[] = [];
    const anyOf: string[][] = [];

    for (const [key, value] of Object.entries(query)) {
        if (unencryptedFields.includes(key)) {
            unencrypted[key] = value;
            continue;
        }
        if (!isOperatorValue(value)) {
            equality[key] = value;
            continue;
        }
        const notEqual = [
            ...('$ne' in value ? [value.$ne] : []),
            ...('$nin' in value && Array.isArray(value.$nin) ? value.$nin : []),
        ];
        excluded.push(
            ...(await Promise.all(
                notEqual.map(item => hash(learnCard, `${key}:${stringify(item)}`))
            ))
        );
        if ('$in' in value && Array.isArray(value.$in)) {
            anyOf.push(
                await Promise.all(
                    value.$in.map(item => hash(learnCard, `${key}:${stringify(item)}`))
                )
            );
        }
    }

    const fields = await generateEncryptedFieldsArray(learnCard, equality);
    const fieldFilter = {
        ...(fields.length > 0 ? { $in: fields } : {}),
        ...(excluded.length > 0 ? { $nin: excluded } : {}),
    };

    return {
        ...unencrypted,
        ...(Object.keys(fieldFilter).length > 0 ? { fields: fieldFilter } : {}),
        ...(anyOf.length > 0 ? { $and: anyOf.map(hashes => ({ fields: { $in: hashes } })) } : {}),
    };
};

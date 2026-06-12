import { createHash } from 'node:crypto';

import { decryptWithPassword, encryptWithPassword } from '@learncard/sss-key-manager';

import type { EncryptedPayloadEnvelope } from './types';

export const sha256Hex = (bytes: string | Buffer): string =>
    createHash('sha256').update(bytes).digest('hex');

export const stableStringify = (value: unknown): string => {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);

    if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;

    const object = value as Record<string, unknown>;

    return `{${Object.keys(object)
        .sort()
        .map(key => `${JSON.stringify(key)}:${stableStringify(object[key])}`)
        .join(',')}}`;
};

export const encodePayload = async (
    plaintext: string,
    options: { encrypt: boolean; password?: string }
): Promise<{ stored: string; encrypted: boolean }> => {
    if (!options.encrypt) return { stored: plaintext, encrypted: false };

    if (!options.password)
        throw new Error('A password is required for encrypted LearnCard exports');

    return {
        stored: JSON.stringify(await encryptWithPassword(plaintext, options.password), null, 2),
        encrypted: true,
    };
};

export const decodePayload = async (
    stored: string,
    options: { encrypted: boolean; password?: string }
): Promise<string> => {
    if (!options.encrypted) return stored;

    if (!options.password)
        throw new Error('A password is required to decrypt this LearnCard export');

    const envelope = JSON.parse(stored) as EncryptedPayloadEnvelope;

    return decryptWithPassword(
        envelope.ciphertext,
        envelope.iv,
        envelope.salt,
        options.password,
        envelope.kdfParams
    );
};

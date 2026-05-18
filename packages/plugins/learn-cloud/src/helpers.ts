import { JWE, EncryptedRecord } from '@learncard/types';
import stringify from 'json-stringify-deterministic';
import pbkdf2Hmac from 'pbkdf2-hmac';
import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha2';

import { LearnCloudDependentLearnCard } from './types';

/**
 * Searchable-encryption field hash used by the LearnCloud index plane.
 *
 * Derives an HMAC key from the user's secp256k1 private scalar via
 * PBKDF2, then computes HMAC-SHA256(key, message). The output is the
 * server-side searchable token: identical inputs produce identical
 * tokens so the server can filter on `fields[]` without ever seeing
 * the plaintext.
 *
 * **Why pure-JS HMAC-SHA256 instead of `crypto.subtle`?** The previous
 * implementation called `crypto.subtle.importKey` + `crypto.subtle.sign`.
 * Both are `undefined` on iOS WKWebView when the page is loaded over a
 * non-secure origin (e.g. the `pnpm start --host` dev hot-reload
 * workflow that points Capacitor at `http://<LAN-IP>:3000`), crashing
 * the credential-storage step with "undefined is not an object
 * (evaluating 'crypto.subtle.importKey')". `@noble/hashes` is a
 * pure-JS implementation that works in any context. The output is
 * byte-for-byte identical to WebCrypto's HMAC-SHA256, so existing
 * indexes stay searchable across the upgrade.
 *
 * Host wallets that already expose `invoke.hash(message, alg)` win:
 * the early-return on the first line lets them substitute a custom
 * implementation (e.g. one routed through native iOS crypto).
 */
export const hash = async (
    learnCard: LearnCloudDependentLearnCard,
    message: string
): Promise<string> => {
    const lcHash = await learnCard.invoke.hash?.(message, 'PBKDF2-HMAC-SHA256');

    if (lcHash) return lcHash;

    const uint8Message = new TextEncoder().encode(message);

    const pk = learnCard.id.keypair('secp256k1').d;
    const hmacKey = new Uint8Array(await pbkdf2Hmac(pk, 'salt', 1000, 32));

    const digestBytes = hmac(sha256, hmacKey, uint8Message);

    return Array.from(digestBytes)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
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

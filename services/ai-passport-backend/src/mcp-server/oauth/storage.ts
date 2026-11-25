import { randomUUID } from 'crypto';
import cache, { evalOwnerMutation } from '../../utils/cache';
import { withOwnerOperation } from '../../services/dataErasure';
import {
    consumeOwnerAuthenticationRecord,
    INDEX_AUTHENTICATION_RECORD_SCRIPT,
    ownerAuthenticationIndexKey,
    setOwnerAuthenticationRecord,
} from '../../services/ownerAuthIndex';

export type StorageResult<T> =
    { success: true; data: T } | { success: false; error: 'not_found' | 'storage_error' };

export interface AuthorizationCodeData {
    code: string;
    did: string;
    clientId: string;
    redirectUri: string;
    codeChallenge: string;
    codeChallengeMethod: string;
}
const AUTH_CODE_PREFIX = 'oauth:authcode:';
const AUTH_CODE_TTL = 600;
const oauthStore = () => {
    if (!cache.redis) throw new Error('Persistent Redis is required for OAuth credentials');
    return cache.redis;
};

export async function generateAuthorizationCode(
    did: string,
    clientId: string,
    redirectUri: string,
    codeChallenge: string,
    codeChallengeMethod: string
): Promise<string> {
    return withOwnerOperation(did, async () => {
        const code = randomUUID();
        const data: AuthorizationCodeData = {
            code,
            did,
            clientId,
            redirectUri,
            codeChallenge,
            codeChallengeMethod,
        };
        await setOwnerAuthenticationRecord(
            oauthStore(),
            did,
            `${AUTH_CODE_PREFIX}${code}`,
            JSON.stringify(data),
            AUTH_CODE_TTL
        );
        return code;
    });
}
export async function consumeAuthorizationCode(
    code: string
): Promise<StorageResult<AuthorizationCodeData>> {
    try {
        const key = `${AUTH_CODE_PREFIX}${code}`;
        const value = await oauthStore().get(key);
        if (!value) return { success: false, error: 'not_found' };
        const parsed = JSON.parse(value) as AuthorizationCodeData & {
            used?: boolean;
        };
        // Owner is taken only from server-stored state. CAS is the sole consumption path;
        // no fallback may exchange a code when the atomic command fails.
        return await withOwnerOperation(
            parsed.did,
            async (): Promise<StorageResult<AuthorizationCodeData>> => {
                const consumed = await consumeOwnerAuthenticationRecord(
                    oauthStore(),
                    parsed.did,
                    key,
                    value
                );
                if (!consumed || parsed.used) return { success: false, error: 'not_found' };
                return { success: true, data: parsed };
            }
        );
    } catch {
        return { success: false, error: 'storage_error' };
    }
}
export interface RefreshTokenData {
    token: string;
    did: string;
    clientId: string;
}
const REFRESH_TOKEN_PREFIX = 'oauth:refresh:';
const REFRESH_TOKEN_TTL = 60 * 60 * 24 * 30;
export async function storeRefreshToken(
    token: string,
    did: string,
    clientId: string
): Promise<void> {
    await withOwnerOperation(did, async () => {
        const data: RefreshTokenData = { token, did, clientId };
        await setOwnerAuthenticationRecord(
            oauthStore(),
            did,
            `${REFRESH_TOKEN_PREFIX}${token}`,
            JSON.stringify(data),
            REFRESH_TOKEN_TTL
        );
    });
}
export async function getRefreshToken(token: string): Promise<StorageResult<RefreshTokenData>> {
    try {
        const data = await oauthStore().get(`${REFRESH_TOKEN_PREFIX}${token}`);
        if (!data) return { success: false, error: 'not_found' };
        return { success: true, data: JSON.parse(data) as RefreshTokenData };
    } catch {
        return { success: false, error: 'storage_error' };
    }
}
// Persisting the successor and consuming the predecessor is one fenced CAS.
// A paused caller cannot leave two redeemable tokens or publish after erasure.
export async function rotateRefreshToken(
    previous: RefreshTokenData,
    token: string
): Promise<boolean> {
    return withOwnerOperation(previous.did, async () => {
        const next: RefreshTokenData = {
            token,
            did: previous.did,
            clientId: previous.clientId,
        };
        return (
            (await evalOwnerMutation(
                oauthStore(),
                previous.did,
                `
    local indexType = redis.call("TYPE", KEYS[6]).ok
    if indexType ~= "none" and indexType ~= "zset" then return redis.error_reply("INVALID_AUTHENTICATION_INDEX") end
    local value = redis.call("GET", KEYS[4])
    if not value then return 0 end
    local previous = cjson.decode(value)
    if previous.token ~= ARGV[2] or previous.did ~= ARGV[3] or previous.clientId ~= ARGV[4] then return 0 end
    redis.call("SET", KEYS[5], ARGV[5], "EX", ARGV[6])
    redis.call("DEL", KEYS[4])
    redis.call("ZREM", KEYS[6], ARGV[8])
    local recordKey = KEYS[5]
    local indexKey = KEYS[6]
    local member = ARGV[7]
    ${INDEX_AUTHENTICATION_RECORD_SCRIPT}
    return 1`,
                [
                    `${REFRESH_TOKEN_PREFIX}${previous.token}`,
                    `${REFRESH_TOKEN_PREFIX}${token}`,
                    ownerAuthenticationIndexKey(previous.did),
                ],
                [
                    previous.token,
                    previous.did,
                    previous.clientId,
                    JSON.stringify(next),
                    REFRESH_TOKEN_TTL,
                    `${REFRESH_TOKEN_PREFIX}${token}`,
                    `${REFRESH_TOKEN_PREFIX}${previous.token}`,
                ]
            )) === 1
        );
    });
}
export async function deleteRefreshToken(token: string): Promise<void> {
    const key = `${REFRESH_TOKEN_PREFIX}${token}`;
    const value = await oauthStore().get(key);
    if (!value) return;
    const record = JSON.parse(value) as RefreshTokenData;
    await withOwnerOperation(record.did, async () => {
        await consumeOwnerAuthenticationRecord(oauthStore(), record.did, key, value);
    });
}

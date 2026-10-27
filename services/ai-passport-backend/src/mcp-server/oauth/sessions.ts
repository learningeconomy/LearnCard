import { randomUUID } from 'crypto';
import cache, { evalOwnerMutation } from '../../utils/cache';
import { getCurrentOwnerOperation, withOwnerOperation } from '../../services/dataErasure';
import {
    consumeOwnerAuthenticationRecord,
    setOwnerAuthenticationRecord,
} from '../../services/ownerAuthIndex';
import type { StorageResult } from './storage';

const SESSION_PREFIX = 'oauth:session:';
const SESSION_TTL = 600;

export interface OAuthSessionData {
    did?: string;
    clientId: string;
    redirectUri: string;
    state: string;
    codeChallenge: string;
    codeChallengeMethod: string;
}

export async function createOAuthSession(data: OAuthSessionData): Promise<string> {
    const sessionId = randomUUID();
    const key = `${SESSION_PREFIX}${sessionId}`;
    if (data.did) {
        const did = data.did;
        await withOwnerOperation(did, async () => {
            if (!cache.redis) throw new Error('Persistent Redis is required for OAuth sessions');
            await setOwnerAuthenticationRecord(
                cache.redis,
                did,
                key,
                JSON.stringify(data),
                SESSION_TTL
            );
        });
    } else {
        // Before authentication these contain only client/PKCE parameters, no owner.
        await cache.set(key, JSON.stringify(data), SESSION_TTL);
    }
    return sessionId;
}

export async function consumeOAuthSession(
    sessionId: string
): Promise<StorageResult<OAuthSessionData>> {
    try {
        if (!cache.redis) throw new Error('Persistent Redis is required for OAuth sessions');
        const key = `${SESSION_PREFIX}${sessionId}`;
        const value = await cache.redis.get(key);
        if (!value) return { success: false, error: 'not_found' };
        const data = JSON.parse(value) as OAuthSessionData;
        const operation = getCurrentOwnerOperation();
        if (data.did && operation && data.did !== operation.did)
            return { success: false, error: 'not_found' };
        const did = data.did ?? operation?.did;
        // A callback must already have an authenticated owner. Tests and other
        // consumers of owner-bound sessions may establish that owner's fence here.
        if (!did) throw new Error('OAuth session consumption requires an owner');
        return await withOwnerOperation(did, async (): Promise<StorageResult<OAuthSessionData>> => {
            const consumed = data.did
                ? await consumeOwnerAuthenticationRecord(cache.redis!, did, key, value)
                : (await evalOwnerMutation(
                      cache.redis!,
                      did,
                      `
if redis.call("GET", KEYS[4]) ~= ARGV[2] then return 0 end
return redis.call("DEL", KEYS[4])`,
                      [key],
                      [value]
                  )) === 1;
            return consumed ? { success: true, data } : { success: false, error: 'not_found' };
        });
    } catch {
        return { success: false, error: 'storage_error' };
    }
}

/**
 * Resource-server side: bearer → live grant without a grantId in the request body.
 */
import { settleGrantExpiry } from '../v1/auth';
import type { HcpV1Deps } from '../v1/service/deps';
import { toGrant } from '../v1/service/grants';
import { parseScopeString } from './scopes';
import { verifyAccessToken, type TokenSignerConfig } from './tokens';
import type { ResolvedHcpGrantAuth } from './types';

export type ResolveBearerResult =
    | { ok: true; auth: ResolvedHcpGrantAuth }
    | { ok: false; status: 401; error: 'invalid_token' | 'expired_token' | 'revoked_grant' };

/**
 * Verifies the JWT, loads the bound grant, and re-checks live status (§13.6 / §6.2.2).
 */
export const resolveBearerToGrant = async (
    deps: Pick<HcpV1Deps, 'store' | 'now' | 'newId' | 'providerId' | 'contracts'>,
    tokenConfig: TokenSignerConfig,
    token: string
): Promise<ResolveBearerResult> => {
    const verified = await verifyAccessToken(tokenConfig, token);
    if (!verified.ok) {
        return { ok: false, status: 401, error: verified.error };
    }

    const stored = await deps.store.getGrant(verified.claims.grant_id);
    if (!stored) {
        return { ok: false, status: 401, error: 'invalid_token' };
    }

    // Full deps shape is only needed for settleGrantExpiry's urn/newId/providerId.
    const settled = await settleGrantExpiry(deps as HcpV1Deps, stored);
    if (settled.status !== 'active' || settled.access.length === 0) {
        return { ok: false, status: 401, error: 'revoked_grant' };
    }

    if (settled.client.id !== verified.claims.sub) {
        return { ok: false, status: 401, error: 'invalid_token' };
    }

    // Token scope is an upper bound from consent; live grant may shrink later.
    // Never widen: auth.scopes = intersection(token, live).
    const live = toGrant(settled);
    const tokenScopes = parseScopeString(verified.claims.scope);
    const liveSet = new Set(live.scopes);
    const scopes = tokenScopes.filter(scope => liveSet.has(scope));

    return {
        ok: true,
        auth: {
            grant: settled,
            clientDid: settled.client.id,
            oauthClientId: verified.claims.client_id,
            scopes,
            tokenJti: verified.claims.jti,
            expiresAt: verified.claims.exp,
        },
    };
};

export const extractBearer = (authorization: string | undefined): string | null => {
    if (!authorization) return null;
    const match = /^Bearer\s+(.+)$/i.exec(authorization.trim());
    return match?.[1]?.trim() || null;
};

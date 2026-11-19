/**
 * Bridge Unit 1 `resolveBearerToGrant` into `@learncard/mcp` AuthInfo, and cap
 * live grant.access to the token∩grant scopes for service calls (Critic P1).
 */
import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import { InvalidTokenError } from '@learncard/mcp';

import { isRegisteredCategory, type AccessDetail } from '../v1/schemas';
import type { HcpV1Deps } from '../v1/service/deps';
import type { HcpV1Store } from '../v1/store/port';
import { resolveBearerToGrant } from '../oauth/rs';
import type { TokenSignerConfig } from '../oauth/tokens';
import type { ResolvedHcpGrantAuth } from '../oauth/types';

export type HcpMcpAuthExtra = {
    did: string;
    grantId: string;
    subjectDid: string;
};

/**
 * Keep only registered category/action pairs that appear in `scopes`.
 * Filtering categories and actions independently would rebuild the AccessDetail
 * cross product (`scopesForAccess`) and widen past the token. Custom categories
 * have no OAuth scope form, so they stay on a separate detail with their
 * original actions.
 */
export const narrowAccessToScopes = (
    access: readonly AccessDetail[],
    scopes: readonly string[]
): AccessDetail[] => {
    const allowed = new Set(scopes);
    const narrowed: AccessDetail[] = [];
    for (const detail of access) {
        const custom = detail.categories.filter(c => !isRegisteredCategory(c));
        const registered = detail.categories.filter(isRegisteredCategory);
        for (const category of registered) {
            const keptActions = detail.actions.filter(action =>
                allowed.has(`hcp:${category}:${action}`)
            );
            if (keptActions.length === 0) continue;
            narrowed.push({ ...detail, categories: [category], actions: keptActions });
        }
        if (custom.length > 0) {
            narrowed.push({ ...detail, categories: custom, actions: [...detail.actions] });
        }
    }
    return narrowed;
};

/** Store proxy: `getGrant(grantId)` returns access narrowed to token scopes. */
export const withTokenScopedGrant = (
    deps: HcpV1Deps,
    grantId: string,
    scopes: readonly string[]
): HcpV1Deps => {
    const store: HcpV1Store = new Proxy(deps.store, {
        get(target, prop, receiver) {
            if (prop === 'getGrant') {
                return async (id: string) => {
                    const grant = await target.getGrant(id);
                    if (!grant || id !== grantId) return grant;
                    return { ...grant, access: narrowAccessToScopes(grant.access, scopes) };
                };
            }
            const value = Reflect.get(target, prop, receiver);
            return typeof value === 'function' ? value.bind(target) : value;
        },
    });
    return { ...deps, store };
};

export const authInfoFromResolved = (token: string, auth: ResolvedHcpGrantAuth): AuthInfo => ({
    token,
    clientId: auth.oauthClientId,
    scopes: auth.scopes,
    expiresAt: auth.expiresAt,
    extra: {
        did: auth.clientDid,
        grantId: auth.grant.grantId,
        subjectDid: auth.grant.subjectDid,
    } satisfies HcpMcpAuthExtra,
});

export const createHcpVerifyAccessToken = (
    deps: Pick<HcpV1Deps, 'store' | 'now' | 'newId' | 'providerId' | 'contracts'>,
    tokenConfig: TokenSignerConfig
) => {
    return async (token: string): Promise<AuthInfo> => {
        const resolved = await resolveBearerToGrant(deps, tokenConfig, token);
        if (!resolved.ok) {
            throw new InvalidTokenError(resolved.error);
        }
        return authInfoFromResolved(token, resolved.auth);
    };
};

export const requireHcpAuth = (
    authInfo: AuthInfo | undefined
): HcpMcpAuthExtra & { scopes: string[]; token: string } => {
    const grantId = authInfo?.extra?.grantId;
    const subjectDid = authInfo?.extra?.subjectDid;
    const did = authInfo?.extra?.did;
    if (
        !authInfo ||
        typeof grantId !== 'string' ||
        typeof subjectDid !== 'string' ||
        typeof did !== 'string'
    ) {
        throw new InvalidTokenError('invalid_token');
    }
    return {
        did,
        grantId,
        subjectDid,
        scopes: authInfo.scopes ?? [],
        token: authInfo.token,
    };
};

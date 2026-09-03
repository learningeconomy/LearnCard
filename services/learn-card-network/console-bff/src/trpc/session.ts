import type { DashboardSession, EcosystemRoleGrant } from '@learncard/types';

import { DidAuthBearerFactory } from '../brain/did-auth';
import { authorizedCall } from '../brain';
import type { ConsoleContext } from './trpc';

type AuthedContext = Omit<ConsoleContext, 'session'> & {
    session: NonNullable<ConsoleContext['session']>;
};

const ROLE_RANK: Record<EcosystemRoleGrant['role'], number> = {
    VIEWER: 0,
    MEMBER: 1,
    ADMIN: 2,
    OWNER: 3,
};

// ADR-001 §3.9: the IdP assertion sets the JIT grants at login, but the enforced authority is
// the MEMBER_OF edge in brain — which out-of-band grants (seed:education-os, an admin promoting a
// member) update without a re-login. The session view overlays the live edges so the console
// never hides a control brain would allow; where both exist the higher role wins.
export const withLiveEcosystemRoles = async (ctx: AuthedContext): Promise<DashboardSession> => {
    const keyRef = await ctx.keyRefFor(ctx.session.managedDid);
    if (!keyRef) return ctx.session;

    let live: EcosystemRoleGrant[];
    try {
        const result = await authorizedCall(
            new DidAuthBearerFactory(ctx.kms),
            ctx.transport,
            ctx.session.managedDid,
            keyRef,
            bearer =>
                ctx.transport.trpcQuery<EcosystemRoleGrant[]>(
                    bearer,
                    'ecosystem.listMyMemberships',
                    undefined
                )
        );
        live = Array.isArray(result) ? result : [];
    } catch {
        return ctx.session;
    }

    const byEcosystem = new Map<string, EcosystemRoleGrant>();
    for (const grant of [...ctx.session.effectiveAccess.ecosystemRoles, ...live]) {
        const existing = byEcosystem.get(grant.ecosystemId);
        if (!existing || ROLE_RANK[grant.role] > ROLE_RANK[existing.role]) {
            byEcosystem.set(grant.ecosystemId, grant);
        }
    }

    return {
        ...ctx.session,
        effectiveAccess: {
            ...ctx.session.effectiveAccess,
            ecosystemRoles: [...byEcosystem.values()],
        },
    };
};

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { EcosystemValidator } from '@learncard/types';

import { t, didAndChallengeRoute, profileRoute, serviceDidRoute } from '@routes';
import {
    getEcosystemById,
    getChildEcosystems,
    getRootEcosystemsForTenant,
} from '@accesslayer/ecosystem/read';
import {
    grantEcosystemMembership,
    getEcosystemMembershipRole,
} from '@accesslayer/ecosystem/membership';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import { getTenantRootEcosystem } from '@accesslayer/tenant/read';

// OWNER is structural (set once at Ecosystem creation, one per Ecosystem) and cannot be
// conferred as a membership grant. Only ADMIN can grant, and never a role above their own.
const GrantableRoleValidator = z.enum(['ADMIN', 'MEMBER', 'VIEWER']);

// Automated service provisioning (JIT) may only ever confer non-admin roles — a compromised
// or buggy service DID must never be able to escalate a subject to ADMIN/OWNER.
const ProvisionableRoleValidator = z.enum(['MEMBER', 'VIEWER']);

export const ecosystemsRouter = t.router({
    getEcosystem: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/ecosystem/{id}',
                tags: ['Ecosystems'],
                summary: 'Get an Ecosystem by ID',
                description: 'Retrieves a single Ecosystem aggregate by its ID.',
            },
        })
        .input(z.object({ id: z.string() }))
        .output(EcosystemValidator.optional())
        .query(async ({ input }) => {
            const ecosystem = await getEcosystemById(input.id);

            if (!ecosystem) throw new TRPCError({ code: 'NOT_FOUND' });

            return ecosystem;
        }),

    getChildEcosystems: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/ecosystem/{id}/children',
                tags: ['Ecosystems'],
                summary: 'List child Ecosystems',
                description: 'Lists the direct child Ecosystems of the given parent.',
            },
        })
        .input(z.object({ id: z.string() }))
        .output(z.array(EcosystemValidator))
        .query(async ({ input }) => {
            return getChildEcosystems(input.id);
        }),

    getRootEcosystems: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/ecosystem/root/{rootEcosystemId}',
                tags: ['Ecosystems'],
                summary: 'List Ecosystems within a tenant root tree',
                description: 'Lists all Ecosystems sharing the given root Ecosystem ID.',
            },
        })
        .input(z.object({ rootEcosystemId: z.string() }))
        .output(z.array(EcosystemValidator))
        .query(async ({ input }) => {
            return getRootEcosystemsForTenant(input.rootEcosystemId);
        }),

    getMyTenantRoot: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/ecosystem/tenant/root',
                tags: ['Ecosystems'],
                summary: "Get the calling tenant's shadow root Ecosystem",
                description:
                    'Resolves the root Ecosystem bound (via SERVES) to the tenant on the request.',
            },
        })
        .input(z.object({}).default({}))
        .output(EcosystemValidator.optional())
        .query(async ({ ctx }) => {
            const tenantId = ctx.tenant?.id;

            if (!tenantId) throw new TRPCError({ code: 'NOT_FOUND' });

            const root = await getTenantRootEcosystem(tenantId);

            if (!root) throw new TRPCError({ code: 'NOT_FOUND' });

            return root;
        }),

    grantMembership: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/ecosystem/{id}/members',
                tags: ['Ecosystems'],
                summary: 'Grant a Profile membership in an Ecosystem',
                description:
                    'Creates or updates a MEMBER_OF edge with the given role. Caller must own or be an ADMIN of the Ecosystem.',
            },
        })
        .input(
            z.object({
                id: z.string(),
                profileId: z.string(),
                role: GrantableRoleValidator,
            })
        )
        .output(z.object({ granted: z.boolean(), role: GrantableRoleValidator }))
        .mutation(async ({ ctx, input }) => {
            const ecosystem = await getEcosystemById(input.id);

            if (!ecosystem)
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Ecosystem not found' });

            const callerProfileId = ctx.user.profile.profileId;
            const isOwner = ecosystem.ownerProfileId === callerProfileId;
            const callerRole = isOwner
                ? 'OWNER'
                : await getEcosystemMembershipRole(callerProfileId, input.id);

            if (callerRole !== 'OWNER' && callerRole !== 'ADMIN') {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Only an Ecosystem owner or admin may grant membership',
                });
            }

            const target = await getProfileByProfileId(input.profileId);

            if (!target) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Target profile not found' });
            }

            await grantEcosystemMembership({
                profileId: input.profileId,
                ecosystemId: input.id,
                role: input.role,
            });

            return { granted: true, role: input.role };
        }),

    grantProvisionedMembership: serviceDidRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/ecosystem/{id}/members/provisioned',
                tags: ['Ecosystems'],
                summary: 'Service-provisioned Ecosystem membership (JIT)',
                description:
                    'Grants a non-admin MEMBER_OF role. Restricted to authorized service DIDs and to MEMBER/VIEWER.',
            },
        })
        .input(
            z.object({
                id: z.string(),
                profileId: z.string(),
                role: ProvisionableRoleValidator,
            })
        )
        .output(z.object({ granted: z.boolean(), role: ProvisionableRoleValidator }))
        .mutation(async ({ input }) => {
            const ecosystem = await getEcosystemById(input.id);

            if (!ecosystem)
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Ecosystem not found' });

            const target = await getProfileByProfileId(input.profileId);

            if (!target) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Target profile not found' });
            }

            await grantEcosystemMembership({
                profileId: input.profileId,
                ecosystemId: input.id,
                role: input.role,
            });

            return { granted: true, role: input.role };
        }),
});

export type EcosystemsRouter = typeof ecosystemsRouter;

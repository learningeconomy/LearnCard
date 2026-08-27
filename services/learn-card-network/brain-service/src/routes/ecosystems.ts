import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { EcosystemValidator, EcosystemRoleEnum, SLUG_REGEX } from '@learncard/types';

import { t, didAndChallengeRoute, profileRoute, serviceDidRoute } from '@routes';
import {
    getEcosystemById,
    getChildEcosystems,
    getRootEcosystemsForTenant,
    inflateEcosystem,
} from '@accesslayer/ecosystem/read';
import { createEcosystem } from '@accesslayer/ecosystem/create';
import { updateEcosystemSettings } from '@accesslayer/ecosystem/update';
import { FlatEcosystemType } from 'types/ecosystem';
import {
    grantEcosystemMembership,
    getEcosystemMembershipRole,
    getEcosystemMembers,
    revokeEcosystemMembership,
} from '@accesslayer/ecosystem/membership';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import { getTenantRootEcosystem } from '@accesslayer/tenant/read';
import { readAppStoreListingById } from '@accesslayer/app-store-listing/read';
import { getCatalogPolicySnapshot } from '@helpers/catalog-policy.helpers';

// OWNER is structural (set once at Ecosystem creation, one per Ecosystem) and cannot be
// conferred as a membership grant. Only ADMIN can grant, and never a role above their own.
const GrantableRoleValidator = z.enum(['ADMIN', 'MEMBER', 'VIEWER']);

// Automated service provisioning (JIT) may only ever confer non-admin roles — a compromised
// or buggy service DID must never be able to escalate a subject to ADMIN/OWNER.
const ProvisionableRoleValidator = z.enum(['MEMBER', 'VIEWER']);

const CatalogPolicyStateValidator = z.object({
    ecosystemId: z.string(),
    allowedListings: z.array(z.string()).nullable(),
    requireEndorsement: z.boolean(),
    unrestricted: z.boolean(),
});

const resolveCallerRole = async (
    ecosystem: { id: string; ownerProfileId: string },
    callerProfileId: string
) =>
    ecosystem.ownerProfileId === callerProfileId
        ? ('OWNER' as const)
        : getEcosystemMembershipRole(callerProfileId, ecosystem.id);

const readCatalogPolicyState = async (ecosystemId: string) => {
    const snapshot = await getCatalogPolicySnapshot(ecosystemId);

    return {
        ecosystemId,
        allowedListings: snapshot.allowedListings ?? null,
        requireEndorsement: snapshot.requireEndorsement,
        // ADR-010 §3.2: an absent allowedListings is permissive at this level.
        unrestricted: !snapshot.allowedListings,
    };
};

// ADR-010 D1/D8: enablement is a governor-level policy write, so it carries the same
// OWNER/ADMIN posture as membership writes.
const assertCatalogGovernor = async (
    ecosystem: { id: string; ownerProfileId: string },
    callerProfileId: string
): Promise<void> => {
    const callerRole = await resolveCallerRole(ecosystem, callerProfileId);

    if (callerRole !== 'OWNER' && callerRole !== 'ADMIN') {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: "Only an Ecosystem owner or admin may change the Ecosystem's catalog policy",
        });
    }
};

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

    createEcosystem: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/ecosystem',
                tags: ['Ecosystems'],
                summary: 'Create a child Ecosystem',
                description:
                    'Creates an Ecosystem under the given parent. Caller must own or be an ADMIN of the parent; the caller becomes the new Ecosystem owner.',
            },
        })
        .input(
            z.object({
                parentEcosystemId: z.string(),
                name: z.string().min(1).max(120),
                slug: z.string().regex(SLUG_REGEX),
                description: z.string().max(500).optional(),
            })
        )
        .output(EcosystemValidator)
        .mutation(async ({ ctx, input }) => {
            const parent = await getEcosystemById(input.parentEcosystemId);

            if (!parent)
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Parent Ecosystem not found' });

            const callerProfileId = ctx.user.profile.profileId;
            const isOwner = parent.ownerProfileId === callerProfileId;
            const callerRole = isOwner
                ? 'OWNER'
                : await getEcosystemMembershipRole(callerProfileId, parent.id);

            if (callerRole !== 'OWNER' && callerRole !== 'ADMIN') {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Only an Ecosystem owner or admin may create a child Ecosystem',
                });
            }

            const siblings = await getChildEcosystems(parent.id);

            if (siblings.some(sibling => sibling.slug === input.slug)) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'A sibling Ecosystem already uses this slug',
                });
            }

            const created = await createEcosystem({
                name: input.name,
                slug: input.slug,
                description: input.description,
                parentEcosystemId: parent.id,
                ownerProfileId: callerProfileId,
                settings: {},
                status: 'ACTIVE',
            });

            return inflateEcosystem(created.dataValues as FlatEcosystemType);
        }),

    listMembers: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/ecosystem/{id}/members',
                tags: ['Ecosystems'],
                summary: 'List Ecosystem members',
                description:
                    'Lists Profiles with a MEMBER_OF role in the Ecosystem. Caller must own or be a member of the Ecosystem.',
            },
        })
        .input(z.object({ id: z.string() }))
        .output(
            z.array(
                z.object({
                    profileId: z.string(),
                    displayName: z.string(),
                    role: EcosystemRoleEnum,
                    profileRole: z.string().nullable(),
                    email: z.string().nullable(),
                })
            )
        )
        .query(async ({ ctx, input }) => {
            const ecosystem = await getEcosystemById(input.id);

            if (!ecosystem)
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Ecosystem not found' });

            const callerProfileId = ctx.user.profile.profileId;
            const isOwner = ecosystem.ownerProfileId === callerProfileId;
            const callerRole = isOwner
                ? 'OWNER'
                : await getEcosystemMembershipRole(callerProfileId, input.id);

            if (!callerRole) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Only Ecosystem members may list membership',
                });
            }

            return getEcosystemMembers(input.id);
        }),

    revokeMembership: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'DELETE',
                path: '/ecosystem/{id}/members/{profileId}',
                tags: ['Ecosystems'],
                summary: "Revoke a Profile's Ecosystem membership",
                description:
                    'Removes the MEMBER_OF edge. Caller must own or be an ADMIN of the Ecosystem; only the owner may revoke an ADMIN.',
            },
        })
        .input(z.object({ id: z.string(), profileId: z.string() }))
        .output(z.object({ revoked: z.boolean() }))
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
                    message: 'Only an Ecosystem owner or admin may revoke membership',
                });
            }

            const targetRole = await getEcosystemMembershipRole(input.profileId, input.id);

            if (!targetRole) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Target is not a member' });
            }

            if (targetRole === 'ADMIN' && callerRole !== 'OWNER') {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Only the Ecosystem owner may revoke an admin',
                });
            }

            await revokeEcosystemMembership(input.profileId, input.id);

            return { revoked: true };
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

    getCatalogPolicy: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/ecosystem/{id}/catalog-policy',
                tags: ['Ecosystems'],
                summary: "Get an Ecosystem's catalog policy",
                description:
                    'Returns the enablement state governing which listings this Ecosystem exposes. Caller must own or be a member of the Ecosystem.',
            },
        })
        .input(z.object({ id: z.string() }))
        .output(CatalogPolicyStateValidator)
        .query(async ({ ctx, input }) => {
            const ecosystem = await getEcosystemById(input.id);

            if (!ecosystem)
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Ecosystem not found' });

            const callerRole = await resolveCallerRole(ecosystem, ctx.user.profile.profileId);

            if (!callerRole) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: "Only Ecosystem members may read the Ecosystem's catalog policy",
                });
            }

            return readCatalogPolicyState(input.id);
        }),

    enableListing: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/ecosystem/{id}/catalog-policy/enablements',
                tags: ['Ecosystems'],
                summary: "Enable a listing in an Ecosystem's catalog",
                description:
                    'Adds the listing to the Ecosystem catalog allowlist so members can install it themselves. Enabling installs nothing. Caller must own or be an ADMIN of the Ecosystem.',
            },
        })
        .input(z.object({ id: z.string(), listingId: z.string().min(1) }))
        .output(CatalogPolicyStateValidator)
        .mutation(async ({ ctx, input }) => {
            const ecosystem = await getEcosystemById(input.id);

            if (!ecosystem)
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Ecosystem not found' });

            await assertCatalogGovernor(ecosystem, ctx.user.profile.profileId);

            const listing = await readAppStoreListingById(input.listingId);

            if (!listing) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Listing not found' });
            }

            const catalogPolicy = ecosystem.settings.catalogPolicy;

            // ADR-010 §3.2: while allowedListings is absent the level is implicitly permissive.
            // The first explicit enablement moves the Ecosystem to explicit curation, so the
            // allowlist starts from the listing being enabled rather than the whole catalog.
            const allowedListings = Array.from(
                new Set([...(catalogPolicy?.allowedListings ?? []), input.listingId])
            ).sort();

            await updateEcosystemSettings(input.id, {
                ...ecosystem.settings,
                catalogPolicy: {
                    ...catalogPolicy,
                    allowedListings,
                    requireEndorsement: catalogPolicy?.requireEndorsement ?? false,
                },
            });

            return readCatalogPolicyState(input.id);
        }),

    disableListing: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'DELETE',
                path: '/ecosystem/{id}/catalog-policy/enablements/{listingId}',
                tags: ['Ecosystems'],
                summary: "Disable a listing in an Ecosystem's catalog",
                description:
                    'Removes the listing from the Ecosystem catalog allowlist. Caller must own or be an ADMIN of the Ecosystem.',
            },
        })
        .input(z.object({ id: z.string(), listingId: z.string().min(1) }))
        .output(CatalogPolicyStateValidator)
        .mutation(async ({ ctx, input }) => {
            const ecosystem = await getEcosystemById(input.id);

            if (!ecosystem)
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Ecosystem not found' });

            await assertCatalogGovernor(ecosystem, ctx.user.profile.profileId);

            const catalogPolicy = ecosystem.settings.catalogPolicy;

            if (!catalogPolicy?.allowedListings) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message:
                        "This Ecosystem's catalog is unrestricted, so no listing is individually enabled. Enable the listings you want available before disabling any.",
                });
            }

            const allowedListings = catalogPolicy.allowedListings.filter(
                listingId => listingId !== input.listingId
            );

            await updateEcosystemSettings(input.id, {
                ...ecosystem.settings,
                catalogPolicy: {
                    ...catalogPolicy,
                    allowedListings,
                    requireEndorsement: catalogPolicy.requireEndorsement ?? false,
                },
            });

            return readCatalogPolicyState(input.id);
        }),
});

export type EcosystemsRouter = typeof ecosystemsRouter;

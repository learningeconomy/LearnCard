import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';

import {
    BoostValidator as ConsumerBoostValidator,
    UnsignedVCValidator,
    VCValidator,
    JWEValidator,
    BoostRecipientValidator,
    BoostPermissionsValidator,
    PaginatedBoostRecipientsValidator,
    PaginatedBoostsValidator,
    PaginationOptionsValidator,
    PaginatedLCNProfilesValidator,
    BoostPermissions,
    BoostQueryValidator,
    LCNProfileQueryValidator,
    LCNProfileManagerQueryValidator,
    PaginatedLCNProfileManagersValidator,
    UnsignedVC,
    JWE,
    VC,
} from '@learncard/types';

import { t, profileRoute } from '@routes';

import {
    getBoostByUri,
    getBoostsForProfile,
    countBoostsForProfile,
    getBoostsByUri,
    getChildrenBoosts,
    countBoostChildren,
    getParentBoosts,
    countBoostParents,
    getSiblingBoosts,
    countBoostSiblings,
    getFamilialBoosts,
    countFamilialBoosts,
    getChildrenProfileManagers,
} from '@accesslayer/boost/read';
import {
    getBoostRecipientsSkipLimit,
    getBoostAdmins,
    getBoostRecipients,
    isProfileBoostAdmin,
    countBoostRecipients,
    isBoostParent,
    getBoostPermissions,
    canManageBoostPermissions,
    canProfileIssueBoost,
    canProfileEditBoost,
    canProfileCreateChildBoost,
    getBoostByUriWithDefaultClaimPermissions,
} from '@accesslayer/boost/relationships/read';

import { deleteStorageForUri, setStorageForUri } from '@cache/storage';

import {
    getBoostUri,
    isProfileBoostOwner,
    sendBoost,
    issueClaimLinkBoost,
    isDraftBoost,
    convertCredentialToBoostTemplateJSON,
} from '@helpers/boost.helpers';
import {
    BoostValidator,
    BoostGenerateClaimLinkInput,
    BoostStatus,
    BoostType,
    BoostWithClaimPermissionsValidator,
} from 'types/boost';
import { deleteBoost } from '@accesslayer/boost/delete';
import { createBoost } from '@accesslayer/boost/create';
import { getBoostOwner } from '@accesslayer/boost/relationships/read';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import { getSigningAuthorityForUserByName } from '@accesslayer/signing-authority/relationships/read';

import {
    isClaimLinkAlreadySetForBoost,
    setValidClaimLinkForBoost,
    getClaimLinkSAInfoForBoost,
    useClaimLinkForBoost,
} from '@cache/claim-links';
import { getBlockedAndBlockedByIds, isRelationshipBlocked } from '@helpers/connection.helpers';
import { getDidWeb, getManagedDidWeb } from '@helpers/did.helpers';
import { setBoostAsParent, setProfileAsBoostAdmin } from '@accesslayer/boost/relationships/create';
import {
    removeBoostAsParent,
    removeProfileAsBoostAdmin,
} from '@accesslayer/boost/relationships/delete';
import { getIdFromUri } from '@helpers/uri.helpers';
import { updateBoostPermissions } from '@accesslayer/boost/relationships/update';
import { EMPTY_PERMISSIONS, QUERYABLE_PERMISSIONS } from 'src/constants/permissions';
import { updateBoost } from '@accesslayer/boost/update';
import { addClaimPermissionsForBoost } from '@accesslayer/role/relationships/create';
import { issueCredentialWithSigningAuthority } from '@helpers/signingAuthority.helpers';

export const boostsRouter = t.router({
    sendBoost: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/send/{profileId}',
                tags: ['Boosts'],
                summary: 'Send a Boost',
                description: 'This endpoint sends a boost to a profile',
            },
            requiredScope: 'boosts:write',
        })
        .input(
            z.object({
                profileId: z.string(),
                uri: z.string(),
                credential: VCValidator.or(JWEValidator),
                options: z
                    .object({
                        skipNotification: z.boolean().default(false).optional(),
                    })
                    .optional(),
            })
        )
        .output(z.string())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { profileId, credential, uri, options } = input;

            if (process.env.NODE_ENV !== 'test') {
                console.log('🚀 BEGIN - Send Boost', JSON.stringify(input));
            }

            const targetProfile = await getProfileByProfileId(profileId);
            const isBlocked = await isRelationshipBlocked(profile, targetProfile);

            if (!targetProfile || isBlocked) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Profile not found. Are you sure this person exists?',
                });
            }

            const boost = await getBoostByUri(uri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            if (!(await canProfileIssueBoost(profile, boost))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not have permissions to issue boost',
                });
            }

            if (isDraftBoost(boost)) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Draft Boosts can not be sent. Only Published Boosts can be sent.',
                });
            }

            let skipNotification = profile.profileId === targetProfile.profileId;
            if (options?.skipNotification) skipNotification = options?.skipNotification;

            return sendBoost({
                from: profile,
                to: targetProfile,
                boost,
                credential,
                domain: ctx.domain,
                skipNotification,
            });
        }),

    createBoost: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/create',
                tags: ['Boosts'],
                summary: 'Creates a boost',
                description: 'This route creates a boost',
            },
            requiredScope: 'boosts:write',
        })
        .input(
            ConsumerBoostValidator.partial()
                .omit({ uri: true, claimPermissions: true })
                .extend({
                    credential: VCValidator.or(UnsignedVCValidator),
                    claimPermissions: BoostPermissionsValidator.partial().optional(),
                })
        )
        .output(z.string())
        .mutation(async ({ input, ctx }) => {
            const { profile } = ctx.user;
            const { credential, claimPermissions, ...metadata } = input;

            const boost = await createBoost(credential, profile, metadata, ctx.domain);

            if (claimPermissions) {
                await addClaimPermissionsForBoost(boost, {
                    ...EMPTY_PERMISSIONS,
                    ...claimPermissions,
                });
            }

            return getBoostUri(boost.id, ctx.domain);
        }),

    createChildBoost: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/create/child',
                tags: ['Boosts'],
                summary: 'Creates a boost',
                description: 'This route creates a boost',
            },
            requiredScope: 'boosts:write',
        })
        .input(
            z.object({
                parentUri: z.string(),
                boost: ConsumerBoostValidator.partial()
                    .omit({ uri: true, claimPermissions: true })
                    .extend({
                        credential: VCValidator.or(UnsignedVCValidator),
                        claimPermissions: BoostPermissionsValidator.partial().optional(),
                    }),
            })
        )
        .output(z.string())
        .mutation(async ({ input, ctx }) => {
            const { profile } = ctx.user;
            const {
                parentUri,
                boost: { credential, claimPermissions, ...metadata },
            } = input;

            const parentBoost = await getBoostByUri(parentUri);

            if (!parentBoost) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find parent boost' });
            }

            if (
                !(await canProfileCreateChildBoost(profile, parentBoost, {
                    status: BoostStatus.enum.LIVE,
                    ...metadata,
                }))
            ) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not own parent boost',
                });
            }

            const childBoost = await createBoost(credential, profile, metadata, ctx.domain);

            await setBoostAsParent(parentBoost, childBoost);

            if (claimPermissions) {
                await addClaimPermissionsForBoost(childBoost, {
                    ...EMPTY_PERMISSIONS,
                    ...claimPermissions,
                });
            }

            return getBoostUri(childBoost.id, ctx.domain);
        }),

    getBoost: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/boost',
                tags: ['Boosts'],
                summary: 'Get boost',
                description: 'This endpoint gets metadata about a boost',
            },
            requiredScope: 'boosts:read',
        })
        .input(z.object({ uri: z.string() }))
        .output(
            BoostWithClaimPermissionsValidator.omit({ id: true, boost: true }).extend({
                uri: z.string(),
                boost: UnsignedVCValidator,
            })
        )
        .query(async ({ ctx, input }) => {
            const { uri } = input;

            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUriWithDefaultClaimPermissions(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            const { id, boost: _boost, ...remaining } = boost;

            return { ...remaining, boost: JSON.parse(_boost), uri: getBoostUri(id, ctx.domain) };
        }),

    getBoosts: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/all',
                tags: ['Boosts'],
                summary: 'Get boosts',
                deprecated: true,
                description:
                    "This endpoint gets the current user's boosts.\nWarning! This route is deprecated and currently has a hard limit of returning only the first 50 boosts. Please use getPaginatedBoosts instead",
            },
            requiredScope: 'boosts:read',
        })
        .input(z.object({ query: BoostQueryValidator.optional() }).default({}))
        .output(BoostValidator.omit({ id: true, boost: true }).extend({ uri: z.string() }).array())
        .query(async ({ ctx, input }) => {
            const { query } = input;
            const { profile } = ctx.user;

            const boosts = await getBoostsForProfile(profile, { limit: 50, query });

            return boosts.map(boost => {
                const { id, boost: _boost, ...remaining } = boost;
                return { ...remaining, uri: getBoostUri(id, ctx.domain) };
            });
        }),

    countBoosts: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/count',
                tags: ['Boosts'],
                summary: 'Count managed boosts',
                description: "This endpoint counts the current user's managed boosts.",
            },
            requiredScope: 'boosts:read',
        })
        .input(z.object({ query: BoostQueryValidator.optional() }).default({}))
        .output(z.number())
        .query(async ({ ctx, input }) => {
            const { query } = input;
            const { profile } = ctx.user;

            const count = await countBoostsForProfile(profile, { query });

            return count;
        }),

    getPaginatedBoosts: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/paginated',
                tags: ['Boosts'],
                summary: 'Get boosts',
                description: "This endpoint gets the current user's boosts",
            },
            requiredScope: 'boosts:read',
        })
        .input(
            PaginationOptionsValidator.extend({
                limit: PaginationOptionsValidator.shape.limit.default(25),
                query: BoostQueryValidator.optional(),
            }).default({})
        )
        .output(PaginatedBoostsValidator)
        .query(async ({ ctx, input }) => {
            const { limit, cursor, query } = input;
            const { profile } = ctx.user;

            const records = await getBoostsForProfile(profile, { limit: limit + 1, cursor, query });

            const hasMore = records.length > limit;
            const newCursor = records.at(hasMore ? -2 : -1)?.created;

            return {
                hasMore,
                records: records
                    .map(boost => {
                        const { id, boost: _boost, created: _created, ...remaining } = boost;

                        return { ...remaining, uri: getBoostUri(id, ctx.domain) };
                    })
                    .slice(0, limit),
                ...(newCursor && { cursor: newCursor }),
            };
        }),

    getBoostRecipients: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/boost/recipients',
                tags: ['Boosts'],
                summary: 'Get boost recipients',
                deprecated: true,
                description:
                    'This endpoint gets the recipients of a particular boost.\nWarning! This route is deprecated and currently has a hard limit of returning only the first 50 boosts. Please use getPaginatedBoostRecipients instead',
            },
            requiredScope: 'boosts:read',
        })
        .input(
            z.object({
                uri: z.string(),
                limit: z.number().optional().default(25),
                skip: z.number().optional(),
                includeUnacceptedBoosts: z.boolean().default(true),
            })
        )
        .output(BoostRecipientValidator.array())
        .query(async ({ input, ctx }) => {
            const { domain } = ctx;
            const { uri, limit, skip, includeUnacceptedBoosts } = input;

            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            //TODO: Should we restrict who can see the recipients of a boost? Maybe to Boost owner / people who have the boost?
            return getBoostRecipientsSkipLimit(boost, {
                limit,
                skip,
                includeUnacceptedBoosts,
                domain,
            });
        }),

    getPaginatedBoostRecipients: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/recipients/paginated',
                tags: ['Boosts'],
                summary: 'Get boost recipients',
                description: 'This endpoint gets the recipients of a particular boost',
            },
            requiredScope: 'boosts:read',
        })
        .input(
            PaginationOptionsValidator.extend({
                limit: PaginationOptionsValidator.shape.limit.default(25),
                uri: z.string(),
                includeUnacceptedBoosts: z.boolean().default(true),
                query: LCNProfileQueryValidator.optional(),
            })
        )
        .output(PaginatedBoostRecipientsValidator)
        .query(async ({ input, ctx }) => {
            const { domain } = ctx;
            const { uri, limit, cursor, includeUnacceptedBoosts, query } = input;

            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            const records = await getBoostRecipients(boost, {
                limit: limit + 1,
                cursor,
                includeUnacceptedBoosts,
                query,
                domain,
            });

            const hasMore = records.length > limit;
            const newCursor = records.at(hasMore ? -2 : -1)?.sent;

            return {
                hasMore,
                records: records.slice(0, limit),
                ...(newCursor && { cursor: newCursor }),
            };
        }),

    getBoostRecipientCount: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/boost/recipients/count',
                tags: ['Boosts'],
                summary: 'Get boost recipients count',
                description: 'This endpoint counts the recipients of a particular boost',
            },
            requiredScope: 'boosts:read',
        })
        .input(z.object({ uri: z.string(), includeUnacceptedBoosts: z.boolean().default(true) }))
        .output(z.number())
        .query(async ({ input }) => {
            const { uri, includeUnacceptedBoosts } = input;

            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            return countBoostRecipients(boost, { includeUnacceptedBoosts });
        }),

    getChildrenProfileManagers: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/children-profile-managers',
                tags: ['Boosts', 'Profile Managers'],
                summary: 'Get Profile Managers that are a child of a boost',
                description: 'Get Profile Managers that are a child of a boost',
            },
            requiredScope: 'boosts:read',
        })
        .input(
            PaginationOptionsValidator.extend({
                limit: PaginationOptionsValidator.shape.limit.default(25),
                uri: z.string(),
                query: LCNProfileManagerQueryValidator.optional(),
            })
        )
        .output(PaginatedLCNProfileManagersValidator)
        .query(async ({ input, ctx }) => {
            const { uri, limit, cursor, query } = input;

            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            const records = await getChildrenProfileManagers(boost, {
                limit: limit + 1,
                cursor,
                query,
            });

            const hasMore = records.length > limit;
            const newCursor = records.at(hasMore ? -2 : -1)?.created;

            return {
                hasMore,
                records: records
                    .map(record => ({ ...record, did: getManagedDidWeb(ctx.domain, record.id) }))
                    .slice(0, limit),
                ...(newCursor && { cursor: newCursor }),
            };
        }),

    getBoostChildren: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/children',
                tags: ['Boosts'],
                summary: 'Get boost children',
                description: 'This endpoint gets the children of a particular boost',
            },
            requiredScope: 'boosts:read',
        })
        .input(
            PaginationOptionsValidator.extend({
                limit: PaginationOptionsValidator.shape.limit.default(25),
                uri: z.string(),
                query: BoostQueryValidator.optional(),
                numberOfGenerations: z.number().default(1),
            })
        )
        .output(PaginatedBoostsValidator)
        .query(async ({ input, ctx }) => {
            const { uri, limit, cursor, query, numberOfGenerations } = input;

            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            const records = await getChildrenBoosts(boost, {
                limit: limit + 1,
                cursor,
                query,
                numberOfGenerations,
            });

            const hasMore = records.length > limit;
            const newCursor = records.at(hasMore ? -2 : -1)?.created;

            return {
                hasMore,
                records: records
                    .map(boost => {
                        const { id, boost: _boost, created: _created, ...remaining } = boost;

                        return { ...remaining, uri: getBoostUri(id, ctx.domain) };
                    })
                    .slice(0, limit),
                ...(newCursor && { cursor: newCursor }),
            };
        }),

    countBoostChildren: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/children/count',
                tags: ['Boosts'],
                summary: 'Count boost children',
                description: 'This endpoint counts the children of a particular boost',
            },
            requiredScope: 'boosts:read',
        })
        .input(
            z.object({
                uri: z.string(),
                query: BoostQueryValidator.optional(),
                numberOfGenerations: z.number().default(1),
            })
        )
        .output(z.number())
        .query(async ({ input }) => {
            const { uri, query, numberOfGenerations } = input;

            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            return countBoostChildren(boost, { query, numberOfGenerations });
        }),

    getBoostSiblings: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/siblings',
                tags: ['Boosts'],
                summary: 'Get boost siblings',
                description: 'This endpoint gets the siblings of a particular boost',
            },
            requiredScope: 'boosts:read',
        })
        .input(
            PaginationOptionsValidator.extend({
                limit: PaginationOptionsValidator.shape.limit.default(25),
                uri: z.string(),
                query: BoostQueryValidator.optional(),
            })
        )
        .output(PaginatedBoostsValidator)
        .query(async ({ input, ctx }) => {
            const { uri, limit, cursor, query } = input;

            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            const records = await getSiblingBoosts(boost, { limit: limit + 1, cursor, query });

            const hasMore = records.length > limit;
            const newCursor = records.at(hasMore ? -2 : -1)?.created;

            return {
                hasMore,
                records: records
                    .map(boost => {
                        const { id, boost: _boost, created: _created, ...remaining } = boost;

                        return { ...remaining, uri: getBoostUri(id, ctx.domain) };
                    })
                    .slice(0, limit),
                ...(newCursor && { cursor: newCursor }),
            };
        }),

    countBoostSiblings: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/siblings/count',
                tags: ['Boosts'],
                summary: 'Count boost siblings',
                description: 'This endpoint counts the siblings of a particular boost',
            },
            requiredScope: 'boosts:read',
        })
        .input(
            z.object({
                uri: z.string(),
                query: BoostQueryValidator.optional(),
            })
        )
        .output(z.number())
        .query(async ({ input }) => {
            const { uri, query } = input;

            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            return countBoostSiblings(boost, { query });
        }),

    getFamilialBoosts: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/family',
                tags: ['Boosts'],
                summary: 'Get familial boosts',
                description:
                    'This endpoint gets the parents, children, and siblings of a particular boost',
            },
            requiredScope: 'boosts:read',
        })
        .input(
            PaginationOptionsValidator.extend({
                limit: PaginationOptionsValidator.shape.limit.default(25),
                uri: z.string(),
                query: BoostQueryValidator.optional(),
                parentGenerations: z.number().default(1),
                childGenerations: z.number().default(1),
                includeExtendedFamily: z.boolean().default(false),
            })
        )
        .output(PaginatedBoostsValidator)
        .query(async ({ input, ctx }) => {
            const {
                uri,
                limit,
                cursor,
                query,
                parentGenerations,
                childGenerations,
                includeExtendedFamily,
            } = input;

            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            const records = await getFamilialBoosts(boost, {
                limit: limit + 1,
                cursor,
                query,
                parentGenerations,
                childGenerations,
                includeExtendedFamily,
            });

            const hasMore = records.length > limit;
            const newCursor = records.at(hasMore ? -2 : -1)?.created;

            return {
                hasMore,
                records: records
                    .map(boost => {
                        const { id, boost: _boost, created: _created, ...remaining } = boost;

                        return { ...remaining, uri: getBoostUri(id, ctx.domain) };
                    })
                    .slice(0, limit),
                ...(newCursor && { cursor: newCursor }),
            };
        }),

    countFamilialBoosts: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/family/count',
                tags: ['Boosts'],
                summary: 'Count familial boosts',
                description:
                    'This endpoint counts the parents, children, and siblings of a particular boost',
            },
            requiredScope: 'boosts:read',
        })
        .input(
            z.object({
                uri: z.string(),
                query: BoostQueryValidator.optional(),
                parentGenerations: z.number().default(1),
                childGenerations: z.number().default(1),
                includeExtendedFamily: z.boolean().default(false),
            })
        )
        .output(z.number())
        .query(async ({ input }) => {
            const { uri, query, parentGenerations, childGenerations, includeExtendedFamily } =
                input;

            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            return countFamilialBoosts(boost, {
                query,
                parentGenerations,
                childGenerations,
                includeExtendedFamily,
            });
        }),

    getBoostParents: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/parents',
                tags: ['Boosts'],
                summary: 'Get boost parents',
                description: 'This endpoint gets the parents of a particular boost',
            },
            requiredScope: 'boosts:read',
        })
        .input(
            PaginationOptionsValidator.extend({
                limit: PaginationOptionsValidator.shape.limit.default(25),
                uri: z.string(),
                query: BoostQueryValidator.optional(),
                numberOfGenerations: z.number().default(1),
            })
        )
        .output(PaginatedBoostsValidator)
        .query(async ({ input, ctx }) => {
            const { uri, limit, cursor, query, numberOfGenerations } = input;

            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            const records = await getParentBoosts(boost, {
                limit: limit + 1,
                cursor,
                query,
                numberOfGenerations,
            });

            const hasMore = records.length > limit;
            const newCursor = records.at(hasMore ? -2 : -1)?.created;

            return {
                hasMore,
                records: records
                    .map(boost => {
                        const { id, boost: _boost, created: _created, ...remaining } = boost;

                        return { ...remaining, uri: getBoostUri(id, ctx.domain) };
                    })
                    .slice(0, limit),
                ...(newCursor && { cursor: newCursor }),
            };
        }),

    countBoostParents: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/parents/count',
                tags: ['Boosts'],
                summary: 'Count boost parents',
                description: 'This endpoint counts the parents of a particular boost',
            },
            requiredScope: 'boosts:read',
        })
        .input(
            z.object({
                uri: z.string(),
                query: BoostQueryValidator.optional(),
                numberOfGenerations: z.number().default(1),
            })
        )
        .output(z.number())
        .query(async ({ input }) => {
            const { uri, query, numberOfGenerations } = input;

            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            return countBoostParents(boost, { query, numberOfGenerations });
        }),

    updateBoost: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost',
                tags: ['Boosts'],
                summary: 'Update a boost',
                description: 'This route updates a boost',
            },
            requiredScope: 'boosts:write',
        })
        .input(
            z.object({
                uri: z.string(),
                updates: BoostValidator.partial()
                    .omit({ id: true, boost: true })
                    .extend({ credential: VCValidator.or(UnsignedVCValidator).optional() }),
            })
        )
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            const { profile } = ctx.user;

            const { uri, updates } = input;
            const { name, type, category, status, credential, meta } = updates;

            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            if (!(await canProfileEditBoost(profile, boost))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not have permission to edit this boost',
                });
            }

            const actualUpdates: Partial<BoostType> = {};

            if (meta) actualUpdates.meta = meta;

            if (isDraftBoost(boost)) {
                if (name) actualUpdates.name = name;
                if (category) actualUpdates.category = category;
                if (type) actualUpdates.type = type;
                if (status) actualUpdates.status = status;
                if (credential) {
                    actualUpdates.boost = convertCredentialToBoostTemplateJSON(
                        credential,
                        getDidWeb(ctx.domain, profile.profileId)
                    );
                }
            } else if (!meta) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message:
                        'Published Boosts can only have their meta updated. Draft Boosts can update any field.',
                });
            }

            const result = await updateBoost(boost, actualUpdates);

            if (actualUpdates.boost) await setStorageForUri(uri, JSON.parse(actualUpdates.boost));

            return result;
        }),

    getBoostAdmins: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/admins',
                tags: ['Boosts'],
                summary: 'Get boost admins',
                description: 'This route returns the admins for a boost',
            },
            requiredScope: 'boosts:read',
        })
        .input(
            PaginationOptionsValidator.extend({
                limit: PaginationOptionsValidator.shape.limit.default(25),
                includeSelf: z.boolean().default(true),
                uri: z.string(),
            })
        )
        .output(PaginatedLCNProfilesValidator)
        .query(async ({ input, ctx }) => {
            const { uri, limit, cursor, includeSelf } = input;

            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            const selfProfile = ctx.user.profile;

            const blacklist = await getBlockedAndBlockedByIds(selfProfile);

            const results = await getBoostAdmins(boost, {
                limit: limit + 1,
                cursor,
                blacklist: includeSelf ? blacklist : [selfProfile.profileId, ...blacklist],
            });

            const hasMore = results.length > limit;
            const nextCursor = hasMore ? results.at(-2)?.profileId : undefined;

            return {
                hasMore,
                ...(nextCursor && { cursor: nextCursor }),
                records: results.slice(0, limit),
            };
        }),

    addBoostAdmin: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/add-admin',
                tags: ['Boosts'],
                summary: 'Add a Boost admin',
                description: 'This route adds a new admin for a boost',
            },
            requiredScope: 'boosts:write',
        })
        .input(z.object({ uri: z.string(), profileId: z.string() }))
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            const { profile } = ctx.user;

            const { uri, profileId } = input;

            const targetProfile = await getProfileByProfileId(profileId);

            const isBlocked = await isRelationshipBlocked(profile, targetProfile);

            if (!targetProfile || isBlocked) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Profile not found. Are you sure this person exists?',
                });
            }
            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            if (!(await isProfileBoostAdmin(profile, boost))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not have admin rights over boost',
                });
            }

            if (await isProfileBoostAdmin(targetProfile, boost)) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'Target profile is already an admin of this boost',
                });
            }

            await setProfileAsBoostAdmin(targetProfile, boost);

            return true;
        }),

    removeBoostAdmin: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/remove-admin',
                tags: ['Boosts'],
                summary: 'Remove a Boost admin',
                description: 'This route removes an  admin from a boost',
            },
            requiredScope: 'boosts:write',
        })
        .input(
            z.object({
                uri: z.string(),
                profileId: z.string(),
            })
        )
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            const { profile } = ctx.user;

            const { uri, profileId } = input;

            const targetProfile = await getProfileByProfileId(profileId);

            const isBlocked = await isRelationshipBlocked(profile, targetProfile);

            if (!targetProfile || isBlocked) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Profile not found. Are you sure this person exists?',
                });
            }

            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            if (!(await canManageBoostPermissions(boost, profile))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile can not manage permissions for boost',
                });
            }

            if (await isProfileBoostOwner(targetProfile, boost)) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Cannot remove boost creator',
                });
            }

            await removeProfileAsBoostAdmin(targetProfile, boost);

            return true;
        }),

    getBoostPermissions: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/boost/permissions',
                tags: ['Boosts'],
                summary: 'Get boost permissions',
                description: 'This endpoint gets permission metadata about a boost',
            },
            requiredScope: 'boosts:read',
        })
        .input(z.object({ uri: z.string() }))
        .output(BoostPermissionsValidator)
        .query(async ({ ctx, input }) => {
            const { profile } = ctx.user;

            const { uri } = input;

            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            const permissions = await getBoostPermissions(boost, profile);

            if (!permissions) return EMPTY_PERMISSIONS;

            return permissions;
        }),

    getOtherBoostPermissions: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/boost/permissions/{profileId}',
                tags: ['Boosts'],
                summary: 'Get boost permissions for someone else',
                description:
                    'This endpoint gets permission metadata about a boost for someone else',
            },
            requiredScope: 'boosts:read',
        })
        .input(z.object({ uri: z.string(), profileId: z.string() }))
        .output(BoostPermissionsValidator)
        .query(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { uri, profileId } = input;

            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            if (!(await canManageBoostPermissions(boost, profile))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not have rights to get permissions',
                });
            }

            const otherProfile = await getProfileByProfileId(profileId);

            if (!otherProfile) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Could not find target profile',
                });
            }

            const permissions = await getBoostPermissions(boost, otherProfile);

            if (!permissions) return EMPTY_PERMISSIONS;

            return permissions;
        }),

    updateBoostPermissions: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/permissions',
                tags: ['Boosts'],
                summary: 'Update boost permissions',
                description:
                    'This endpoint updates permission metadata about a boost for the current user',
            },
            requiredScope: 'boosts:write',
        })
        .input(
            z.object({
                uri: z.string(),
                updates: BoostPermissionsValidator.omit({ role: true }).partial(),
            })
        )
        .output(z.boolean())
        .query(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { uri, updates } = input;

            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            if (await isProfileBoostOwner(profile, boost)) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message:
                        'Cannot update boost creators permissions (this could break permissions!)',
                });
            }

            const permissions = await getBoostPermissions(boost, profile);

            if (!permissions || !permissions.canManagePermissions) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not have rights to manage permissions',
                });
            }

            const newPermissions = Object.entries(updates).reduce<Partial<BoostPermissions>>(
                (newPermissionsObject, [permission, value]) => {
                    if (typeof value !== undefined) {
                        if (!(permissions as any)[permission]) {
                            throw new TRPCError({
                                code: 'UNAUTHORIZED',
                                message: `Profile does not have rights to manage ${permission}`,
                            });
                        }

                        if (QUERYABLE_PERMISSIONS.includes(permission) && value && value !== '*') {
                            try {
                                JSON.parse(value as string);
                            } catch (error) {
                                throw new TRPCError({
                                    code: 'BAD_REQUEST',
                                    message: `Invalid value for ${permission}`,
                                });
                            }
                        }

                        (newPermissionsObject as any)[permission] = value;
                    }
                    return newPermissionsObject;
                },
                {}
            );

            return updateBoostPermissions(profile, boost, newPermissions);
        }),

    updateOtherBoostPermissions: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/permissions/{profileId}',
                tags: ['Boosts'],
                summary: "Update other profile's boost permissions",
                description:
                    'This endpoint updates permission metadata about a boost for another user',
            },
            requiredScope: 'boosts:write',
        })
        .input(
            z.object({
                uri: z.string(),
                profileId: z.string(),
                updates: BoostPermissionsValidator.omit({ role: true }).partial(),
            })
        )
        .output(z.boolean())
        .query(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { uri, updates, profileId } = input;

            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            const permissions = await getBoostPermissions(boost, profile);

            if (!permissions || !permissions.canManagePermissions) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not have rights to manage permissions',
                });
            }

            const otherProfile = await getProfileByProfileId(profileId);

            if (!otherProfile) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Could not find target profile',
                });
            }

            if (await isProfileBoostOwner(otherProfile, boost)) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Cannot update boost creators permissions',
                });
            }

            // Ensure that there is at least an empty permissions relationship
            await getBoostPermissions(boost, otherProfile, true);

            const newPermissions = Object.entries(updates).reduce<Partial<BoostPermissions>>(
                (newPermissionsObject, [permission, value]) => {
                    if (typeof value !== undefined) {
                        if (!(permissions as any)[permission]) {
                            throw new TRPCError({
                                code: 'UNAUTHORIZED',
                                message: `Profile does not have rights to manage ${permission}`,
                            });
                        }

                        if (QUERYABLE_PERMISSIONS.includes(permission) && value && value !== '*') {
                            try {
                                JSON.parse(value as string);
                            } catch (error) {
                                throw new TRPCError({
                                    code: 'BAD_REQUEST',
                                    message: `Invalid value for ${permission}`,
                                });
                            }
                        }

                        (newPermissionsObject as any)[permission] = value;
                    }
                    return newPermissionsObject;
                },
                {}
            );

            return updateBoostPermissions(otherProfile, boost, newPermissions);
        }),

    deleteBoost: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'DELETE',
                path: '/boost',
                tags: ['Boosts'],
                summary: 'Delete a boost',
                description: 'This route deletes a boost',
            },
            requiredScope: 'boosts:delete',
        })
        .input(z.object({ uri: z.string() }))
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;

            const { uri } = input;

            const decodedUri = decodeURIComponent(uri);
            const boost = await getBoostByUri(decodedUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            if (!(await isProfileBoostAdmin(profile, boost))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not own boost',
                });
            }

            const childCount = await countBoostChildren(boost, {
                query: {},
                numberOfGenerations: 1,
            });
            if (childCount > 0) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Cannot delete boost with children',
                });
            }

            await Promise.all([deleteBoost(boost), deleteStorageForUri(uri)]);

            return true;
        }),

    generateClaimLink: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/generate-claim-link',
                tags: ['Boosts'],
                summary: 'Generate a claim link for a boost',
                description:
                    'This route creates a challenge that an unknown profile can use to claim a boost.',
            },
            requiredScope: 'boosts:write',
        })
        .input(BoostGenerateClaimLinkInput)
        .output(z.object({ boostUri: z.string(), challenge: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { boostUri, challenge = uuid(), claimLinkSA, options = {} } = input ?? {};

            const boost = await getBoostByUri(boostUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            if (!(await canProfileIssueBoost(profile, boost))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not have permissions to issue boost',
                });
            }

            if (isDraftBoost(boost)) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message:
                        'Can not generate claim links for Draft Boosts. Claim links can only be generated for Published Boosts.',
                });
            }

            if (await isClaimLinkAlreadySetForBoost(boostUri, challenge)) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'Challenge already in use!',
                });
            }

            await setValidClaimLinkForBoost(boostUri, challenge, claimLinkSA, options);

            return { boostUri: boostUri, challenge };
        }),
    claimBoostWithLink: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/claim',
                tags: ['Boosts'],
                summary: 'Claim a boost using a claim link',
                description: 'Claims a boost using a claim link, including a challenge',
            },
            requiredScope: 'boosts:write',
        })
        .input(z.object({ boostUri: z.string(), challenge: z.string() }))
        .output(z.string())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { boostUri, challenge } = input;

            const [claimLinkSA, boost] = await Promise.all([
                getClaimLinkSAInfoForBoost(boostUri, challenge),
                getBoostByUri(boostUri),
            ]);

            if (!claimLinkSA) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: `Challenge not found for ${boostUri}`,
                });
            }

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            const boostOwner = await getBoostOwner(boost);

            if (!boostOwner) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost owner' });
            }

            const signingAuthority = await getSigningAuthorityForUserByName(
                boostOwner,
                claimLinkSA.endpoint,
                claimLinkSA.name
            );

            if (!signingAuthority) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Could not find signing authority for boost',
                });
            }

            try {
                const sentBoostUri = await issueClaimLinkBoost(
                    boost,
                    ctx.domain,
                    boostOwner,
                    profile,
                    signingAuthority
                );
                try {
                    await useClaimLinkForBoost(boostUri, challenge);
                } catch (e) {
                    console.error('Problem using useClaimLinkForBoost', e);
                }
                return sentBoostUri;
            } catch (e) {
                console.error('Unable to issueClaimLinkBoost');
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Could not issue boost with claim link.',
                });
            }
        }),

    makeBoostParent: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/make-parent',
                tags: ['Boosts'],
                summary: 'Make Boost Parent',
                description: 'This endpoint creates a parent/child relationship between two boosts',
            },
            requiredScope: 'boosts:write',
        })
        .input(z.object({ parentUri: z.string(), childUri: z.string() }))
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { parentUri, childUri } = input;
            const boosts = await getBoostsByUri([parentUri, childUri]);

            const parentBoost = boosts.find(boost => boost.id === getIdFromUri(parentUri));
            const childBoost = boosts.find(boost => boost.id === getIdFromUri(childUri));

            if (!parentBoost) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find parent boost' });
            }

            if (!childBoost) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find child boost' });
            }

            if (!(await canProfileCreateChildBoost(profile, parentBoost, childBoost.dataValues))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile can not create children for parent',
                });
            }

            if (!(await isProfileBoostAdmin(profile, childBoost))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not own child boost',
                });
            }

            if (
                await isBoostParent(parentBoost, childBoost, {
                    numberOfGenerations: Infinity,
                    direction: 'none',
                })
            ) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'Boost is already a parent',
                });
            }

            return setBoostAsParent(parentBoost, childBoost);
        }),

    removeBoostParent: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/remove-parent',
                tags: ['Boosts'],
                summary: 'Remove Boost Parent',
                description: 'This endpoint removes a parent/child relationship between two boosts',
            },
            requiredScope: 'boosts:write',
        })
        .input(z.object({ parentUri: z.string(), childUri: z.string() }))
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { parentUri, childUri } = input;
            const boosts = await getBoostsByUri([parentUri, childUri]);

            const parentBoost = boosts.find(boost => boost.id === getIdFromUri(parentUri));
            const childBoost = boosts.find(boost => boost.id === getIdFromUri(childUri));

            if (!parentBoost) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find parent boost' });
            }

            if (!childBoost) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find child boost' });
            }

            if (!(await isProfileBoostAdmin(profile, parentBoost))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not own parent boost',
                });
            }

            if (!(await isProfileBoostAdmin(profile, childBoost))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not own child boost',
                });
            }

            if (!(await isBoostParent(parentBoost, childBoost))) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Boost is already not a parent',
                });
            }

            return removeBoostAsParent(parentBoost, childBoost);
        }),

    sendBoostViaSigningAuthority: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/send/via-signing-authority/{profileId}',
                tags: ['Boosts'],
                summary: 'Send a boost to a profile using a signing authority',
                description:
                    'Issues a boost VC to a recipient profile using a specified signing authority and sends it via the network.',
            },
            requiredScope: 'boosts:write',
        })
        .input(
            z.object({
                profileId: z.string(),
                boostUri: z.string(),
                signingAuthority: z.object({
                    name: z.string(),
                    endpoint: z.string(),
                }),
                options: z
                    .object({
                        skipNotification: z.boolean().default(false).optional(),
                    })
                    .optional(),
            })
        )
        .output(z.string())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { profileId, boostUri, signingAuthority, options } = input;

            const boost = await getBoostByUri(boostUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            if (!(await canProfileIssueBoost(profile, boost))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not have permission to issue boost',
                });
            }

            if (isDraftBoost(boost)) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Draft Boosts can not be sent. Only Published Boosts can be sent.',
                });
            }

            const targetProfile = await getProfileByProfileId(profileId);

            if (!targetProfile) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Recipient profile not found' });
            }

            let unsignedVc: UnsignedVC;

            try {
                unsignedVc = JSON.parse(boost.dataValues.boost);

                unsignedVc.issuanceDate = new Date().toISOString();
                unsignedVc.issuer = { id: getDidWeb(ctx.domain, profile.profileId) };

                if (Array.isArray(unsignedVc.credentialSubject)) {
                    unsignedVc.credentialSubject = unsignedVc.credentialSubject.map(subject => ({
                        ...subject,
                        id: getDidWeb(ctx.domain, targetProfile.profileId),
                    }));
                } else {
                    unsignedVc.credentialSubject = {
                        ...unsignedVc.credentialSubject,
                        id: getDidWeb(ctx.domain, targetProfile.profileId),
                    };
                }
                if (unsignedVc?.type?.includes('BoostCredential')) unsignedVc.boostId = boostUri;
            } catch (e) {
                console.error('Failed to parse boost', e);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to parse boost',
                });
            }

            const sa = await getSigningAuthorityForUserByName(
                profile,
                signingAuthority.endpoint,
                signingAuthority.name
            );
            if (!sa) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Could not find signing authority for boost',
                });
            }

            let credential: VC | JWE;
            try {
                credential = await issueCredentialWithSigningAuthority(
                    profile,
                    unsignedVc,
                    sa,
                    ctx.domain
                );
            } catch (e) {
                console.error('Failed to issue VC with signing authority', e);
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Could not issue VC with signing authority',
                });
            }

            let skipNotification = profile.profileId === targetProfile.profileId;
            if (options?.skipNotification) skipNotification = options?.skipNotification;

            return sendBoost({
                from: profile,
                to: targetProfile,
                boost,
                credential,
                domain: ctx.domain,
                skipNotification,
            });
        }),
});

export type BoostsRouter = typeof boostsRouter;

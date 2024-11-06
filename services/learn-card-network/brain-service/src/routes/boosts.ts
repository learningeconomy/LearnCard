import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';

import {
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
    canProfileViewBoost,
    canProfileEditBoost,
    canProfileCreateChildBoost,
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
import { BoostValidator, BoostGenerateClaimLinkInput, BoostStatus } from 'types/boost';
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
import { getDidWeb } from '@helpers/did.helpers';
import {
    giveProfileEmptyPermissions,
    setBoostAsParent,
    setProfileAsBoostAdmin,
} from '@accesslayer/boost/relationships/create';
import {
    removeBoostAsParent,
    removeProfileAsBoostAdmin,
} from '@accesslayer/boost/relationships/delete';
import { getIdFromUri } from '@helpers/uri.helpers';
import { updateBoostPermissions } from '@accesslayer/boost/relationships/update';
import { EMPTY_PERMISSIONS, QUERYABLE_PERMISSIONS } from 'src/constants/permissions';

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
        })
        .input(
            z.object({
                profileId: z.string(),
                uri: z.string(),
                credential: VCValidator.or(JWEValidator),
            })
        )
        .output(z.string())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { profileId, credential, uri } = input;

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

            return sendBoost(
                profile,
                targetProfile,
                boost,
                credential,
                ctx.domain,
                profile.profileId === targetProfile.profileId
            );
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
        })
        .input(
            BoostValidator.partial()
                .omit({ id: true, boost: true })
                .extend({ credential: VCValidator.or(UnsignedVCValidator) })
        )
        .output(z.string())
        .mutation(async ({ input, ctx }) => {
            const { profile } = ctx.user;
            const { credential, ...metadata } = input;

            const boost = await createBoost(credential, profile, metadata, ctx.domain);

            return getBoostUri(boost.id, ctx.domain);
        }),

    createChildBoost: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/create/child/{parentUri}',
                tags: ['Boosts'],
                summary: 'Creates a boost',
                description: 'This route creates a boost',
            },
        })
        .input(
            z.object({
                parentUri: z.string(),
                boost: BoostValidator.partial()
                    .omit({ id: true, boost: true })
                    .extend({ credential: VCValidator.or(UnsignedVCValidator) }),
            })
        )
        .output(z.string())
        .mutation(async ({ input, ctx }) => {
            const { profile } = ctx.user;
            const {
                parentUri,
                boost: { credential, ...metadata },
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

            return getBoostUri(childBoost.id, ctx.domain);
        }),

    getBoost: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/boost/{uri}',
                tags: ['Boosts'],
                summary: 'Get boost',
                description: 'This endpoint gets metadata about a boost',
            },
        })
        .input(z.object({ uri: z.string() }))
        .output(
            BoostValidator.omit({ id: true, boost: true }).extend({
                uri: z.string(),
                boost: UnsignedVCValidator,
            })
        )
        .query(async ({ ctx, input }) => {
            const { profile } = ctx.user;

            const { uri } = input;

            const boost = await getBoostByUri(uri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            if (!(await canProfileViewBoost(profile, boost))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not have permission to view this boost',
                });
            }

            const { id, boost: _boost, ...remaining } = boost.dataValues;

            return { ...remaining, boost: JSON.parse(_boost), uri: getBoostUri(id, ctx.domain) };
        }),

    getBoosts: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost',
                tags: ['Boosts'],
                summary: 'Get boosts',
                deprecated: true,
                description:
                    "This endpoint gets the current user's boosts.\nWarning! This route is deprecated and currently has a hard limit of returning only the first 50 boosts. Please use getPaginatedBoosts instead",
            },
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
                path: '/boost/recipients/{uri}',
                tags: ['Boosts'],
                summary: 'Get boost recipients',
                deprecated: true,
                description:
                    'This endpoint gets the recipients of a particular boost.\nWarning! This route is deprecated and currently has a hard limit of returning only the first 50 boosts. Please use getPaginatedBoostRecipients instead',
            },
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
        .query(async ({ input }) => {
            const { uri, limit, skip, includeUnacceptedBoosts } = input;

            const boost = await getBoostByUri(uri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            //TODO: Should we restrict who can see the recipients of a boost? Maybe to Boost owner / people who have the boost?
            return getBoostRecipientsSkipLimit(boost, { limit, skip, includeUnacceptedBoosts });
        }),

    getPaginatedBoostRecipients: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/boost/recipients/paginated/{uri}',
                tags: ['Boosts'],
                summary: 'Get boost recipients',
                description: 'This endpoint gets the recipients of a particular boost',
            },
        })
        .input(
            PaginationOptionsValidator.extend({
                limit: PaginationOptionsValidator.shape.limit.default(25),
                uri: z.string(),
                includeUnacceptedBoosts: z.boolean().default(true),
            })
        )
        .output(PaginatedBoostRecipientsValidator)
        .query(async ({ input }) => {
            const { uri, limit, cursor, includeUnacceptedBoosts } = input;

            const boost = await getBoostByUri(uri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            const records = await getBoostRecipients(boost, {
                limit: limit + 1,
                cursor,
                includeUnacceptedBoosts,
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
                path: '/boost/recipients/{uri}/count',
                tags: ['Boosts'],
                summary: 'Get boost recipients count',
                description: 'This endpoint counts the recipients of a particular boost',
            },
        })
        .input(z.object({ uri: z.string(), includeUnacceptedBoosts: z.boolean().default(true) }))
        .output(z.number())
        .query(async ({ input }) => {
            const { uri, includeUnacceptedBoosts } = input;

            const boost = await getBoostByUri(uri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            return countBoostRecipients(boost, { includeUnacceptedBoosts });
        }),

    getBoostChildren: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/children/{uri}',
                tags: ['Boosts'],
                summary: 'Get boost children',
                description: 'This endpoint gets the children of a particular boost',
            },
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

            const boost = await getBoostByUri(uri);

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
                path: '/boost/children/{uri}/count',
                tags: ['Boosts'],
                summary: 'Count boost children',
                description: 'This endpoint counts the children of a particular boost',
            },
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

            const boost = await getBoostByUri(uri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            return countBoostChildren(boost, { query, numberOfGenerations });
        }),

    getBoostParents: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/parents/{uri}',
                tags: ['Boosts'],
                summary: 'Get boost parents',
                description: 'This endpoint gets the parents of a particular boost',
            },
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

            const boost = await getBoostByUri(uri);

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
                path: '/boost/parents/{uri}/count',
                tags: ['Boosts'],
                summary: 'Count boost parents',
                description: 'This endpoint counts the parents of a particular boost',
            },
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

            const boost = await getBoostByUri(uri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            return countBoostParents(boost, { query, numberOfGenerations });
        }),

    updateBoost: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/{uri}',
                tags: ['Boosts'],
                summary: 'Update a boost',
                description: 'This route updates a boost',
            },
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
            const { name, type, category, status, credential } = updates;

            const boost = await getBoostByUri(uri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            if (!(await canProfileEditBoost(profile, boost))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not have permission to edit this boost',
                });
            }

            if (!isDraftBoost(boost)) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message:
                        'Published Boosts can not be updated. Only Draft Boosts can be updated.',
                });
            }

            if (name) boost.name = name;
            if (category) boost.category = category;
            if (type) boost.type = type;
            if (status) boost.status = status;
            if (credential) {
                boost.boost = convertCredentialToBoostTemplateJSON(
                    credential,
                    getDidWeb(ctx.domain, profile.profileId)
                );
            }

            await boost.save();
            await setStorageForUri(uri, JSON.parse(boost.boost));

            return true;
        }),

    getBoostAdmins: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/admins/{uri}',
                tags: ['Boosts'],
                summary: 'Get boost admins',
                description: 'This route returns the admins for a boost',
            },
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

            const boost = await getBoostByUri(uri);

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
                path: '/boost/add-admin/{uri}',
                tags: ['Boosts'],
                summary: 'Add a Boost admin',
                description: 'This route adds a new admin for a boost',
            },
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

            const boost = await getBoostByUri(uri);

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
                path: '/boost/remove-admin/{uri}',
                tags: ['Boosts'],
                summary: 'Remove a Boost admin',
                description: 'This route removes an  admin from a boost',
            },
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

            const boost = await getBoostByUri(uri);

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
                path: '/boost/permissions/{uri}',
                tags: ['Boosts'],
                summary: 'Get boost permissions',
                description: 'This endpoint gets permission metadata about a boost',
            },
        })
        .input(z.object({ uri: z.string() }))
        .output(BoostPermissionsValidator)
        .query(async ({ ctx, input }) => {
            const { profile } = ctx.user;

            const { uri } = input;

            const boost = await getBoostByUri(uri);

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
                path: '/boost/permissions/{uri}/{profileId}',
                tags: ['Boosts'],
                summary: 'Get boost permissions for someone else',
                description:
                    'This endpoint gets permission metadata about a boost for someone else',
            },
        })
        .input(z.object({ uri: z.string(), profileId: z.string() }))
        .output(BoostPermissionsValidator)
        .query(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { uri, profileId } = input;

            const boost = await getBoostByUri(uri);

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
                path: '/boost/permissions/{uri}',
                tags: ['Boosts'],
                summary: 'Update boost permissions',
                description:
                    'This endpoint updates permission metadata about a boost for the current user',
            },
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

            const boost = await getBoostByUri(uri);

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
                path: '/boost/permissions/{uri}/{profileId}',
                tags: ['Boosts'],
                summary: "Update other profile's boost permissions",
                description:
                    'This endpoint updates permission metadata about a boost for another user',
            },
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

            const boost = await getBoostByUri(uri);

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

            const currentPermissions = await getBoostPermissions(boost, otherProfile);

            if (!currentPermissions) await giveProfileEmptyPermissions(otherProfile, boost);

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
                path: '/boost/{uri}',
                tags: ['Boosts'],
                summary: 'Delete a boost',
                description: 'This route deletes a boost',
            },
        })
        .input(z.object({ uri: z.string() }))
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;

            const { uri } = input;

            const boost = await getBoostByUri(uri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            if (!(await isProfileBoostAdmin(profile, boost))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not own boost',
                });
            }

            if (!isDraftBoost(boost)) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message:
                        'Published Boosts can not be deleted. Only Draft Boosts can be deleted.',
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
        })
        .input(BoostGenerateClaimLinkInput)
        .output(z.object({ boostUri: z.string(), challenge: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { boostUri, challenge = uuid(), claimLinkSA, options = {} } = input ?? {};

            const boost = await getBoostByUri(boostUri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            if (!(await isProfileBoostAdmin(profile, boost))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not own boost',
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
                path: '/boost/{boostUri}/claim/{challenge}',
                tags: ['Boosts'],
                summary: 'Claim a boost using a claim link',
                description: 'Claims a boost using a claim link, including a challenge',
            },
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
});
export type BoostsRouter = typeof boostsRouter;

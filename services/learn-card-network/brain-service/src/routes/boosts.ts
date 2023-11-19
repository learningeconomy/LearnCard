import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';

import {
    UnsignedVCValidator,
    VCValidator,
    JWEValidator,
    BoostRecipientValidator,
    PaginationOptionsValidator,
    PaginatedLCNProfilesValidator,
} from '@learncard/types';

import { t, profileRoute } from '@routes';

import { getBoostByUri, getBoostsForProfile } from '@accesslayer/boost/read';
import {
    getBoostAdmins,
    getBoostRecipients,
    isProfileBoostAdmin,
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
import { BoostValidator, BoostGenerateClaimLinkInput } from 'types/boost';
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
import { setProfileAsBoostAdmin } from '@accesslayer/boost/relationships/create';
import { removeProfileAsBoostAdmin } from '@accesslayer/boost/relationships/delete';

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
            console.log('🚀 BEGIN - Send Boost', JSON.stringify(input));

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

            if (!(await isProfileBoostOwner(profile, boost))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not own boost',
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

            if (!(await isProfileBoostOwner(profile, boost))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not own boost',
                });
            }

            const { id, boost: _boost, ...remaining } = boost.dataValues;

            return { ...remaining, boost: JSON.parse(_boost), uri: getBoostUri(id, ctx.domain) };
        }),

    getBoosts: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/boost',
                tags: ['Boosts'],
                summary: 'Get boosts',
                description:
                    "This endpoint gets the current user's boosts.\nWarning! This route will soon be deprecated and currently has a hard limit of returning only the first 50 boosts",
            },
        })
        .input(z.void())
        .output(BoostValidator.omit({ id: true, boost: true }).extend({ uri: z.string() }).array())
        .query(async ({ ctx }) => {
            const { profile } = ctx.user;

            const boosts = await getBoostsForProfile(profile, { limit: 50 });

            return boosts.map(boost => {
                const { id, boost: _boost, ...remaining } = boost.dataValues;
                return {
                    ...remaining,
                    uri: getBoostUri(id, ctx.domain),
                };
            });
        }),
    getBoostRecipients: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/boost/recipients/{uri}',
                tags: ['Boosts'],
                summary: 'Get boost recipients',
                description:
                    'This endpoint gets the recipients of a particular boost.\nWarning! This route will soon be deprecated and currently has a hard limit of returning only the first 50 boosts',
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
            return getBoostRecipients(boost, { limit, skip, includeUnacceptedBoosts });
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

            if (!(await isProfileBoostOwner(profile, boost))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not own boost',
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
                includeSelf: z.boolean().default(false),
                uri: z.string(),
            })
        )
        .output(PaginatedLCNProfilesValidator)
        .mutation(async ({ input, ctx }) => {
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

            if (!(await isProfileBoostAdmin(profile, boost))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not own boost',
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

            if (!(await isProfileBoostAdmin(profile, boost))) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not have admin rights over boost',
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

            if (!(await isProfileBoostOwner(profile, boost))) {
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

            if (!(await isProfileBoostOwner(profile, boost))) {
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
});
export type BoostsRouter = typeof boostsRouter;

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';

import {
    UnsignedVCValidator,
    VCValidator,
    JWEValidator,
    BoostRecipientValidator,
} from '@learncard/types';

import { t, profileRoute } from '@routes';

import { getBoostByUri, getBoostsForProfile } from '@accesslayer/boost/read';
import { getBoostRecipients } from '@accesslayer/boost/relationships/read';

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
import { isRelationshipBlocked } from '@helpers/connection.helpers';
import { getDidWeb } from '@helpers/did.helpers';

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

            return sendBoost(profile, targetProfile, boost, credential, ctx.domain);
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
        .output(BoostValidator.omit({ id: true, boost: true }).extend({ uri: z.string() }))
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

            return { ...remaining, uri: getBoostUri(id, ctx.domain) };
        }),

    getBoosts: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/boost',
                tags: ['Boosts'],
                summary: 'Get boosts',
                description: "This endpoint gets the current user's boosts",
            },
        })
        .input(z.void())
        .output(BoostValidator.omit({ id: true, boost: true }).extend({ uri: z.string() }).array())
        .query(async ({ ctx }) => {
            const { profile } = ctx.user;

            const boosts = await getBoostsForProfile(profile);

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
                description: 'This endpoint gets the recipients of a particular boost',
            },
        })
        .input(
            z.object({
                uri: z.string(),
                limit: z.number().optional().default(25),
                skip: z.number().optional(),
            })
        )
        .output(BoostRecipientValidator.array())
        .query(async ({ input }) => {
            const { uri, limit, skip } = input;

            const boost = await getBoostByUri(uri);

            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            //TODO: Should we restrict who can see the recipients of a boost? Maybe to Boost owner / people who have the boost?
            return getBoostRecipients(boost, { limit, skip });
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

            await deleteBoost(boost);

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
            const {
                boostUri,
                challenge = uuid(),
                claimLinkSA,
                options = { ttlSeconds: 86_400 },
            } = input ?? {};

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

            const claimLinkSA = await getClaimLinkSAInfoForBoost(boostUri, challenge);

            if (!claimLinkSA) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: `Challenge not found for ${boostUri}`,
                });
            }

            const boost = await getBoostByUri(boostUri);
            if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

            const boostOwner = await getBoostOwner(boost);
            if (!boostOwner)
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost owner' });

            const signingAuthority = await getSigningAuthorityForUserByName(
                boostOwner,
                claimLinkSA.endpoint,
                claimLinkSA.name
            );
            if (!signingAuthority)
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Could not find signing authority for boost',
                });

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

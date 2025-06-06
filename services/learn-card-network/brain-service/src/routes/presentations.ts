import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { SentCredentialInfoValidator, VPValidator, JWEValidator } from '@learncard/types';

import { deleteStorageForUri } from '@cache/storage';
import { t, profileRoute } from '@routes';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import { acceptPresentation, sendPresentation } from '@helpers/presentation.helpers';
import {
    getReceivedPresentationsForProfile,
    getSentPresentationsForProfile,
    getIncomingPresentationsForProfile,
    getPresentationByUri,
} from '@accesslayer/presentation/read';
import { getPresentationOwner } from '@accesslayer/presentation/relationships/read';
import { deletePresentation } from '@accesslayer/presentation/delete';
import { isRelationshipBlocked } from '@helpers/connection.helpers';

export const presentationsRouter = t.router({
    sendPresentation: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/presentation/send/{profileId}',
                tags: ['Presentations'],
                summary: 'Send a Presentation',
                description:
                    'This endpoint sends a presentation to a user based on their profileId',
            },
            requiredScope: 'presentations:write',
        })
        .input(z.object({ profileId: z.string(), presentation: VPValidator.or(JWEValidator) }))
        .output(z.string())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { profileId, presentation } = input;

            const targetProfile = await getProfileByProfileId(profileId);

            const isBlocked = await isRelationshipBlocked(profile, targetProfile);
            if (!targetProfile || isBlocked) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Profile not found. Are you sure this person exists?',
                });
            }

            return sendPresentation(profile, targetProfile, presentation, ctx.domain);
        }),

    acceptPresentation: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/presentation/accept',
                tags: ['Presentations'],
                summary: 'Accept a Presentation',
                description: 'This endpoint accepts a presentation',
            },
            requiredScope: 'presentations:write',
        })
        .input(z.object({ uri: z.string() }))
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { uri } = input;

            return acceptPresentation(profile, uri);
        }),

    receivedPresentations: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/presentation/received',
                tags: ['Presentations'],
                summary: 'Get received presentations',
                description: "This endpoint returns the current user's received presentations",
            },
            requiredScope: 'presentations:read',
        })
        .input(
            z
                .object({
                    limit: z.number().int().positive().lt(100).default(25),
                    from: z.string().optional(),
                })
                .default({})
        )
        .output(SentCredentialInfoValidator.array())
        .query(async ({ input: { limit, from }, ctx }) => {
            return getReceivedPresentationsForProfile(ctx.domain, ctx.user.profile, {
                limit,
                from: typeof from === 'string' ? [from] : from,
            });
        }),

    sentPresentations: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/presentation/sent',
                tags: ['Presentations'],
                summary: 'Get sent presentations',
                description: "This endpoint returns the current user's sent presentations",
            },
            requiredScope: 'presentations:read',
        })
        .input(
            z
                .object({
                    limit: z.number().int().positive().lt(100).default(25),
                    to: z.string().optional(),
                })
                .default({})
        )
        .output(SentCredentialInfoValidator.array())
        .query(async ({ input: { limit, to }, ctx }) => {
            return getSentPresentationsForProfile(ctx.domain, ctx.user.profile, {
                limit,
                to: typeof to === 'string' ? [to] : to,
            });
        }),

    incomingPresentations: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/presentation/incoming',
                tags: ['Presentations'],
                summary: 'Get incoming presentations',
                description: "This endpoint returns the current user's incoming presentations",
            },
            requiredScope: 'presentations:read',
        })
        .input(
            z
                .object({
                    limit: z.number().int().positive().lt(100).default(25),
                    from: z.string().optional(),
                })
                .default({})
        )
        .output(SentCredentialInfoValidator.array())
        .query(async ({ input: { limit, from }, ctx }) => {
            return getIncomingPresentationsForProfile(ctx.domain, ctx.user.profile, {
                limit,
                from: typeof from === 'string' ? [from] : from,
            });
        }),

    deletePresentation: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'DELETE',
                path: '/presentation',
                tags: ['Presentations'],
                summary: 'Delete a presentation',
                description: 'This endpoint deletes a presentation',
            },
            requiredScope: 'presentations:delete',
        })
        .input(z.object({ uri: z.string() }))
        .output(z.boolean())
        .mutation(async ({ input: { uri }, ctx }) => {
            const presentation = await getPresentationByUri(uri);

            if (!presentation) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Presentation not found' });
            }

            const owner = await getPresentationOwner(presentation);

            if (owner?.profileId !== ctx.user.profile.profileId) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not own presentation',
                });
            }

            await Promise.all([deletePresentation(presentation), deleteStorageForUri(uri)]);

            return true;
        }),
});
export type PresentationsRouter = typeof presentationsRouter;

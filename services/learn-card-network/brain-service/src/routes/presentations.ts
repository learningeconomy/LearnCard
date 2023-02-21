import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { SentCredentialInfoValidator, VPValidator, JWEValidator } from '@learncard/types';

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
        })
        .input(z.object({ profileId: z.string(), presentation: VPValidator.or(JWEValidator) }))
        .output(z.string())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { profileId, presentation } = input;

            const targetProfile = await getProfileByProfileId(profileId);

            if (!targetProfile) {
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
                path: '/presentation/accept/{profileId}',
                tags: ['Presentations'],
                summary: 'Accept a Presentation',
                description:
                    'This endpoint accepts a presentation from a user based on their profileId',
            },
        })
        .input(z.object({ profileId: z.string(), uri: z.string() }))
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { profileId, uri } = input;

            const targetProfile = await getProfileByProfileId(profileId);

            if (!targetProfile) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Profile not found. Are you sure this person exists?',
                });
            }

            return acceptPresentation(profile, targetProfile, uri);
        }),

    receivedPresentations: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/presentation/received',
                tags: ['Presentations'],
                summary: 'Store a Credential',
                description:
                    'This endpoint stores a credential, returning a uri that can be used to resolve it',
            },
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
                summary: 'Store a Credential',
                description:
                    'This endpoint stores a credential, returning a uri that can be used to resolve it',
            },
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
                summary: 'Store a Credential',
                description:
                    'This endpoint stores a credential, returning a uri that can be used to resolve it',
            },
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
                path: '/presentation/{uri}',
                tags: ['Presentations'],
                summary: 'Delete a presentation',
                description: 'This endpoint deletes a presentation',
            },
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

            await deletePresentation(presentation);

            return true;
        }),
});
export type PresentationsRouter = typeof presentationsRouter;

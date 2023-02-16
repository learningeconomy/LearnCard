import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { SentCredentialInfoValidator, VPValidator } from '@learncard/types';

import { t, profileRoute } from '@routes';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import { acceptPresentation, sendPresentation } from '@helpers/presentation.helpers';
import {
    getReceivedPresentationsForProfile,
    getSentPresentationsForProfile,
    getIncomingPresentationsForProfile,
} from '@accesslayer/presentation/read';

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
        .input(z.object({ profileId: z.string(), presentation: VPValidator }))
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
        .input(z.object({ limit: z.number().int().positive().lt(100).default(25) }).default({}))
        .output(SentCredentialInfoValidator.array())
        .query(async ({ input: { limit }, ctx }) => {
            return getReceivedPresentationsForProfile(ctx.domain, ctx.user.profile, limit);
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
        .input(z.object({ limit: z.number().int().positive().lt(100).default(25) }).default({}))
        .output(SentCredentialInfoValidator.array())
        .query(async ({ input: { limit }, ctx }) => {
            return getSentPresentationsForProfile(ctx.domain, ctx.user.profile, limit);
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
        .input(z.object({ limit: z.number().int().positive().lt(100).default(25) }).default({}))
        .output(SentCredentialInfoValidator.array())
        .query(async ({ input: { limit }, ctx }) => {
            return getIncomingPresentationsForProfile(ctx.domain, ctx.user.profile, limit);
        }),
});
export type PresentationsRouter = typeof presentationsRouter;

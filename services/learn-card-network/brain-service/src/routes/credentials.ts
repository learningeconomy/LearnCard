import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { UnsignedVCValidator, VCValidator, SentCredentialInfoValidator } from '@learncard/types';

import { acceptCredential, sendCredential } from '@helpers/credential.helpers';

import {
    getIncomingCredentialsForProfile,
    getReceivedCredentialsForProfile,
    getSentCredentialsForProfile,
} from '@accesslayer/credential/read';

import { t, profileRoute } from '@routes';
import { getProfileByHandle } from '@accesslayer/profile/read';

export const credentialsRouter = t.router({
    sendCredential: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/credential/send/{handle}',
                tags: ['Credentials'],
                summary: 'Send a Credential',
                description: 'This endpoint sends a credential to a user based on their handle',
            },
        })
        .input(z.object({ handle: z.string(), credential: UnsignedVCValidator.or(VCValidator) }))
        .output(z.string())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { handle, credential } = input;

            const targetProfile = await getProfileByHandle(handle);

            if (!targetProfile) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Profile not found. Are you sure this person exists?',
                });
            }

            return sendCredential(profile, targetProfile, credential, ctx.domain);
        }),

    acceptCredential: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/credential/accept/{handle}',
                tags: ['Credentials'],
                summary: 'Accept a Credential',
                description: 'This endpoint accepts a credential from a user based on their handle',
            },
        })
        .input(z.object({ handle: z.string(), uri: z.string() }))
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { handle, uri } = input;

            const targetProfile = await getProfileByHandle(handle);

            if (!targetProfile) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Profile not found. Are you sure this person exists?',
                });
            }

            return acceptCredential(profile, targetProfile, uri);
        }),

    receivedCredentials: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/credentials/received',
                tags: ['Credentials'],
                summary: 'Store a Credential',
                description:
                    'This endpoint stores a credential, returning a uri that can be used to resolve it',
            },
        })
        .input(z.object({ limit: z.number().int().positive().lt(100).default(25) }).default({}))
        .output(SentCredentialInfoValidator.array())
        .query(async ({ input: { limit }, ctx }) => {
            return getReceivedCredentialsForProfile(ctx.domain, ctx.user.profile, limit);
        }),

    sentCredentials: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/credentials/sent',
                tags: ['Credentials'],
                summary: 'Store a Credential',
                description:
                    'This endpoint stores a credential, returning a uri that can be used to resolve it',
            },
        })
        .input(z.object({ limit: z.number().int().positive().lt(100).default(25) }).default({}))
        .output(SentCredentialInfoValidator.array())
        .query(async ({ input: { limit }, ctx }) => {
            return getSentCredentialsForProfile(ctx.domain, ctx.user.profile, limit);
        }),

    incomingCredentials: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/credentials/incoming',
                tags: ['Credentials'],
                summary: 'Store a Credential',
                description:
                    'This endpoint stores a credential, returning a uri that can be used to resolve it',
            },
        })
        .input(z.object({ limit: z.number().int().positive().lt(100).default(25) }).default({}))
        .output(SentCredentialInfoValidator.array())
        .query(async ({ input: { limit }, ctx }) => {
            return getIncomingCredentialsForProfile(ctx.domain, ctx.user.profile, limit);
        }),
});
export type CredentialsRouter = typeof credentialsRouter;

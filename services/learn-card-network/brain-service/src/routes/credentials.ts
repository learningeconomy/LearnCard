import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
    UnsignedVCValidator,
    VCValidator,
    SentCredentialInfoValidator,
    JWEValidator,
} from '@learncard/types';

import { acceptCredential, sendCredential } from '@helpers/credential.helpers';

import {
    getCredentialByUri,
    getIncomingCredentialsForProfile,
    getReceivedCredentialsForProfile,
    getSentCredentialsForProfile,
} from '@accesslayer/credential/read';

import { t, profileRoute } from '@routes';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import { getCredentialOwner } from '@accesslayer/credential/relationships/read';
import { deleteCredential } from '@accesslayer/credential/delete';

export const credentialsRouter = t.router({
    sendCredential: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/credential/send/{profileId}',
                tags: ['Credentials'],
                summary: 'Send a Credential',
                description: 'This endpoint sends a credential to a user based on their profileId',
            },
        })
        .input(
            z.object({
                profileId: z.string(),
                credential: UnsignedVCValidator.or(VCValidator).or(JWEValidator),
            })
        )
        .output(z.string())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { profileId, credential } = input;

            const targetProfile = await getProfileByProfileId(profileId);

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
                path: '/credential/accept/{profileId}',
                tags: ['Credentials'],
                summary: 'Accept a Credential',
                description:
                    'This endpoint accepts a credential from a user based on their profileId',
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
            return getReceivedCredentialsForProfile(ctx.domain, ctx.user.profile, {
                limit,
                from: typeof from === 'string' ? [from] : from,
            });
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
            return getSentCredentialsForProfile(ctx.domain, ctx.user.profile, {
                limit,
                to: typeof to === 'string' ? [to] : to,
            });
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
            return getIncomingCredentialsForProfile(ctx.domain, ctx.user.profile, {
                limit,
                from: typeof from === 'string' ? [from] : from,
            });
        }),

    deleteCredential: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'DELETE',
                path: '/credential/{uri}',
                tags: ['Credentials'],
                summary: 'Delete a credential',
                description: 'This endpoint deletes a credential',
            },
        })
        .input(z.object({ uri: z.string() }))
        .output(z.boolean())
        .mutation(async ({ input: { uri }, ctx }) => {
            const credential = await getCredentialByUri(uri);

            if (!credential) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Credential not found' });
            }

            const owner = await getCredentialOwner(credential);

            if (owner?.profileId !== ctx.user.profile.profileId) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not own credential',
                });
            }

            await deleteCredential(credential);

            return true;
        }),
});
export type CredentialsRouter = typeof credentialsRouter;

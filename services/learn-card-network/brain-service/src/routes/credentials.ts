import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
    UnsignedVCValidator,
    VCValidator,
    SentCredentialInfoValidator,
    JWEValidator,
    IssueCredentialInputValidator,
    VerifyCredentialInputValidator,
    VerificationResultValidator,
} from '@learncard/types';

import { acceptCredential, sendCredential } from '@helpers/credential.helpers';

import {
    getCredentialByUri,
    getIncomingCredentialsForProfile,
    getReceivedCredentialsForProfile,
    getSentCredentialsForProfile,
} from '@accesslayer/credential/read';

import { deleteStorageForUri } from '@cache/storage';

import { t, profileRoute, openRoute } from '@routes';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import { getCredentialOwner } from '@accesslayer/credential/relationships/read';
import { deleteCredential } from '@accesslayer/credential/delete';
import { isRelationshipBlocked } from '@helpers/connection.helpers';
import { issueCredentialWithSigningAuthority } from '@helpers/signingAuthority.helpers';
import {
    getSigningAuthorityForUserByName,
    getPrimarySigningAuthorityForUser,
} from '@accesslayer/signing-authority/relationships/read';
import { getEmptyLearnCard } from '@helpers/learnCard.helpers';

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
            requiredScope: 'credentials:write',
        })
        .input(
            z.object({
                profileId: z.string(),
                credential: UnsignedVCValidator.or(VCValidator).or(JWEValidator),
                metadata: z.record(z.string(), z.unknown()).optional(),
            })
        )
        .output(z.string())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { profileId, credential, metadata } = input;

            const targetProfile = await getProfileByProfileId(profileId);

            const isBlocked = await isRelationshipBlocked(profile, targetProfile);
            if (!targetProfile || isBlocked) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Profile not found. Are you sure this person exists?',
                });
            }

            return sendCredential(profile, targetProfile, credential, ctx.domain, metadata);
        }),

    acceptCredential: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/credential/accept',
                tags: ['Credentials'],
                summary: 'Accept a Credential',
                description: 'This endpoint accepts a credential',
            },
            requiredScope: 'credentials:write',
        })
        .input(
            z.object({
                uri: z.string(),
                options: z
                    .object({
                        skipNotification: z.boolean().default(false).optional(),
                        metadata: z.record(z.string(), z.unknown()).optional(),
                    })
                    .optional(),
            })
        )
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { uri } = input;

            return acceptCredential(profile, uri, input?.options ?? {});
        }),

    receivedCredentials: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/credentials/received',
                tags: ['Credentials'],
                summary: 'Get received credentials',
                description: "This endpoint returns the current user's received credentials",
            },
            requiredScope: 'credentials:read',
        })
        .input(
            z
                .object({
                    limit: z.number().int().positive().lt(100).default(25),
                    from: z.string().optional(),
                })
                .default({ limit: 25 })
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
                summary: 'Get sent credentials',
                description: "This endpoint returns the current user's sent credentials",
            },
            requiredScope: 'credentials:read',
        })
        .input(
            z
                .object({
                    limit: z.number().int().positive().lt(100).default(25),
                    to: z.string().optional(),
                })
                .default({ limit: 25 })
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
                summary: 'Get incoming credentials',
                description: "This endpoint returns the current user's incoming credentials",
            },
            requiredScope: 'credentials:read',
        })
        .input(
            z
                .object({
                    limit: z.number().int().positive().lt(100).default(25),
                    from: z.string().optional(),
                })
                .default({ limit: 25 })
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
                path: '/credential',
                tags: ['Credentials'],
                summary: 'Delete a credential',
                description: 'This endpoint deletes a credential',
            },
            requiredScope: 'credentials:delete',
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

            await Promise.all([deleteCredential(credential), deleteStorageForUri(uri)]);

            return true;
        }),

    issueCredential: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/credential/issue',
                tags: ['Credentials'],
                summary: 'Issue a Credential',
                description:
                    'Issue a verifiable credential using a registered signing authority. If no signing authority is specified, the primary signing authority will be used.',
            },
            requiredScope: 'credentials:write',
        })
        .input(IssueCredentialInputValidator)
        .output(VCValidator.or(JWEValidator))
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { credential, signingAuthority: saInput, options } = input;

            let signingAuthorityForUser;

            if (saInput) {
                signingAuthorityForUser = await getSigningAuthorityForUserByName(
                    profile,
                    saInput.endpoint,
                    saInput.name
                );

                if (!signingAuthorityForUser) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: `Signing authority '${saInput.name}' at endpoint '${saInput.endpoint}' not found for this profile.`,
                    });
                }
            } else {
                signingAuthorityForUser = await getPrimarySigningAuthorityForUser(profile);

                if (!signingAuthorityForUser) {
                    throw new TRPCError({
                        code: 'PRECONDITION_FAILED',
                        message:
                            'No primary signing authority found. Register one via registerSigningAuthority or provide a specific signingAuthority in the request.',
                    });
                }
            }

            const unsignedCredential = { ...credential };

            unsignedCredential.issuer = signingAuthorityForUser.relationship.did;

            return issueCredentialWithSigningAuthority(
                profile,
                unsignedCredential,
                signingAuthorityForUser,
                ctx.domain,
                options?.encrypt ?? false
            );
        }),

    verifyCredential: openRoute
        .meta({
            openapi: {
                protect: false,
                method: 'POST',
                path: '/credential/verify',
                tags: ['Credentials'],
                summary: 'Verify a Credential',
                description:
                    'Verify a verifiable credential. This endpoint does not require authentication.',
            },
        })
        .input(VerifyCredentialInputValidator)
        .output(VerificationResultValidator)
        .mutation(async ({ input }) => {
            const { credential } = input;

            const learnCard = await getEmptyLearnCard();

            const result = await learnCard.invoke.verifyCredential(credential);

            return {
                checks: result.checks,
                warnings: result.warnings,
                errors: result.errors,
            };
        }),
});
export type CredentialsRouter = typeof credentialsRouter;

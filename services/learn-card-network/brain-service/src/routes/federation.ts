import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { t, openRoute } from '@routes';
import { VCValidator, JWEValidator, LCNNotificationTypeEnumValidator } from '@learncard/types';
import { isServiceTrusted, getTrustedServices } from '@helpers/federation.helpers';
import { getProfileByDid, getProfileByProfileId } from '@accesslayer/profile/read';
import { addNotificationToQueue } from '@helpers/notifications.helpers';
import {
    createFederatedInboxCredential,
    getFederatedInboxCredentialById,
    updateFederatedInboxCredentialStatus,
} from '@accesslayer/federated-inbox-credential/create';
import { getFederatedInboxCredentialsForProfile } from '@accesslayer/federated-inbox-credential/read';
import { getProfileIdFromDid } from '@helpers/did.helpers';

export const federationRouter = t.router({
    /**
     * Receive a credential from a federated LearnCard Network instance
     * This endpoint is called by remote brain-services to deliver credentials to local users
     */
    receive: openRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/inbox/receive',
                tags: ['Universal Inbox', 'Federation'],
                summary: 'Receive Federated Inbox Credential',
                description:
                    'Receives a credential from a federated LearnCard Network instance for delivery to a local user',
            },
        })
        .input(
            z.object({
                recipientDid: z.string(),
                credential: VCValidator.or(JWEValidator),
                issuerDid: z.string(),
                issuerDisplayName: z.string(),
                configuration: z
                    .object({
                        webhookUrl: z.string().optional(),
                        expiresInDays: z.number().optional(),
                        federatedFrom: z.string(),
                    })
                    .optional(),
            })
        )
        .output(
            z.object({
                issuanceId: z.string(),
                claimUrl: z.string().optional(),
                status: z.string(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const { recipientDid, credential, issuerDid, issuerDisplayName, configuration } = input;

            // Verify sender is authenticated via DID Auth
            if (!ctx.user?.did) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Missing or invalid DID Auth token',
                });
            }

            const senderDid = ctx.user.did;

            // Verify the sender is trusted
            const isTrusted = await isServiceTrusted(senderDid, ctx.domain);
            if (!isTrusted) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Sender service not trusted',
                });
            }

            // Resolve recipient profile locally
            const profileId = getProfileIdFromDid(recipientDid);
            if (!profileId) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Recipient not found on this service',
                });
            }

            const recipientProfile = await getProfileByProfileId(profileId);

            // Create inbox credential record
            const inboxCredential = await createFederatedInboxCredential({
                credential,
                recipientProfileId: profileId,
                senderServiceDid: senderDid,
                issuerDid,
                issuerDisplayName,
                metadata: configuration,
                status: recipientProfile ? 'PENDING_ACCEPTANCE' : 'PENDING_REGISTRATION',
            });

            if (recipientProfile) {
                // Send notification to recipient
                await addNotificationToQueue({
                    type: LCNNotificationTypeEnumValidator.enum.CREDENTIAL_RECEIVED,
                    to: recipientProfile,
                    from: { did: issuerDid, displayName: issuerDisplayName, profileId: '' },
                    message: {
                        title: 'Credential Received',
                        body: `${issuerDisplayName} has sent you a credential`,
                    },
                    data: {
                        inboxCredentialId: inboxCredential.id,
                        federatedFrom: configuration?.federatedFrom,
                    },
                });
            }

            return {
                issuanceId: inboxCredential.id,
                claimUrl: undefined,
                status: recipientProfile ? 'PENDING_ACCEPTANCE' : 'PENDING_REGISTRATION',
            };
        }),

    getMyFederatedCredentials: openRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/inbox/federated',
                tags: ['Federation', 'Inbox'],
                summary: 'Get federated inbox credentials for the authenticated user',
                description: 'Retrieves credentials received from external brain-services',
            },
            requiredScope: 'inbox:read',
        })
        .input(
            z.object({
                limit: z.number().int().min(1).max(100).default(25),
                cursor: z.string().optional(),
            })
        )
        .output(
            z.object({
                hasMore: z.boolean(),
                records: z.array(
                    z.object({
                        id: z.string(),
                        credential: z.unknown(),
                        senderServiceDid: z.string(),
                        issuerDid: z.string().optional(),
                        issuerDisplayName: z.string().optional(),
                        createdAt: z.string(),
                        status: z.enum([
                            'PENDING_ACCEPTANCE',
                            'PENDING_REGISTRATION',
                            'ACCEPTED',
                            'REJECTED',
                        ]),
                    })
                ),
            })
        )
        .query(async ({ ctx, input }) => {
            if (!ctx.user?.did) {
                throw new TRPCError({ code: 'UNAUTHORIZED' });
            }

            const profile = await getProfileByDid(ctx.user.did);
            if (!profile) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Profile not found' });
            }

            const { limit, cursor } = input;
            const results = await getFederatedInboxCredentialsForProfile(profile.profileId, {
                limit: limit + 1,
                cursor,
            });

            const records = results.slice(0, limit);
            const hasMore = results.length > limit;

            return {
                hasMore,
                records: records.map(r => ({
                    id: r.id,
                    credential: r.credential,
                    senderServiceDid: r.senderServiceDid,
                    issuerDid: r.issuerDid,
                    issuerDisplayName: r.issuerDisplayName,
                    createdAt: r.createdAt,
                    status: r.status,
                })),
            };
        }),

    acceptFederatedCredential: openRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/inbox/federated/{credentialId}/accept',
                tags: ['Federation', 'Inbox'],
                summary: 'Accept a federated inbox credential',
                description: 'Accepts a credential received from an external brain-service',
            },
            requiredScope: 'inbox:write',
        })
        .input(z.object({ credentialId: z.string() }))
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            if (!ctx.user?.did) {
                throw new TRPCError({ code: 'UNAUTHORIZED' });
            }

            const credential = await getFederatedInboxCredentialById(input.credentialId);
            if (!credential) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Credential not found' });
            }

            const profile = await getProfileByDid(ctx.user.did);
            if (!profile || credential.recipientProfileId !== profile.profileId) {
                throw new TRPCError({ code: 'UNAUTHORIZED' });
            }

            // Update credential status to ACCEPTED
            const updatedCredential = await updateFederatedInboxCredentialStatus(
                input.credentialId,
                'ACCEPTED'
            );

            return !!updatedCredential;
        }),

    getTrustedServices: openRoute
        .meta({
            openapi: {
                method: 'GET',
                path: '/federation/trusted-services',
                tags: ['Federation'],
                summary: 'Get list of trusted brain-services',
                description: 'Returns the list of brain-services trusted by this instance',
            },
        })
        .input(z.object({}))
        .output(
            z.array(
                z.object({
                    did: z.string(),
                    name: z.string(),
                    endpoint: z.string(),
                })
            )
        )
        .query(async ({ ctx }) => {
            return getTrustedServices(ctx.domain);
        }),
});

export type FederationRouter = typeof federationRouter;

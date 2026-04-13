import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { t, openRoute, didRoute } from '@routes';
import { VCValidator, JWEValidator } from '@learncard/types';
import {
    isServiceTrusted,
    getTrustedServices,
    getServerDidWebDID,
    getServerDidFromUserDid,
} from '@helpers/federation.helpers';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import { getProfileIdFromDid } from '@helpers/did.helpers';

import { getOrCreateFederatedProfile } from '@helpers/profile.helpers';
import { sendCredential } from '@helpers/credential.helpers';

export const federationRouter = t.router({
    receive: didRoute
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

            const senderDid = ctx.user.did;

            const isTrusted = await isServiceTrusted(senderDid, ctx.domain);

            if (!isTrusted) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Sender service not trusted',
                });
            }

            const profileId = getProfileIdFromDid(recipientDid);

            if (!profileId) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Recipient not found on this service',
                });
            }

            const recipientProfile = await getProfileByProfileId(profileId);

            const senderServerDid = getServerDidFromUserDid(senderDid);
            const localServerDid = getServerDidWebDID(ctx.domain);
            const isLocalSender = senderServerDid === localServerDid;

            // Verify that the issuerDid belongs to the sender's service.
            // This prevents impersonation attacks where a malicious service sends
            // credentials claiming to be from users on a different trusted service.
            // Example: Service B sends to Service D on behalf of User A on Service B.
            // senderDid = did:web:service-b.com (Service B's DID)
            // issuerDid = did:web:service-b.com:users:a (User A's DID on Service B)
            // We verify getServerDidFromUserDid(issuerDid) === senderDid
            const issuerServerDid = getServerDidFromUserDid(issuerDid);
            if (issuerDid !== senderDid && issuerServerDid !== senderDid) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'Issuer DID does not belong to sender service',
                });
            }

            if (isLocalSender && recipientProfile) {
                const federatedSender = await getOrCreateFederatedProfile(
                    issuerDid,
                    senderDid,
                    issuerDisplayName
                );

                const credentialUri = await sendCredential(
                    federatedSender,
                    recipientProfile,
                    credential,
                    ctx.domain,
                    configuration
                );

                return {
                    issuanceId: credentialUri,
                    claimUrl: undefined,
                    status: 'PENDING_ACCEPTANCE',
                };
            }

            if (!recipientProfile) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Recipient not found on this service',
                });
            }

            const federatedSender = await getOrCreateFederatedProfile(
                issuerDid,
                senderDid,
                issuerDisplayName
            );

            const credentialUri = await sendCredential(
                federatedSender,
                recipientProfile,
                credential,
                ctx.domain,
                {
                    ...configuration,
                    federatedFrom: configuration?.federatedFrom || senderDid,
                }
            );

            return {
                issuanceId: credentialUri,
                claimUrl: undefined,
                status: 'PENDING_ACCEPTANCE',
            };
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

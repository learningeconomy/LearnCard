import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { t, profileRoute, verifiedContactRoute } from '@routes';
import { 
    PaginationOptionsValidator,     
    IssueInboxCredentialValidator,
    IssueInboxCredentialResponseValidator,
    InboxCredentialValidator,
    PaginatedInboxCredentialsValidator,
    InboxCredentialQueryValidator, 
    ContactMethodQueryValidator,
    ClaimInboxCredentialValidator,
    // For finalize flow
    LCNNotificationTypeEnumValidator,
    LCNInboxStatusEnumValidator,
    VC,
    VCValidator,
    UnsignedVC,
} from '@learncard/types';

import { claimIntoInbox, issueToInbox } from '@helpers/inbox.helpers';
import { getAcceptedPendingInboxCredentialsForContactMethodId, getInboxCredentialsForProfile } from '@accesslayer/inbox-credential/read';
import { readIntegrationByPublishableKey } from '@accesslayer/integration/read';
import { getPrimarySigningAuthorityForIntegration, getSigningAuthoritiesForIntegrationByName, getSigningAuthorityForUserByName } from '@accesslayer/signing-authority/relationships/read';
import { getOwnerProfileForIntegration } from '@accesslayer/integration/relationships/read';
import { isDomainWhitelisted } from '@helpers/integrations.helpers';
import { getContactMethodsForProfile } from '@accesslayer/contact-method/read';
import { getProfileByDid } from '@accesslayer/profile/read';
import { markInboxCredentialAsIsAccepted, markInboxCredentialAsIssued } from '@accesslayer/inbox-credential/update';
import { createClaimedRelationship } from '@accesslayer/inbox-credential/relationships/create';
import { issueCredentialWithSigningAuthority } from '@helpers/signingAuthority.helpers';
import { addNotificationToQueue } from '@helpers/notifications.helpers';
import { getLearnCard } from '@helpers/learnCard.helpers';

export const inboxRouter = t.router({
    // Issue a credential to someone's inbox
    issue: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/inbox/issue',
                tags: ['Universal Inbox'],
                summary: 'Issue Credential to Universal Inbox',
                description:
                    "Issue a credential to a recipient's inbox. If the recipient exists with a verified email, the credential is auto-delivered.",
            },
            requiredScope: 'inbox:write',
        })
        .input(IssueInboxCredentialValidator)
        .output(IssueInboxCredentialResponseValidator)
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { recipient, credential, configuration } = input;

            try {
                const result = await issueToInbox(
                    profile,
                    recipient,
                    credential,
                    configuration,
                    ctx
                );

                return {
                    issuanceId: result.inboxCredential.id,
                    status: result.status,
                    recipient,
                    claimUrl: result.claimUrl,
                    recipientDid: result.recipientDid,
                };
            } catch (error) {
                if (error instanceof TRPCError) {
                    throw error;
                }

                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to issue credential to inbox: ' + error,
                });
            }
        }),

    claim: verifiedContactRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/inbox/claim',
                tags: ['Universal Inbox'],
                summary: 'Claim Universal Inbox Credential',
                description: 'Claim a credential from the inbox',
            }
        })
        .input(ClaimInboxCredentialValidator)
        .output(z.object({
            inboxCredential: InboxCredentialValidator,
            status: z.string(),
            recipientDid: z.string().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const { contactMethod, domain } = ctx;
            const { credential, configuration } = input;

            if (!credential) throw new TRPCError({ code: 'NOT_FOUND', message: 'Credential not found' });

            if (!configuration) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Configuration is required' });
            const { publishableKey } = configuration;

            const integration = await readIntegrationByPublishableKey(publishableKey);
            if (!integration) throw new TRPCError({ code: 'NOT_FOUND', message: 'Integration not found' });

            if (!isDomainWhitelisted(domain, integration.whitelistedDomains)) throw new TRPCError({ code: 'UNAUTHORIZED' });
 
            const signingAuthorityRel = configuration?.signingAuthorityName
                ? (await getSigningAuthoritiesForIntegrationByName(
                      integration,
                      configuration.signingAuthorityName
                  )).at(0)
                : await getPrimarySigningAuthorityForIntegration(integration);

            console.log('signingAuthorityRel', signingAuthorityRel)
            if (!signingAuthorityRel)
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Signing Authority not found' });

            const issuerProfile = await getOwnerProfileForIntegration(integration.id);
            if (!issuerProfile) throw new TRPCError({ code: 'NOT_FOUND', message: 'Issuer Profile not found' });
            
            // Claim Credential into Contact Method's inbox
            const result = await claimIntoInbox(
                issuerProfile,
                signingAuthorityRel,
                contactMethod,
                credential,
                {
                    expiresInDays: 720,
                },
                ctx
            );

            return {
                inboxCredential: result.inboxCredential,
                status: result.status,
                recipientDid: result.recipientDid,
            };
        }),

    // Finalize all pending inbox credentials for verified contact methods
    finalize: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/inbox/finalize',
                tags: ['Universal Inbox'],
                summary: 'Finalize Universal Inbox Credentials',
                description: 'Sign and issue all pending inbox credentials for verified contact methods of the authenticated profile',
            },
            requiredScope: 'inbox:write',
        })
        .input(z.object({}).default({}))
        .output(z.object({
            processed: z.number(),
            claimed: z.number(),
            errors: z.number(),
            verifiableCredentials: z.array(VCValidator),
        }))
        .mutation(async ({ ctx }) => {
            const { profile } = ctx.user;

            // Get verified contact methods for this profile
            const contactMethods = await getContactMethodsForProfile(profile.did);
            const verifiedContacts = contactMethods.filter(cm => cm.isVerified);

            let processed = 0;
            let claimed = 0;
            let errors = 0;

            // Preload LC DID for webhooks
            let lcDid: string | null = null;
            try { const lc = await getLearnCard(); lcDid = lc.id.did(); } catch {}

            const verifiableCredentials: VC[] = [];

            for (const cm of verifiedContacts) {
                const pending = await getAcceptedPendingInboxCredentialsForContactMethodId(cm.id);
                console.log(`Found ${pending.length} pending inbox credentials for contact method ${cm.value}`, pending);
                for (const inboxCredential of pending) {
                    processed += 1;
                    try {
                        let finalCredential: VC;

                        if (!inboxCredential.isSigned) {
                            const unsignedCredential = JSON.parse(inboxCredential.credential) as UnsignedVC;

                            const endpoint = (inboxCredential.signingAuthority?.endpoint as string) ?? undefined;
                            const name = (inboxCredential.signingAuthority?.name as string) ?? undefined;
                            if (!endpoint || !name) throw new Error('Inbox credential missing signing authority info');

                            const issuerProfile = await getProfileByDid(inboxCredential.issuerDid);
                            if (!issuerProfile) throw new Error('Issuer profile not found');

                            const signingAuthorityForUser = await getSigningAuthorityForUserByName(
                                issuerProfile,
                                endpoint,
                                name
                            );
                            if (!signingAuthorityForUser) throw new Error('Signing authority not found');

                            // Set subject DID to the authenticated user's DID
                            if (Array.isArray(unsignedCredential.credentialSubject)) {
                                unsignedCredential.credentialSubject = unsignedCredential.credentialSubject.map(sub => ({
                                    ...sub,
                                    id: (sub as any).did || (sub as any).id || profile.did,
                                }));
                            } else {
                                (unsignedCredential.credentialSubject as any).id = (unsignedCredential as any).credentialSubject?.did || (unsignedCredential as any).credentialSubject?.id || profile.did;
                            }

                            // Set issuer from signing authority
                            unsignedCredential.issuer = signingAuthorityForUser.relationship.did;

                            finalCredential = (await issueCredentialWithSigningAuthority(
                                issuerProfile,
                                unsignedCredential,
                                signingAuthorityForUser,
                                ctx.domain,
                                false
                            )) as VC;
                        }
                        else {
                            finalCredential = JSON.parse(inboxCredential.credential) as VC;
                        }

                        await markInboxCredentialAsIssued(inboxCredential.id);
                        await markInboxCredentialAsIsAccepted(inboxCredential.id);
                        await createClaimedRelationship(profile.profileId, inboxCredential.id, 'finalize');

                        // Trigger webhook if configured
                        if (inboxCredential.webhookUrl) {
                            try {
                                await addNotificationToQueue({
                                    webhookUrl: inboxCredential.webhookUrl,
                                    type: LCNNotificationTypeEnumValidator.enum.ISSUANCE_CLAIMED,
                                    from: { did: lcDid || profile.did },
                                    to: { did: inboxCredential.issuerDid },
                                    message: {
                                        title: 'Credential Claimed from Inbox',
                                        body: `${cm.value} claimed a credential from their inbox.`,
                                    },
                                    data: {
                                        inbox: {
                                            issuanceId: inboxCredential.id,
                                            status: LCNInboxStatusEnumValidator.enum.ISSUED,
                                            recipient: {
                                                contactMethod: { type: cm.type, value: cm.value },
                                                learnCardId: profile.did,
                                            },
                                            timestamp: new Date().toISOString(),
                                        },
                                    },
                                });
                            } catch (webhookError) {
                                // Non-fatal
                                console.error('Failed to enqueue claimed webhook:', webhookError);
                            }
                        }

                        claimed += 1;
                        verifiableCredentials.push(finalCredential);
                    } catch (error) {
                        console.error(`Failed to finalize inbox credential ${inboxCredential.id}:`, error);

                        // Error webhook if configured
                        if (inboxCredential.webhookUrl) {
                            try {
                                await addNotificationToQueue({
                                    webhookUrl: inboxCredential.webhookUrl,
                                    type: LCNNotificationTypeEnumValidator.enum.ISSUANCE_ERROR,
                                    from: { did: lcDid || profile.did },
                                    to: { did: inboxCredential.issuerDid },
                                    message: {
                                        title: 'Credential Issuance Error from Inbox',
                                        body: error instanceof Error ? error.message : `${cm.value} failed to claim a credential from their inbox.`,
                                    },
                                    data: {
                                        inbox: {
                                            issuanceId: inboxCredential.id,
                                            status: LCNInboxStatusEnumValidator.enum.PENDING,
                                            recipient: {
                                                contactMethod: { type: cm.type, value: cm.value },
                                                learnCardId: profile.did,
                                            },
                                            timestamp: new Date().toISOString(),
                                        },
                                    },
                                });
                            } catch (webhookError) {
                                console.error('Failed to enqueue error webhook:', webhookError);
                            }
                        }

                        errors += 1;
                    }
                }
            }

            return { processed, claimed, errors, verifiableCredentials };
        }),

    // Get inbox credentials issued by this profile
    getMyIssuedCredentials: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/inbox/issued',
                tags: ['Universal Inbox'],
                summary: 'Get My Issued Universal Inbox Credentials',
                description: 'Get all inbox credentials issued by the authenticated profile',
            },
            requiredScope: 'inbox:read',
        })
        .input(
            PaginationOptionsValidator.extend({
                limit: PaginationOptionsValidator.shape.limit.default(25),
                query: InboxCredentialQueryValidator.optional(),
                recipient: ContactMethodQueryValidator.optional(),
            }).default({})
        )
        .output(PaginatedInboxCredentialsValidator)
        .query(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { limit, cursor, query, recipient } = input;

            const credentials = await getInboxCredentialsForProfile(profile.profileId, {
                limit: limit + 1,
                cursor,
                query,
                recipient,
            });

            const hasMore = credentials.length > limit;
            const newCursor = credentials.at(hasMore ? -2 : -1)?.createdAt;
            return {
                hasMore,
                records: credentials.slice(0, limit),
                ...(newCursor && { cursor: newCursor }),
            };
        }),

    // Get a specific inbox credential (if owned by the profile)
    getInboxCredential: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/inbox/credentials/{credentialId}',
                tags: ['Universal Inbox'],
                summary: 'Get Universal Inbox Credential Details',
                description:
                    'Get details of a specific inbox credential (if owned by the authenticated profile)',
            },
            requiredScope: 'inbox:read',
        })
        .input(
            z.object({
                credentialId: z.string(),
            })
        )
        .output(InboxCredentialValidator)
        .query(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { credentialId } = input;

            // Get all credentials for this profile and find the requested one
            const inboxCredentials = await getInboxCredentialsForProfile(profile.profileId, {
                limit: 1,
                query: { id: credentialId },
            });

            const inboxCredential = inboxCredentials[0];
            if (!inboxCredential) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Inbox credential not found or not owned by you',
                });
            }

            return inboxCredential;
        }),
});

export type InboxRouter = typeof inboxRouter;

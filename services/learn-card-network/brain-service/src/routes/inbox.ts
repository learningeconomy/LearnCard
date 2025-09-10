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
    ClaimInboxCredentialValidator
} from '@learncard/types';

import { claimIntoInbox, issueToInbox } from '@helpers/inbox.helpers';
import { getInboxCredentialsForProfile } from '@accesslayer/inbox-credential/read';
import { readIntegrationByPublishableKey } from '@accesslayer/integration/read';
import { getPrimarySigningAuthorityForIntegration, getSigningAuthoritiesForIntegrationByName } from '@accesslayer/signing-authority/relationships/read';
import { getOwnerProfileForIntegration } from '@accesslayer/integration/relationships/read';
import { isDomainWhitelisted } from '@helpers/integrations.helpers';

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
                description: 'Issue a credential to a recipient\'s inbox. If the recipient exists with a verified email, the credential is auto-delivered.',
            },
            requiredScope: 'inbox:write',
        }) 
        .input(IssueInboxCredentialValidator)
        .output(IssueInboxCredentialResponseValidator)
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { 
                recipient, 
                credential, 
                configuration,
            } = input;

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
                    message: 'Failed to issue credential to inbox',
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

            const credentials = await getInboxCredentialsForProfile(
                profile.profileId,
                { limit: limit + 1, cursor, query, recipient }
            );

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
                description: 'Get details of a specific inbox credential (if owned by the authenticated profile)',
            },
            requiredScope: 'inbox:read',
        })
        .input(z.object({
            credentialId: z.string(),
        }))
        .output(InboxCredentialValidator)
        .query(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { credentialId } = input;

            // Get all credentials for this profile and find the requested one
            const inboxCredentials = await getInboxCredentialsForProfile(profile.profileId, { limit: 1, query: { id: credentialId } });

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
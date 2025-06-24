import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { t, profileRoute } from '@routes';

import { issueToInbox } from '@helpers/inbox.helpers';
import { getInboxCredentialsForProfile } from '@accesslayer/inbox-credential/read';
import {
    IssueInboxCredentialValidator,
    IssueInboxCredentialResponseValidator,
    InboxCredentialValidator,
} from 'types/inbox-credential';

export const inboxRouter = t.router({
    // Issue a credential to someone's inbox
    issue: profileRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/inbox/issue',
                tags: ['Inbox'],
                summary: 'Issue Credential to Inbox',
                description: 'Issue a credential to a recipient\'s inbox. If the recipient exists with a verified email, the credential is auto-delivered.',
            },
        })
        .input(IssueInboxCredentialValidator)
        .output(IssueInboxCredentialResponseValidator)
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { 
                recipientEmail, 
                credential, 
                isSigned, 
                signingAuthority, 
                webhookUrl, 
                expiresInDays 
            } = input;

            try {
                const result = await issueToInbox(
                    profile,
                    recipientEmail,
                    credential,
                    {
                        isSigned,
                        signingAuthority,
                        webhookUrl,
                        expiresInDays,
                    }
                );

                return {
                    issuanceId: result.inboxCredential.id,
                    status: result.status,
                    recipient: recipientEmail,
                    claimUrl: result.claimUrl,
                    recipientDid: result.recipientDid,
                };
            } catch (error) {
                console.error('Inbox issuance error:', error);
                
                if (error instanceof TRPCError) {
                    throw error;
                }
                
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to issue credential to inbox',
                });
            }
        }),

    // Get inbox credentials issued by this profile
    getMyIssuedCredentials: profileRoute
        .meta({
            openapi: {
                method: 'GET',
                path: '/inbox/issued',
                tags: ['Inbox'],
                summary: 'Get My Issued Inbox Credentials',
                description: 'Get all inbox credentials issued by the authenticated profile',
            },
        })
        .input(z.object({
            status: z.enum(['PENDING', 'CLAIMED', 'EXPIRED', 'DELIVERED']).optional(),
            limit: z.number().min(1).max(100).default(25),
        }))
        .output(z.array(InboxCredentialValidator))
        .query(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { status } = input;

            const credentials = await getInboxCredentialsForProfile(
                profile.did,
                status
            );

            return credentials;
        }),

    // Get a specific inbox credential (if owned by the profile)
    getInboxCredential: profileRoute
        .meta({
            openapi: {
                method: 'GET',
                path: '/inbox/credentials/{credentialId}',
                tags: ['Inbox'],
                summary: 'Get Inbox Credential Details',
                description: 'Get details of a specific inbox credential (if owned by the authenticated profile)',
            },
        })
        .input(z.object({
            credentialId: z.string(),
        }))
        .output(InboxCredentialValidator)
        .query(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { credentialId } = input;

            // Get all credentials for this profile and find the requested one
            const credentials = await getInboxCredentialsForProfile(profile.did);
            const credential = credentials.find(c => c.id === credentialId);

            if (!credential) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Inbox credential not found or not owned by you',
                });
            }

            return credential;
        }),
});

export type InboxRouter = typeof inboxRouter;
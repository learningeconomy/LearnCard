import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { t, profileRoute } from '@routes';
import { PaginationOptionsValidator } from '@learncard/types';

import { issueToInbox } from '@helpers/inbox.helpers';
import { getInboxCredentialsForProfile } from '@accesslayer/inbox-credential/read';
import {
    IssueInboxCredentialValidator,
    IssueInboxCredentialResponseValidator,
    InboxCredentialValidator,
    PaginatedInboxCredentialsValidator,
    InboxCredentialQueryValidator,
} from 'types/inbox-credential';
import { ContactMethodQueryValidator } from 'types/contact-method';

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
                recipient, 
                credential, 
                isSigned, 
                signingAuthority, 
                webhookUrl, 
                expiresInDays,
                template
            } = input;

            try {
                const result = await issueToInbox(
                    profile,
                    recipient,
                    credential,
                    {
                        isSigned,
                        signingAuthority,
                        webhookUrl,
                        expiresInDays,
                        template,  
                    },
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
        .input(PaginationOptionsValidator.extend({
            limit: PaginationOptionsValidator.shape.limit.default(25),
            query: InboxCredentialQueryValidator.optional(),
            recipient: ContactMethodQueryValidator.optional(),
        }).default({}))
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
            // TODO: Should this just be a getInboxCredentialById function?
            const credentials = await getInboxCredentialsForProfile(profile.profileId, { limit: 1, query: { id: credentialId }});
            const credential = credentials?.find(c => c.id === credentialId);

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
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { t, profileRoute, openRoute } from '@routes';
import {
    PaginationOptionsValidator,
    IssueInboxCredentialValidator,
    IssueInboxCredentialResponseValidator,
    InboxCredentialValidator,
    PaginatedInboxCredentialsValidator,
    InboxCredentialQueryValidator,
    ContactMethodQueryValidator,
    LCNNotificationTypeEnumValidator,
} from '@learncard/types';

import { issueToInbox } from '@helpers/inbox.helpers';
import {
    generateGuardianApprovalToken,
    generateGuardianApprovalUrl,
    validateGuardianApprovalToken,
    markGuardianApprovalTokenAsUsed,
} from '@helpers/guardian-approval.helpers';
import { getDeliveryService } from '@services/delivery/delivery.factory';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import { updateProfile } from '@accesslayer/profile/update';
import { getInboxCredentialsForProfile } from '@accesslayer/inbox-credential/read';
import { addNotificationToQueue } from '@helpers/notifications.helpers';

export const inboxRouter = t.router({
    // Request guardian approval via email
    sendGuardianApprovalEmail: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/inbox/guardian-approval/send',
                tags: ['Universal Inbox', 'Profiles'],
                summary: 'Send Guardian Approval Email',
                description:
                    "Generates a one-time approval token and emails a link to the guardian. When the link is consumed, the requester's profile will be marked as approved.",
            },
            requiredScope: 'profiles:write',
        })
        .input(
            z.object({
                guardianEmail: z.string().email(),
                ttlHours: z
                    .number()
                    .int()
                    .min(0)
                    .max(24 * 30)
                    .optional(),
                template: z
                    .object({
                        id: z.string().optional(),
                        model: z.record(z.string(), z.any()).optional(),
                    })
                    .optional(),
            })
        )
        .output(
            z.object({
                message: z.string(),
                approvalUrl: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { guardianEmail, ttlHours, template } = input;

            try {
                // Generate approval token and URL
                const token = await generateGuardianApprovalToken(
                    profile.profileId,
                    guardianEmail,
                    ttlHours
                );
                const approvalUrl = generateGuardianApprovalUrl(token);

                // Send email via delivery service
                const deliveryService = getDeliveryService({ type: 'email', value: guardianEmail });
                const injectedTemplateFields = {
                    requester: {
                        displayName: profile.displayName,
                        profileId: profile.profileId,
                    },
                    guardian: { email: guardianEmail },
                };

                await deliveryService.send({
                    contactMethod: { type: 'email', value: guardianEmail },
                    templateId: template?.id || 'guardian-approval',
                    templateModel: {
                        approvalUrl,
                        approvalToken: token,
                        ...injectedTemplateFields,
                        ...(template?.model || {}),
                    },
                    messageStream: 'guardian-approval',
                });

                return { message: 'Guardian approval email sent.', approvalUrl };
            } catch (error) {
                if (error instanceof TRPCError) throw error;
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to send guardian approval email',
                });
            }
        }),

    // Open route: consume approval token and mark requester as approved
    approveGuardianRequest: openRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/inbox/guardian-approval/approve',
                tags: ['Universal Inbox', 'Profiles'],
                summary: 'Approve Guardian Request',
                description:
                    'Consumes a guardian approval token and marks the requesting user profile as approved.',
            },
        })
        .input(z.object({ token: z.string() }))
        .output(z.object({ message: z.string() }))
        .mutation(async ({ input }) => {
            const { token } = input;

            // Validate token
            const tokenData = await validateGuardianApprovalToken(token);
            if (!tokenData) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Invalid or expired approval token',
                });
            }

            // Fetch requester profile and mark approved
            const requester = await getProfileByProfileId(tokenData.requesterProfileId);
            if (!requester) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Requester profile not found' });
            }

            const alreadyApproved = !!requester.approved;
            if (!alreadyApproved) {
                const updated = await updateProfile(requester, { approved: true });
                if (!updated) {
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'Failed to mark profile as approved',
                    });
                }

                // Notify the user that their account has been approved
                await addNotificationToQueue({
                    type: LCNNotificationTypeEnumValidator.enum.PROFILE_PARENT_APPROVED,
                    to: requester,
                    from: requester,
                    message: {
                        title: 'Account Approved',
                        body: 'Your account has been approved by your parent or guardian.',
                    },
                });
            }

            // Mark token as used (idempotent)
            await markGuardianApprovalTokenAsUsed(token);

            return {
                message: alreadyApproved
                    ? 'Profile already approved.'
                    : 'Profile approved successfully.',
            };
        }),
    // Open route (GET): approve via path parameter for direct email link usage
    approveGuardianRequestByPath: openRoute
        .meta({
            openapi: {
                method: 'GET',
                path: '/inbox/guardian-approval/{token}',
                tags: ['Universal Inbox', 'Profiles'],
                summary: 'Approve Guardian Request (GET)',
                description: 'GET endpoint to consume guardian approval token from URL path.',
            },
        })
        .input(z.object({ token: z.string() }))
        .output(z.object({ message: z.string() }))
        .query(async ({ input }) => {
            const { token } = input;

            const tokenData = await validateGuardianApprovalToken(token);
            if (!tokenData) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Invalid or expired approval token',
                });
            }

            const requester = await getProfileByProfileId(tokenData.requesterProfileId);
            if (!requester) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Requester profile not found' });
            }

            const alreadyApproved = !!requester.approved;
            if (!alreadyApproved) {
                const updated = await updateProfile(requester, { approved: true });
                if (!updated) {
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'Failed to mark profile as approved',
                    });
                }

                // Notify the user that their account has been approved
                await addNotificationToQueue({
                    type: LCNNotificationTypeEnumValidator.enum.PROFILE_PARENT_APPROVED,
                    to: requester,
                    from: requester,
                    message: {
                        title: 'Account Approved',
                        body: 'Your account has been approved by your parent or guardian.',
                    },
                });
            }

            await markGuardianApprovalTokenAsUsed(token);

            return {
                message: alreadyApproved
                    ? 'Profile already approved.'
                    : 'Profile approved successfully.',
            };
        }),
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
                    message: 'Failed to issue credential to inbox',
                });
            }
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

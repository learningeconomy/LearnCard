import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { t, profileRoute } from '@routes';

import { createEmailAddress } from '@accesslayer/email-address/create';
import { getEmailAddressByEmail } from '@accesslayer/email-address/read';
import { setPrimaryEmail, verifyEmailAddress } from '@accesslayer/email-address/update';
import { deleteEmailAddress } from '@accesslayer/email-address/delete';
import { createProfileEmailRelationship } from '@accesslayer/email-address/relationships/create';
import { 
    checkProfileEmailRelationship,
    getProfileEmailRelationships,
} from '@accesslayer/email-address/relationships/read';
import { deleteProfileEmailRelationship } from '@accesslayer/email-address/relationships/delete';
import {
    generateEmailVerificationToken,
    validateEmailVerificationToken,
} from '@helpers/email.helpers';
import {
    EmailAddressValidator,
    EmailVerificationRequestValidator,
    EmailVerificationValidator,
    SetPrimaryEmailValidator,
} from 'types/email-address';

export const emailsRouter = t.router({
    // Get all emails for the authenticated profile
    getMyEmails: profileRoute
        .meta({
            openapi: {
                method: 'GET',
                path: '/profile/emails',
                tags: ['Emails'],
                summary: 'Get My Email Addresses',
                description: 'Get all email addresses associated with the authenticated profile',
            },
        })
        .input(z.void())
        .output(z.array(EmailAddressValidator))
        .query(async ({ ctx }) => {
            const { profile } = ctx.user;
            return getProfileEmailRelationships(profile.did);
        }),

    // Add a new email address (requires verification)
    addEmail: profileRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/profile/emails/add',
                tags: ['Emails'],
                summary: 'Add Email Address',
                description: 'Add a new email address to the profile (requires verification)',
            },
        })
        .input(EmailVerificationRequestValidator)
        .output(z.object({
            message: z.string(),
            emailId: z.string(),
            verificationRequired: z.boolean(),
        }))
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { email } = input;

            // Check if email already exists
            const existingEmail = await getEmailAddressByEmail(email);
            if (existingEmail) {
                // Check if this profile already owns this email
                const ownsEmail = await checkProfileEmailRelationship(
                    profile.did,
                    existingEmail.id
                );

                if (ownsEmail) {
                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message: 'Email already associated with your profile',
                    });
                } else {
                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message: 'Email already in use by another profile',
                    });
                }
            }

            // Create new email address (unverified)
            const emailAddress = await createEmailAddress({
                email,
                isVerified: false,
                isPrimary: false,
            });

            // Create relationship with profile
            await createProfileEmailRelationship(profile.did, emailAddress.id);

            // Generate verification token
            const verificationToken = await generateEmailVerificationToken(emailAddress.id);

            // TODO: Send verification email using notification system
            console.log(`Verification email would be sent to ${email} with token: ${verificationToken}`);

            return {
                message: 'Email added. Please check your email for verification instructions.',
                emailId: emailAddress.id,
                verificationRequired: true,
            };
        }),

    // Verify an email address
    verifyEmail: profileRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/profile/emails/verify',
                tags: ['Emails'],
                summary: 'Verify Email Address',
                description: 'Verify an email address using the verification token',
            },
        })
        .input(EmailVerificationValidator)
        .output(z.object({
            message: z.string(),
            emailAddress: EmailAddressValidator,
        }))
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { token } = input;

            // Validate token and get email ID
            const emailAddressId = await validateEmailVerificationToken(token);
            if (!emailAddressId) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Invalid or expired verification token',
                });
            }

            // Check if this profile owns this email
            const ownsEmail = await checkProfileEmailRelationship(
                profile.did,
                emailAddressId
            );

            if (!ownsEmail) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You do not own this email address',
                });
            }

            // Verify the email
            const emailAddress = await verifyEmailAddress(emailAddressId);
            if (!emailAddress) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Email address not found',
                });
            }

            return {
                message: 'Email verified successfully',
                emailAddress,
            };
        }),

    // Set primary email
    setPrimaryEmail: profileRoute
        .meta({
            openapi: {
                method: 'PUT',
                path: '/profile/emails/{emailId}/primary',
                tags: ['Emails'],
                summary: 'Set Primary Email',
                description: 'Set an email address as the primary email for the profile',
            },
        })
        .input(SetPrimaryEmailValidator)
        .output(z.object({
            message: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { emailId } = input;

            // Check if this profile owns this email
            const ownsEmail = await checkProfileEmailRelationship(
                profile.did,
                emailId
            );

            if (!ownsEmail) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You do not own this email address',
                });
            }

            // Set as primary
            const success = await setPrimaryEmail(profile.did, emailId);
            if (!success) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to set primary email',
                });
            }

            return {
                message: 'Primary email updated successfully',
            };
        }),

    // Remove email address
    removeEmail: profileRoute
        .meta({
            openapi: {
                method: 'DELETE',
                path: '/profile/emails/{emailId}',
                tags: ['Emails'],
                summary: 'Remove Email Address',
                description: 'Remove an email address from the profile',
            },
        })
        .input(z.object({ emailId: z.string() }))
        .output(z.object({
            message: z.string(),
        }))
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { emailId } = input;

            // Check if this profile owns this email
            const ownsEmail = await checkProfileEmailRelationship(
                profile.did,
                emailId
            );

            if (!ownsEmail) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You do not own this email address',
                });
            }

            // Remove relationship first, then delete email
            await deleteProfileEmailRelationship(profile.did, emailId);
            await deleteEmailAddress(emailId);

            return {
                message: 'Email address removed successfully',
            };
        }),
});

export type EmailsRouter = typeof emailsRouter;
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { t, profileRoute } from '@routes';

import { createContactMethod } from '@accesslayer/contact-method/create';
import { getContactMethodByValue } from '@accesslayer/contact-method/read';
import { setPrimaryContactMethod, verifyContactMethod } from '@accesslayer/contact-method/update';
import { deleteContactMethod } from '@accesslayer/contact-method/delete';
import { createProfileContactMethodRelationship } from '@accesslayer/contact-method/relationships/create';
import {
    checkProfileContactMethodRelationship,
    getProfileContactMethodRelationships,
} from '@accesslayer/contact-method/relationships/read';
import { deleteProfileContactMethodRelationship } from '@accesslayer/contact-method/relationships/delete';
import {
    generateContactMethodVerificationToken,
    validateContactMethodVerificationToken,
} from '@helpers/contact-method.helpers';
import {
    ContactMethodValidator,
    ContactMethodVerificationRequestValidator,
    ContactMethodVerificationValidator,
    SetPrimaryContactMethodValidator,
} from 'types/contact-method';

export const contactMethodsRouter = t.router({
    // Get all contact methods for the authenticated profile
    getMyContactMethods: profileRoute
        .meta({
            openapi: {
                method: 'GET',
                path: '/profile/contact-methods',
                tags: ['Contact Methods'],
                summary: 'Get My Contact Methods',
                description: 'Get all contact methods associated with the authenticated profile',
            },
        })
        .input(z.void())
        .output(z.array(ContactMethodValidator))
        .query(async ({ ctx }) => {
            const { profile } = ctx.user;
            return getProfileContactMethodRelationships(profile);
        }),

    // Add a new contact method (requires verification)
    addContactMethod: profileRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/profile/contact-methods/add',
                tags: ['Contact Methods'],
                summary: 'Add Contact Method',
                description: 'Add a new contact method to the profile (requires verification)',
            },
        })
        .input(ContactMethodVerificationRequestValidator)
        .output(
            z.object({
                message: z.string(),
                contactMethodId: z.string(),
                verificationRequired: z.boolean(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { type, value } = input;

            // Check if contact method already exists
            const existingContactMethod = await getContactMethodByValue(type, value);
            if (existingContactMethod) {
                // Check if this profile already owns this contact method
                const ownsContactMethod = await checkProfileContactMethodRelationship(
                    profile.did,
                    existingContactMethod.id
                );

                if (ownsContactMethod) {
                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message: 'Contact method already associated with your profile',
                    });
                } else {
                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message: 'Contact method already in use by another profile',
                    });
                }
            }

            // Create new contact method (unverified)
            const contactMethod = await createContactMethod({
                type,
                value,
                isVerified: false,
                isPrimary: false,
            });

            // Create relationship with profile
            await createProfileContactMethodRelationship(profile.did, contactMethod.id);

            // Generate verification token
            const verificationToken = await generateContactMethodVerificationToken(
                contactMethod.id
            );

            // TODO: Send verification notification using notification system
            console.log(
                `Verification notification would be sent to ${value} with token: ${verificationToken}`
            );

            return {
                message: 'Contact method added. Please check for verification instructions.',
                contactMethodId: contactMethod.id,
                verificationRequired: true,
            };
        }),

    // Verify a contact method
    verifyContactMethod: profileRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/profile/contact-methods/verify',
                tags: ['Contact Methods'],
                summary: 'Verify Contact Method',
                description: 'Verify a contact method using the verification token',
            },
        })
        .input(ContactMethodVerificationValidator)
        .output(
            z.object({
                message: z.string(),
                contactMethod: ContactMethodValidator,
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { token } = input;

            // Validate token and get contact method ID
            const contactMethodId = await validateContactMethodVerificationToken(token);
            if (!contactMethodId) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Invalid or expired verification token',
                });
            }

            // Check if this profile owns this contact method
            const ownsContactMethod = await checkProfileContactMethodRelationship(
                profile.did,
                contactMethodId
            );

            if (!ownsContactMethod) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You do not own this contact method',
                });
            }

            // Mark contact method as verified
            const updatedContactMethod = await verifyContactMethod(contactMethodId);

            if (!updatedContactMethod) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to verify contact method',
                });
            }

            return {
                message: 'Contact method verified successfully.',
                contactMethod: updatedContactMethod,
            };
        }),

    // Set a primary contact method
    setPrimaryContactMethod: profileRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/profile/contact-methods/set-primary',
                tags: ['Contact Methods'],
                summary: 'Set Primary Contact Method',
                description: 'Set a contact method as the primary one for the profile',
            },
        })
        .input(SetPrimaryContactMethodValidator)
        .output(z.object({ message: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { contactMethodId } = input;

            // Check if this profile owns this contact method
            const ownsContactMethod = await checkProfileContactMethodRelationship(
                profile.did,
                contactMethodId
            );

            if (!ownsContactMethod) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You do not own this contact method',
                });
            }

            await setPrimaryContactMethod(profile.did, contactMethodId);

            return { message: 'Primary contact method set successfully.' };
        }),

    // Remove a contact method
    removeContactMethod: profileRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/profile/contact-methods/remove',
                tags: ['Contact Methods'],
                summary: 'Remove Contact Method',
                description: 'Remove a contact method from the profile',
            },
        })
        .input(z.object({ id: z.string() }))
        .output(z.object({ message: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { id } = input;

            // Check if this profile owns this contact method
            const ownsContactMethod = await checkProfileContactMethodRelationship(
                profile.did,
                id
            );

            if (!ownsContactMethod) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You do not own this contact method',
                });
            }

            // Delete relationship and contact method node
            await deleteProfileContactMethodRelationship(profile.did, id);
            await deleteContactMethod(id);

            return { message: 'Contact method removed successfully.' };
        }),
});

export type ContactMethodsRouter = typeof contactMethodsRouter;
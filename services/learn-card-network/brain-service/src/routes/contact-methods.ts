import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { t, profileRoute, openRoute } from '@routes';
import type { DidAuthVP } from '@routes';

import { createContactMethod } from '@accesslayer/contact-method/create';
import { getContactMethodByValue, getContactMethodById } from '@accesslayer/contact-method/read';
import { setPrimaryContactMethod, unverifyContactMethod, verifyContactMethod } from '@accesslayer/contact-method/update';
import { deleteContactMethod } from '@accesslayer/contact-method/delete';
import { createProfileContactMethodRelationship } from '@accesslayer/contact-method/relationships/create';
import {
    checkProfileContactMethodRelationship,
    getProfileContactMethodRelationships,
} from '@accesslayer/contact-method/relationships/read';
import { deleteAllProfileContactMethodRelationshipsExceptForProfileId, deleteProfileContactMethodRelationship } from '@accesslayer/contact-method/relationships/delete';
import {
    generateContactMethodVerificationToken,
    validateContactMethodVerificationToken,
} from '@helpers/contact-method.helpers';
import { getDidWebLearnCard, isTrustedLoginProviderDID } from '@helpers/learnCard.helpers';
import jwtDecode from 'jwt-decode';
import {
    ContactMethodValidator,
    ContactMethodVerificationRequestValidator,
    ContactMethodVerificationValidator,
    SetPrimaryContactMethodValidator,
    CreateContactMethodSessionValidator,
    CreateContactMethodSessionResponseValidator,
} from '@learncard/types';
import { getDeliveryService } from '@services/delivery/delivery.factory';
import { getRegistryService } from '@services/registry/registry.factory';
import { readIntegrationByPublishableKey } from '@accesslayer/integration/read';
import { isDomainWhitelisted } from '@helpers/integrations.helpers';
import { CONTACT_METHOD_SESSION_PREFIX } from '@helpers/contact-method.helpers';

export const contactMethodsRouter = t.router({
    // Get all contact methods for the authenticated profile
    getMyContactMethods: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/profile/contact-methods',
                tags: ['Contact Methods'],
                summary: 'Get My Contact Methods',
                description: 'Get all contact methods associated with the authenticated profile',
            },
            requiredScope: 'contact-methods:read',
        })
        .input(z.void())
        .output(z.array(ContactMethodValidator))
        .query(async ({ ctx }) => {
            const { profile } = ctx.user;
            return getProfileContactMethodRelationships(profile);
        }),

    // Verify a contact method using a proof-of-login VP-JWT
    verifyWithCredential: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/profile/contact-methods/verify-with-credential',
                tags: ['Contact Methods'],
                summary: 'Verify Contact Method With Credential',
                description:
                    "Verify ownership of a contact method using a cryptographically verified proof-of-login Verifiable Presentation JWT.",
            },
            requiredScope: 'contact-methods:write',
        })
        .input(
            z.object({
                proofOfLoginJwt: z.string(),
            })
        )
        .output(
            z.object({
                message: z.string(),
                contactMethod: ContactMethodValidator,
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { proofOfLoginJwt } = input;

            // 1) Cryptographically verify the VP-JWT
            const learnCard = await getDidWebLearnCard();
            const verification = await learnCard.invoke.verifyPresentation(proofOfLoginJwt, {
                proofFormat: 'jwt',
            });

            if (!verification || (verification as any).errors?.length) {
                throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid Verifiable Presentation' });
            }

            // 2) Extract challenge from the VP-JWT payload
            const decoded = jwtDecode<DidAuthVP>(proofOfLoginJwt);
            const challenge = (decoded as any)?.nonce ?? (decoded as any)?.challenge;

            const holder = decoded?.vp?.holder;
            console.log(holder, isTrustedLoginProviderDID(holder), process.env.LOGIN_PROVIDER_DID);

            if(!holder || !isTrustedLoginProviderDID(holder)) {
                throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Unauthorized holder' });
            }

            if (!challenge || typeof challenge !== 'string') {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'Missing challenge in VP-JWT' });
            }

            // 3) Validate and parse challenge: 'proof-of-login:<type>:<value>'
            if (!challenge.startsWith('proof-of-login:')) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid proof-of-login challenge' });
            }

            const parts = challenge.split(':');
            if (parts.length < 3) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'Malformed proof-of-login challenge' });
            }

            const type = parts[1] as 'email' | 'phone';
            const value = parts.slice(2).join(':');

            if (type !== 'email' && type !== 'phone') {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'Unsupported contact method type' });
            }
            if (!value) {
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'Missing contact method value' });
            }

            // 4) Find or create the contact method by value
            let contactMethod = await getContactMethodByValue(type, value);
            if (!contactMethod) {
                contactMethod = await createContactMethod({
                    type,
                    value,
                    isVerified: false,
                    isPrimary: false,
                });
            }

            // 5) Ensure the current profile owns this contact method
            const ownsContactMethod = await checkProfileContactMethodRelationship(
                profile.profileId,
                contactMethod.id
            );
            if (!ownsContactMethod) {
                await createProfileContactMethodRelationship(profile.profileId, contactMethod.id);
            }

            // 6) Make this contact method exclusive to this profile and set verified
            await deleteAllProfileContactMethodRelationshipsExceptForProfileId(
                profile.profileId,
                contactMethod.id
            );

            const updated = await verifyContactMethod(contactMethod.id);
            if (!updated) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to verify contact method',
                });
            }

            return {
                message: 'Contact method verified successfully.',
                contactMethod: updated,
            };
        }),

    // Create a session for a contact method
    createContactMethodSession: openRoute
        .meta({
            openapi: {
                protect: false,
                method: 'POST',
                path: '/contact-methods/session',
                tags: ['Contact Methods'],
                summary: 'Create Contact Method Session',
                description:
                    'Creates a short-lived claim session for the specified contact method and returns a claim URL that can be used to claim pending inbox credentials.',
            },
        })
        .input(CreateContactMethodSessionValidator)
        .output(CreateContactMethodSessionResponseValidator)
        .mutation(async ({ input }) => {
            const { contactMethod, otpChallenge } = input;

            const contactMethodId = await validateContactMethodVerificationToken(otpChallenge);
            if (!contactMethodId) {
                throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid OTP challenge' });
            }

            const contactMethodFromChallenge = await getContactMethodById(contactMethodId);
            if (!contactMethodFromChallenge) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Contact method not found' });
            }

            if (contactMethodFromChallenge.type !== contactMethod.type || contactMethodFromChallenge.value !== contactMethod.value) {
                throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid contact method' });
            }

            try {
                const learnCard = await getDidWebLearnCard();

                const sessionJwt = (await learnCard.invoke.getDidAuthVp({
                   proofFormat: 'jwt',
                   challenge: `${CONTACT_METHOD_SESSION_PREFIX}${contactMethodId}:${contactMethod.type}:${contactMethod.value}`
                })) as unknown as string;

                return { sessionJwt };
            } catch (error) {
                console.error(error);
                if (error instanceof TRPCError) throw error;
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to create inbox claim session: ' + error,
                });
            }
        }),

    // Send an OTP challenge to a contact method
    sendChallenge: openRoute
        .meta({
            openapi: {
                protect: false,
                method: 'POST',
                path: '/contact-methods/challenge',
                tags: ['Contact Methods'],
                summary: 'Send Contact Method Challenge (OTP)',
                description:
                    'Generates a 6-digit OTP and sends it to the specified contact method, caching it for short-lived verification.',
            },
        })
        .input(ContactMethodVerificationRequestValidator.extend({ configuration: z.object({ 
            publishableKey: z.string() }) }))
        .output(
            z.object({
                message: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { domain } = ctx;
            const { type, value, configuration } = input;

            const { publishableKey } = configuration;

            const integration = await readIntegrationByPublishableKey(publishableKey);
            if (!integration) throw new TRPCError({ code: 'NOT_FOUND' });   
            
            if (!isDomainWhitelisted(domain, integration.whitelistedDomains)) throw new TRPCError({ code: 'UNAUTHORIZED' });

            /**
             * Phone numbers can only be added and verified by trusted integrations
            */
            if (type === 'phone') {
                // TODO: This should be a trusted integration, not a trusted issuer
                const isTrusted = await getRegistryService().isTrusted(integration.id);
                if (!isTrusted) {
                    throw new TRPCError({
                        code: 'FORBIDDEN',
                        message: 'Sending a challenge to a phone is a feature reserved for members of the LearnCard Trusted Registry. To verify your DID, visit: https://docs.learncard.com/how-to-guides/verify-my-issuer',
                    });
                }
            }

            // Check if contact method already exists
            let contactMethodToVerify = await getContactMethodByValue(type, value);
            if (!contactMethodToVerify) {
                // Create new contact method (unverified)
                contactMethodToVerify = await createContactMethod({
                    type,
                    value,
                    isVerified: false,
                    isPrimary: false,
                });
            }

            // Generate verification token
            const verificationToken = await generateContactMethodVerificationToken(
                contactMethodToVerify.id,
                type,
                24,
                '6-digit-code'
            );

            const deliveryService = getDeliveryService(contactMethodToVerify);
            await deliveryService.send({
                contactMethod: contactMethodToVerify,
                templateId: 'contact-method-verification',
                templateModel: {
                    verificationToken,
                },
            });

            return {
                message: 'Challenge sent successfully.',
            };
        }),

    // Add a new contact method (requires verification)
    addContactMethod: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/profile/contact-methods/add',
                tags: ['Contact Methods'],
                summary: 'Add Contact Method',
                description: 'Add a new contact method to the profile (requires verification)',
            },
            requiredScope: 'contact-methods:write',
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

            /**
             * Phone numbers can only be added and verified by trusted issuers
             * TODO: Remove this check once we have a way to add progressive trust verification: i.e. 
             * Allow after verifying email, etc. with significant captcha + rate limits in place.
            */
            if (type === 'phone') {
                const isTrusted = await getRegistryService().isTrusted(profile.did);
                if (!isTrusted) {
                    throw new TRPCError({
                        code: 'FORBIDDEN',
                        message: 'Manually adding and verifying a phone is a feature reserved for members of the LearnCard Trusted Registry. To verify your DID, visit: https://docs.learncard.com/how-to-guides/verify-my-issuer',
                    });
                }
            }

            // Check if contact method already exists
            const existingContactMethod = await getContactMethodByValue(type, value);
            if (existingContactMethod?.isVerified) {
                // Check if this profile already owns this contact method
                const ownsContactMethod = await checkProfileContactMethodRelationship(
                    profile.profileId,
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
            let contactMethodToVerify = existingContactMethod;
            if (!contactMethodToVerify) {
                // Create new contact method (unverified)
                const contactMethod = await createContactMethod({
                    type,
                    value,
                    isVerified: false,
                    isPrimary: false,
                });
                contactMethodToVerify = contactMethod;
            }

            // Create relationship with profile
            await createProfileContactMethodRelationship(profile.profileId, contactMethodToVerify.id);

            // Generate verification token
            const verificationToken = await generateContactMethodVerificationToken(
                contactMethodToVerify.id,
                type
            );

            const deliveryService = getDeliveryService(contactMethodToVerify);
            await deliveryService.send({
                contactMethod: contactMethodToVerify,
                templateId: 'contact-method-verification',
                templateModel: {
                    verificationToken,
                },
            });

            return {
                message: 'Contact method added. Please check for verification instructions.',
                contactMethodId: contactMethodToVerify.id,
                verificationRequired: true,
            };
        }),

    // Verify a contact method
    verifyContactMethod: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/profile/contact-methods/verify',
                tags: ['Contact Methods'],
                summary: 'Verify Contact Method',
                description: 'Verify a contact method using the verification token',
            },
            requiredScope: 'contact-methods:write',
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
                profile.profileId,
                contactMethodId
            );

            if (!ownsContactMethod) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You do not own this contact method',
                });
            }

            // Delete all other contact method relationships for this profile
            await deleteAllProfileContactMethodRelationshipsExceptForProfileId(profile.profileId, contactMethodId);

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
                protect: true,
                method: 'POST',
                path: '/profile/contact-methods/set-primary',
                tags: ['Contact Methods'],
                summary: 'Set Primary Contact Method',
                description: 'Set a contact method as the primary one for the profile',
            },
            requiredScope: 'contact-methods:write',
        })
        .input(SetPrimaryContactMethodValidator)
        .output(z.object({ message: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { contactMethodId } = input;

            // Check if this profile owns this contact method
            const ownsContactMethod = await checkProfileContactMethodRelationship(
                profile.profileId,
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
                protect: true,
                method: 'POST',
                path: '/profile/contact-methods/remove',
                tags: ['Contact Methods'],
                summary: 'Remove Contact Method',
                description: 'Remove a contact method from the profile',
            },
            requiredScope: 'contact-methods:delete',
        })
        .input(z.object({ id: z.string() }))
        .output(z.object({ message: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { id } = input;

            // Check if this profile owns this contact method
            const ownsContactMethod = await checkProfileContactMethodRelationship(
                profile.profileId,
                id
            );

            if (!ownsContactMethod) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You do not own this contact method',
                });
            }

            // Delete relationship and contact method node
            await deleteProfileContactMethodRelationship(profile.profileId, id);
            try {
                await deleteContactMethod(id);
            } catch (e) {
                console.error(e);
                await unverifyContactMethod(id);
            }

            return { message: 'Contact method removed successfully.' };
        }),
});

export type ContactMethodsRouter = typeof contactMethodsRouter;
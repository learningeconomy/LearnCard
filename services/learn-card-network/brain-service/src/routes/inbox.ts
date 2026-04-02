import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { t, profileRoute, openRoute, verifiedContactRoute } from '@routes';
import {
    PaginationOptionsValidator,
    IssueInboxCredentialValidator,
    IssueInboxCredentialResponseValidator,
    InboxCredentialValidator,
    PaginatedInboxCredentialsValidator,
    InboxCredentialQueryValidator,
    ContactMethodQueryValidator,
    ClaimInboxCredentialValidator,
    LCNNotificationTypeEnumValidator,
    VCValidator,
    UnsignedVC,
} from '@learncard/types';
import { claimIntoInbox, issueToInbox } from '@helpers/inbox.helpers';
import { prepareCredentialFromBoost, getBoostUri } from '@helpers/boost.helpers';
import { hasMustacheVariables, renderBoostTemplate, parseRenderedTemplate } from '@helpers/template.helpers';
import { getProfileByVerifiedContactMethod } from '@accesslayer/contact-method/relationships/read';
import { getBoostByUri, getBoostsForProfile } from '@accesslayer/boost/read';
import {
    generateGuardianApprovalToken,
    generateGuardianApprovalUrl,
    validateGuardianApprovalTokenDetailed,
    markGuardianApprovalTokenAsUsed,
} from '@helpers/guardian-approval.helpers';
import { getDeliveryService } from '@services/delivery/delivery.factory';
import { getInboxCredentialsForProfile } from '@accesslayer/inbox-credential/read';
import { readIntegrationByPublishableKey } from '@accesslayer/integration/read';
import {
    getPrimarySigningAuthorityForListing,
    getSigningAuthoritiesForListingByName,
    getPrimarySigningAuthorityForIntegration,
    getPrimarySigningAuthorityForUser,
} from '@accesslayer/signing-authority/relationships/read';
import { getOwnerProfileForIntegration } from '@accesslayer/integration/relationships/read';
import {
    readAppStoreListingById,
    readAppStoreListingBySlug,
    getListingsForIntegration,
} from '@accesslayer/app-store-listing/read';
import { getIntegrationForListing } from '@accesslayer/app-store-listing/relationships/read';
import { isDomainWhitelisted } from '@helpers/integrations.helpers';
import { getContactMethodsForProfile } from '@accesslayer/contact-method/read';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import { updateProfile } from '@accesslayer/profile/update';
import { addNotificationToQueue } from '@helpers/notifications.helpers';
import { logCredentialSent } from '@helpers/activity.helpers';
import { finalizeInboxCredentialsForProfile } from '@helpers/finalize-inbox.helpers';

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
                    branding: ctx.tenant.emailBranding,
                    // messageStream: 'guardian-approval',
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
        .mutation(async ({ input, ctx }) => {
            const { token } = input;

            // Validate token with detailed result
            const validation = await validateGuardianApprovalTokenDetailed(token);
            if (!validation.valid) {
                const errorMessages = {
                    invalid:
                        'Invalid approval token. The token may not exist or has been corrupted.',
                    expired:
                        'This approval token has expired. Please request a new approval email.',
                    already_used: 'This approval token has already been used.',
                };
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: errorMessages[validation.reason],
                });
            }

            // Fetch requester profile and mark approved
            const requester = await getProfileByProfileId(validation.data.requesterProfileId);
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

                // Send email notification to the approved user
                const contactMethods = await getContactMethodsForProfile(requester.did);
                const emailContact =
                    contactMethods.find(cm => cm.type === 'email' && cm.isVerified) ||
                    contactMethods.find(cm => cm.type === 'email');

                if (emailContact) {
                    try {
                        const deliveryService = getDeliveryService({
                            type: 'email',
                            value: emailContact.value,
                        });
                        await deliveryService.send({
                            contactMethod: { type: 'email', value: emailContact.value },
                            templateId: 'account-approved-email',
                            templateModel: {
                                user: {
                                    displayName: requester.displayName,
                                    profileId: requester.profileId,
                                },
                            },
                            branding: ctx.tenant.emailBranding,
                        });
                    } catch (emailError) {
                        // Log error but don't fail the approval
                        console.error('Failed to send account approval email:', emailError);
                    }
                }
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
        .query(async ({ input, ctx }) => {
            const { token } = input;

            // Validate token with detailed result
            const validation = await validateGuardianApprovalTokenDetailed(token);
            if (!validation.valid) {
                const errorMessages = {
                    invalid:
                        'Invalid approval token. The token may not exist or has been corrupted.',
                    expired:
                        'This approval token has expired. Please request a new approval email.',
                    already_used: 'This approval token has already been used.',
                };
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: errorMessages[validation.reason],
                });
            }

            const requester = await getProfileByProfileId(validation.data.requesterProfileId);
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

                // Send email notification to the approved user
                const contactMethods = await getContactMethodsForProfile(requester.did);
                const emailContact =
                    contactMethods.find(cm => cm.type === 'email' && cm.isVerified) ||
                    contactMethods.find(cm => cm.type === 'email');

                if (emailContact) {
                    try {
                        const deliveryService = getDeliveryService({
                            type: 'email',
                            value: emailContact.value,
                        });
                        await deliveryService.send({
                            contactMethod: { type: 'email', value: emailContact.value },
                            templateId: 'account-approved-email',
                            templateModel: {
                                user: {
                                    displayName: requester.displayName,
                                    profileId: requester.profileId,
                                },
                            },
                            branding: ctx.tenant.emailBranding,
                        });
                    } catch (emailError) {
                        // Log error but don't fail the approval
                        console.error('Failed to send account approval email:', emailError);
                    }
                }
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
                    "Issue a credential to a recipient's inbox. If the recipient exists with a verified email, the credential is auto-delivered. Supports either a credential object or a templateUri to resolve the credential from a boost template.",
            },
            requiredScope: 'inbox:write',
        })
        .input(IssueInboxCredentialValidator)
        .output(IssueInboxCredentialResponseValidator)
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;
            const { recipient, credential: inputCredential, templateUri, configuration } = input;

            // Resolve credential from templateUri if provided
            let credential = inputCredential;
            let resolvedBoostUri: string | undefined;

            if (templateUri && !credential) {
                const boostInstance = await getBoostByUri(templateUri);

                if (!boostInstance) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: `Boost not found: ${templateUri}`,
                    });
                }

                if (!boostInstance.dataValues.boost) {
                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message: `Boost does not contain a credential template: ${templateUri}`,
                    });
                }

                try {
                    // Use shared helper to prepare credential with templateData rendering,
                    // issuance date, boostId injection, and OBv3 alignments
                    resolvedBoostUri = getBoostUri(boostInstance.id, ctx.domain);

                    credential = await prepareCredentialFromBoost(
                        boostInstance,
                        resolvedBoostUri,
                        ctx.domain,
                        { templateData: configuration?.templateData as Record<string, unknown> }
                    );
                } catch (e) {
                    console.error('Failed to prepare boost credential', e);
                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message: `Failed to prepare boost credential template: ${templateUri}`,
                    });
                }
            }

            if (!credential) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Either credential or templateUri must be provided',
                });
            }

            // Normalize signing authority name if provided
            const normalizedConfiguration = configuration?.signingAuthority
                ? {
                      ...configuration,
                      signingAuthority: {
                          ...configuration.signingAuthority,
                          name: configuration.signingAuthority.name.toLowerCase(),
                      },
                  }
                : configuration;

            try {
                const result = await issueToInbox(
                    profile,
                    recipient,
                    credential,
                    normalizedConfiguration,
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
            },
        })
        .input(ClaimInboxCredentialValidator)
        .output(
            z.object({
                inboxCredential: InboxCredentialValidator,
                status: z.string(),
                recipientDid: z.string().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const { contactMethod, domain } = ctx;
            const { credential, configuration } = input;

            if (!credential)
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Credential not found' });

            if (!configuration)
                throw new TRPCError({ code: 'BAD_REQUEST', message: 'Configuration is required' });
            const { publishableKey } = configuration;

            const integration = await readIntegrationByPublishableKey(publishableKey);
            if (!integration)
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Integration not found' });

            if (!isDomainWhitelisted(domain, integration.whitelistedDomains))
                throw new TRPCError({ code: 'UNAUTHORIZED' });

            const { listingId, listingSlug } = configuration;
            let listing = null;

            if (listingId || listingSlug) {
                listing = listingId
                    ? await readAppStoreListingById(listingId)
                    : await readAppStoreListingBySlug(listingSlug || '');

                if (!listing)
                    throw new TRPCError({ code: 'NOT_FOUND', message: 'Listing not found' });

                const listingIntegration = await getIntegrationForListing(listing.listing_id);
                if (!listingIntegration || listingIntegration.id !== integration.id) {
                    throw new TRPCError({
                        code: 'UNAUTHORIZED',
                        message: 'Listing is not associated with this integration',
                    });
                }
            } else {
                const listings = await getListingsForIntegration(integration.id, { limit: 2 });
                if (listings.length === 1) {
                    listing = listings[0] ?? null;
                }
                // 0 or >1 listings: listing stays null, fall through to SA fallback
            }

            let signingAuthorityRel;

            if (listing) {
                signingAuthorityRel = configuration?.signingAuthorityName
                    ? (
                          await getSigningAuthoritiesForListingByName(
                              listing,
                              configuration.signingAuthorityName.toLowerCase()
                          )
                      ).at(0)
                    : await getPrimarySigningAuthorityForListing(listing);
            }

            if (!signingAuthorityRel) {
                signingAuthorityRel = await getPrimarySigningAuthorityForIntegration(integration.id);
            }

            if (!signingAuthorityRel) {
                const owner = await getOwnerProfileForIntegration(integration.id);
                if (owner) {
                    signingAuthorityRel = await getPrimarySigningAuthorityForUser(owner);
                }
            }

            if (!signingAuthorityRel)
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Signing Authority not found' });

            const issuerProfile = await getOwnerProfileForIntegration(integration.id);
            if (!issuerProfile)
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Issuer Profile not found' });

            // If credential is a name reference (no @context), resolve the boost template by name
            let resolvedCredential = credential;
            if (!(credential as any)['@context'] && (credential as any).name) {
                const matchingBoosts = await getBoostsForProfile(issuerProfile, {
                    limit: 1,
                    query: {
                        name: (credential as any).name,
                        meta: { integrationId: integration.id },
                    },
                });

                if (!matchingBoosts.length) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: `No template found with name "${(credential as any).name}" for this integration`,
                    });
                }

                try {
                    resolvedCredential = JSON.parse(matchingBoosts[0]!.boost);
                } catch {
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'Failed to parse credential template',
                    });
                }
            }

            // Render Mustache template variables in the credential (e.g. {{Recipient_name}})
            const credentialJson = JSON.stringify(resolvedCredential);
            if (hasMustacheVariables(credentialJson)) {
                const recipientProfile = await getProfileByVerifiedContactMethod(
                    contactMethod.type,
                    contactMethod.value
                );
                const templateData: Record<string, string> = {
                    Recipient_name: recipientProfile?.displayName || contactMethod.value,
                    recipient_name: recipientProfile?.displayName || contactMethod.value,
                    Recipient_email: contactMethod.value,
                    recipient_email: contactMethod.value,
                };
                const rendered = renderBoostTemplate(credentialJson, templateData);
                resolvedCredential = parseRenderedTemplate(rendered);
            }

            // Log initial activity so embed claims appear in the dashboard
            const activityId = await logCredentialSent({
                actorProfileId: issuerProfile.profileId,
                recipientType: contactMethod.type as 'email' | 'phone',
                recipientIdentifier: contactMethod.value,
                integrationId: integration.id,
                source: 'claim',
                metadata: { templateName: (resolvedCredential as any)?.name },
            });

            // Claim Credential into Contact Method's inbox
            const result = await claimIntoInbox(
                issuerProfile,
                signingAuthorityRel,
                contactMethod,
                resolvedCredential as UnsignedVC,
                {
                    expiresInDays: 720,
                    integrationId: integration.id,
                    activityId,
                },
                ctx,
                listing?.slug
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
                description:
                    'Sign and issue all pending inbox credentials for verified contact methods of the authenticated profile',
            },
            requiredScope: 'inbox:write',
        })
        .input(z.object({}).default({}))
        .output(
            z.object({
                processed: z.number(),
                claimed: z.number(),
                errors: z.number(),
                verifiableCredentials: z.array(VCValidator),
            })
        )
        .mutation(async ({ ctx }) => {
            const { profile } = ctx.user;
            return finalizeInboxCredentialsForProfile(profile, ctx.domain);
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
            }).default({ limit: 25 })
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

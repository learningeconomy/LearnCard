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
    // For finalize flow
    LCNNotificationTypeEnumValidator,
    LCNInboxStatusEnumValidator,
    VC,
    VCValidator,
    UnsignedVC,
} from '@learncard/types';
import { claimIntoInbox, issueToInbox } from '@helpers/inbox.helpers';
import { prepareCredentialFromBoost, getBoostUri } from '@helpers/boost.helpers';
import { getBoostByUri } from '@accesslayer/boost/read';
import {
    generateGuardianApprovalToken,
    generateGuardianApprovalUrl,
    validateGuardianApprovalTokenDetailed,
    markGuardianApprovalTokenAsUsed,
} from '@helpers/guardian-approval.helpers';
import { getDeliveryService } from '@services/delivery/delivery.factory';
import {
    getAcceptedPendingInboxCredentialsForContactMethodId,
    getInboxCredentialsForProfile,
} from '@accesslayer/inbox-credential/read';
import { readIntegrationByPublishableKey } from '@accesslayer/integration/read';
import {
    getPrimarySigningAuthorityForListing,
    getSigningAuthoritiesForListingByName,
    getSigningAuthorityForUserByName,
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
import { getProfileByDid, getProfileByProfileId } from '@accesslayer/profile/read';
import { updateProfile } from '@accesslayer/profile/update';
import {
    markInboxCredentialAsIsAccepted,
    markInboxCredentialAsIssued,
} from '@accesslayer/inbox-credential/update';
import { createClaimedRelationship } from '@accesslayer/inbox-credential/relationships/create';
import { issueCredentialWithSigningAuthority } from '@helpers/signingAuthority.helpers';
import { addNotificationToQueue } from '@helpers/notifications.helpers';
import { getLearnCard } from '@helpers/learnCard.helpers';
import { logCredentialClaimed, logCredentialFailed } from '@helpers/activity.helpers';

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
        .mutation(async ({ input }) => {
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
        .query(async ({ input }) => {
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
                if (!listings.length) {
                    throw new TRPCError({
                        code: 'NOT_FOUND',
                        message: 'No listings found for this integration',
                    });
                }
                if (listings.length > 1) {
                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message:
                            'Multiple listings found. Provide listingId or listingSlug in configuration.',
                    });
                }
                listing = listings[0] ?? null;
            }

            if (!listing) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Listing not found' });
            }

            const signingAuthorityRel = configuration?.signingAuthorityName
                ? (
                      await getSigningAuthoritiesForListingByName(
                          listing,
                          configuration.signingAuthorityName.toLowerCase()
                      )
                  ).at(0)
                : await getPrimarySigningAuthorityForListing(listing);

            if (!signingAuthorityRel)
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Signing Authority not found' });

            const issuerProfile = await getOwnerProfileForIntegration(integration.id);
            if (!issuerProfile)
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Issuer Profile not found' });

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

            // Get verified contact methods for this profile
            const contactMethods = await getContactMethodsForProfile(profile.did);
            const verifiedContacts = contactMethods.filter(cm => cm.isVerified);

            let processed = 0;
            let claimed = 0;
            let errors = 0;

            // Preload LC DID for webhooks
            let lcDid: string | null = null;
            try {
                const lc = await getLearnCard();
                lcDid = lc.id.did();
            } catch {}

            const verifiableCredentials: VC[] = [];

            for (const cm of verifiedContacts) {
                const pending = await getAcceptedPendingInboxCredentialsForContactMethodId(cm.id);
                for (const inboxCredential of pending) {
                    processed += 1;
                    try {
                        let finalCredential: VC;

                        if (!inboxCredential.isSigned) {
                            const unsignedCredential = JSON.parse(
                                inboxCredential.credential
                            ) as UnsignedVC;

                            const endpoint =
                                (inboxCredential.signingAuthority?.endpoint as string) ?? undefined;
                            const name =
                                (inboxCredential.signingAuthority?.name as string) ?? undefined;
                            if (!endpoint || !name)
                                throw new Error('Inbox credential missing signing authority info');

                            const issuerProfile = await getProfileByDid(inboxCredential.issuerDid);
                            if (!issuerProfile) throw new Error('Issuer profile not found');

                            const signingAuthorityForUser = await getSigningAuthorityForUserByName(
                                issuerProfile,
                                endpoint,
                                name
                            );
                            if (!signingAuthorityForUser)
                                throw new Error('Signing authority not found');

                            // Set subject DID to the authenticated user's DID
                            if (Array.isArray(unsignedCredential.credentialSubject)) {
                                unsignedCredential.credentialSubject =
                                    unsignedCredential.credentialSubject.map(sub => ({
                                        ...sub,
                                        id: (sub as any).did || (sub as any).id || profile.did,
                                    }));
                            } else {
                                (unsignedCredential.credentialSubject as any).id =
                                    (unsignedCredential as any).credentialSubject?.did ||
                                    (unsignedCredential as any).credentialSubject?.id ||
                                    profile.did;
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
                        } else {
                            finalCredential = JSON.parse(inboxCredential.credential) as VC;
                        }

                        await markInboxCredentialAsIssued(inboxCredential.id);
                        await markInboxCredentialAsIsAccepted(inboxCredential.id);
                        await createClaimedRelationship(
                            profile.profileId,
                            inboxCredential.id,
                            'finalize'
                        );

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

                        // Log credential activity for inbox claim - chain to original activityId
                        await logCredentialClaimed({
                            activityId: inboxCredential.activityId || undefined,
                            actorProfileId: profile.profileId,
                            recipientType: cm.type as 'email' | 'phone',
                            recipientIdentifier: cm.value,
                            recipientProfileId: profile.profileId,
                            inboxCredentialId: inboxCredential.id,
                            boostUri: inboxCredential.boostUri || undefined,
                            source: 'inbox',
                        });

                        claimed += 1;
                        verifiableCredentials.push(finalCredential);
                    } catch (error) {
                        console.error(
                            `Failed to finalize inbox credential ${inboxCredential.id}:`,
                            error
                        );

                        // Log FAILED activity - chain to original activityId/integrationId if available
                        try {
                            await logCredentialFailed({
                                activityId: inboxCredential.activityId || undefined,
                                actorProfileId: profile.profileId,
                                recipientType: cm.type as 'email' | 'phone',
                                recipientIdentifier: cm.value,
                                recipientProfileId: profile.profileId,
                                boostUri: inboxCredential.boostUri || undefined,
                                integrationId: (inboxCredential as any).integrationId || undefined,
                                source: 'claimLink',
                                metadata: {
                                    error: error instanceof Error ? error.message : 'Unknown error',
                                },
                            });
                        } catch (logError) {
                            console.error('Failed to log credential failed activity:', logError);
                        }

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
                                        body:
                                            error instanceof Error
                                                ? error.message
                                                : `${cm.value} failed to claim a credential from their inbox.`,
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

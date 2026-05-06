import { TRPCError } from '@trpc/server';
import {
    VC,
    UnsignedVC,
    LCNNotificationTypeEnumValidator,
    LCNInboxStatusEnumValidator,
    VP,
    ContactMethodQueryType,
    InboxCredentialType,
    IssueInboxCredentialType,
    IssueInboxSigningAuthority,
} from '@learncard/types';

import { ProfileType, SigningAuthorityForUserType } from 'types/profile';
import { createInboxCredential } from '@accesslayer/inbox-credential/create';
import { markInboxCredentialAsIssued } from '@accesslayer/inbox-credential/update';
import { Context } from '@routes';
import { getAppDidWeb } from '@helpers/did.helpers';
import {
    createDeliveredRelationship,
    createEmailSentRelationship,
} from '@accesslayer/inbox-credential/relationships/create';
import {
    getContactMethodByValue,
    getContactMethodsForProfile,
} from '@accesslayer/contact-method/read';
import { createContactMethod } from '@accesslayer/contact-method/create';
import { getProfileByVerifiedContactMethod } from '@accesslayer/contact-method/relationships/read';
import { getProfileByContactMethod } from '@accesslayer/contact-method/read';
import { doesProfileManageProfile } from '@accesslayer/profile-manager/relationships/read';
import { getProfilesThatManageAProfile } from '@accesslayer/profile/relationships/read';
import { getProfileForInboxCredential } from '@accesslayer/inbox-credential/read';
import { sendCredential } from '@helpers/credential.helpers';
import { sendBoost } from '@helpers/boost.helpers';
import { getBoostByUri } from '@accesslayer/boost/read';
import { issueCredentialWithSigningAuthority } from '@helpers/signingAuthority.helpers';
import { getSigningAuthorityForUserByName } from '@accesslayer/signing-authority/relationships/read';
import { generateInboxClaimToken, generateClaimUrl } from '@helpers/contact-method.helpers';
import { getDeliveryService } from '@services/delivery/delivery.factory';
import {
    generateGuardianCredentialApprovalToken,
    generateGuardianCredentialApprovalUrl,
} from '@helpers/guardian-approval.helpers';
import { addNotificationToQueue } from '@helpers/notifications.helpers';
import { logCredentialDelivered } from '@helpers/activity.helpers';
import { getLearnCard } from '@helpers/learnCard.helpers';
import { getPrimarySigningAuthorityForUser } from '@accesslayer/signing-authority/relationships/read';
import { getRegistryService } from '@services/registry/registry.factory';

export const verifyCredentialCanBeSigned = async (credential: UnsignedVC): Promise<boolean> => {
    try {
        const learnCard = await getLearnCard(undefined, true);
        const testCredential = { ...credential, issuer: learnCard.id.did() };
        await learnCard.invoke.issueCredential(testCredential);
    } catch (error) {
        console.error('[verifyCredentialCanBeSigned] Pre-flight signing failed:', error);
        return false;
    }
    return true;
};

export const claimIntoInbox = async (
    issuerProfile: ProfileType,
    signingAuthorityForUser: SigningAuthorityForUserType,
    recipient: ContactMethodQueryType,
    credential: VC | UnsignedVC | VP,
    configuration: IssueInboxCredentialType['configuration'] & {
        integrationId?: string;
        activityId?: string;
    } = {},
    ctx: Context,
    listingSlug?: string
): Promise<{
    status: 'PENDING' | 'ISSUED' | 'EXPIRED' | 'CLAIMED' | 'DELIVERED'; // DELIVERED & CLAIMED are deprecated, use ISSUED
    inboxCredential: InboxCredentialType;
    recipientDid?: string;
}> => {
    const { webhookUrl, expiresInDays, integrationId, activityId } = configuration;

    const isSigned = !!credential?.proof;

    if (!isSigned && !signingAuthorityForUser) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Unsigned credentials require a signing authority',
        });
    }

    // Check if recipient already exists with verified email
    const existingProfile = await getProfileByVerifiedContactMethod(
        recipient.type,
        recipient.value
    );

    if (existingProfile) {
        // Auto-deliver to existing user
        let finalCredential: VC;

        if (isSigned) {
            finalCredential = credential as VC;
        } else {
            // For app-based SAs (listings), use the app did:web as ownerDid
            const ownerDidOverride = listingSlug
                ? getAppDidWeb(ctx.domain, listingSlug)
                : undefined;

            finalCredential = (await issueCredentialWithSigningAuthority(
                { type: 'profile', profile: issuerProfile },
                credential as UnsignedVC,
                signingAuthorityForUser,
                ctx.domain,
                false, // don't encrypt
                ownerDidOverride
            )) as VC;
        }

        // Create inbox record for tracking
        const inboxCredential = await createInboxCredential({
            credential: JSON.stringify(finalCredential),
            isSigned: true,
            isAccepted: true,
            recipient,
            issuerProfile,
            webhookUrl,
            integrationId,
            activityId,
            expiresInDays,
        });

        return {
            status: LCNInboxStatusEnumValidator.enum.ISSUED,
            inboxCredential,
            recipientDid: existingProfile.did,
        };
    } else {
        // Store in inbox for claiming
        const inboxCredential = await createInboxCredential({
            credential: JSON.stringify(credential),
            isSigned,
            isAccepted: true,
            recipient,
            issuerProfile,
            webhookUrl,
            integrationId,
            activityId,
            signingAuthority: {
                endpoint: signingAuthorityForUser.signingAuthority.endpoint,
                name: signingAuthorityForUser.relationship.name,
                ...(listingSlug ? { listingSlug } : {}),
            },
            expiresInDays,
        });

        return {
            status: LCNInboxStatusEnumValidator.enum.PENDING,
            inboxCredential: inboxCredential,
        };
    }
};

export const issueToInbox = async (
    issuerProfile: ProfileType,
    recipient: ContactMethodQueryType,
    credential: VC | UnsignedVC | VP,
    configuration: IssueInboxCredentialType['configuration'] & {
        boostUri?: string;
        activityId?: string;
        integrationId?: string;
        guardianEmail?: string;
    } = {},
    ctx: Context
): Promise<{
    status: 'PENDING' | 'ISSUED' | 'EXPIRED' | 'DELIVERED' | 'CLAIMED'; // DELIVERED & CLAIMED are deprecated, use ISSUED
    inboxCredential: InboxCredentialType;
    claimUrl?: string;
    recipientDid?: string;
    guardianStatus?: 'AWAITING_GUARDIAN' | 'GUARDIAN_APPROVED' | 'GUARDIAN_REJECTED';
}> => {
    const {
        signingAuthority: _signingAuthority,
        webhookUrl,
        expiresInDays,
        delivery,
        boostUri,
        activityId,
        integrationId,
        guardianEmail,
    } = configuration;
    const isSigned = !!credential?.proof;
    let signingAuthority: IssueInboxSigningAuthority | undefined = _signingAuthority;

    if (recipient.type === 'phone') {
        const isTrusted = await getRegistryService().isTrusted(issuerProfile.did);
        if (!isTrusted) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message:
                    'Sending credentials via phone is a feature reserved for members of the LearnCard Trusted Registry. Email delivery is available for all issuers. To verify your issuer, visit: https://docs.learncard.com/how-to-guides/verify-my-issuer',
            });
        }
    }

    // Validate that unsigned credentials have signing authority
    if (!isSigned && !signingAuthority) {
        /**  If credential is unsigned & no signing authority provided in configuration
         * Then, try to retrieve the primary signing authority for user.
         * This is the 'default' path so users can send credentials quickly with our API
         **/
        const primary = await getPrimarySigningAuthorityForUser(issuerProfile);

        if (primary) {
            signingAuthority = {
                endpoint: primary.signingAuthority.endpoint,
                name: primary.relationship.name,
            };

            /**  If the user is relying on a primary signing authority, we should verify that the credential they submitted can be issued.
             * This check doesn't happen if the user submits a custom signing authority through configuration. We assume, in that case,
             * the user has verified that the credential can be issued. Our API cannot replicate the logic of their unknown, external service.
             * By providing this parameter, the developer explicitly takes responsibility for the signing process. We trust them and proceed.
             **/
            if (!(await verifyCredentialCanBeSigned(credential as UnsignedVC))) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message:
                        'Credential failed to pass a pre-flight issuance test. Please verify that the credential is well-formed and can be issued.',
                });
            }
        } else {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Unsigned credentials require a signing authority',
            });
        }
    }

    // Check if recipient already exists with verified email
    const existingProfile = await getProfileByVerifiedContactMethod(
        recipient.type,
        recipient.value
    );

    // Check if the recipient is a managed child (has a guardian via MANAGES relationship).
    // Managed children need guardian approval for all inbox credentials, even without explicit guardianEmail.
    const recipientManagers = existingProfile
        ? await getProfilesThatManageAProfile(existingProfile.profileId)
        : [];
    const recipientIsManaged = recipientManagers.length > 0;

    if (existingProfile && !guardianEmail && !recipientIsManaged) {
        // Auto-deliver to existing user
        let finalCredential: VC;

        if (isSigned) {
            finalCredential = credential as VC;
        } else {
            // Sign the credential using signing authority
            const signingAuthorityForUser = await getSigningAuthorityForUserByName(
                issuerProfile,
                signingAuthority!.endpoint,
                signingAuthority!.name
            );

            if (!signingAuthorityForUser) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Signing authority not found for issuer',
                });
            }

            finalCredential = (await issueCredentialWithSigningAuthority(
                { type: 'profile', profile: issuerProfile },
                credential as UnsignedVC,
                signingAuthorityForUser,
                ctx.domain,
                false // don't encrypt
            )) as VC;
        }

        // Create inbox record for tracking
        const inboxCredential = await createInboxCredential({
            credential: JSON.stringify(finalCredential),
            isSigned,
            recipient,
            issuerProfile,
            webhookUrl,
            boostUri,
            activityId,
            integrationId,
            expiresInDays,
        });

        // Send credential using appropriate helper (sendBoost handles boost tracking)
        // Pass activityId and integrationId so they're stored on the relationship for CLAIMED chaining
        if (boostUri) {
            const boost = await getBoostByUri(boostUri);
            if (boost) {
                await sendBoost({
                    from: { type: 'profile', profile: issuerProfile },
                    to: existingProfile,
                    boost,
                    credential: finalCredential,
                    domain: ctx.domain,
                    skipCertification: true,
                    activityId,
                    integrationId,
                });
            } else {
                // Fallback to sendCredential if boost not found
                await sendCredential(
                    issuerProfile,
                    existingProfile,
                    finalCredential,
                    ctx.domain,
                    undefined,
                    activityId,
                    integrationId
                );
            }
        } else {
            await sendCredential(
                issuerProfile,
                existingProfile,
                finalCredential,
                ctx.domain,
                undefined,
                activityId,
                integrationId
            );
        }

        // Mark as issued and create relationship
        await markInboxCredentialAsIssued(inboxCredential.id);

        // Log credential activity for auto-delivery
        if (activityId) {
            await logCredentialDelivered({
                activityId,
                actorProfileId: issuerProfile.profileId,
                recipientType: recipient.type as 'email' | 'phone',
                recipientIdentifier: recipient.value,
                recipientProfileId: existingProfile.profileId,
                boostUri,
                inboxCredentialId: inboxCredential.id,
                integrationId,
                source: 'send',
            });
        }

        await createDeliveredRelationship(
            issuerProfile.profileId,
            inboxCredential.id,
            existingProfile.did,
            'auto-delivery'
        );

        // Send webhook if configured
        if (webhookUrl) {
            const learnCard = await getLearnCard();
            await addNotificationToQueue({
                webhookUrl,
                type: LCNNotificationTypeEnumValidator.enum.ISSUANCE_DELIVERED,
                from: { did: learnCard.id.did() },
                to: issuerProfile,
                message: {
                    title: 'Credential Delivered to Inbox',
                    body: `${issuerProfile.displayName} sent a credential to ${recipient.type}'s inbox at ${recipient.value}!`,
                },
                data: {
                    inbox: {
                        issuanceId: inboxCredential.id,
                        status: LCNInboxStatusEnumValidator.enum.ISSUED,
                        recipient: {
                            contactMethod: recipient,
                            learnCardId: existingProfile.did,
                        },
                        timestamp: new Date().toISOString(),
                    },
                },
            });
        }

        return {
            status: LCNInboxStatusEnumValidator.enum.ISSUED,
            inboxCredential,
            recipientDid: existingProfile.did,
        };
    } else {
        // Store in inbox for claiming
        // Guardian gate if issuer specified guardianEmail OR recipient is a managed child
        const needsGuardianGate = !!guardianEmail || recipientIsManaged;
        const inboxCredential = await createInboxCredential({
            credential: JSON.stringify(credential),
            isSigned,
            recipient,
            issuerProfile,
            webhookUrl,
            boostUri,
            activityId,
            integrationId,
            signingAuthority,
            expiresInDays,
            ...(guardianEmail ? { guardianEmail } : {}),
            ...(needsGuardianGate ? { guardianStatus: 'AWAITING_GUARDIAN' as const } : {}),
        });

        // Generate claim token
        let recipientContactMethod = await getContactMethodByValue(recipient.type, recipient.value);
        if (!recipientContactMethod) {
            recipientContactMethod = await createContactMethod({
                type: recipient.type,
                value: recipient.value,
                isVerified: false,
            });
        }

        if (guardianEmail) {
            // Guardian gate: send TWO emails instead of the normal claim email
            // 1) Student: "Your guardian must approve before you can claim"
            const studentDeliveryService = getDeliveryService(recipient);
            await studentDeliveryService.send({
                contactMethod: recipient,
                templateId: 'credential-awaiting-guardian',
                templateModel: {
                    issuer: {
                        name: issuerProfile.displayName,
                        ...(delivery?.template?.model?.issuer ?? {}),
                    },
                    credential: {
                        name: (credential as any)?.name,
                        ...(delivery?.template?.model?.credential ?? {}),
                    },
                    recipient: {
                        ...(delivery?.template?.model?.recipient ?? {}),
                        ...(recipient.type === 'email' ? { email: recipient.value } : {}),
                    },
                },
                branding: ctx.tenant?.emailBranding,
                messageStream: 'universal-inbox',
            });

            // 2) Guardian: "Approval required — click to review and approve"
            const approvalToken = await generateGuardianCredentialApprovalToken(
                inboxCredential.id,
                guardianEmail
            );
            const approvalUrl = generateGuardianCredentialApprovalUrl(
                approvalToken,
                ctx.tenant?.emailBranding?.appUrl
            );

            const guardianDeliveryService = getDeliveryService({
                type: 'email',
                value: guardianEmail,
            });
            await guardianDeliveryService.send({
                contactMethod: { type: 'email', value: guardianEmail },
                templateId: 'guardian-credential-approval',
                templateModel: {
                    approvalUrl,
                    approvalToken,
                    issuer: {
                        name: issuerProfile.displayName,
                        ...(delivery?.template?.model?.issuer ?? {}),
                    },
                    credential: {
                        name: (credential as any)?.name,
                        ...(delivery?.template?.model?.credential ?? {}),
                    },
                    recipient: {
                        ...(delivery?.template?.model?.recipient ?? {}),
                        ...(recipient.type === 'email' ? { email: recipient.value } : {}),
                    },
                },
                branding: ctx.tenant?.emailBranding,
                messageStream: 'universal-inbox',
            });

            // Check if guardian already has an account with MANAGES relationship
            // If so, also send an in-app notification for faster approval
            try {
                const guardianContactMethod = await getContactMethodByValue('email', guardianEmail);
                if (guardianContactMethod) {
                    const guardianProfile = await getProfileByContactMethod(
                        guardianContactMethod.id
                    );
                    if (guardianProfile) {
                        const childProfile = await getProfileForInboxCredential(inboxCredential.id);
                        if (childProfile) {
                            const manages = await doesProfileManageProfile(
                                guardianProfile.profileId,
                                childProfile.profileId
                            );
                            if (manages) {
                                // Parse credential name for the notification
                                let credentialName: string | undefined;
                                try {
                                    credentialName =
                                        (credential as any)?.name ??
                                        (credential as any)?.credentialSubject?.achievement?.name;
                                } catch {}

                                await addNotificationToQueue({
                                    type: LCNNotificationTypeEnumValidator.enum
                                        .GUARDIAN_APPROVAL_PENDING,
                                    to: guardianProfile,
                                    from: issuerProfile,
                                    message: {
                                        title: 'Credential Approval Request',
                                        body: `${credentialName ?? 'A credential'} for ${childProfile.displayName ?? 'your student'} from ${issuerProfile.displayName}`,
                                    },
                                    data: {
                                        inboxCredentialId: inboxCredential.id,
                                        childProfileId: childProfile.profileId,
                                        childDisplayName: childProfile.displayName ?? '',
                                        credentialName: credentialName ?? '',
                                        issuerDisplayName: issuerProfile.displayName,
                                    },
                                });
                            }
                        }
                    }
                }
            } catch (err) {
                console.error('[issueToInbox] Failed to send guardian in-app notification:', err);
                // Non-critical — email path is always available as fallback
            }
        } else if (!guardianEmail && recipientIsManaged) {
            // Auto-detected managed child: look up guardian email(s) and send approval emails + in-app notifications
            try {
                const childProfile = await getProfileForInboxCredential(inboxCredential.id);

                let credentialName: string | undefined;
                try {
                    credentialName =
                        (credential as any)?.name ??
                        (credential as any)?.credentialSubject?.achievement?.name;
                } catch {}

                for (const guardianProfile of recipientManagers) {
                    // Look up guardian's verified email to send approval email
                    const guardianContactMethods = await getContactMethodsForProfile(
                        guardianProfile.did
                    );
                    const guardianVerifiedEmail = guardianContactMethods.find(
                        cm => cm.type === 'email' && cm.isVerified
                    );

                    if (guardianVerifiedEmail) {
                        // Send approval email to guardian (same flow as explicit guardianEmail)
                        const approvalToken = await generateGuardianCredentialApprovalToken(
                            inboxCredential.id,
                            guardianVerifiedEmail.value
                        );
                        const approvalUrl = generateGuardianCredentialApprovalUrl(
                            approvalToken,
                            ctx.tenant?.emailBranding?.appUrl
                        );

                        const guardianDeliveryService = getDeliveryService({
                            type: 'email',
                            value: guardianVerifiedEmail.value,
                        });
                        await guardianDeliveryService.send({
                            contactMethod: { type: 'email', value: guardianVerifiedEmail.value },
                            templateId: 'guardian-credential-approval',
                            templateModel: {
                                approvalUrl,
                                approvalToken,
                                issuer: {
                                    name: issuerProfile.displayName,
                                    ...(delivery?.template?.model?.issuer ?? {}),
                                },
                                credential: {
                                    name: (credential as any)?.name,
                                    ...(delivery?.template?.model?.credential ?? {}),
                                },
                                recipient: {
                                    ...(delivery?.template?.model?.recipient ?? {}),
                                    ...(recipient.type === 'email'
                                        ? { email: recipient.value }
                                        : {}),
                                },
                            },
                            branding: ctx.tenant?.emailBranding,
                            messageStream: 'universal-inbox',
                        });
                    }

                    // Also send in-app notification
                    await addNotificationToQueue({
                        type: LCNNotificationTypeEnumValidator.enum.GUARDIAN_APPROVAL_PENDING,
                        to: guardianProfile,
                        from: issuerProfile,
                        message: {
                            title: 'Credential Approval Request',
                            body: `${credentialName ?? 'A credential'} for ${childProfile?.displayName ?? 'your student'} from ${issuerProfile.displayName}`,
                        },
                        data: {
                            inboxCredentialId: inboxCredential.id,
                            childProfileId: childProfile?.profileId ?? '',
                            childDisplayName: childProfile?.displayName ?? '',
                            credentialName: credentialName ?? '',
                            issuerDisplayName: issuerProfile.displayName,
                        },
                    });
                }
            } catch (err) {
                console.error(
                    '[issueToInbox] Failed to send guardian notifications for managed child:',
                    err
                );
            }

            // Still send the normal claim email to the child so they know a credential arrived
            if (!delivery?.suppress) {
                const emailClaimToken = await generateInboxClaimToken(
                    recipientContactMethod.id,
                    expiresInDays ? 24 * expiresInDays : 24,
                    true
                );
                const emailClaimUrl = generateClaimUrl(emailClaimToken);
                await createEmailSentRelationship(
                    issuerProfile.did,
                    inboxCredential?.id,
                    recipient.value,
                    emailClaimToken
                );

                const deliveryService = getDeliveryService(recipient);
                const injectedTemplateFields = {
                    recipient: {
                        ...(delivery?.template?.model?.recipient ?? {}),
                        ...(recipientContactMethod
                            ? {
                                  ...(recipientContactMethod.type === 'email'
                                      ? {
                                            email: recipientContactMethod.value,
                                        }
                                      : {}),
                                  ...(recipientContactMethod.type === 'phone'
                                      ? {
                                            phone: recipientContactMethod.value,
                                        }
                                      : {}),
                              }
                            : {}),
                    },
                    issuer: {
                        name: issuerProfile.displayName,
                        ...(delivery?.template?.model?.issuer ?? {}),
                    },
                    credential: {
                        name: (credential as any)?.name,
                        ...(delivery?.template?.model?.credential ?? {}),
                    },
                };

                await deliveryService.send({
                    contactMethod: recipient,
                    templateId: delivery?.template?.id ?? 'universal-inbox',
                    templateModel: {
                        emailClaimUrl,
                        claimToken: emailClaimToken,
                        ...injectedTemplateFields,
                    },
                    branding: ctx.tenant?.emailBranding,
                    messageStream: 'universal-inbox',
                });
            }
        } else if (!delivery?.suppress) {
            const emailClaimToken = await generateInboxClaimToken(
                recipientContactMethod.id,
                expiresInDays ? 24 * expiresInDays : 24,
                true
            );
            const emailClaimUrl = generateClaimUrl(emailClaimToken);
            // Record email being sent
            await createEmailSentRelationship(
                issuerProfile.did,
                inboxCredential?.id,
                recipient.value,
                emailClaimToken
            );

            // Send claim email
            const deliveryService = getDeliveryService(recipient);
            // Only inject whitelisted template fields.
            const injectedTemplateFields = {
                recipient: {
                    ...(delivery?.template?.model?.recipient ?? {}),
                    ...(recipientContactMethod
                        ? {
                              ...(recipientContactMethod.type === 'email'
                                  ? {
                                        email: recipientContactMethod.value,
                                    }
                                  : {}),
                              ...(recipientContactMethod.type === 'phone'
                                  ? {
                                        phone: recipientContactMethod.value,
                                    }
                                  : {}),
                          }
                        : {}),
                },
                issuer: {
                    name: issuerProfile.displayName,
                    ...(delivery?.template?.model?.issuer ?? {}),
                },
                credential: {
                    name: (credential as any)?.name,
                    ...(delivery?.template?.model?.credential ?? {}),
                },
            };

            await deliveryService.send({
                contactMethod: recipient,
                templateId: delivery?.template?.id || 'universal-inbox-claim',
                templateModel: {
                    claimUrl: emailClaimUrl,
                    ...injectedTemplateFields,
                },
                branding: ctx.tenant?.emailBranding,
                messageStream: 'universal-inbox',
            });
        }

        // Send webhook if configured
        if (webhookUrl) {
            const learnCard = await getLearnCard();
            await addNotificationToQueue({
                webhookUrl,
                type: LCNNotificationTypeEnumValidator.enum.ISSUANCE_DELIVERED,
                from: { did: learnCard.id.did() },
                to: issuerProfile,
                message: {
                    title: 'Credential Delivered to Inbox',
                    body: `${issuerProfile.displayName} sent a credential to ${recipient.type}'s inbox at ${recipient.value}!`,
                },
                data: {
                    inbox: {
                        issuanceId: inboxCredential.id,
                        status: LCNInboxStatusEnumValidator.enum.PENDING,
                        recipient: {
                            contactMethod: recipient,
                        },
                        timestamp: new Date().toISOString(),
                    },
                },
            });
        }

        const claimToken = await generateInboxClaimToken(
            recipientContactMethod.id,
            expiresInDays ? 24 * expiresInDays : 24,
            false
        );
        const claimUrl = generateClaimUrl(claimToken);

        return {
            status: LCNInboxStatusEnumValidator.enum.PENDING,
            inboxCredential,
            claimUrl,
            ...(guardianEmail ? { guardianStatus: 'AWAITING_GUARDIAN' as const } : {}),
        };
    }
};

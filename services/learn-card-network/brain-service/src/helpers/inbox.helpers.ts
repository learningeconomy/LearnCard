import { TRPCError } from '@trpc/server';
import { VC, UnsignedVC, LCNNotificationTypeEnumValidator, LCNInboxStatusEnumValidator, VP, ContactMethodQueryType, InboxCredentialType, IssueInboxCredentialType, IssueInboxSigningAuthority } from '@learncard/types';

import { ProfileType } from 'types/profile';
import { createInboxCredential } from '@accesslayer/inbox-credential/create';
import { markInboxCredentialAsDelivered } from '@accesslayer/inbox-credential/update';
import { Context } from '@routes'
import { 
    createDeliveredRelationship,
    createEmailSentRelationship,
} from '@accesslayer/inbox-credential/relationships/create';
import { getContactMethodByValue } from '@accesslayer/contact-method/read';
import { createContactMethod } from '@accesslayer/contact-method/create';
import { getProfileByVerifiedContactMethod } from '@accesslayer/contact-method/relationships/read';
import { sendCredential } from '@helpers/credential.helpers';
import { issueCredentialWithSigningAuthority } from '@helpers/signingAuthority.helpers';
import { getSigningAuthorityForUserByName } from '@accesslayer/signing-authority/relationships/read';
import { generateInboxClaimToken, generateClaimUrl } from '@helpers/contact-method.helpers';
import { getDeliveryService } from '@services/delivery/delivery.factory';
import { addNotificationToQueue } from '@helpers/notifications.helpers';
import { getLearnCard } from '@helpers/learnCard.helpers';
import { getPrimarySigningAuthorityForUser } from '@accesslayer/signing-authority/relationships/read';

export const verifyCredentialCanBeSigned = async (credential: UnsignedVC): Promise<boolean> => {
    try {
        const learnCard = await getLearnCard();
        const testCredential = credential;
        testCredential.issuer = learnCard.id.did();
        await learnCard.invoke.issueCredential(testCredential);
    } catch (error) {
       return false;
    }
    return true;
}


export const issueToInbox = async (
    issuerProfile: ProfileType,
    recipient: ContactMethodQueryType,
    credential: VC | UnsignedVC | VP, 
    configuration: IssueInboxCredentialType['configuration'] = {},
    ctx: Context
): Promise<{ 
    status: 'PENDING' | 'DELIVERED' | 'CLAIMED' | 'EXPIRED'; 
    inboxCredential: InboxCredentialType;
    claimUrl?: string;
    recipientDid?: string;
}> => {
    const { signingAuthority: _signingAuthority, webhookUrl, expiresInDays, delivery } = configuration;
    

    const isSigned = !!credential?.proof;
    let signingAuthority: IssueInboxSigningAuthority | undefined = _signingAuthority;

    // Validate that unsigned credentials have signing authority
    if (!isSigned && !signingAuthority) {

        /**  If credential is unsigned & no signing authority provided in configuration
         * Then, try to retrieve the primary signing authority for user. 
         * This is the 'default' path so users can send credentials quickly with our API
         **/
        const primary = await getPrimarySigningAuthorityForUser(
            issuerProfile
        );

        if(primary) {
            signingAuthority = {
                endpoint: primary.signingAuthority.endpoint,
                name: primary.relationship.name,
            };

            /**  If the user is relying on a primary signing authority, we should verify that the credential they submitted can be issued.
             * This check doesn't happen if the user submits a custom signing authority through configuration. We assume, in that case, 
             * the user has verified that the credential can be issued. Our API cannot replicate the logic of their unknown, external service. 
             * By providing this parameter, the developer explicitly takes responsibility for the signing process. We trust them and proceed.
             **/
            if(!(await verifyCredentialCanBeSigned(credential as UnsignedVC))) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Credential failed to pass a pre-flight issuance test. Please verify that the credential is well-formed and can be issued.',
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
    const existingProfile = await getProfileByVerifiedContactMethod(recipient.type, recipient.value);

    if (existingProfile) {
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

            finalCredential = await issueCredentialWithSigningAuthority(
                issuerProfile,
                credential as UnsignedVC,
                signingAuthorityForUser,
                ctx.domain,
                false // don't encrypt
            ) as VC;
        }

        // Create inbox record for tracking
        const inboxCredential = await createInboxCredential({
            credential: JSON.stringify(finalCredential),
            isSigned,
            recipient,
            issuerProfile,
            webhookUrl,
            expiresInDays,
        });

        // Send credential directly
        await sendCredential(
            issuerProfile,
            existingProfile,
            finalCredential,
            ctx.domain // domain
        );


        // Mark as delivered and create relationship
        await markInboxCredentialAsDelivered(inboxCredential.id);
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
                        status: LCNInboxStatusEnumValidator.enum.DELIVERED,
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
            status: LCNInboxStatusEnumValidator.enum.DELIVERED,
            inboxCredential,
            recipientDid: existingProfile.did,
        };
    } else {
        // Store in inbox for claiming
        const inboxCredential = await createInboxCredential({
            credential: JSON.stringify(credential),
            isSigned,
            recipient,
            issuerProfile,
            webhookUrl,
            signingAuthority,
            expiresInDays,
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

        const claimToken = await generateInboxClaimToken(recipientContactMethod.id);
        const claimUrl = generateClaimUrl(claimToken);

        if (!delivery?.suppress) {
            // Record email being sent
            await createEmailSentRelationship(
                issuerProfile.did,
                inboxCredential?.id,
                recipient.value,
                claimToken
            );

            // Send claim email
            const deliveryService = getDeliveryService(recipient);
            // Only inject whitelisted template fields.
            const injectedTemplateFields = {
                recipient: {
                    ...(delivery?.template?.model?.recipient ?? {}),
                    ...(recipientContactMethod ? {
                        ...(recipientContactMethod.type === 'email' ? {
                            email: recipientContactMethod.value,
                        } : {}),
                        ...(recipientContactMethod.type === 'phone' ? {
                            phone: recipientContactMethod.value,
                        } : {}),
                    } : {}),
                },
                issuer: {
                    name: issuerProfile.displayName,
                    ...(delivery?.template?.model?.issuer ?? {})
                },
                credential: {
                    name: (credential as any)?.name,
                    ...(delivery?.template?.model?.credential ?? {})
                }
            }
            await deliveryService.send({
                contactMethod: recipient,
                templateId: delivery?.template?.id || 'universal-inbox-claim',
                templateModel: {
                    claimUrl,
                    issuerName: issuerProfile.profileId ?? 'An Organization',
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    credentialName: (credential as any)?.name ?? 'A Credential',
                    ...injectedTemplateFields,
                },
                messageStream: 'universal-inbox'
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
                        status: LCNInboxStatusEnumValidator.enum.DELIVERED,
                        recipient: {
                            contactMethod: recipient,
                        },
                        timestamp: new Date().toISOString(),
                    },
                },
            });
        }

        return {
            status: LCNInboxStatusEnumValidator.enum.DELIVERED,
            inboxCredential,
            claimUrl,
        };
    }
};

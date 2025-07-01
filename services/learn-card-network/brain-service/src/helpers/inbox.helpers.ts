import { TRPCError } from '@trpc/server';
import { VC, UnsignedVC, LCNNotificationTypeEnumValidator, LCNInboxStatusEnumValidator } from '@learncard/types';

import { ProfileType } from 'types/profile';
import { createInboxCredential } from '@accesslayer/inbox-credential/create';
import { markInboxCredentialAsDelivered } from '@accesslayer/inbox-credential/update';
import { Context } from '@routes'
import { 
    createDeliveredRelationship,
    createEmailSentRelationship,
    createWebhookSentRelationship,
} from '@accesslayer/inbox-credential/relationships/create';
import { getContactMethodByValue } from '@accesslayer/contact-method/read';
import { createContactMethod } from '@accesslayer/contact-method/create';
import { getProfileByVerifiedContactMethod } from '@accesslayer/contact-method/relationships/read';
import { sendCredential } from '@helpers/credential.helpers';
import { issueCredentialWithSigningAuthority } from '@helpers/signingAuthority.helpers';
import { getSigningAuthorityForUserByName } from '@accesslayer/signing-authority/relationships/read';
import { ContactMethodQueryType } from 'types/contact-method';
import { generateInboxClaimToken, generateClaimUrl } from '@helpers/contact-method.helpers';
import { InboxCredentialType, SigningAuthorityType } from 'types/inbox-credential';
import { getDeliveryService } from '@services/delivery/delivery.factory';
import { addNotificationToQueue } from '@helpers/notifications.helpers';
import { getLearnCard } from '@helpers/learnCard.helpers';

export const issueToInbox = async (
    issuerProfile: ProfileType,
    recipient: ContactMethodQueryType,
    credential: object,
    options: {
        isSigned?: boolean;
        signingAuthority?: SigningAuthorityType;
        webhookUrl?: string;
        expiresInDays?: number;
        template?: { id: string; model?: Record<string, any> };
    } = {},
    ctx: Context
): Promise<{ 
    status: 'PENDING' | 'DELIVERED'; 
    inboxCredential: InboxCredentialType;
    claimUrl?: string;
    recipientDid?: string;
}> => {
    const { isSigned = false, signingAuthority, webhookUrl, expiresInDays, template } = options;

    // Validate that unsigned credentials have signing authority
    if (!isSigned && !signingAuthority) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Unsigned credentials require a signing authority',
        });
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
            isSigned: true,
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
            status: 'DELIVERED',
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

        // Record email being sent
        await createEmailSentRelationship(
            issuerProfile.did,
            inboxCredential?.id,
            recipient.value,
            claimToken
        );

        
        // Send claim email
        const deliveryService = getDeliveryService(recipient);
        await deliveryService.send({
            contactMethod: recipient,
            templateId: template?.id || 'credential-claim',
            templateModel: {
                claimUrl,
                issuerName: issuerProfile.profileId ?? 'An Organization',
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                credentialName: (credential as any)?.name ?? 'A Credential',
                ...template?.model,
            },
        });

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
            status: 'PENDING',
            inboxCredential,
            claimUrl,
        };
    }
};

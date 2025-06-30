import { TRPCError } from '@trpc/server';
import { VC, UnsignedVC } from '@learncard/types';

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

export const issueToInbox = async (
    issuerProfile: ProfileType,
    recipient: ContactMethodQueryType,
    credential: object,
    options: {
        isSigned?: boolean;
        signingAuthority?: SigningAuthorityType;
        webhookUrl?: string;
        expiresInDays?: number;
    } = {},
    ctx: Context
): Promise<{ 
    status: 'PENDING' | 'DELIVERED'; 
    inboxCredential: InboxCredentialType;
    claimUrl?: string;
    recipientDid?: string;
}> => {
    const { isSigned = false, signingAuthority, webhookUrl, expiresInDays } = options;

    // Validate that unsigned credentials have signing authority
    if (!isSigned && !signingAuthority) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Unsigned credentials require a signing authority',
        });
    }

    // Check if recipient already exists with verified email
    const existingProfile = await getProfileByVerifiedContactMethod('email', recipient.value);

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
            issuerProfile.did,
            inboxCredential.id,
            existingProfile.did,
            'auto-delivery'
        );

        // Send webhook if configured
        if (webhookUrl) {
            await triggerWebhook(
                issuerProfile.did,
                inboxCredential.id,
                webhookUrl,
                {
                    event: 'issuance.delivered',
                    data: {
                        issuanceId: inboxCredential.id,
                        status: 'DELIVERED',
                        recipient: {
                            email: recipient.value,
                            learnCardId: existingProfile.did,
                        },
                        deliveredAt: new Date().toISOString(),
                    },
                }
            );
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
        const claimUrl = generateClaimUrl(claimToken, 'claim.learncard.com');

        // Record email being sent
        await createEmailSentRelationship(
            issuerProfile.did,
            inboxCredential?.id,
            recipient.value,
            claimToken
        );

        // TODO: Send actual email here using notification system
        //console.log(`Email would be sent to ${recipient.value} with claim URL: ${claimUrl}`);

        return {
            status: 'PENDING',
            inboxCredential,
            claimUrl,
        };
    }
};

// Note: Claim functionality is implemented in workflows route

export const triggerWebhook = async (
    issuerDid: string,
    inboxCredentialId: string,
    webhookUrl: string,
    payload: object
): Promise<void> => {
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'LearnCard-Webhook/1.0',
            },
            body: JSON.stringify(payload),
        });

        const responseText = await response.text();

        await createWebhookSentRelationship(
            issuerDid,
            inboxCredentialId,
            webhookUrl,
            response.status.toString(),
            responseText.slice(0, 1000) // Limit response size
        );

        if (!response.ok) {
            console.error(`Webhook failed: ${response.status} ${responseText}`);
        }
    } catch (error) {
        console.error('Webhook error:', error);
        await createWebhookSentRelationship(
            issuerDid,
            inboxCredentialId,
            webhookUrl,
            'error',
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
};
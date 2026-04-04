import {
    LCNNotificationTypeEnumValidator,
    LCNInboxStatusEnumValidator,
    VC,
    UnsignedVC,
} from '@learncard/types';
import { ProfileType } from 'types/profile';
import { getContactMethodsForProfile } from '@accesslayer/contact-method/read';
import { getAcceptedPendingInboxCredentialsForContactMethodId } from '@accesslayer/inbox-credential/read';
import { getProfileByDid } from '@accesslayer/profile/read';
import { getSigningAuthorityForUserByName } from '@accesslayer/signing-authority/relationships/read';
import {
    markInboxCredentialAsIsAccepted,
    markInboxCredentialAsIssued,
} from '@accesslayer/inbox-credential/update';
import { createClaimedRelationship } from '@accesslayer/inbox-credential/relationships/create';
import { issueCredentialWithSigningAuthority } from '@helpers/signingAuthority.helpers';
import { getAppDidWeb } from '@helpers/did.helpers';
import { addNotificationToQueue } from '@helpers/notifications.helpers';
import { getLearnCard } from '@helpers/learnCard.helpers';
import { logCredentialClaimed, logCredentialFailed } from '@helpers/activity.helpers';

export async function finalizeInboxCredentialsForProfile(
    profile: ProfileType,
    domain: string
): Promise<{ processed: number; claimed: number; errors: number; verifiableCredentials: VC[] }> {
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
            // Skip credentials still awaiting or rejected by a guardian
            if (
                inboxCredential.guardianStatus === 'AWAITING_GUARDIAN' ||
                inboxCredential.guardianStatus === 'GUARDIAN_REJECTED'
            ) {
                continue;
            }

            processed += 1;

            // Look up the sender/issuer profile outside try/catch so it's
            // available for activity logging in both success and failure paths
            let senderProfile;
            try {
                senderProfile = await getProfileByDid(inboxCredential.issuerDid);
            } catch (error) {
                console.warn(
                    `Failed to fetch sender profile for DID ${inboxCredential.issuerDid}:`,
                    error
                );
                senderProfile = null;
            }

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

                    // For app-based SAs (listings), use the app did:web as ownerDid
                    const listingSlug = (inboxCredential.signingAuthority as any)
                        ?.listingSlug as string | undefined;
                    const ownerDidOverride = listingSlug
                        ? getAppDidWeb(domain, listingSlug)
                        : undefined;

                    finalCredential = (await issueCredentialWithSigningAuthority(
                        issuerProfile,
                        unsignedCredential,
                        signingAuthorityForUser,
                        domain,
                        false,
                        ownerDidOverride
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
                // Use the issuer's profileId as actorProfileId so the CLAIMED event
                // appears in the sender's activity chain alongside the original CREATED event
                if (senderProfile) {
                    await logCredentialClaimed({
                        activityId: inboxCredential.activityId || undefined,
                        actorProfileId: senderProfile.profileId,
                        recipientType: cm.type as 'email' | 'phone',
                        recipientIdentifier: cm.value,
                        recipientProfileId: profile.profileId,
                        inboxCredentialId: inboxCredential.id,
                        boostUri: inboxCredential.boostUri || undefined,
                        integrationId: (inboxCredential as any).integrationId || undefined,
                        source: 'inbox',
                    });
                }

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
                        actorProfileId: senderProfile?.profileId || profile.profileId,
                        recipientType: cm.type as 'email' | 'phone',
                        recipientIdentifier: cm.value,
                        recipientProfileId: profile.profileId,
                        boostUri: inboxCredential.boostUri || undefined,
                        integrationId: inboxCredential.integrationId || undefined,
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
}

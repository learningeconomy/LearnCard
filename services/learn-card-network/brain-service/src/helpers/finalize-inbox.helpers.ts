import { finalizeInboxRefresh } from './inbox-refresh.helpers';
import {
    LCNNotificationTypeEnumValidator,
    LCNInboxStatusEnumValidator,
    VC,
    JWE,
    UnsignedVC,
    VCValidator,
    JWEValidator,
} from '@learncard/types';
import { ProfileType } from 'types/profile';
import { getContactMethodsForProfile } from '@accesslayer/contact-method/read';
import { getAcceptedPendingInboxCredentialsForContactMethodId } from '@accesslayer/inbox-credential/read';
import { getProfileByDid } from '@accesslayer/profile/read';
import { getSigningAuthorityForUserByName } from '@accesslayer/signing-authority/relationships/read';
import { finalizeAndWipeInboxCredential } from '@accesslayer/inbox-credential/update';
import { createClaimedRelationship } from '@accesslayer/inbox-credential/relationships/create';
import { issueCredentialWithSigningAuthority } from '@helpers/signingAuthority.helpers';
import { getAppDidWeb } from '@helpers/did.helpers';
import { addNotificationToQueue } from '@helpers/notifications.helpers';
import { getNotificationMessage } from '@helpers/notificationMessages';
import { resolveRecipientLocale } from '@helpers/getRecipientLocale.helpers';
import { getLearnCard, getEmptyLearnCard } from '@helpers/learnCard.helpers';
import { logCredentialClaimed, logCredentialFailed } from '@helpers/activity.helpers';
import { handleConnectionPromptsForCredentialClaim } from '@helpers/connectionPrompt.helpers';
import { decryptInboxCredential } from '@helpers/inbox-encryption.helpers';
import { setCredentialSubjectIds } from '@helpers/credentialSubject.helpers';
import { getBitstringStatusListEntries, isEncrypted } from '@learncard/helpers';
import type { IssuedCredential } from 'types/credential';
import { getBoostByUri } from '@accesslayer/boost/read';
import { storeCredential } from '@accesslayer/credential/create';
import { createBoostInstanceOfRelationship } from '@accesslayer/boost/relationships/create';
import {
    createSentCredentialRelationship,
    createReceivedCredentialRelationship,
} from '@accesslayer/credential/relationships/create';

export async function finalizeInboxCredentialsForProfile(
    profile: ProfileType,
    domain: string
): Promise<{
    processed: number;
    claimed: number;
    errors: number;
    guardianPending: number;
    verifiableCredentials: (VC | JWE)[];
    deliveries: { id: string; credential: VC | JWE }[];
}> {
    const contactMethods = await getContactMethodsForProfile(profile.did);
    const verifiedContacts = contactMethods.filter(cm => cm.isVerified);

    let processed = 0;
    let claimed = 0;
    let errors = 0;
    let guardianPending = 0;

    // Preload LC DID for webhooks
    let lcDid: string | null = null;
    try {
        const lc = await getLearnCard();
        lcDid = lc.id.did();
    } catch {}

    const verifiableCredentials: (VC | JWE)[] = [];
    const deliveries: { id: string; credential: VC | JWE }[] = [];

    for (const cm of verifiedContacts) {
        const pending = await getAcceptedPendingInboxCredentialsForContactMethodId(cm.id);
        for (const inboxCredential of pending) {
            // Skip credentials still awaiting or rejected by a guardian
            if (
                inboxCredential.guardianStatus === 'AWAITING_GUARDIAN' ||
                inboxCredential.guardianStatus === 'GUARDIAN_REJECTED'
            ) {
                guardianPending += 1;
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
                let finalCredential: VC | JWE;
                let issued: IssuedCredential | undefined;
                const credentialPayload = inboxCredential.refreshId
                    ? undefined
                    : await decryptInboxCredential(inboxCredential.credential);

                if (inboxCredential.refreshId) {
                    finalCredential = (
                        await finalizeInboxRefresh({
                            inboxId: inboxCredential.id,
                            holderDid: profile.did,
                            holderProfile: profile,
                            domain,
                        })
                    ).credential;
                } else if (!inboxCredential.isSigned) {
                    const unsignedCredential = JSON.parse(credentialPayload!) as UnsignedVC;

                    const endpoint =
                        (inboxCredential.signingAuthority?.endpoint as string) ?? undefined;
                    const name = (inboxCredential.signingAuthority?.name as string) ?? undefined;
                    if (!endpoint || !name)
                        throw new Error('Inbox credential missing signing authority info');

                    const issuerProfile = await getProfileByDid(inboxCredential.issuerDid);
                    if (!issuerProfile) throw new Error('Issuer profile not found');

                    const signingAuthorityForUser = await getSigningAuthorityForUserByName(
                        issuerProfile,
                        endpoint,
                        name
                    );
                    if (!signingAuthorityForUser) throw new Error('Signing authority not found');

                    setCredentialSubjectIds(unsignedCredential, profile.did);

                    // Set issuer from signing authority
                    unsignedCredential.issuer = signingAuthorityForUser.relationship.did;

                    // For app-based SAs (listings), use the app did:web as ownerDid
                    const listingSlug = (inboxCredential.signingAuthority as any)?.listingSlug as
                        string | undefined;
                    const ownerDidOverride = listingSlug
                        ? getAppDidWeb(domain, listingSlug)
                        : undefined;

                    issued = await issueCredentialWithSigningAuthority(
                        { type: 'profile', profile: issuerProfile },
                        unsignedCredential,
                        signingAuthorityForUser,
                        domain,
                        undefined,
                        ownerDidOverride,
                        undefined,
                        [issuerProfile.did]
                    );
                    finalCredential = issued.credential;
                } else {
                    finalCredential = JSON.parse(credentialPayload!) as VC;
                }

                if (!inboxCredential.refreshId) {
                    if (!senderProfile) throw new Error('Issuer profile not found');
                    if (!issued || !isEncrypted(issued.credential)) {
                        const signedCredential = VCValidator.parse(finalCredential);
                        const learnCard = await getEmptyLearnCard();
                        issued = {
                            kind: 'issued-credential',
                            credential: await learnCard.invoke.createDagJwe(signedCredential, [
                                profile.did,
                                inboxCredential.issuerDid,
                            ]),
                            statusEntries:
                                issued?.statusEntries ??
                                getBitstringStatusListEntries(signedCredential),
                        };
                    }
                    const finalized = await finalizeAndWipeInboxCredential(inboxCredential.id, {
                        recipientDid: profile.did,
                        credential: JWEValidator.parse(issued.credential),
                    });
                    if (!finalized) throw new Error('Inbox credential is no longer pending');
                    finalCredential = issued.credential;
                    // Finalization already owns claim prompts and notifications. Index
                    // the accepted delivery without replaying ordinary send/accept effects.
                    const instance = await storeCredential(issued);
                    const boost = inboxCredential.boostUri
                        ? await getBoostByUri(inboxCredential.boostUri)
                        : undefined;
                    if (boost) await createBoostInstanceOfRelationship(instance, boost);
                    await createSentCredentialRelationship(
                        { type: 'profile', profile: senderProfile },
                        profile,
                        instance,
                        undefined,
                        inboxCredential.activityId,
                        inboxCredential.integrationId
                    );
                    await createReceivedCredentialRelationship(profile, senderProfile, instance);
                }

                // Only write a claim audit edge once the record is actually finalized.
                await createClaimedRelationship(profile.profileId, inboxCredential.id, 'finalize');

                if (
                    senderProfile &&
                    !(inboxCredential.signingAuthority as { listingSlug?: string } | undefined)
                        ?.listingSlug
                ) {
                    await handleConnectionPromptsForCredentialClaim({
                        claimer: profile,
                        sender: senderProfile,
                        triggerId: `inbox:${inboxCredential.id}`,
                    }).catch(() =>
                        console.error(
                            'Failed to create inbox connection prompts',
                            inboxCredential.id
                        )
                    );
                }

                // Trigger webhook if configured
                if (inboxCredential.webhookUrl) {
                    try {
                        await addNotificationToQueue({
                            webhookUrl: inboxCredential.webhookUrl,
                            type: LCNNotificationTypeEnumValidator.enum.ISSUANCE_CLAIMED,
                            from: { did: lcDid || profile.did },
                            to: { did: inboxCredential.issuerDid },
                            message: getNotificationMessage(
                                'issuanceClaimed',
                                // senderProfile is the issuer (the webhook recipient),
                                // loaded above via getProfileByDid(issuerDid); falls back
                                // to 'en' when the issuer has no LearnCard profile.
                                resolveRecipientLocale(senderProfile),
                                { value: cm.value }
                            ),
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
                    }).catch(() => console.error('Failed to log inbox claim', inboxCredential.id));
                }

                claimed += 1;
                verifiableCredentials.push(finalCredential);
                deliveries.push({ id: inboxCredential.id, credential: finalCredential });
            } catch (error) {
                console.error(`Failed to finalize inbox credential ${inboxCredential.id}:`, error);

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
                        const issuanceErrorMsg = getNotificationMessage(
                            'issuanceError',
                            resolveRecipientLocale(senderProfile),
                            { value: cm.value }
                        );
                        await addNotificationToQueue({
                            webhookUrl: inboxCredential.webhookUrl,
                            type: LCNNotificationTypeEnumValidator.enum.ISSUANCE_ERROR,
                            from: { did: lcDid || profile.did },
                            to: { did: inboxCredential.issuerDid },
                            message: {
                                title: issuanceErrorMsg.title,
                                body:
                                    error instanceof Error ? error.message : issuanceErrorMsg.body,
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

    return { processed, claimed, errors, guardianPending, verifiableCredentials, deliveries };
}

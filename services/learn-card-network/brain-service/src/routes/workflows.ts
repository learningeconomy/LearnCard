import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import base64url from 'base64url';
import { gunzipSync } from 'zlib';

import {
    VC,
    UnsignedVC,
    VP,
    VPValidator,
    VCValidator,
    UnsignedVCValidator,
    LCNNotificationTypeEnumValidator,
    LCNInboxStatusEnumValidator,
} from '@learncard/types';

import {
    assertInlineSrcSafe,
    InlineSrcUrlRejected,
    isInlineSrcDevMode,
} from '@helpers/inline-src.helpers';
import {
    reconcileAwardedByDomain,
    type VerifiedAwardedByDomain,
} from '@helpers/inline-origin.helpers';

import { t, openRoute, Context } from '@routes';

import { getBoostByUri } from '@accesslayer/boost/read';
import { getBoostOwner } from '@accesslayer/boost/relationships/read';
import { createBoostInstanceOfRelationship } from '@accesslayer/boost/relationships/create';
import { getSigningAuthorityForUserByName } from '@accesslayer/signing-authority/relationships/read';
import { storeCredential } from '@accesslayer/credential/create';
import { createSentCredentialRelationship } from '@accesslayer/credential/relationships/create';

import {
    isClaimLinkAlreadySetForBoost,
    getClaimLinkSAInfoForBoost,
    getClaimLinkGeneratorProfileId,
    useClaimLinkForBoost,
} from '@cache/claim-links';

import {
    validateInboxClaimToken,
} from '@helpers/contact-method.helpers';
import { getPendingOrIssuedInboxCredentialsForContactMethodId } from '@accesslayer/inbox-credential/read';
import { markInboxCredentialAsIsAccepted, markInboxCredentialAsIssued } from '@accesslayer/inbox-credential/update';
import { createClaimedRelationship } from '@accesslayer/inbox-credential/relationships/create';
import {
    getContactMethodById,
    getProfileByContactMethod,
} from '@accesslayer/contact-method/read';
import { getProfileByDid, getProfileByProfileId } from '@accesslayer/profile/read';

import { getBoostUri, isBoostViewableByClaimLink, isDraftBoost } from '@helpers/boost.helpers';
import { getEmptyLearnCard, getLearnCard } from '@helpers/learnCard.helpers';
import { issueCredentialWithSigningAuthority } from '@helpers/signingAuthority.helpers';
import { injectObv3AlignmentsIntoCredentialForBoost } from '@services/skills-provider/inject';
import { createProfileContactMethodRelationship } from '@accesslayer/contact-method/relationships/create';
import { verifyContactMethod } from '@accesslayer/contact-method/update';
import { addNotificationToQueue } from '@helpers/notifications.helpers';
import { logCredentialClaimed, logCredentialFailed } from '@helpers/activity.helpers';
import { EXHAUSTED, exhaustExchangeChallengeForToken, getExchangeChallengeStateForToken, setValidExchangeChallengeForToken } from '@cache/exchanges';
import { createHash, randomUUID } from 'crypto';

// Zod schema for the participate in exchange input
const participateInExchangeInput = z.object({
    localWorkflowId: z.string(),
    localExchangeId: z.string(),
    // Type 1: A body containing the VP for the challenge-response step
    verifiablePresentation: VPValidator.optional()
});

// Response schema for the initiation step (VPR)
const VerifiablePresentationRequestValidator = z.object({
    query: z.array(z.object({
        type: z.string(),
        credentialQuery: z.array(z.object({
            required: z.boolean().optional(),
            reason: z.string().optional(),
        })).optional(),
    })),
    challenge: z.string(),
    domain: z.string(),
});

const ParticipateInExchangeResponseValidator = z.object({
    verifiablePresentation: VPValidator.optional(),
    verifiablePresentationRequest: VerifiablePresentationRequestValidator.optional(),
    redirectUrl: z.string().optional(),
});

// Exchange info schema
const ExchangeInfoValidator = z.object({
    boostUri: z.string(),
    challenge: z.string(),
});

type ExchangeInfoType = z.infer<typeof ExchangeInfoValidator>;

export const workflowsRouter = t.router({
    participateInExchange: openRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/workflows/{localWorkflowId}/exchanges/{localExchangeId}',
                tags: ['Workflows', 'VC-API'],
                summary: 'Participate in an Exchange',
                description: 'VC-API endpoint for participating in credential exchanges. Supports both exchange initiation and credential claiming.',
            },
        })
        .input(participateInExchangeInput)
        .output(ParticipateInExchangeResponseValidator)
        .mutation(async ({ ctx, input }) => {
            const { localWorkflowId, localExchangeId, verifiablePresentation } = input;
            const { domain } = ctx;

            // Demonstration of VC-API workflow with redirect
            if (localWorkflowId == "redirect") {
                return {
                    redirectUrl: "https://www.learncard.com"
                }
            } 

            // Handle inbox claim workflow
            if (localWorkflowId === "inbox-claim") {
                const isInitiation = !verifiablePresentation;
                
                if (isInitiation) {
                    return handleInboxClaimInitiation(localExchangeId, domain);
                } else {
                    return handleInboxClaimPresentation(localExchangeId, verifiablePresentation, ctx);
                }
            }

            // Inline credential claim. Single workflow; the payload is auto-detected:
            //   • base64url(https://...)  → fetch from partner host
            //   • base64url(signed VC JSON) → wrap in VP and return (1-step)
            //   • base64url(unsigned VC JSON) → DIDAuth 2-step, sign bound to holder DID
            //
            // The legacy workflow IDs `inline`, `inline-unsigned`, and `inline-src` all
            // route to this handler for backward compatibility; new integrations should
            // use the single `inline` ID.
            if (INLINE_WORKFLOW_IDS.has(localWorkflowId)) {
                return handleInlineExchange(localExchangeId, verifiablePresentation, domain);
            }

            // Check if this is an initiation request (empty body) or presentation request (contains VP)
            const isInitiation = !verifiablePresentation;
            // Decode the boost URI from the base64url encoded localExchangeId because boostUris have URL-unsafe characters
            const exchangeInfo = parseExchangeInfo(localExchangeId);
            if(!exchangeInfo) { 
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Invalid exchange ID',
                });

            }

            // Demonstration of VC-API verify workflow with redirect
            if (localWorkflowId == "verify") {
                if (verifiablePresentation) {
                    return { redirectUrl: "https://www.learncard.com" }
                }
                return {
                    verifiablePresentationRequest: {
                        query: [{
                            type: 'QueryByExample',
                            credentialQuery: [{
                                required: true,
                                reason: "Please present a credential to verify your identity",
                            }],
                        }],
                        challenge: exchangeInfo.challenge,
                        domain,
                    },
                }
            }

            // If the user submitted an empty {} post request, this is an initiation of an exchange.
            if (isInitiation) {
                // Scenario 1: Exchange Initiation
                return handleExchangeInitiation(exchangeInfo, domain);
            } else {
                // If the user submitted a VP post request, this is a presentation for claim.
                // Scenario 2: Presentation for Claim
                return handlePresentationForClaim(
                    exchangeInfo,
                    verifiablePresentation,
                    domain
                );
            }
        }),
});

function parseExchangeInfo(localExchangeId: string): ExchangeInfoType | undefined {
    try {
        const exchangeInfo = JSON.parse(base64url.decode(localExchangeId)) as ExchangeInfoType;
        return exchangeInfo;
    } catch (e) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid exchange ID',
        });
    }
}

async function issueResponsePresentationWithVcs(vcs: VC[]) : Promise<VP> {
    const learnCard = await getLearnCard();
    return learnCard.invoke.issuePresentation({
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            'https://w3id.org/security/suites/ed25519-2020/v1',
        ],
        type: ['VerifiablePresentation'],
        verifiableCredential: vcs,
        holder: learnCard.id.did(),
    });
}

async function handleExchangeInitiation(
    exchangeInfo: ExchangeInfoType,
    domain: string
) {
    // Validate that the boost URI is valid and available
    const boost = await getBoostByUri(exchangeInfo.boostUri);

    if (!boost) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Exchange not found or not available for claiming',
        });
    }

    if (isDraftBoost(boost)) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Draft boosts cannot be claimed via exchange',
        });
    }

    if (!(await isBoostViewableByClaimLink(boost))) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'This boost is not currently viewable by claim link.',
        });
    }

    // Check if challenge is already in use (shouldn't happen with UUID but be safe)
    if (!await isClaimLinkAlreadySetForBoost(exchangeInfo.boostUri, exchangeInfo.challenge)) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Challenge is not valid for this boost',
        });
    }

    // Store exchange state in Redis
    // We need a default signing authority setup for this workflow
    const boostOwner = await getBoostOwner(boost);
    if (!boostOwner) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Boost owner not found',
        });
    }


    // Return VerifiablePresentationRequest
    return {
        verifiablePresentationRequest: {
            query: [{
                type: 'DIDAuthentication',
                acceptedMethods: [{method: "key"}, {method: "web"}]
            }],
            challenge: exchangeInfo.challenge,
            domain,
        },
    };
}

async function handlePresentationForClaim(
    exchangeInfo: ExchangeInfoType,
    verifiablePresentation: VP,
    domain: string
) {

    // Extract challenge from the VP (handle both single proof and proof array)
    const challenge = Array.isArray(verifiablePresentation.proof)
        ? verifiablePresentation.proof[0]?.challenge
        : verifiablePresentation.proof?.challenge;

    if (!challenge) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Verifiable presentation must include challenge in proof',
        });
    }

    if (exchangeInfo.challenge !== challenge) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Challenge mismatch',
        });
    }

    const [claimLinkSA, boost] = await Promise.all([
        getClaimLinkSAInfoForBoost(exchangeInfo.boostUri, exchangeInfo.challenge),
        getBoostByUri(exchangeInfo.boostUri),
    ]);

    if (!claimLinkSA) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Challenge not found for ${exchangeInfo.boostUri}`,
        });
    }

    if (!boost) throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost' });

    if (!(await isBoostViewableByClaimLink(boost))) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'This boost is not currently viewable by claim link.',
        });
    }

    const [boostOwner, generatorProfileId] = await Promise.all([
        getBoostOwner(boost),
        getClaimLinkGeneratorProfileId(exchangeInfo.boostUri, exchangeInfo.challenge),
    ]);

    if (!boostOwner) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost owner' });
    }

    // Use the generator's profile for SA lookup if available, fall back to boost owner
    const saOwner = generatorProfileId
        ? (await getProfileByProfileId(generatorProfileId)) ?? boostOwner
        : boostOwner;

    const signingAuthorityForUser = await getSigningAuthorityForUserByName(
        saOwner,
        claimLinkSA.endpoint,
        claimLinkSA.name
    );

    if (!signingAuthorityForUser) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Could not find signing authority for boost',
        });
    }

    // Verify the presentation
    const learnCard = await getEmptyLearnCard();
    const verificationResult = await learnCard.invoke.verifyPresentation(verifiablePresentation, {
        challenge,
        domain,
    });

    if (verificationResult.errors.length > 0 || !verificationResult.checks.includes('proof')) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Verifiable presentation verification failed',
        });
    }

    // Extract holder DID from the VP
    const holderDid = verifiablePresentation.holder;
    if (!holderDid) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Verifiable presentation must include holder DID',
        });
    }

    // TODO if there is a profile for the holder, we should use it
    /** Get the holder profile by DID
        const holderProfile = await getProfileByDid(holderDid);
        if (!holderProfile) {
            // Process holder profile if available
        }
    */


    try {
        // For VC-API workflow, we'll create the credential directly and use sendBoost
        // This avoids the complexity of signing authorities for the VC-API exchange
        const boostCredential = JSON.parse(boost.dataValues?.boost) as UnsignedVC;
        const boostURI = getBoostUri(boost.dataValues?.id, domain);

        // Ensure `type` is a non-empty array to satisfy Zod validation for the output.
        // If the boost's credential type is missing or empty, we default it.
        // We include 'BoostCredential' because the logic below for adding a `boostId` depends on it.
        if (!boostCredential.type || boostCredential.type.length === 0) {
            boostCredential.type = ['VerifiableCredential', 'BoostCredential'];
        }

        boostCredential.issuer = signingAuthorityForUser.relationship.did;

        if (Array.isArray(boostCredential.credentialSubject)) {
            boostCredential.credentialSubject = boostCredential.credentialSubject.map(subject => ({
                ...subject,
                id: subject.did || subject.id || holderDid,
            }));
        } else {
            boostCredential.credentialSubject.id = holderDid;
        }

        // Embed the boostURI into the boost credential for verification purposes.
        if (boostCredential?.type?.includes('BoostCredential')) {
            boostCredential.boostId = boostURI;
        }

        // Inject OBv3 skill alignments based on boost's framework/skills
        await injectObv3AlignmentsIntoCredentialForBoost(boostCredential, boost, domain);

        const vc = await issueCredentialWithSigningAuthority(
            saOwner,
            boostCredential,
            signingAuthorityForUser,
            domain,
            false
        ) as VC;

        // Mark the challenge as used
        await useClaimLinkForBoost(exchangeInfo.boostUri, exchangeInfo.challenge);

        const vp = await issueResponsePresentationWithVcs([vc]);

        return {
            verifiablePresentation: vp
        };

    } catch (error) {
        console.error('Failed to issue credential via VC-API exchange:', error);
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to issue credential for exchange',
        });
    }
}

async function handleInboxClaimInitiation(
    claimToken: string,
    domain: string
) {

    // Validate the claim token
    const claimTokenData = await validateInboxClaimToken(claimToken);
    if (!claimTokenData) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid or expired claim token',
        });
    }

    // Verify there are pending credentials for this contact method
    const pendingCredentials = await getPendingOrIssuedInboxCredentialsForContactMethodId(
        claimTokenData.contactMethodId
    );
    if (pendingCredentials.length === 0) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'No pending credentials found for this claim token',
        });
    }

    const exchangeDidAuthChallenge = randomUUID();
    await setValidExchangeChallengeForToken(claimTokenData.token, exchangeDidAuthChallenge);

    // Return VerifiablePresentationRequest
    return {
        verifiablePresentationRequest: {
            query: [{
                type: 'DIDAuthentication',
                acceptedMethods: [{method: "key"}, {method: "web"}]
            }],
            challenge: `${claimTokenData.token}:${exchangeDidAuthChallenge}`,
            domain,
        },
    };
}

async function handleInboxClaimPresentation(
    claimToken: string,
    verifiablePresentation: VP,
    ctx: Context
) {
    // Validate the claim token
    const claimTokenData = await validateInboxClaimToken(claimToken);
    if (!claimTokenData) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Invalid or expired claim token',
        });
    }

    const contactMethod = await getContactMethodById(claimTokenData.contactMethodId);

    if (!contactMethod) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Contact method not found',
        });
    }

    const challenge = Array.isArray(verifiablePresentation.proof) 
        ? (verifiablePresentation.proof?.length > 0 ? verifiablePresentation.proof[0]?.challenge : undefined)
        : verifiablePresentation.proof?.challenge;
    if (!challenge) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Verifiable presentation must include challenge in proof',
        });
    }
    const challengeParts = challenge.split(':');
    if (challengeParts.length !== 2 || !challengeParts[0] || !challengeParts[1]) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid challenge format',
        });
    }
    const [token, exchangeChallenge] = challengeParts;

    if (token !== claimTokenData.token) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid or expired claim token',
        });
    }

    if (!exchangeChallenge) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid exchange challenge',
        });
    }

    // VERIFY the token exists. Return {} if just exhausted. Throw error if DNE. Later, exhaust the token after using it!
    const exchangeChallengeState = await getExchangeChallengeStateForToken(token, exchangeChallenge);
    if (!exchangeChallengeState || exchangeChallengeState === EXHAUSTED) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid exchange challenge',
        });
    }

    // Verify the presentation
    const learnCard = await getEmptyLearnCard();
    const verificationResult = await learnCard.invoke.verifyPresentation(verifiablePresentation, {
        challenge,
        domain: ctx.domain,
    });

    if (verificationResult.errors.length > 0 || !verificationResult.checks.includes('proof')) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Verifiable presentation verification failed',
        });
    }

    // Extract holder DID from the VP
    const holderDid = verifiablePresentation.holder;
    if (!holderDid) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Verifiable presentation must include holder DID',
        });
    }

    let holderProfile = await getProfileByContactMethod(contactMethod.id);

    if (!holderProfile) {
        // If no profile is associated with the contact method, check if a profile exists for the presented DID
        const existingProfile = await getProfileByDid(holderDid);
        if (existingProfile) {
            // If a profile exists, link the contact method to it
            holderProfile = existingProfile;
            if (claimTokenData.autoVerifyContactMethod) {
                await createProfileContactMethodRelationship(holderProfile.profileId, contactMethod.id);
            }
        } 
    }

    // Mark the contact method as verified
    if (!contactMethod.isVerified && claimTokenData.autoVerifyContactMethod) {
        await verifyContactMethod(contactMethod.id);
    }

    // Get pending credentials for this contact method
    const pendingCredentials = await getPendingOrIssuedInboxCredentialsForContactMethodId(
        contactMethod.id
    );

    if (pendingCredentials.length === 0) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'No pending credentials found for this contact method.',
        });
    }

    const claimedCredentials: VC[] = [];

    // Process each pending credential in parallel
    const credentialProcessingPromises = pendingCredentials.map(async inboxCredential => {
        try {
            let finalCredential: VC;

            if (inboxCredential.isSigned) {
                // Credential is already signed
                finalCredential = JSON.parse(inboxCredential.credential) as VC;
            } else {
                // Need to sign the credential using signing authority
                const unsignedCredential = JSON.parse(inboxCredential.credential) as UnsignedVC;
                const inboxCredentialSigningAuthorityEndpoint = (inboxCredential.signingAuthority?.endpoint as string) ?? undefined;
                const inboxCredentialSigningAuthorityName = (inboxCredential.signingAuthority?.name as string) ?? undefined;

                if (!inboxCredentialSigningAuthorityEndpoint || !inboxCredentialSigningAuthorityName) {
                    console.error(
                        `Inbox credential ${inboxCredential.id} missing signing authority info`
                    );
                    throw new Error('Inbox credential missing signing authority info');
                }

                // Get the issuer profile and signing authority
                const issuerProfile = await getProfileByDid(inboxCredential.issuerDid);
                if (!issuerProfile) {
                    console.error(`Issuer profile not found for ${inboxCredential.issuerDid}`);
                    throw new Error('Issuer profile not found');
                }

                const signingAuthorityForUser = await getSigningAuthorityForUserByName(
                    issuerProfile,
                    inboxCredentialSigningAuthorityEndpoint,
                    inboxCredentialSigningAuthorityName
                );

                if (!signingAuthorityForUser) {
                    console.error(
                        `Signing authority not found for issuer ${inboxCredential.issuerDid}`
                    );
                    throw new Error('Signing authority not found');
                }

                // Set credential subject to claimer's DID
                if (Array.isArray(unsignedCredential.credentialSubject)) {
                    unsignedCredential.credentialSubject = unsignedCredential.credentialSubject.map(
                        subject => ({
                            ...subject,
                            id: subject.did || subject.id || holderDid,
                        })
                    );
                } else {
                    unsignedCredential.credentialSubject.id = holderDid;
                }

                // Set issuer from signing authority
                unsignedCredential.issuer = signingAuthorityForUser.relationship.did;

                // Sign the credential
                finalCredential = (await issueCredentialWithSigningAuthority(
                    issuerProfile,
                    unsignedCredential,
                    signingAuthorityForUser,
                    ctx.domain,
                    false // don't encrypt
                )) as VC;
            }

            await markInboxCredentialAsIssued(inboxCredential.id);
            await markInboxCredentialAsIsAccepted(inboxCredential.id);

            // Store credential and create boost relationship if this was a boost issuance
            const boostUri = (inboxCredential as any).boostUri as string | undefined;
            if (holderProfile && boostUri) {
                const boost = await getBoostByUri(boostUri);
                const issuerProfile = await getProfileByDid(inboxCredential.issuerDid);

                if (boost && issuerProfile) {
                    // Store the credential in the database
                    const credentialInstance = await storeCredential(finalCredential);

                    // Create the boost instance relationship
                    await createBoostInstanceOfRelationship(credentialInstance, boost);

                    // Create the sent/received credential relationship
                    await createSentCredentialRelationship(issuerProfile, holderProfile, credentialInstance);
                }
            }

            // Create claimed relationship if holder has a profile
            if (holderProfile) {
                await createClaimedRelationship(holderProfile.profileId, inboxCredential.id, claimToken);
            }

            // Log CLAIMED activity - chain to original activityId/integrationId if available
            // activityId and integrationId are stored on the inbox credential
            const activityId = inboxCredential.activityId;
            const integrationId = inboxCredential.integrationId;
            const issuerProfileForActivity = await getProfileByDid(inboxCredential.issuerDid);
            if (issuerProfileForActivity) {
                await logCredentialClaimed({
                    activityId,
                    actorProfileId: issuerProfileForActivity.profileId,
                    recipientType: contactMethod.type as 'email' | 'phone',
                    recipientIdentifier: contactMethod.value,
                    recipientProfileId: holderProfile?.profileId,
                    boostUri,
                    integrationId,
                    source: 'claimLink',
                });
            }

            // Trigger webhook if configured
            if (inboxCredential.webhookUrl) {
                const learnCard = await getLearnCard();
                await addNotificationToQueue({
                    webhookUrl: inboxCredential.webhookUrl,
                    type: LCNNotificationTypeEnumValidator.enum.ISSUANCE_CLAIMED,
                    from: { did: learnCard.id.did() },
                    to: { did: inboxCredential.issuerDid },
                    message: {
                        title: 'Credential Claimed from Inbox',
                        body: `${contactMethod.value} claimed a credential from their inbox.`,
                    },
                    data: {
                        inbox: {
                            issuanceId: inboxCredential.id,
                            status: LCNInboxStatusEnumValidator.enum.ISSUED,
                            recipient: {
                                contactMethod: { type: contactMethod.type, value: contactMethod.value },
                                learnCardId: holderProfile?.did || holderDid,
                            },
                            timestamp: new Date().toISOString(),
                        },
                    },
                });
            }

            return finalCredential;
        } catch (error) {
            console.error(`Failed to process inbox credential ${inboxCredential.id}:`, error);
            
            // Log FAILED activity - chain to original activityId/integrationId if available
            const failedActivityId = inboxCredential.activityId;
            const failedIntegrationId = inboxCredential.integrationId;
            const failedBoostUri = inboxCredential.boostUri;
            const failedIssuerProfile = await getProfileByDid(inboxCredential.issuerDid);
            if (failedIssuerProfile) {
                try {
                    await logCredentialFailed({
                        activityId: failedActivityId,
                        actorProfileId: failedIssuerProfile.profileId,
                        recipientType: contactMethod.type as 'email' | 'phone',
                        recipientIdentifier: contactMethod.value,
                        recipientProfileId: holderProfile?.profileId,
                        boostUri: failedBoostUri,
                        integrationId: failedIntegrationId,
                        source: 'claimLink',
                        metadata: {
                            error: error instanceof Error ? error.message : 'Unknown error',
                        },
                    });
                } catch (logError) {
                    console.error('Failed to log credential failed activity:', logError);
                }
            }

            try {
                // Trigger webhook for error if configured
                if (inboxCredential.webhookUrl) {
                    const learnCard = await getLearnCard();
                    await addNotificationToQueue({
                        webhookUrl: inboxCredential.webhookUrl,
                        type: LCNNotificationTypeEnumValidator.enum.ISSUANCE_ERROR,
                        from: { did: learnCard.id.did() },
                        to: { did: inboxCredential.issuerDid },
                        message: {
                            title: 'Credential Issuance Error from Inbox',
                            body: error instanceof Error ? error.message : `${contactMethod.value} failed to claim a credential from their inbox.`,
                        },
                        data: {
                            inbox: {
                                issuanceId: inboxCredential.id,
                                status: LCNInboxStatusEnumValidator.enum.PENDING,
                                recipient: {
                                    contactMethod: { type: contactMethod.type, value: contactMethod.value },
                                    learnCardId: holderProfile?.did || holderDid,
                                },
                                timestamp: new Date().toISOString(),
                            },
                        },
                    });
                }
            } catch (webhookError) {
                console.error(`Failed to trigger webhook for inbox credential error ${inboxCredential.id}:`, webhookError);
            }
            return null; // Continue processing other credentials
        }
    });

    const settledCredentials = await Promise.all(credentialProcessingPromises);
    claimedCredentials.push(...settledCredentials.filter((c): c is VC => c !== null));


    // Create response VP with all claimed credentials
    const responseVP = await issueResponsePresentationWithVcs(claimedCredentials);

    // Mark exchange challenge as used
    try {
        await exhaustExchangeChallengeForToken(token, exchangeChallenge);
    } catch (error) {
        console.error(`Failed to mark exchange challenge as used:`, error);
    }

    return {
        verifiablePresentation: responseVP,
    };
}

// =========================================================================
// Inline credential claim (single unified workflow)
// =========================================================================
//
// One workflow id (`inline`) handles all three source forms. Legacy ids
// (`inline-unsigned`, `inline-src`) are still routed here for backward compat.
// The localExchangeId encodes one of:
//
//   • base64url(httpsUrlToJson)       — URL the partner hosts the VC at
//   • base64url([gzip(]signedVcJson[)])   — a fully-signed VC (1-step flow)
//   • base64url([gzip(]unsignedVcJson[)]) — an unsigned VC template (DIDAuth flow)
//
// Signed VCs are returned as-is wrapped in a VP (partner took cryptographic
// responsibility). Unsigned VCs require a DIDAuth round-trip so that the
// resulting credential is cryptographically bound to the holder's DID; they
// are never issued as unbound bearer credentials.
//
// URL shape at the edge:
//   /interactions/inline/<base64url-encoded-payload>?iuv=1
//
// The edge function enforces a MAX_INLINE_ID_LEN; brain-service enforces a
// decoded-bytes cap as a second line of defense.
// =========================================================================

const INLINE_WORKFLOW_IDS: ReadonlySet<string> = new Set([
    'inline',
    'inline-unsigned',
    'inline-src',
]);

const MAX_INLINE_DECODED_BYTES = 64 * 1024;
const INLINE_SRC_FETCH_TIMEOUT_MS = 10_000;

type InlinePayload =
    | { kind: 'signed'; vc: VC }
    | { kind: 'unsigned'; vc: UnsignedVC };

/**
 * SDK-produced URL-source envelope. Small JSON object wrapping the partner-
 * hosted JSON URL plus an optional `presenting` origin reported by the SDK at
 * build time. The `v:1` discriminator disambiguates from raw VC JSON.
 *
 * Legacy shape (raw `https://...` string) is still accepted in `looksLikeHttpsUrl`
 * for backward compat, but new SDK builds emit this envelope so the server can
 * reconcile the two domain signals.
 */
type InlineSrcEnvelope = {
    url: URL;
    presenting?: string;
};

// -------------------------------------------------------------------------
// Decode / classify
// -------------------------------------------------------------------------

/** Decode the base64url payload to its raw bytes (applying gzip if present). */
function decodeInlineBytes(localExchangeId: string): Buffer {
    let raw: Buffer;
    try {
        raw = base64url.toBuffer(localExchangeId);
    } catch {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid inline payload encoding' });
    }

    // Detect gzip magic bytes (0x1f 0x8b) and inflate if present.
    const decoded =
        raw.length >= 2 && raw[0] === 0x1f && raw[1] === 0x8b ? gunzipSync(raw) : raw;

    if (decoded.byteLength > MAX_INLINE_DECODED_BYTES) {
        throw new TRPCError({
            code: 'PAYLOAD_TOO_LARGE',
            message: 'Inline payload exceeds maximum decoded size',
        });
    }

    return decoded;
}

/**
 * True if the decoded bytes look like a URL string we should fetch.
 *
 * Default policy accepts only `https://` URLs. When `INLINE_SRC_DEV_MODE=1`
 * is set, plain `http://` is also accepted so the local demo (partner HTML on
 * http://localhost) can round-trip. The SSRF guard still runs afterwards and
 * is likewise gated by dev mode.
 */
function looksLikeHttpsUrl(bytes: Buffer): string | null {
    // Only consider payloads small enough to be a URL and that decode to ASCII.
    if (bytes.byteLength > 4096) return null;
    const text = bytes.toString('utf8').trim();
    const lower = text.toLowerCase();
    const devMode = isInlineSrcDevMode();
    const hasAcceptedScheme =
        lower.startsWith('https://') || (devMode && lower.startsWith('http://'));
    if (!hasAcceptedScheme) return null;
    try {
        const url = new URL(text);
        if (url.protocol === 'https:') return text;
        if (devMode && url.protocol === 'http:') return text;
        return null;
    } catch {
        return null;
    }
}

/**
 * Attempt to parse the decoded bytes as an SDK-produced inline-src envelope:
 *   `{ "v": 1, "url": "https://...", "presenting"?: "https://..." }`
 *
 * Returns `null` when the bytes don't match the envelope shape (including all
 * VC payloads, which will be handled by classifyJsonPayload downstream).
 */
function tryParseInlineSrcEnvelope(bytes: Buffer): InlineSrcEnvelope | null {
    // Cap envelope size at 8 KiB — more than enough for a URL + origin + hash.
    if (bytes.byteLength > 8192) return null;

    const text = bytes.toString('utf8').trim();
    if (!text.startsWith('{')) return null;

    let obj: unknown;
    try {
        obj = JSON.parse(text);
    } catch {
        return null;
    }
    if (!obj || typeof obj !== 'object') return null;

    const candidate = obj as Record<string, unknown>;
    // Discriminator: envelope must have `v === 1`. Keeps us from accidentally
    // matching any credential or other JSON that happens to have a `url` field.
    if (candidate.v !== 1) return null;
    if (typeof candidate.url !== 'string') return null;

    let parsedUrl: URL;
    try {
        parsedUrl = new URL(candidate.url);
    } catch {
        return null;
    }
    // Production: https only. Dev mode: also accept http for local demos.
    const devMode = isInlineSrcDevMode();
    if (parsedUrl.protocol !== 'https:' && !(devMode && parsedUrl.protocol === 'http:')) {
        return null;
    }

    const presenting =
        typeof candidate.presenting === 'string' ? candidate.presenting : undefined;

    return { url: parsedUrl, presenting };
}

/** Parse decoded bytes as JSON and classify as signed/unsigned VC. */
function classifyJsonPayload(bytes: Buffer): InlinePayload {
    let body: unknown;
    try {
        body = JSON.parse(bytes.toString('utf8'));
    } catch {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid inline payload JSON' });
    }
    return classifyParsedPayload(body);
}

function classifyParsedPayload(body: unknown): InlinePayload {
    // Signed first: VCValidator is a superset of UnsignedVCValidator (adds proof),
    // so trying it first avoids misclassifying a signed VC as unsigned.
    const signedParse = VCValidator.safeParse(body);
    if (signedParse.success) return { kind: 'signed', vc: signedParse.data as VC };

    const unsignedParse = UnsignedVCValidator.safeParse(body);
    if (unsignedParse.success) return { kind: 'unsigned', vc: unsignedParse.data as UnsignedVC };

    throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Inline payload is not a valid VC or Unsigned VC',
    });
}

// -------------------------------------------------------------------------
// inline-src fetch (hardened)
// -------------------------------------------------------------------------

/**
 * Fetch partner-hosted JSON for an inline-src claim. Hardened against:
 *   • non-https URLs (rejected before we get here, but defended in depth)
 *   • non-allowlisted hosts (see isAllowedInlineSrc)
 *   • redirects (`redirect: 'error'`) — an open redirect on any allowlisted
 *     host would otherwise let an attacker get LearnCard to sign arbitrary
 *     content
 *   • non-JSON responses (content-type sniff)
 *   • oversized bodies (content-length header check + streamed byte counter)
 */
async function fetchInlineSrc(parsedUrl: URL): Promise<unknown> {
    let res: Response;
    try {
        res = await fetch(parsedUrl, {
            headers: { Accept: 'application/json' },
            redirect: 'error',
            signal: AbortSignal.timeout(INLINE_SRC_FETCH_TIMEOUT_MS),
        });
    } catch (err) {
        console.error('[fetchInlineSrc] network error:', err);
        throw new TRPCError({
            code: 'BAD_GATEWAY',
            message: 'Failed to fetch inline-src JSON',
        });
    }

    if (!res.ok) {
        throw new TRPCError({
            code: 'BAD_GATEWAY',
            message: `Failed to fetch inline-src JSON (status ${res.status})`,
        });
    }

    const contentType = (res.headers.get('content-type') ?? '').toLowerCase();
    if (
        !contentType.includes('application/json') &&
        !contentType.includes('application/ld+json')
    ) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'inline-src response is not application/json',
        });
    }

    const declaredLength = Number(res.headers.get('content-length') ?? 'NaN');
    if (Number.isFinite(declaredLength) && declaredLength > MAX_INLINE_DECODED_BYTES) {
        throw new TRPCError({
            code: 'PAYLOAD_TOO_LARGE',
            message: 'inline-src JSON exceeds maximum size',
        });
    }

    // Stream the body and enforce the size cap even when Content-Length is absent
    // or lies. Abort the underlying connection as soon as the cap is exceeded.
    const reader = res.body?.getReader();
    if (!reader) {
        throw new TRPCError({
            code: 'BAD_GATEWAY',
            message: 'inline-src response has no body',
        });
    }

    const chunks: Uint8Array[] = [];
    let total = 0;
    try {
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            if (!value) continue;
            total += value.byteLength;
            if (total > MAX_INLINE_DECODED_BYTES) {
                await reader.cancel();
                throw new TRPCError({
                    code: 'PAYLOAD_TOO_LARGE',
                    message: 'inline-src JSON exceeds maximum size',
                });
            }
            chunks.push(value);
        }
    } catch (err) {
        if (err instanceof TRPCError) throw err;
        console.error('[fetchInlineSrc] read error:', err);
        throw new TRPCError({
            code: 'BAD_GATEWAY',
            message: 'Failed to read inline-src response',
        });
    }

    const buf = Buffer.concat(chunks.map(c => Buffer.from(c)));
    try {
        return JSON.parse(buf.toString('utf8'));
    } catch {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'inline-src response is not valid JSON' });
    }
}

// -------------------------------------------------------------------------
// Issuer preservation + sign
// -------------------------------------------------------------------------

/**
 * LearnCard signs inline unsigned credentials with its own DID, so the partner's
 * declared `issuer` is necessarily overwritten. To avoid silent data loss, we
 * preserve the partner's original issuer identity under
 * `credentialSubject.awardedBy` (a custom convention the LearnCard wallet UI
 * surfaces as "Awarded by X, signed by LearnCard"). This also matches the
 * OBv3 semantic where a host signs on behalf of an awarding body.
 *
 * If the partner's declared issuer IS LearnCard's own DID (or empty), we
 * overwrite silently without adding awardedBy.
 */
function preserveIssuer(vc: UnsignedVC, learnCardDid: string): UnsignedVC {
    const originalIssuer = vc.issuer;
    const originalIssuerDid =
        typeof originalIssuer === 'string' ? originalIssuer : originalIssuer?.id;

    // No meaningful issuer to preserve, or partner explicitly said LearnCard.
    if (!originalIssuerDid || originalIssuerDid === learnCardDid) {
        return { ...vc, issuer: learnCardDid };
    }

    const credentialSubject = vc.credentialSubject;
    if (Array.isArray(credentialSubject)) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message:
                'Multi-subject unsigned credentials with a non-LearnCard issuer are not supported by the inline claim flow. ' +
                'Either submit a pre-signed VC or restructure your credential to have a single credentialSubject.',
        });
    }

    const awardedBy =
        typeof originalIssuer === 'object' && originalIssuer !== null
            ? originalIssuer
            : { id: originalIssuerDid };

    return {
        ...vc,
        issuer: learnCardDid,
        credentialSubject: {
            ...credentialSubject,
            awardedBy: (credentialSubject as { awardedBy?: unknown }).awardedBy ?? awardedBy,
        },
    };
}

/**
 * Attach a server-verified `awardedByDomain` claim to `credentialSubject`.
 * This is a sidecar to the partner-declared `awardedBy` (which is user-
 * provided metadata): `awardedByDomain` records the https origin the JSON was
 * actually fetched from, plus the reconciled eTLD+1 when the SDK supplied a
 * compatible presenting origin. Wallets should surface this as the
 * authoritative issuing identity (partner self-declaration is untrusted, but
 * domain control is provable).
 */
function attachVerifiedOrigin(
    vc: UnsignedVC,
    origin: VerifiedAwardedByDomain
): UnsignedVC {
    const cs = vc.credentialSubject;

    if (Array.isArray(cs)) {
        return {
            ...vc,
            credentialSubject: cs.map(s => ({
                ...s,
                awardedByDomain: origin,
            })) as any,
        };
    }

    // Respect an explicit value already set by the partner (unlikely; they'd
    // have no way to know the server-observed origin at authoring time).
    if ((cs as { awardedByDomain?: unknown })?.awardedByDomain !== undefined) {
        return vc;
    }

    return {
        ...vc,
        credentialSubject: {
            ...cs,
            awardedByDomain: origin,
        } as any,
    };
}

/**
 * Bind the unsigned VC to the holder's DID (one-shot DIDAuth exchange),
 * preserve the partner's issuer identity, and sign with LearnCard's DID.
 */
async function bindAndSignInlineCredential(
    unsigned: UnsignedVC,
    holderDid: string
): Promise<VC> {
    const learnCard = await getLearnCard();
    const learnCardDid = learnCard.id.did();

    // Bind credentialSubject.id to the holder's DID so the resulting VC is not
    // a bearer credential. Respect any pre-existing `did` override the partner
    // may have set.
    const subject = unsigned.credentialSubject;
    const boundSubject = Array.isArray(subject)
        ? subject.map(s => ({ ...s, id: (s as any).did || s.id || holderDid }))
        : { ...subject, id: (subject as any).did || subject.id || holderDid };

    const withSubject: UnsignedVC = { ...unsigned, credentialSubject: boundSubject as any };
    const withIssuer = preserveIssuer(withSubject, learnCardDid);

    return (await learnCard.invoke.issueCredential(withIssuer)) as VC;
}

// -------------------------------------------------------------------------
// DIDAuth exchange cache
// -------------------------------------------------------------------------

/** A stable, bounded token for the exchange-challenge cache. */
function inlineExchangeToken(localExchangeId: string): string {
    const hash = createHash('sha256').update(localExchangeId).digest('hex');
    return `inline:${hash}`;
}

// -------------------------------------------------------------------------
// Unified handler
// -------------------------------------------------------------------------

async function handleInlineExchange(
    localExchangeId: string,
    verifiablePresentation: VP | undefined,
    domain: string
) {
    const decoded = decodeInlineBytes(localExchangeId);

    // Branch 1a: SDK-produced URL envelope `{v:1, url, presenting?}`. The
    // presenting origin is reconciled against the fetch origin via eTLD+1
    // to produce a server-verified `awardedByDomain`.
    const envelope = tryParseInlineSrcEnvelope(decoded);
    if (envelope) {
        return handleInlineSrcClaim(envelope.url.href, envelope.presenting);
    }

    // Branch 1b: Legacy raw URL string. No presenting signal — fetch origin
    // alone drives the verified domain. Kept for backward compatibility with
    // older SDK builds and manual URL construction.
    const srcUrl = looksLikeHttpsUrl(decoded);
    if (srcUrl) {
        return handleInlineSrcClaim(srcUrl, undefined);
    }

    // Branch 2: inline JSON. Classify, then route to signed (1-step) or
    // unsigned (DIDAuth 2-step).
    const payload = classifyJsonPayload(decoded);
    if (payload.kind === 'signed') {
        const vp = await issueResponsePresentationWithVcs([payload.vc]);
        return { verifiablePresentation: vp };
    }

    // Unsigned JSON: require DIDAuth to bind the holder.
    if (!verifiablePresentation) {
        return initiateInlineDidAuth(localExchangeId, domain);
    }
    return completeInlineDidAuth(localExchangeId, payload.vc, verifiablePresentation, domain);
}

async function handleInlineSrcClaim(srcUrl: string, presenting?: string) {
    const parsedUrl = new URL(srcUrl);

    // SSRF guard (partner allowlist retired — trust is anchored on the
    // verified fetch origin via awardedByDomain). Rejects internal hosts,
    // private/loopback/link-local IPs, and hostnames that resolve into those
    // ranges. See inline-src.helpers.ts for the full policy.
    try {
        await assertInlineSrcSafe(parsedUrl);
    } catch (err: unknown) {
        if (err instanceof InlineSrcUrlRejected) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: err.message });
        }
        throw err;
    }

    const body = await fetchInlineSrc(parsedUrl);
    const payload = classifyParsedPayload(body);

    // Two-signal domain reconciliation. For pre-signed VCs we do not mutate
    // the credential (it would invalidate the partner's signature), so the
    // verified origin is advisory for that branch. For unsigned VCs we attach
    // it as `credentialSubject.awardedByDomain` before LearnCard signs.
    const verifiedOrigin = reconcileAwardedByDomain(parsedUrl, presenting);

    let vc: VC;
    if (payload.kind === 'signed') {
        vc = payload.vc;
    } else {
        // Unsigned VC fetched from partner: we don't have a holder DID here
        // (this branch is 1-step for backward-compatibility). Sign with
        // LearnCard DID, preserve partner's declared issuer as awardedBy,
        // and attach the server-verified domain as awardedByDomain.
        const learnCard = await getLearnCard();
        const withIssuer = preserveIssuer(payload.vc, learnCard.id.did());
        const withOrigin = attachVerifiedOrigin(withIssuer, verifiedOrigin);
        vc = (await learnCard.invoke.issueCredential(withOrigin)) as VC;
    }

    const vp = await issueResponsePresentationWithVcs([vc]);
    return { verifiablePresentation: vp };
}

async function initiateInlineDidAuth(localExchangeId: string, domain: string) {
    const token = inlineExchangeToken(localExchangeId);
    const challenge = randomUUID();
    await setValidExchangeChallengeForToken(token, challenge);

    return {
        verifiablePresentationRequest: {
            query: [
                {
                    type: 'DIDAuthentication',
                    acceptedMethods: [{ method: 'key' }, { method: 'web' }],
                },
            ],
            // Composite format so the wallet echoes our token back alongside
            // the challenge (same convention as handleInboxClaimInitiation).
            challenge: `${token}:${challenge}`,
            domain,
        },
    };
}

async function completeInlineDidAuth(
    localExchangeId: string,
    unsigned: UnsignedVC,
    verifiablePresentation: VP,
    domain: string
) {
    // 1. Extract & parse the composite challenge.
    const proofChallenge = Array.isArray(verifiablePresentation.proof)
        ? verifiablePresentation.proof[0]?.challenge
        : verifiablePresentation.proof?.challenge;

    if (!proofChallenge) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Verifiable presentation must include challenge in proof',
        });
    }

    const parts = proofChallenge.split(':');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid challenge format' });
    }
    const [echoedToken, challenge] = parts;

    const expectedToken = inlineExchangeToken(localExchangeId);
    if (echoedToken !== expectedToken) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Challenge does not belong to this exchange',
        });
    }

    // 2. Check the challenge is still valid and not already exhausted.
    const state = await getExchangeChallengeStateForToken(expectedToken, challenge);
    if (!state || state === EXHAUSTED) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid or expired exchange challenge',
        });
    }

    // 3. Cryptographically verify the DIDAuth VP.
    const learnCard = await getEmptyLearnCard();
    const verificationResult = await learnCard.invoke.verifyPresentation(verifiablePresentation, {
        challenge: proofChallenge,
        domain,
    });
    if (
        verificationResult.errors.length > 0 ||
        !verificationResult.checks.includes('proof')
    ) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Verifiable presentation verification failed',
        });
    }

    const holderDid = verifiablePresentation.holder;
    if (!holderDid) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Verifiable presentation must include holder DID',
        });
    }

    // 4. Issue the VC bound to the holder.
    const signed = await bindAndSignInlineCredential(unsigned, holderDid);

    // 5. Exhaust the challenge so it can't be replayed.
    await exhaustExchangeChallengeForToken(expectedToken, challenge);

    const vp = await issueResponsePresentationWithVcs([signed]);
    return { verifiablePresentation: vp };
}

export type WorkflowsRouter = typeof workflowsRouter;

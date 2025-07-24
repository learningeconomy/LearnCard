import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import base64url from 'base64url';

import { VC, UnsignedVC, VP, VPValidator, LCNNotificationTypeEnumValidator, LCNInboxStatusEnumValidator } from '@learncard/types';

import { t, openRoute, Context } from '@routes';

import { getBoostByUri } from '@accesslayer/boost/read';
import { getBoostOwner } from '@accesslayer/boost/relationships/read';
import { getSigningAuthorityForUserByName } from '@accesslayer/signing-authority/relationships/read';

import {
    isClaimLinkAlreadySetForBoost,
    getClaimLinkSAInfoForBoost,
    useClaimLinkForBoost,
} from '@cache/claim-links';

import {
    validateInboxClaimToken,
} from '@helpers/contact-method.helpers';
import { getPendingInboxCredentialsForContactMethodId } from '@accesslayer/inbox-credential/read';
import { markInboxCredentialAsClaimed } from '@accesslayer/inbox-credential/update';
import { createClaimedRelationship } from '@accesslayer/inbox-credential/relationships/create';
import {
    getContactMethodById,
    getProfileByContactMethod,
} from '@accesslayer/contact-method/read';
import { getProfileByDid } from '@accesslayer/profile/read';

import { getBoostUri, isDraftBoost } from '@helpers/boost.helpers';
import { getEmptyLearnCard, getLearnCard } from '@helpers/learnCard.helpers';
import { issueCredentialWithSigningAuthority } from '@helpers/signingAuthority.helpers';
import { createProfileContactMethodRelationship } from '@accesslayer/contact-method/relationships/create';
import { verifyContactMethod } from '@accesslayer/contact-method/update';
import { addNotificationToQueue } from '@helpers/notifications.helpers';

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

            // TODO: This is a temporary redirect for testing
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

            // TODO: This is a temporary redirect for testing verification flows
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

    const boostOwner = await getBoostOwner(boost);
    if (!boostOwner) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Could not find boost owner' });
    }

    const signingAuthorityForUser = await getSigningAuthorityForUserByName(
        boostOwner,
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
            console.log("Holder has a profile! ", holderProfile)
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

        const vc = await issueCredentialWithSigningAuthority(
            boostOwner,
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
            code: 'NOT_FOUND',
            message: 'Invalid or expired claim token',
        });
    }

    // Verify there are pending credentials for this contact method
    const pendingCredentials = await getPendingInboxCredentialsForContactMethodId(
        claimTokenData.contactMethodId
    );
    if (pendingCredentials.length === 0) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'No pending credentials found for this claim token',
        });
    }

    // Return VerifiablePresentationRequest
    return {
        verifiablePresentationRequest: {
            query: [{
                type: 'DIDAuthentication',
                acceptedMethods: [{method: "key"}, {method: "web"}]
            }],
            challenge: claimTokenData.token,
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

    // Verify the presentation
    const learnCard = await getEmptyLearnCard();
    const verificationResult = await learnCard.invoke.verifyPresentation(verifiablePresentation, {
        challenge: claimTokenData.token,
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

    if (holderProfile) {
        // If the holder's DID from the presentation doesn't match the profile's DID, throw an error
        if (holderProfile.did !== holderDid) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'DID mismatch. The presented DID does not match the profile associated with this contact method.',
            });
        }
    } else {
        // If no profile is associated with the contact method, check if a profile exists for the presented DID
        const existingProfile = await getProfileByDid(holderDid);
        if (existingProfile) {
            // If a profile exists, link the contact method to it
            holderProfile = existingProfile;
            await createProfileContactMethodRelationship(holderProfile.profileId, contactMethod.id);
        } else {
            // If no profile exists for the DID, we can't proceed with claiming
            // The user should create a profile first
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'No profile found for the presented DID. Please create a profile before claiming.',
            });
        }
    }

    // Mark the contact method as verified
    if (!contactMethod.isVerified) {
        await verifyContactMethod(contactMethod.id);
    }

    // Get pending credentials for this contact method
    const pendingCredentials = await getPendingInboxCredentialsForContactMethodId(
        contactMethod.id
    );

    if (pendingCredentials.length === 0) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'No pending credentials found for this contact method.',
        });
    }

    const claimedCredentials: VC[] = [];

    // Process each pending credential
    for (const inboxCredential of pendingCredentials) {
        try {
            let finalCredential: VC;

            if (inboxCredential.isSigned) {
                // Credential is already signed
                finalCredential = JSON.parse(inboxCredential.credential) as VC;
            } else {
                // Need to sign the credential using signing authority
                const unsignedCredential = JSON.parse(inboxCredential.credential) as UnsignedVC;

                // Neo4j doesn't support object properties, so we have to do this
                //@ts-ignore
                if (!inboxCredential?.signingAuthority?.endpoint || !inboxCredential?.signingAuthority?.name) {
                    console.error(`Inbox credential ${inboxCredential.id} missing signing authority info`);
                    continue;
                }

                // Get the issuer profile and signing authority
                const issuerProfile = await getProfileByDid(inboxCredential.issuerDid);
                if (!issuerProfile) {
                    console.error(`Issuer profile not found for ${inboxCredential.issuerDid}`);
                    continue;
                }

                const signingAuthorityForUser = await getSigningAuthorityForUserByName(
                    issuerProfile,
                    //@ts-ignore
                    inboxCredential?.signingAuthority?.endpoint,
                    //@ts-ignore
                    inboxCredential?.signingAuthority?.name
                );

                if (!signingAuthorityForUser) {
                    console.error(`Signing authority not found for issuer ${inboxCredential.issuerDid}`);
                    continue;
                }

                // Set credential subject to claimer's DID
                if (Array.isArray(unsignedCredential.credentialSubject)) {
                    unsignedCredential.credentialSubject = unsignedCredential.credentialSubject.map(subject => ({
                        ...subject,
                        id: subject.did || subject.id || holderDid,
                    }));
                } else {
                    unsignedCredential.credentialSubject.id = holderDid;
                }

                // Set issuer from signing authority
                unsignedCredential.issuer = signingAuthorityForUser.relationship.did;

                // Sign the credential
                finalCredential = await issueCredentialWithSigningAuthority(
                    issuerProfile,
                    unsignedCredential,
                    signingAuthorityForUser,
                    ctx.domain,
                    false // don't encrypt
                ) as VC;
            }

            // Mark credential as claimed
            await markInboxCredentialAsClaimed(inboxCredential.id);
            await createClaimedRelationship(holderProfile.profileId, inboxCredential.id, claimToken);

            // Add to claimed credentials
            claimedCredentials.push(finalCredential);

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
                            status: LCNInboxStatusEnumValidator.enum.CLAIMED,
                            recipient: {
                                contactMethod: { type: contactMethod.type, value: contactMethod.value },
                                learnCardId: holderProfile.did || holderDid,
                            },
                            timestamp: new Date().toISOString(),
                        },
                    },
                });
            }
        } catch (error) {
            console.error(`Failed to process inbox credential ${inboxCredential.id}:`, error);
            // Continue processing other credentials
        }
    }

    // Mark claim token as used
    // TODO: Disabling, since it disrupts VC-API workflows - and other mechanisms are sufficient to prevent double claims.
    // await markInboxClaimTokenAsUsed(claimToken);

    if (claimedCredentials.length === 0) {
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to process any credentials',
        });
    }

    // Create response VP with all claimed credentials
    const responseVP = await issueResponsePresentationWithVcs(claimedCredentials);

    return {
        verifiablePresentation: responseVP
    };
}

export type WorkflowsRouter = typeof workflowsRouter;

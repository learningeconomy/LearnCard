import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import base64url from "base64url";

import {
    VC,
    UnsignedVC,
    VP,
    VPValidator,
} from '@learncard/types';

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
    markInboxClaimTokenAsUsed,
} from '@helpers/email.helpers';
import { getPendingInboxCredentialsForEmailId } from '@accesslayer/inbox-credential/read';
import { markInboxCredentialAsClaimed } from '@accesslayer/inbox-credential/update';
import { createClaimedRelationship } from '@accesslayer/inbox-credential/relationships/create';
import {
    getEmailAddressById,
    getProfileByEmailAddress,
} from '@accesslayer/email-address/read';
import { getProfileByDid } from '@accesslayer/profile/read';
import { triggerWebhook } from '@helpers/inbox.helpers';

import {
    getBoostUri,
    isDraftBoost,
} from '@helpers/boost.helpers';
import { getEmptyLearnCard, getLearnCard } from '@helpers/learnCard.helpers';
import { issueCredentialWithSigningAuthority } from '@helpers/signingAuthority.helpers';
import { createProfileEmailRelationship, createProfileEmailRelationship } from '@accesslayer/email-address/relationships/create';
import { verifyEmailAddress } from '@accesslayer/email-address/update';

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
            'https://www.w3.org/2018/credentials/v1',
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

    // Verify there are pending credentials for this email
    const pendingCredentials = await getPendingInboxCredentialsForEmailId(claimTokenData.emailId);
    if (pendingCredentials.length === 0) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'No pending credentials found for this claim token',
        });
    }

    // Generate challenge for this claim session
    const challenge = `inbox-claim-${Date.now()}-${Math.random().toString(36).substring(2)}`;

    // Return VerifiablePresentationRequest
    return {
        verifiablePresentationRequest: {
            query: [{
                type: 'DIDAuthentication',
                acceptedMethods: [{method: "key"}, {method: "web"}]
            }],
            challenge,
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

    // Extract challenge from the VP
    const challenge = Array.isArray(verifiablePresentation.proof)
        ? verifiablePresentation.proof[0]?.challenge
        : verifiablePresentation.proof?.challenge;

    if (!challenge) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Verifiable presentation must include challenge in proof',
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

    // Get the email address and verify the claimer has access to it
    const emailAddress = await getEmailAddressById(claimTokenData.emailId);
    if (!emailAddress) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Email address not found',
        });
    }

    // Check if the holder DID corresponds to a profile with this verified email
    const profileForEmail = await getProfileByEmailAddress(emailAddress);
 
    if (!profileForEmail) {
        await createProfileEmailRelationship(ctx.user?.did || holderDid, emailAddress.id);
        await verifyEmailAddress(emailAddress.id);
    }
    // if (!profileForEmail || profileForEmail.did !== holderDid) {
    //     throw new TRPCError({
    //         code: 'FORBIDDEN',
    //         message: 'You do not have access to credentials for this email address',
    //     });
    // }

    // Get all pending credentials for this email
    const pendingCredentials = await getPendingInboxCredentialsForEmailId(claimTokenData.emailId);
    if (pendingCredentials.length === 0) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'No pending credentials found',
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
                    inboxCredential?.signingAuthority?.endpoint,
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
            await createClaimedRelationship(holderDid, inboxCredential.id, claimToken);

            // Add to claimed credentials
            claimedCredentials.push(finalCredential);

            // Trigger webhook if configured
            if (inboxCredential.webhookUrl) {
                await triggerWebhook(
                    inboxCredential.issuerDid,
                    inboxCredential.id,
                    inboxCredential.webhookUrl,
                    {
                        event: 'issuance.claimed',
                        timestamp: new Date().toISOString(),
                        data: {
                            issuanceId: inboxCredential.id,
                            status: 'CLAIMED',
                            recipient: {
                                email: emailAddress.email,
                                learnCardId: holderDid,
                            },
                            claimedAt: new Date().toISOString(),
                        },
                    }
                );
            }
        } catch (error) {
            console.error(`Failed to process inbox credential ${inboxCredential.id}:`, error);
            // Continue processing other credentials
        }
    }

    // Mark claim token as used
    await markInboxClaimTokenAsUsed(claimToken);

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
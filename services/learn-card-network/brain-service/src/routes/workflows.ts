import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';

import {
    VPValidator,
    VP,
    UnsignedVPValidator,
    UnsignedVC,
    VCValidator,
} from '@learncard/types';

import { t, openRoute } from '@routes';

import { getBoostByUri } from '@accesslayer/boost/read';
import { getBoostOwner } from '@accesslayer/boost/relationships/read';
import { getSigningAuthorityForUserByName } from '@accesslayer/signing-authority/relationships/read';

import {
    isClaimLinkAlreadySetForBoost,
    setValidClaimLinkForBoost,
    getClaimLinkSAInfoForBoost,
    useClaimLinkForBoost,
} from '@cache/claim-links';

import {
    issueClaimLinkBoost,
    getBoostUri,
    isDraftBoost,
    sendBoost,
} from '@helpers/boost.helpers';
import { getEmptyLearnCard } from '@helpers/learnCard.helpers';
import { getDidWeb } from '@helpers/did.helpers';
import { getProfileByDid } from '@accesslayer/profile/read';

// Zod schema for the participate in exchange input
const participateInExchangeInput = z.object({
    localWorkflowId: z.string(),
    localExchangeId: z.string(),
    body: z.union([
        // Type 1: A body containing the VP for the challenge-response step
        z.object({
            verifiablePresentation: VPValidator,
        }),
        // Type 2: An empty body for the initiation step
        z.object({}).optional(),
    ]).default({}),
});

// Response schema for the initiation step (VPR)
const VerifiablePresentationRequestValidator = z.object({
    query: z.object({
        type: z.string(),
        credentialQuery: z.array(z.object({
            required: z.boolean().optional(),
            reason: z.string().optional(),
        })).optional(),
    }),
    challenge: z.string(),
    domain: z.string(),
});

// Response schema for the claim step (VP containing the issued VC)
const ParticipateExchangeClaimResponseValidator = UnsignedVPValidator.extend({
    verifiableCredential: VCValidator.array(),
});

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
        .output(
            z.union([
                VerifiablePresentationRequestValidator,
                ParticipateExchangeClaimResponseValidator,
            ])
        )
        .mutation(async ({ ctx, input }) => {
            const { localWorkflowId, localExchangeId, body } = input;
            const { domain } = ctx;

            if (process.env.NODE_ENV !== 'test') {
                console.log('🚀 BEGIN - Participate in Exchange', JSON.stringify(input));
            }

            // Check if this is an initiation request (empty body) or presentation request (contains VP)
            const isInitiation = !body || !('verifiablePresentation' in body);

            if (isInitiation) {
                // Scenario 1: Exchange Initiation
                return handleExchangeInitiation(localWorkflowId, localExchangeId, domain);
            } else {
                // Scenario 2: Presentation for Claim
                return handlePresentationForClaim(
                    localWorkflowId,
                    localExchangeId,
                    body.verifiablePresentation,
                    domain
                );
            }
        }),
});

async function handleExchangeInitiation(
    localWorkflowId: string,
    localExchangeId: string,
    domain: string
) {
    // Validate that the localExchangeId (boost ID) is valid and available
    const boost = await getBoostByUri(localExchangeId);

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

    // Generate a cryptographically secure challenge
    const challenge = uuid();

    // Check if challenge is already in use (shouldn't happen with UUID but be safe)
    if (await isClaimLinkAlreadySetForBoost(localExchangeId, challenge)) {
        throw new TRPCError({
            code: 'CONFLICT',
            message: 'Challenge collision detected, please retry',
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

    // For VC-API workflow, we need to check if the boost owner has a signing authority available
    // Since we can't prompt for it in this step, we'll need to store a placeholder and validate later
    // Store the exchange state with minimal info - the actual signing authority lookup happens during claim
    await setValidClaimLinkForBoost(localExchangeId, challenge, {
        name: 'vc-api-exchange',
        endpoint: domain,
    }, {
        ttlSeconds: 300, // 5 minute expiry
        totalUses: 1, // Single use for security
    });

    // Return VerifiablePresentationRequest
    return {
        query: {
            type: 'VerifiablePresentationRequest',
            credentialQuery: [{
                required: false,
                reason: 'Please present a credential to verify your identity and claim this boost',
            }],
        },
        challenge,
        domain,
    };
}

async function handlePresentationForClaim(
    localWorkflowId: string,
    localExchangeId: string,
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

    // Retrieve exchange state from Redis
    const claimLinkInfo = await getClaimLinkSAInfoForBoost(localExchangeId, challenge);
    
    if (!claimLinkInfo) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Exchange session not found or expired',
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

    // Get the holder profile by DID
    const holderProfile = await getProfileByDid(holderDid);
    
    if (!holderProfile) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Holder profile not found. Please create a profile first.',
        });
    }

    // Get boost and validate it's still available
    const boost = await getBoostByUri(localExchangeId);
    
    if (!boost) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Boost not found',
        });
    }

    if (isDraftBoost(boost)) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Draft boosts cannot be claimed',
        });
    }

    // Get boost owner and their signing authority
    const boostOwner = await getBoostOwner(boost);
    
    if (!boostOwner) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Boost owner not found',
        });
    }

    try {
        // For VC-API workflow, we'll create the credential directly and use sendBoost
        // This avoids the complexity of signing authorities for the VC-API exchange
        const boostCredential = JSON.parse(boost.dataValues?.boost) as UnsignedVC;
        const boostURI = getBoostUri(boost.dataValues?.id, domain);

        // Create the credential with proper subject and issuer
        const credentialToIssue = {
            ...boostCredential,
            issuer: { id: getDidWeb(domain, boostOwner.profileId) },
            issuanceDate: new Date().toISOString(),
            credentialSubject: Array.isArray(boostCredential.credentialSubject)
                ? boostCredential.credentialSubject.map(subject => ({
                    ...subject,
                    id: holderDid,
                }))
                : {
                    ...boostCredential.credentialSubject,
                    id: holderDid,
                },
        };

        // Add boostId for BoostCredentials
        if (credentialToIssue?.type?.includes('BoostCredential')) {
            credentialToIssue.boostId = boostURI;
        }

        // Use sendBoost to issue and store the credential
        const issuedCredentialUri = await sendBoost({
            from: boostOwner,
            to: holderProfile,
            boost,
            credential: credentialToIssue,
            domain,
            skipNotification: true,
            autoAcceptCredential: true,
        });

        // Mark the challenge as used
        await useClaimLinkForBoost(localExchangeId, challenge);

        // Return VP containing the issued credential
        // We'll use the same credential structure we just created for sendBoost
        const responseVP = {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            type: ['VerifiablePresentation'],
            holder: holderDid,
            verifiableCredential: [credentialToIssue],
        };

        if (process.env.NODE_ENV !== 'test') {
            console.log('🚀 VC-API Exchange Complete - Credential Issued', issuedCredentialUri);
        }

        return responseVP;

    } catch (error) {
        console.error('Failed to issue credential via VC-API exchange:', error);
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to issue credential for exchange',
        });
    }
}

export type WorkflowsRouter = typeof workflowsRouter;
import { randomUUID } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { ConsentFlowTermsValidator, type VP } from '@learncard/types';
import cache from '@cache';
import { neogma } from '@instance';
import { getEmptyLearnCard } from '@helpers/learnCard.helpers';
import { constructUri } from '@helpers/uri.helpers';
import { getContractById } from '@accesslayer/consentflowcontract/read';

/**
 * EducationOS consent exchange (RFC 2026-10 Stage 5, neutrality N5): a learner consents to an
 * ecosystem-governed agreement from any wallet that speaks VC-API DID authentication. The
 * consent itself is recorded through the ordinary ConsentFlow route, as the learner, so
 * guardian gating, terms validation and audience versioning apply unchanged.
 */
export const CONSENT_WORKFLOW_ID = 'educationos-consent';
const EXCHANGE_TTL_SECONDS = 15 * 60;

const ExchangeStateValidator = z.object({
    contractId: z.string(),
    challenge: z.string(),
    /** Secret only the page that started the exchange holds; guards the status endpoint. */
    statusToken: z.string(),
    holderDid: z.string().optional(),
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED']),
    reason: z.string().optional(),
});
export type ConsentExchangeState = z.infer<typeof ExchangeStateValidator>;

const exchangeKey = (exchangeId: string): string => `educationos-consent-exchange|${exchangeId}`;

const readState = async (exchangeId: string): Promise<ConsentExchangeState | null> => {
    const raw = await cache.get(exchangeKey(exchangeId));
    if (!raw) return null;
    const parsed = ExchangeStateValidator.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
};

const writeState = async (exchangeId: string, state: ConsentExchangeState): Promise<void> => {
    await cache.set(exchangeKey(exchangeId), JSON.stringify(state), EXCHANGE_TTL_SECONDS);
};

/** Only agreements an ecosystem governs can be consented to through this exchange. */
export const readGovernedAgreement = async (contractId: string) => {
    const result = await neogma.queryRunner.run(
        `MATCH (e:Ecosystem)-[:GOVERNS_CONSENT_CONTRACT]->(c:ConsentFlowContract {id: $contractId})
         RETURN c.name AS name, c.subtitle AS subtitle, c.description AS description,
                c.reasonForAccessing AS reason, e.name AS ecosystemName LIMIT 1`,
        { contractId }
    );
    const row = result.records[0];
    if (!row) return null;
    const text = (key: string): string => {
        const value: unknown = row.get(key);
        return typeof value === 'string' ? value : '';
    };
    return {
        name: text('name'),
        subtitle: text('subtitle'),
        description: text('description'),
        reason: text('reason'),
        ecosystemName: text('ecosystemName'),
    };
};

export const startConsentExchange = async (
    contractId: string
): Promise<{ exchangeId: string; statusToken: string }> => {
    if (!(await readGovernedAgreement(contractId))) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Agreement not found.' });
    }
    const exchangeId = randomUUID();
    const statusToken = randomUUID();
    await writeState(exchangeId, {
        contractId,
        challenge: randomUUID(),
        statusToken,
        status: 'PENDING',
    });
    return { exchangeId, statusToken };
};

/**
 * Status for the page that started the exchange. Reports which wallet completed it, since
 * anyone holding the exchange link could answer it with their own wallet.
 */
export const getConsentExchangeStatus = async (
    exchangeId: string,
    statusToken: string
): Promise<Pick<ConsentExchangeState, 'status' | 'reason' | 'holderDid'> | null> => {
    const state = await readState(exchangeId);
    if (!state || state.statusToken !== statusToken) return null;
    return { status: state.status, reason: state.reason, holderDid: state.holderDid };
};

/** VC-API step 1: ask the wallet to prove control of its DID for this exchange only. */
export const consentExchangeRequest = async (exchangeId: string, domain: string) => {
    const state = await readState(exchangeId);
    if (!state || state.status !== 'PENDING') {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Consent exchange not found.' });
    }
    return {
        verifiablePresentationRequest: {
            query: [{ type: 'DIDAuthentication' }],
            challenge: `${exchangeId}:${state.challenge}`,
            domain,
        },
    };
};

type RecordConsentAsLearner = (input: {
    holderDid: string;
    contractUri: string;
    terms: z.infer<typeof ConsentFlowTermsValidator>;
    audienceVersion: number;
}) => Promise<void>;

/**
 * VC-API step 2: verify the DID-auth presentation, then record consent as the holder. The
 * challenge is single use: the exchange leaves PENDING before consent is attempted.
 */
export const completeConsentExchange = async (
    exchangeId: string,
    presentation: VP,
    domain: string,
    recordConsent: RecordConsentAsLearner
): Promise<Record<string, never>> => {
    const state = await readState(exchangeId);
    if (!state || state.status !== 'PENDING') {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Consent exchange not found.' });
    }
    const expectedChallenge = `${exchangeId}:${state.challenge}`;
    const proofs = Array.isArray(presentation.proof) ? presentation.proof : [presentation.proof];
    const proof = proofs[0];
    const holder = presentation.holder;
    // The signing key must be the holder's own: consent is recorded for `holder`, so a valid
    // signature by any other DID must never be accepted for it.
    const signer =
        typeof proof?.verificationMethod === 'string' ? proof.verificationMethod.split('#')[0] : '';
    if (
        proofs.length !== 1 ||
        !holder ||
        proof?.challenge !== expectedChallenge ||
        proof.proofPurpose !== 'authentication' ||
        signer !== holder
    ) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid consent presentation.' });
    }

    // Atomic single use: only the first presentation to claim the exchange proceeds.
    if ((await cache.incr(`${exchangeKey(exchangeId)}|claim`, EXCHANGE_TTL_SECONDS)) !== 1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Consent exchange not found.' });
    }
    await writeState(exchangeId, { ...state, status: 'IN_PROGRESS' });

    const verification = await (
        await getEmptyLearnCard()
    ).invoke.verifyPresentation(presentation, {
        challenge: expectedChallenge,
        domain,
        proofPurpose: 'authentication',
    });
    if (verification.errors.length > 0 || !verification.checks.includes('proof')) {
        await writeState(exchangeId, { ...state, status: 'FAILED', reason: 'VERIFICATION_FAILED' });
        // Verification ran after the claim, so the exchange is spent either way.
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Presentation verification failed.' });
    }

    const contract = await getContractById(state.contractId);
    if (!contract) {
        await writeState(exchangeId, { ...state, status: 'FAILED', reason: 'NOT_FOUND' });
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Agreement not found.' });
    }
    // Grant exactly the write categories the agreement requires, as the app's screen does.
    const writeCategories = Object.fromEntries(
        Object.entries(contract.contract.write.credentials.categories)
            .filter(([, category]) => category.required)
            .map(([name]) => [name, true])
    );

    try {
        await recordConsent({
            holderDid: holder,
            contractUri: constructUri('contract', state.contractId, domain),
            terms: ConsentFlowTermsValidator.parse({
                read: { credentials: { categories: {} } },
                write: { credentials: { categories: writeCategories } },
            }),
            audienceVersion: contract.audienceVersion ?? 0,
        });
    } catch (error) {
        // Generic on purpose: the page must not learn e.g. that an account is a child account.
        await writeState(exchangeId, {
            ...state,
            status: 'FAILED',
            reason: 'CONSENT_NOT_RECORDED',
        });
        throw error;
    }

    await writeState(exchangeId, { ...state, status: 'COMPLETED', holderDid: holder });
    return {};
};

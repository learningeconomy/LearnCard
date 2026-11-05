import { isDeepStrictEqual } from 'node:util';
import { VCValidator, type VC, type CredentialVerificationMetadata } from '@learncard/types';
import { SummaryCredentialDataValidator } from '../ai/generation-schemas';
import { db } from '../db';
import type { LearnCardInstance } from '../learncard';
import { boundLearnCardCall } from '../learncard/requestScope';
import { createSummaryVCStructure } from '../credentials/sessionSummary';
import {
    CredentialVerificationUnavailableError,
    fingerprintCredential,
    verifyCredentialForIngestion,
    type CredentialConsentReceipt,
} from '../credentials/verification';
import { logSafeEvent } from '../logging';

type Input = {
    did: string;
    credential: VC;
    credentialUri?: string;
    consent: CredentialConsentReceipt;
    learnCard: LearnCardInstance;
    attemptId?: unknown;
    expectedBoostUri?: string;
};

export class AssessmentSummaryOwnershipError extends Error {
    constructor() {
        super('Assessment summary not found');
        this.name = 'AssessmentSummaryOwnershipError';
    }
}

export class AssessmentSummaryVerificationError extends Error {
    constructor() {
        super('Assessment summary proof could not be confirmed');
        this.name = 'AssessmentSummaryVerificationError';
    }
}

/**
 * Verify untouched input first. Recover a legacy summary only from the issuer's
 * retained, owner-associated data; never repair or re-sign caller-supplied claims.
 * The fresh attestation stays in memory and does not replace the saved credential.
 */
export const verifyAssessmentSummary = async (
    input: Input
): Promise<{
    credential: VC;
    verification: CredentialVerificationMetadata;
}> => {
    const { did, credential, consent, learnCard, credentialUri } = input;
    let owned:
        | {
              retained: NonNullable<Awaited<ReturnType<typeof db.getOwnedThreadSummary>>>;
              original: VC;
          }
        | undefined;
    const readOwned = async () => {
        if (owned) return owned;
        if (!credentialUri) throw new AssessmentSummaryOwnershipError();
        const retained = await db.getOwnedThreadSummary(did, credentialUri);
        if (!retained) throw new AssessmentSummaryOwnershipError();
        const stored = await boundLearnCardCall(learnCard.read.get(credentialUri));
        const original = stored?.boostCredential ?? stored;
        if (
            !VCValidator.safeParse(original).success ||
            fingerprintCredential(original) !== fingerprintCredential(credential) ||
            (input.expectedBoostUri && original.boostId !== input.expectedBoostUri)
        )
            throw new AssessmentSummaryOwnershipError();
        owned = { retained, original };
        return owned;
    };
    if (input.expectedBoostUri) await readOwned();
    const verify = async (value: VC) => {
        const verification = await verifyCredentialForIngestion({
            credential: value,
            credentialUri:
                typeof value.id === 'string' ? value.id : `sha256:${fingerprintCredential(value)}`,
            subjectDid: did,
            consent,
            verify: original => learnCard.invoke.verifyCredential(original),
        });
        if (
            verification.status !== 'valid' ||
            !verification.checks.includes('proof') ||
            verification.errors.length
        )
            throw new AssessmentSummaryVerificationError();
        return verification;
    };
    try {
        return { credential, verification: await verify(credential) };
    } catch (error) {
        if (
            !(error instanceof CredentialVerificationUnavailableError) ||
            error.verifierErrorKind !== 'undefined_jsonld_term' ||
            !credentialUri
        )
            throw error;

        const { retained, original } = await readOwned();

        const issuer = typeof original.issuer === 'string' ? original.issuer : original.issuer?.id;
        const subjects = Array.isArray(original.credentialSubject)
            ? original.credentialSubject
            : [original.credentialSubject];
        if (
            issuer !== learnCard.id.did() ||
            !subjects.some(subject => subject?.id === did) ||
            !original.type.includes('SummaryCredential') ||
            typeof original.boostId !== 'string'
        )
            throw error;

        let retainedData: unknown;
        try {
            retainedData = JSON.parse(retained.summary_data);
        } catch {
            throw error;
        }
        const parsed = SummaryCredentialDataValidator.safeParse(retainedData);
        // Reject lossy schema parsing and mismatched history rather than drop claims.
        if (
            !parsed.success ||
            !isDeepStrictEqual(parsed.data, retainedData) ||
            !isDeepStrictEqual(original.summaryInfo, retainedData)
        )
            throw error;

        const unsigned = createSummaryVCStructure(issuer, did, parsed.data);
        unsigned.boostId = original.boostId;
        const fresh = await learnCard.invoke.issueCredential(
            unsigned as Parameters<LearnCardInstance['invoke']['issueCredential']>[0]
        );
        const verification = await verify(fresh);
        verification.provenance.source = 'generated';
        try {
            logSafeEvent('info', 'ai_assessment_summary_reissued', {
                attemptId: typeof input.attemptId === 'string' ? input.attemptId : undefined,
                count: 1,
            });
        } catch {
            /* Diagnostics do not change recovery. */
        }
        return { credential: fresh, verification };
    }
};

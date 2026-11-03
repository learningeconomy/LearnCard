import { db } from '../db';
import type { AssessmentQA } from '../services/assessment';

export const getCredentialSubjectDid = (credential: unknown): string | undefined => {
    if (!credential || typeof credential !== 'object') return;

    const subject = (credential as Record<string, unknown>).credentialSubject;
    const firstSubject = Array.isArray(subject) ? subject[0] : subject;

    if (!firstSubject || typeof firstSubject !== 'object') return;

    const did = (firstSubject as Record<string, unknown>).id;

    return typeof did === 'string' ? did : undefined;
};

export type FinishAssessmentRequest = {
    session: unknown;
    sessionUri: string;
    assessmentQA: AssessmentQA[];
    /** Contract credential URI of the summary; when present, verifyAssessmentSummary() proves ownership. */
    summaryCredentialUri?: string;
};

/**
 * Validate a POST /finish-assessment body. The LearnCard app sends the summary's boost
 * URI as `sessionUri`, which completeAssessment() then uses as the parent boost, so the
 * owner check resolves the boost back to one of this learner's issued summaries.
 * Clients that also send `summaryCredentialUri` skip that lookup here: the route then
 * calls verifyAssessmentSummary(), which binds the retained summary to this owner and
 * to `sessionUri` as its boost (and can recover legacy summaries from issuer history).
 */
export const authorizeFinishAssessment = async (
    did: string,
    body: unknown
): Promise<
    { ok: true; request: FinishAssessmentRequest } | { ok: false; status: 400 | 404; error: string }
> => {
    const { session, assessmentQA, sessionUri, summaryCredentialUri } = (body ?? {}) as Partial<
        Record<keyof FinishAssessmentRequest, unknown>
    >;
    const credentialUri =
        typeof summaryCredentialUri === 'string' ? summaryCredentialUri : undefined;

    if (!session || !assessmentQA || !sessionUri || typeof sessionUri !== 'string') {
        return {
            ok: false,
            status: 400,
            error: 'Session VC/boost URI and assessmentQA are required in the request body',
        };
    }

    if (
        getCredentialSubjectDid(session) !== did ||
        (!credentialUri && !(await db.ownsSummaryBoost(did, sessionUri)))
    ) {
        return { ok: false, status: 404, error: 'Not found' };
    }

    return {
        ok: true,
        request: {
            session,
            sessionUri,
            assessmentQA: assessmentQA as AssessmentQA[],
            ...(credentialUri ? { summaryCredentialUri: credentialUri } : {}),
        },
    };
};

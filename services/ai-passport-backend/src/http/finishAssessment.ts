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
};

/**
 * Validate a POST /finish-assessment body. The LearnCard app sends the summary's boost
 * URI as `sessionUri`, which completeAssessment() then uses as the parent boost, so the
 * owner check resolves the boost back to one of this learner's issued summaries.
 */
export const authorizeFinishAssessment = async (
    did: string,
    body: unknown
): Promise<
    { ok: true; request: FinishAssessmentRequest } | { ok: false; status: 400 | 404; error: string }
> => {
    const { session, assessmentQA, sessionUri } = (body ?? {}) as Partial<
        Record<keyof FinishAssessmentRequest, unknown>
    >;

    if (!session || !assessmentQA || !sessionUri || typeof sessionUri !== 'string') {
        return {
            ok: false,
            status: 400,
            error: 'Session VC/boost URI and assessmentQA are required in the request body',
        };
    }

    if (getCredentialSubjectDid(session) !== did || !(await db.ownsSummaryBoost(did, sessionUri))) {
        return { ok: false, status: 404, error: 'Not found' };
    }

    return {
        ok: true,
        request: { session, sessionUri, assessmentQA: assessmentQA as AssessmentQA[] },
    };
};

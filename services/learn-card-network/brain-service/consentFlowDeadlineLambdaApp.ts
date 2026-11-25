import type { Context } from 'aws-lambda';
import {
    runConsentFlowDeadlinePass,
    type ConsentFlowDeadlineSummary,
} from './src/helpers/consentflow-deadline.helpers';

/**
 * Apply expired consent review deadlines and record consent expiry and share-until events; scheduled input
 * cannot alter the cutoff.
 */
export const consentFlowDeadlineHandler = async (
    _event: unknown,
    context?: Pick<Context, 'getRemainingTimeInMillis'>
): Promise<ConsentFlowDeadlineSummary> => {
    const remainingMs = context?.getRemainingTimeInMillis() ?? 10_000;

    if (remainingMs < 2_000) return { suspended: 0, expired: 0, shareUntilPassed: 0 };

    return runConsentFlowDeadlinePass({ budgetMs: Math.min(20_000, remainingMs - 2_000) });
};

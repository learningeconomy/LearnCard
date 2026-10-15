import type { Context } from 'aws-lambda';
import {
    suspendExpiredConsentFlowTerms,
    type ConsentFlowDeadlineSummary,
} from './src/helpers/consentflow-deadline.helpers';

/** Apply expired consent review deadlines; scheduled input cannot alter the cutoff. */
export const consentFlowDeadlineHandler = async (
    _event: unknown,
    context?: Pick<Context, 'getRemainingTimeInMillis'>
): Promise<ConsentFlowDeadlineSummary> => {
    if ((context?.getRemainingTimeInMillis() ?? 10_000) < 2_000) return { suspended: 0 };
    return suspendExpiredConsentFlowTerms();
};

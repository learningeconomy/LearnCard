import { getCurrentAiSubject } from '../../ai/privacy';
import { pseudonymizeProviderInput } from '../../ai/pseudonymization';
import { getLearnCard } from '../../learncard';
import {
    AiConsentError,
    loadActiveAiConsentData,
    sameConsentAuthorization,
} from '../../learncard/consent';
import {
    generateLearnerContextPrompt,
    LearnerContextPromptError,
} from '../../services/learnerContextPrompt';
import { beginLearnCardPublication, getLearnCardRequestBudget } from '../../learncard/requestScope';

/* Credentials per call under a deadline (every MCP call): at most what one
 * direct synthesis call takes (learnerContextPrompt's
 * DIRECT_SYNTHESIS_MAX_CREDENTIALS), so a large account costs one bounded model
 * call. MCP_CONTEXT_MAX_CREDENTIALS overrides. Without a deadline every
 * consented credential is synthesized, as before. */
export const mcpContextMaxCredentials = (): number => {
    const parsed = Number(process.env.MCP_CONTEXT_MAX_CREDENTIALS);
    return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, 100) : 20;
};

export async function getLatestUserSummary(did: string, options: { synthesize?: boolean } = {}) {
    if (!did || getCurrentAiSubject() !== did) {
        throw new LearnerContextPromptError(
            401,
            'authentication_required',
            'Authentication required'
        );
    }
    const learnCard = await getLearnCard();
    const { receipt } = await loadActiveAiConsentData(learnCard, did, 'model-inference');
    // Legacy AIInsight summaries have no current source/consent provenance. Use
    // the in-app /ai/learner-context/format path instead: one consent-scoped
    // batch (bad credentials skipped, bounded concurrency, budget cutoff), the
    // prompt cache, and one fresh consent read before any model call or return.
    // Its consent read reuses this one (same request).
    const result = await generateLearnerContextPrompt(
        {
            credentialUris: receipt.credentialUris,
            personalFields: receipt.personalFields,
            detailLevel: 'expanded',
            ...(getLearnCardRequestBudget() ? { maxCredentials: mcpContextMaxCredentials() } : {}),
        },
        options
    );
    if (result.metadata.consentRevision !== receipt.revision) throw new AiConsentError();
    // This tool response goes directly to an external model, not the learner UI.
    const context = await pseudonymizeProviderInput(result.prompt);
    // Publication: read consent live, not the request's shared read.
    beginLearnCardPublication();
    const current = await loadActiveAiConsentData(learnCard, did, 'model-inference', {
        fresh: true,
    });
    if (!sameConsentAuthorization(current.receipt, receipt)) throw new AiConsentError();
    return context;
}

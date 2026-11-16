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
import { beginLearnCardPublication } from '../../learncard/requestScope';

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
    // the in-app /ai/learner-context/format path instead. Under the MCP deadline
    // every consented credential with stored ingest-verified text is included;
    // only the rest are verified live, until the budget's cutoff. Then the
    // prompt cache, and one fresh consent read before any model call or return.
    // Its consent read reuses this one (same request).
    const result = await generateLearnerContextPrompt(
        {
            credentialUris: receipt.credentialUris,
            personalFields: receipt.personalFields,
            detailLevel: 'expanded',
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

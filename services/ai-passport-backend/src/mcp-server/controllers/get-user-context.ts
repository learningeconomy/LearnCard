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
import { withToolStage } from '../tool-failure';

export async function getLatestUserSummary(did: string) {
    if (!did || getCurrentAiSubject() !== did) {
        throw new LearnerContextPromptError(
            401,
            'authentication_required',
            'Authentication required'
        );
    }
    const { learnCard, receipt } = await withToolStage('consent', async () => {
        const learnCard = await getLearnCard();
        const { receipt } = await loadActiveAiConsentData(learnCard, did, 'model-inference');
        return { learnCard, receipt };
    });
    // Legacy AIInsight summaries have no current source/consent provenance. Use
    // the in-app /ai/learner-context/format path instead: one consent-scoped
    // batch (bad credentials skipped, bounded concurrency, budget cutoff), the
    // prompt cache, and one fresh consent read before any model call or return.
    // Its consent read reuses this one (same request).
    const result = await withToolStage('learnercontext', () =>
        generateLearnerContextPrompt({
            credentialUris: receipt.credentialUris,
            personalFields: receipt.personalFields,
            detailLevel: 'expanded',
        })
    );
    await withToolStage('consent', async () => {
        if (result.metadata.consentRevision !== receipt.revision) throw new AiConsentError();
    });
    // This tool response goes directly to an external model, not the learner UI.
    const context = await withToolStage('pseudonymize', () =>
        pseudonymizeProviderInput(result.prompt)
    );
    await withToolStage('consent', async () => {
        const current = await loadActiveAiConsentData(learnCard, did, 'model-inference', {
            fresh: true,
        });
        if (!sameConsentAuthorization(current.receipt, receipt)) throw new AiConsentError();
    });
    return context;
}

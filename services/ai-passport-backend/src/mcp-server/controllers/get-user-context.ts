import { getCurrentAiSubject } from '../../ai/privacy';
import { pseudonymizeProviderInput } from '../../ai/pseudonymization';
import { getLearnCard } from '../../learncard';
import { AiConsentError, loadActiveAiConsentData } from '../../learncard/consent';
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
    // Legacy AIInsight summaries have no current source/consent provenance. Reuse
    // the owner-and-revision-scoped formatter instead, resolving signed evidence.
    // Pass the full consent receipt. generateLearnerContextPrompt uses the
    // internal parser, which does not apply the HTTP selection max of 500.
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
        const current = await loadActiveAiConsentData(learnCard, did, 'model-inference');
        if (current.receipt.revision !== receipt.revision) throw new AiConsentError();
    });
    return context;
}

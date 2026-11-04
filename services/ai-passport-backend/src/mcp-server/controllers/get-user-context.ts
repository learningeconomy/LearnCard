import { getCurrentAiSubject } from '../../ai/privacy';
import { pseudonymizeProviderInput } from '../../ai/pseudonymization';
import { getLearnCard } from '../../learncard';
import { AiConsentError, loadActiveAiConsentData } from '../../learncard/consent';
import {
    generateLearnerContextPrompt,
    LearnerContextPromptError,
    parseLearnerContextPromptRequest,
} from '../../services/learnerContextPrompt';

export async function getLatestUserSummary(did: string) {
    if (!did || getCurrentAiSubject() !== did) {
        throw new LearnerContextPromptError(
            401,
            'authentication_required',
            'Authentication required'
        );
    }
    const learnCard = await getLearnCard();
    const { receipt } = await loadActiveAiConsentData(learnCard, did, 'model-inference');
    // Legacy AIInsight summaries have no current source/consent provenance. Reuse
    // the owner-and-revision-scoped formatter instead, resolving signed evidence.
    const result = await generateLearnerContextPrompt(
        parseLearnerContextPromptRequest({
            credentialUris: receipt.credentialUris,
            personalFields: receipt.personalFields,
            detailLevel: 'expanded',
        })
    );
    if (result.metadata.consentRevision !== receipt.revision) throw new AiConsentError();
    // This tool response goes directly to an external model, not the learner UI.
    const context = await pseudonymizeProviderInput(result.prompt);
    const current = await loadActiveAiConsentData(learnCard, did, 'model-inference');
    if (current.receipt.revision !== receipt.revision) throw new AiConsentError();
    return context;
}

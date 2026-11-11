import { getCurrentAiSubject } from '../../ai/privacy';
import { pseudonymizeProviderInput } from '../../ai/pseudonymization';
import { settleCredentialBatch, type CredentialBatchResult } from '../../credentials/batch';
import { resolveVerifiedCredentialProjection } from '../../credentials/service';
import { getLearnCard } from '../../learncard';
import { AiConsentError, loadActiveAiConsentData } from '../../learncard/consent';
import { logSafeEvent } from '../../logging';
import {
    generateLearnerContextPrompt,
    LearnerContextPromptError,
    rethrowLearnerContextDependency,
} from '../../services/learnerContextPrompt';
import { withToolStage } from '../tool-failure';

const logSkippedCredentialCounts = (skipped: CredentialBatchResult<string>['skipped']): void => {
    const counts = new Map<string, number>();
    for (const item of skipped) counts.set(item.code, (counts.get(item.code) ?? 0) + 1);
    for (const [failureCode, count] of counts) {
        logSafeEvent('warn', 'credential_skipped', {
            credentialBatch: 'context',
            failureCode,
            count,
        });
    }
};

const loadSharedContextUris = async (
    did: string,
    receipt: Awaited<ReturnType<typeof loadActiveAiConsentData>>['receipt']
): Promise<string[]> => {
    const uris = [...new Set(receipt.credentialUris)];
    if (uris.length === 0) return [];
    try {
        const { loaded, skipped } = await settleCredentialBatch(
            'context',
            uris.map(uri => async () => {
                await resolveVerifiedCredentialProjection(did, uri, receipt);
                return uri;
            })
        );
        logSkippedCredentialCounts(skipped);
        return loaded;
    } catch (error) {
        rethrowLearnerContextDependency(error);
    }
};

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
    // Skip unreadable or unverifiable credentials with the same policy as in-app
    // chat (`settleCredentialBatch`) and pass only the loaded URIs downstream.
    const result = await withToolStage('learnercontext', async () => {
        const credentialUris = await loadSharedContextUris(did, receipt);
        return generateLearnerContextPrompt({
            credentialUris,
            personalFields: receipt.personalFields,
            detailLevel: 'expanded',
        });
    });
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

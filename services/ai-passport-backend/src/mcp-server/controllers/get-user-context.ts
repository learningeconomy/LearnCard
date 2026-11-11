import { getCurrentAiSubject } from '../../ai/privacy';
import { CREDENTIAL_PRELOAD_CONCURRENCY } from '../../constants/env';
import { pseudonymizeProviderInput } from '../../ai/pseudonymization';
import {
    emptyBatchSkipCountsOf,
    isCredentialItemFailure,
    settleCredentialBatch,
    type CredentialBatchResult,
} from '../../credentials/batch';
import {
    attachVerifyFailureDiagnostics,
    withCauseStep,
} from '../../credentials/verify-diagnostics';
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
    const counts = new Map<CredentialBatchResult<string>['skipped'][number]['code'], number>();
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
    try {
        const uris = await withCauseStep('uri_list', async () => [
            ...new Set(receipt.credentialUris),
        ]);
        if (uris.length === 0) return [];
        const { tasks, concurrency } = await withCauseStep('batch_setup', async () => ({
            concurrency: CREDENTIAL_PRELOAD_CONCURRENCY,
            tasks: uris.map(uri => async () => {
                await withCauseStep('projection', () =>
                    resolveVerifiedCredentialProjection(did, uri, receipt)
                );
                return uri;
            }),
        }));
        const { loaded, skipped } = await withCauseStep('batch', () =>
            settleCredentialBatch('context', tasks, { concurrency })
        );
        logSkippedCredentialCounts(skipped);
        return loaded;
    } catch (error) {
        if (isCredentialItemFailure(error)) {
            const wrapper = new Error('All credentials were skipped', { cause: error });
            wrapper.name = 'CredentialBatchEmptyError';
            Object.assign(wrapper, { code: 'all_skipped' });
            attachVerifyFailureDiagnostics(wrapper, {
                kind: 'all_skipped',
                skipCounts: emptyBatchSkipCountsOf(error),
            });
            return rethrowLearnerContextDependency(wrapper, 'verify');
        }
        return rethrowLearnerContextDependency(error, 'verify');
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

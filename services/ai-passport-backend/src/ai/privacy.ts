import { withAiInsightStage } from '../diagnostics/ai-insight';
import { AsyncLocalStorage } from 'node:async_hooks';

import type { ActiveAiConsentReceipt, AiConsentPurpose } from '../learncard/consent';

type AiPrivacyContext = {
    did: string;
    consentRevision?: string;
    personalFields?: Record<string, string>;
    credentialUris?: string[];
};

const privacyContext = new AsyncLocalStorage<AiPrivacyContext>();

export const runWithAiPrivacyContext = <Result>(did: string, callback: () => Result): Result => {
    if (!did.trim()) throw new Error('Authenticated AI subject is required');

    return privacyContext.run({ did }, callback);
};

export const getCurrentAiSubject = (): string | undefined => privacyContext.getStore()?.did;

export const getCurrentAiPersonalFields = (): Record<string, string> =>
    privacyContext.getStore()?.personalFields ?? {};
export const getCurrentAiCredentialUris = (): readonly string[] =>
    privacyContext.getStore()?.credentialUris ?? [];

// Bind the entire operation to its first live grant. A later provider check
// cannot authorize context assembled under a different revision.
export const bindAiConsentRevision = (
    did: string,
    revision: string,
    personalFields?: Record<string, string>,
    credentialUris?: string[]
): boolean => {
    const context = privacyContext.getStore();
    if (!context) return true;
    if (context.did !== did || (context.consentRevision && context.consentRevision !== revision))
        return false;
    context.consentRevision = revision;
    if (personalFields) context.personalFields = { ...personalFields };
    if (credentialUris) context.credentialUris = [...credentialUris];
    return true;
};

export type AiConsentCheckOptions = {
    /**
     * Stop waiting on LearnCard when this aborts. Defaults to the LearnCard
     * request scope's signal; the consent page read also has its own timeout.
     */
    signal?: AbortSignal;
    /**
     * Read the consent contract again instead of reusing the request's shared
     * read. Required before provider dispatch and before publishing a result.
     */
    fresh?: boolean;
    /**
     * With `fresh`: inside one AI call, reuse that call's newest read instead of
     * reading again. For the audit, guardrail and Nova boundaries, which run
     * several times per call. The next AI call always reads again.
     */
    oncePerAiCall?: boolean;
};

const assertAiConsent = async (
    purpose: AiConsentPurpose,
    options: AiConsentCheckOptions
): Promise<ActiveAiConsentReceipt> => {
    const did = getCurrentAiSubject();
    // Consent and LearnCard depend on DB consumers of this context; defer that
    // dependency cycle until the context module is fully initialized.
    const { AiConsentError, loadActiveAiConsentData } = await import('../learncard/consent');

    if (!did) throw new AiConsentError('Authenticated AI subject is required');
    const { assertOwnerOperationActive } = await import('../services/dataErasure');
    await assertOwnerOperationActive(did);

    const { getLearnCard } = await import('../learncard');
    options.signal?.throwIfAborted();
    // A consent gate fails the whole AI call without LearnCard, so a transient
    // init failure gets one fresh init here instead of the cached failure. The
    // check itself still fails closed if LearnCard stays down.
    const learnCard = await getLearnCard({
        signal: options.signal,
        retryTransientFailure: true,
    });
    const { receipt } = await loadActiveAiConsentData(learnCard, did, purpose, {
        signal: options.signal,
        fresh: options.fresh,
        oncePerAiCall: options.oncePerAiCall,
    });

    return receipt;
};

export const assertCurrentAiConsent = (
    purpose: AiConsentPurpose,
    options: AiConsentCheckOptions = {}
): Promise<ActiveAiConsentReceipt> =>
    withAiInsightStage('consent', () => assertAiConsent(purpose, options));

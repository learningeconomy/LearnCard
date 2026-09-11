import { z } from 'zod';
import {
    aiPassportFetch,
    ensureAiPassportSession,
    getAiPassportAuthMode,
} from 'learn-card-base/helpers/aiPassportAuth';
import { addActiveLocaleToUrl } from 'learn-card-base/i18n';
import { networkStore } from 'learn-card-base/stores/NetworkStore';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';

export type LearnerContextRequestOptions = {
    includeCredentials?: boolean;
    includePersonalData?: boolean;
    format?: 'prompt' | 'structured';
    instructions?: string;
    detailLevel?: 'compact' | 'expanded';
    waitForSync?: boolean;
};

export type LearnerContextSourceData = {
    appId: string;
    did: string;
    credentialUris: string[];
    personalData?: Record<string, unknown>;
    displayName?: string;
};

export type LearnerContextSelection = {
    credentialUris: string[];
    personalFields: string[];
    instructions?: string;
    detailLevel: 'compact' | 'expanded';
    includeStructuredContext: boolean;
    maxCredentials?: number;
};

const LearnerContextFormatResponseValidator = z.object({
    prompt: z.string().refine(value => value.trim().length > 0),
    metadata: z
        .object({
            consentRevision: z.string().refine(value => value.trim().length > 0),
            promptCacheHit: z.boolean().optional(),
        })
        .catchall(z.unknown()),
    structuredContext: z.unknown().optional(),
});
export type LearnerContextFormatResponse = z.infer<typeof LearnerContextFormatResponseValidator>;

export const formatLearnerContext = async (
    wallet: BespokeLearnCard,
    selection: LearnerContextSelection
): Promise<LearnerContextFormatResponse> => {
    const did = wallet.id.did();
    if (!did) throw new Error('Learner context requires a current wallet identity');
    const serviceUrl = networkStore.get.aiServiceUrl().trim().replace(/\/+$/, '');
    if (!serviceUrl) throw new Error('AI Passport service is not configured');
    if (selection.credentialUris.length > 500 || selection.personalFields.length > 100) {
        throw new Error('Learner context selection exceeds the supported limit');
    }
    if ((selection.instructions?.length ?? 0) > 8000) {
        throw new Error('Learner context instructions exceed 8000 characters');
    }
    if (
        selection.maxCredentials !== undefined &&
        (!Number.isSafeInteger(selection.maxCredentials) || selection.maxCredentials <= 0)
    ) {
        throw new Error('maxCredentials must be a positive integer');
    }
    if ((await ensureAiPassportSession(wallet)) !== 'session') {
        throw new Error('Learner context requires AI Passport session authentication');
    }
    if (
        wallet.id.did() !== did ||
        networkStore.get.aiServiceUrl().trim().replace(/\/+$/, '') !== serviceUrl
    ) {
        throw new Error('Learner context identity or service changed during authentication');
    }
    const response = await aiPassportFetch(
        addActiveLocaleToUrl(`${serviceUrl}/ai/learner-context/format`),
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                credentialUris: selection.credentialUris,
                personalFields: selection.personalFields,
                instructions: selection.instructions,
                detailLevel: selection.detailLevel,
                includeStructuredContext: selection.includeStructuredContext,
                maxCredentials: selection.maxCredentials,
            }),
        },
        did
    );
    const data: unknown = await response.json();
    if (
        getAiPassportAuthMode(did) !== 'session' ||
        wallet.id.did() !== did ||
        networkStore.get.aiServiceUrl().trim().replace(/\/+$/, '') !== serviceUrl
    ) {
        throw new Error('Learner context session identity or service changed');
    }
    if (!response.ok) {
        const error = z.object({ error: z.string() }).safeParse(data);
        throw new Error(
            error.success ? error.data.error : `Learner context request failed (${response.status})`
        );
    }
    const parsed = LearnerContextFormatResponseValidator.safeParse(data);
    if (!parsed.success) {
        throw new Error('Learner context response is missing a prompt or current consent evidence');
    }
    return parsed.data;
};

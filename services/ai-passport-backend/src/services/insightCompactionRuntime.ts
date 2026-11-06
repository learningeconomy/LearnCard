import { createHmac } from 'node:crypto';
import { aiCall } from '../ai';
import { getCurrentLocale, normalizeAiLocale, appendLocaleInstruction } from '../ai/locale';
import { assertCurrentAiConsent, getCurrentAiPersonalFields } from '../ai/privacy';
import { getPrivacyKeyMaterial } from '../ai/privacy-keys';
import { CHAT_MODEL } from '../constants/env';
import { db } from '../db';
import { AiConsentError } from '../learncard/consent';
import { assertOwnerOperationActive } from './dataErasure';
import { measureProviderInputSize } from '../ai/pseudonymization';
import {
    buildFullEvidenceInsightPrompt,
    INSIGHT_COMPACTION_VERSION,
    InsightCohortSummaryValidator,
    type InsightEvidencePlan,
} from './insightCompaction';

export const compactInsightEvidence = async (
    did: string,
    consentRevision: string,
    plan: InsightEvidencePlan
) => {
    const scope = {
        did,
        consentRevision,
        model: CHAT_MODEL,
        locale: normalizeAiLocale(getCurrentLocale()),
        version: INSIGHT_COMPACTION_VERSION,
        personalFields: getCurrentAiPersonalFields(),
    };
    const assertFresh = async () => {
        await assertOwnerOperationActive(did);
        const receipt = await assertCurrentAiConsent('model-inference');
        if (receipt.revision !== consentRevision) throw new AiConsentError();
    };
    return buildFullEvidenceInsightPrompt(plan, {
        measure: measureProviderInputSize,
        hash: value =>
            createHmac('sha256', getPrivacyKeyMaterial().reference)
                .update(JSON.stringify({ scope, value }))
                .digest('hex'),
        assertFresh,
        read: async hash => {
            const cached = await db.getCredentialSummaryByHash(did, consentRevision, hash);
            if (!cached) return undefined;
            if (cached.did !== did || cached.consentRevision !== consentRevision)
                throw new AiConsentError();
            if (cached.version !== INSIGHT_COMPACTION_VERSION || cached.model !== CHAT_MODEL)
                return undefined;
            return cached.summary;
        },
        write: (hash, summary) =>
            db.upsertCredentialSummaryByHash({
                did,
                consentRevision,
                hash,
                summary,
                model: CHAT_MODEL,
                version: INSIGHT_COMPACTION_VERSION,
            }),
        summarize: input =>
            aiCall({
                ...input,
                model: CHAT_MODEL,
                output: InsightCohortSummaryValidator,
                timeoutMs: 60_000,
            }),
        systemSuffix: appendLocaleInstruction(getCurrentLocale()),
    });
};

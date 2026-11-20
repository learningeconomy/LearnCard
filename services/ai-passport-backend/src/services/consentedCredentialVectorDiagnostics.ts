import { assertCurrentAiConsent, getCurrentAiSubject } from '../ai/privacy';
import { currentGeneration, type EmbeddingGeneration } from '../ai/embedding-generation';
import { withSearchGeneration } from '../ai/read-generation';
import { getCredentialVectorCoverage, CREDENTIAL_VECTOR_COLLECTION_COUNT } from '../db/qdrant';
import { AiConsentError } from '../learncard/consent';

export type ConsentedCredentialVectorDiagnostics = {
    generation: EmbeddingGeneration;
    consentRevision: string;
    missingUris: string[];
    partialUris: string[];
    indexedUris: string[];
};

/**
 * Read-only vector presence for the current owner's consented URIs. Run inside
 * the owner's AI privacy context and owner operation, like the MCP controllers.
 * Counts physical points in the effective read generation, not search hits:
 * indexed URIs may still be ineligible due to stale provenance or low relevance.
 * Keep this report private; it contains credential URIs and is not model context.
 */
export const diagnoseConsentedCredentialVectors = (
    did: string
): Promise<ConsentedCredentialVectorDiagnostics> =>
    withSearchGeneration(async () => {
        if (getCurrentAiSubject() !== did) throw new AiConsentError();
        const receipt = await assertCurrentAiConsent('model-inference', { fresh: true });
        const uris = [...new Set(receipt.credentialUris)];
        const coverage = await getCredentialVectorCoverage(did, uris);
        const report: ConsentedCredentialVectorDiagnostics = {
            generation: currentGeneration(),
            consentRevision: receipt.revision,
            missingUris: [],
            partialUris: [],
            indexedUris: [],
        };
        for (const uri of uris) {
            const count = coverage.get(uri)?.size ?? 0;
            if (!count) report.missingUris.push(uri);
            else if (count < CREDENTIAL_VECTOR_COLLECTION_COUNT) report.partialUris.push(uri);
            else report.indexedUris.push(uri);
        }
        await assertCurrentAiConsent('model-inference', { fresh: true });
        return report;
    });

import { beforeEach, describe, expect, it, mock } from 'bun:test';
import type { ActiveAiConsentReceipt } from '../learncard/consent';

process.env.MONGO_URI ||= 'mongodb://localhost:27017/test';
process.env.AI_PRIVACY_KEY ||= Buffer.alloc(32, 9).toString('base64');

const OWNER = 'did:example:learner';
const receipt: ActiveAiConsentReceipt = {
    contractUri: 'lc:network:ai-contract',
    receiptId: 'receipt-1',
    status: 'live',
    updatedAt: '2026-09-01T00:00:00.000Z',
    contractUpdatedAt: '2026-09-01T00:00:00.000Z',
    categories: ['Achievement'],
    credentialUris: ['lc:math', 'lc:design', 'lc:summary', 'lc:design'],
    personalFields: [],
    purpose: 'model-inference',
    revision: 'revision-1',
    guardian: { required: false, approved: false },
};
let currentReceipt = receipt;
let afterCoverage: (() => void) | undefined;
const getCredentialVectorCoverage = mock(async (_did: string, _uris: string[]) => {
    afterCoverage?.();
    return new Map([
        ['lc:math', new Set(['full', 'domain', 'claims', 'technical', 'comparison'])],
        ['lc:design', new Set(['full'])],
        ['lc:summary', new Set<string>()],
        ['lc:unconsented', new Set<string>()],
    ]);
});
const { AiConsentError } = await import('../learncard/consent');
mock.module('../learncard/consent', () => ({
    AiConsentError,
    loadActiveAiConsentData: async (_learnCard: unknown, did: string) => {
        if (!bindAiConsentRevision(did, currentReceipt.revision)) throw new AiConsentError();
        return { records: [], receipt: structuredClone(currentReceipt) };
    },
}));
mock.module('../learncard', () => ({ getLearnCard: async () => ({}) }));
mock.module('../services/dataErasure', () => ({ assertOwnerOperationActive: async () => {} }));
mock.module('../db/qdrant', () => ({
    getCredentialVectorCoverage,
    CREDENTIAL_VECTOR_COLLECTION_COUNT: 5,
}));
const { bindAiConsentRevision, runWithAiPrivacyContext } = await import('../ai/privacy');
const { withEmbeddingGeneration } = await import('../ai/embedding-generation');
const { diagnoseConsentedCredentialVectors } =
    await import('./consentedCredentialVectorDiagnostics');

beforeEach(() => {
    currentReceipt = receipt;
    afterCoverage = undefined;
    getCredentialVectorCoverage.mockClear();
});

describe('consented credential vector diagnostics', () => {
    for (const generation of ['openai1536', 'nova1024v1'] as const) {
        it(`lists missing and partial consented URIs in the pinned ${generation} generation`, async () => {
            const report = await withEmbeddingGeneration(generation, () =>
                runWithAiPrivacyContext(OWNER, () => diagnoseConsentedCredentialVectors(OWNER))
            );
            expect(report).toEqual({
                generation,
                consentRevision: 'revision-1',
                missingUris: ['lc:summary'],
                partialUris: ['lc:design'],
                indexedUris: ['lc:math'],
            });
            expect(getCredentialVectorCoverage).toHaveBeenCalledWith(OWNER, [
                'lc:math',
                'lc:design',
                'lc:summary',
            ]);
            expect(JSON.stringify(report)).not.toContain('lc:unconsented');
        });
    }

    it('rejects another owner before reading Qdrant', async () => {
        await expect(
            runWithAiPrivacyContext(OWNER, () =>
                diagnoseConsentedCredentialVectors('did:example:foreign')
            )
        ).rejects.toBeInstanceOf(AiConsentError);
        expect(getCredentialVectorCoverage).not.toHaveBeenCalled();
    });

    it('does not publish a report assembled under a different consent revision', async () => {
        afterCoverage = () => {
            currentReceipt = { ...receipt, revision: 'changed' };
        };
        await expect(
            runWithAiPrivacyContext(OWNER, () => diagnoseConsentedCredentialVectors(OWNER))
        ).rejects.toBeInstanceOf(AiConsentError);
    });

    it('reports no missing embeddings for an empty consented set', async () => {
        currentReceipt = { ...receipt, credentialUris: [] };
        const report = await runWithAiPrivacyContext(OWNER, () =>
            diagnoseConsentedCredentialVectors(OWNER)
        );
        expect(report.missingUris).toEqual([]);
        expect(report.partialUris).toEqual([]);
        expect(report.indexedUris).toEqual([]);
    });
});

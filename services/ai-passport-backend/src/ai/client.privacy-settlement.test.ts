import { afterAll, expect, mock, test } from 'bun:test';
import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';

mock.module('./privacy-keys', () => ({
    getPrivacySubjectRef: (did: string) => createHash('sha256').update(did).digest('hex'),
    getPrivacyKeyMaterial: () => ({ erasureRequest: Buffer.alloc(32, 9) }),
}));
const { default: cache } = await import('../utils/cache');
const { withOwnerOperation, assertOwnerOperationActive } = await import('../services/dataErasure');
const { createAiAuditBoundary, AiAuditPersistenceError } = await import('./audit');
const { runAiInsightDiagnostics, withAiInsightStage } = await import('../diagnostics/ai-insight');
const owner = `did:example:synthetic-${randomUUID()}`;
let release = Promise.withResolvers<void>();
let entered = Promise.withResolvers<void>();
const primary = new Error('synthetic privacy failure');
const siblingFailures: unknown[] = [];
const providerCall = mock(async () => ({ answer: 'synthetic result' }));
let nextEvent = 0;
const rows = new Set<string>();
const boundary = createAiAuditBoundary({
    getSubject: () => owner,
    subjectReference: () => 'a'.repeat(64),
    assertConsent: async () => {
        await assertOwnerOperationActive(owner);
        return {
            contractUri: 'lc:contract:synthetic',
            receiptId: 'synthetic',
            status: 'live',
            grantedAt: '2026-10-01T00:00:00Z',
            updatedAt: '2026-10-01T00:00:00Z',
            contractUpdatedAt: '2026-10-01T00:00:00Z',
            categories: [],
            credentialUris: [],
            personalFields: [],
            guardian: { required: false, approved: false },
            purpose: 'model-inference',
            revision: 'synthetic',
        };
    },
    persist: async event => {
        await assertOwnerOperationActive(owner);
        rows.add(event.eventId);
    },
    complete: async eventId => {
        await assertOwnerOperationActive(owner);
        return rows.delete(eventId);
    },
    now: () => new Date('2026-10-01T00:00:00Z'),
    elapsed: () => 0,
    eventId: () => {
        nextEvent += 1;
        return `00000000-0000-4000-8000-${String(nextEvent).padStart(12, '0')}`;
    },
});
mock.module('./audit', () => ({ withAiAudit: boundary }));
mock.module('./privacy', () => ({
    assertCurrentAiConsent: async () => {
        await assertOwnerOperationActive(owner);
    },
    getCurrentAiSubject: () => owner,
    getCurrentAiPersonalFields: () => ({}),
    getCurrentAiCredentialUris: () => [],
    bindAiConsentRevision: () => true,
}));
mock.module('./pseudonymization', () => ({
    pseudonymizeProviderInput: async (value: unknown) =>
        withAiInsightStage('privacy_filter', async () => {
            if (typeof value === 'string' && value.startsWith('synthetic-system')) {
                await entered.promise;
                throw primary;
            }
            entered.resolve();
            await release.promise;
            try {
                return await boundary(
                    {
                        provider: 'bedrock',
                        model: 'synthetic-guardrail',
                        operation: 'guardrail',
                        purpose: 'model-inference',
                    },
                    async () => value
                );
            } catch (error) {
                siblingFailures.push(error);
                throw error;
            }
        }),
    restoreProviderOutput: async (value: unknown) => value,
}));
class Provider {
    call = providerCall;
    streamingCall = providerCall;
}
class OpenAi {
    embeddings = { create: providerCall };
    chat = { completions: { create: providerCall } };
}
mock.module('openai', () => ({ default: OpenAi }));
mock.module('./bedrock-responses', () => ({
    BedrockResponsesProvider: Provider,
    getReasoningConfig: () => undefined,
    parseOpenAIModelAlias: (model: string) => ({ apiModel: model }),
}));
mock.module('./anthropic', () => ({ AnthropicProvider: Provider }));
mock.module('./google', () => ({ GoogleProvider: Provider }));
const { aiCall, streamingAiCall, streamingStructuredAiCall } = await import('./client');
afterAll(async () => {
    await cache.redis?.quit();
});

for (const mode of ['structured', 'streaming', 'structured-streaming'] as const) {
    test(`${mode} privacy failure drains its sibling before audit completion and owner-scope release`, async () => {
        release = Promise.withResolvers<void>();
        entered = Promise.withResolvers<void>();
        siblingFailures.length = 0;
        rows.clear();
        providerCall.mockClear();
        let settled = false;
        const input = {
            systemPrompt: 'synthetic-system',
            message: 'synthetic-message',
            output: z.object({ answer: z.string() }),
            model: 'gpt-6.1-sol',
            toolName: 'synthetic_answer',
            onPartial: () => {},
            timeoutMs: 1000,
        };
        const call = async (): Promise<unknown> => {
            if (mode === 'structured') return aiCall(input);
            if (mode === 'streaming') return streamingAiCall(input);
            return streamingStructuredAiCall(input);
        };
        const operation = withOwnerOperation(owner, () => runAiInsightDiagnostics(call));
        const outcome = operation.then(
            () => {
                settled = true;
            },
            () => {
                settled = true;
            }
        );
        try {
            await entered.promise;
            await Bun.sleep(20);
            expect(settled).toBe(false);
        } finally {
            release.resolve();
            await outcome;
        }
        await expect(operation).rejects.toBe(primary);
        await Bun.sleep(10);
        expect(
            siblingFailures.filter(error => error instanceof AiAuditPersistenceError)
        ).toHaveLength(0);
        expect(siblingFailures).toHaveLength(0);
        expect(providerCall).not.toHaveBeenCalled();
        expect(rows.size).toBe(0);
    });
}

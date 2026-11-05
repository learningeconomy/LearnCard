import { expect, mock, test } from 'bun:test';
import { z } from 'zod';

const providerCall = mock(async () => ({ answer: 'provider-contacted' }));
const providerStreamingCall = mock(async () => 'provider-contacted');
const embeddingCreate = mock(async () => ({ data: [] }));
const structuredStreamingCreate = mock(async () => {
    throw new Error('provider-contacted');
});
const assertCurrentAiConsent = mock(async (_purpose: 'model-inference' | 'embedding') => {
    throw new Error('consent denied');
});

class TestProvider {
    call = providerCall;
    streamingCall = providerStreamingCall;
    structuredStreamingCall = structuredStreamingCreate;
}

class TestOpenAi {
    embeddings = { create: embeddingCreate };
}

mock.module('openai', () => ({ default: TestOpenAi }));
mock.module('./bedrock-responses', () => ({
    BedrockResponsesProvider: TestProvider,
}));
mock.module('./privacy', () => ({
    assertCurrentAiConsent,
    getCurrentAiSubject: () => 'did:example:learner',
    getCurrentAiPersonalFields: () => ({}),
    getCurrentAiCredentialUris: () => [],
    bindAiConsentRevision: () => true,
}));
mock.module('./audit', () => ({
    withAiAudit: async (
        operation: { purpose: 'model-inference' | 'embedding' },
        callback: () => Promise<unknown>
    ) => {
        await assertCurrentAiConsent(operation.purpose);

        return callback();
    },
}));
mock.module('./provider-circuit', () => ({
    withAiProviderCircuit: async (_provider: string, callback: () => Promise<unknown>) =>
        callback(),
}));
mock.module('./pseudonymization', () => ({
    pseudonymizeProviderInput: async () => {
        throw new Error('Denied work must not transform private input');
    },
    restoreProviderOutput: async () => {
        throw new Error('Denied work must not restore output');
    },
}));

const { aiCall, embeddingAiCall, streamingAiCall, streamingStructuredAiCall } =
    await import('./client');

test('denies structured, streaming, structured streaming, and embedding calls before provider invocation', async () => {
    await expect(
        aiCall({
            message: 'private input',
            output: z.object({ answer: z.string() }),
        })
    ).rejects.toThrow('consent denied');
    await expect(streamingAiCall({ message: 'private input' })).rejects.toThrow('consent denied');
    await expect(embeddingAiCall(['private input'])).rejects.toThrow('consent denied');
    await expect(
        streamingStructuredAiCall({
            systemPrompt: 'private input',
            message: 'private input',
            output: z.object({ answer: z.string() }),
            model: 'gpt-6.1-sol',
            toolName: 'answer',
            timeoutMs: 1_000,
            onPartial: () => {
                throw new Error('partial callback must not run');
            },
        })
    ).rejects.toThrow('consent denied');

    expect(assertCurrentAiConsent).toHaveBeenCalledTimes(4);
    expect(providerCall).not.toHaveBeenCalled();
    expect(providerStreamingCall).not.toHaveBeenCalled();
    expect(embeddingCreate).not.toHaveBeenCalled();
    expect(structuredStreamingCreate).not.toHaveBeenCalled();
});

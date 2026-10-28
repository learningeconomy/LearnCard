import { expect, mock, test } from 'bun:test';
import { z } from 'zod';
import type { StreamingOptions } from './providers';
import * as environment from '../constants/env';

mock.module('../constants/env', () => ({
    ...environment,
    CHAT_MODEL: 'gpt-6-luna-none',
}));

let structuredInput: Record<string, unknown> | undefined;
let streamingInput: Record<string, unknown> | undefined;
let embeddingInput: string[] | undefined;
let streamingSuffix = '!';
let rejectOutput = false;
let _structuredStreamingInput: Record<string, unknown> | undefined;
const auditedOperations: { provider: string; model: string; operation: string }[] = [];
const circuitRecipients: string[] = [];
const token = `{{NAME_${'a'.repeat(32)}}}`;
const assertCurrentAiConsent = mock(async () => undefined);

const replaceText = <Value>(value: Value, from: string, to: string): Value => {
    if (typeof value === 'string') return value.replaceAll(from, to) as Value;
    if (Array.isArray(value)) return value.map(item => replaceText(item, from, to)) as Value;
    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([key, item]) => [key, replaceText(item, from, to)])
        ) as Value;
    }
    return value;
};

const restoreProviderOutput = mock(async <Value>(value: Value) =>
    replaceText(value, token, 'Taylor')
);
const filterOutput = mock(async <Value>(value: Value) => {
    if (rejectOutput) throw new Error('output filter unavailable');
    return replaceText(value, 'Unlisted Visitor', '{NAME}');
});

class TestProvider {
    call = async (input: Record<string, unknown>) => {
        structuredInput = input;
        return { answer: `Hello ${token}` };
    };

    streamingCall = async (input: Record<string, unknown> & { options: StreamingOptions }) => {
        streamingInput = input;
        for (const chunk of ['Hello ', token.slice(0, 8), token.slice(8), ...streamingSuffix]) {
            await input.options.onChunk?.(chunk);
        }
        return input.options.accumulateContent ? `Hello ${token}${streamingSuffix}` : '';
    };

    structuredStreamingCall = async (
        input: Record<string, unknown> & {
            onPartial: (value: unknown) => Promise<void>;
        }
    ) => {
        _structuredStreamingInput = input;
        await input.onPartial({ answer: `Hello ${token}` });
        await input.onPartial({ answer: `Hello ${token}`, done: true });
        return { answer: `Hello ${token}`, done: true };
    };
}

class TestOpenAi {
    embeddings = {
        create: async ({ input }: { input: string[] }) => {
            embeddingInput = input;
            return { data: [{ index: 0, embedding: [0.1, 0.2] }] };
        },
    };
}

mock.module('openai', () => ({ default: TestOpenAi }));
mock.module('./bedrock-responses', () => ({
    BedrockResponsesProvider: TestProvider,
}));
mock.module('./pseudonymization', () => ({
    pseudonymizeProviderInput: async <Value>(value: Value, source = 'INPUT') => {
        const masked = replaceText(value, 'Taylor', token);
        return source === 'OUTPUT' ? filterOutput(masked) : masked;
    },
    restoreProviderOutput,
}));
mock.module('./audit', () => ({
    withAiAudit: async (
        operation: { provider: string; model: string; operation: string },
        callback: () => Promise<unknown>
    ) => {
        auditedOperations.push(operation);
        return callback();
    },
}));
mock.module('./provider-circuit', () => ({
    withAiProviderCircuit: async (provider: string, callback: () => Promise<unknown>) => {
        circuitRecipients.push(provider);
        return callback();
    },
}));

mock.module('./privacy', () => ({
    assertCurrentAiConsent,
    getCurrentAiSubject: () => 'did:example:learner',
}));
mock.module('../services/credentialSearch', () => ({
    searchCredentialsByTopic: async () => [
        {
            title: "Taylor's algebra",
            type: 'Achievement',
            score: 1,
            context: 'Algebra',
        },
    ],
}));
mock.module('../learncard/consent', () => ({
    AiConsentError: class extends Error {
        constructor() {
            super('AI consent required');
        }
    },
}));
// Import after mocks to exercise the real gateway with isolated provider I/O.
const { aiCall, embeddingAiCall, streamingAiCall, streamingStructuredAiCall } =
    await import('./client');
const { getAnswerAboutUser } = await import('../mcp-server/controllers/get-answer-about-user');

test('keeps provider inputs pseudonymous while returning restored authenticated output', async () => {
    expect(
        await aiCall({
            systemPrompt: 'Help Taylor',
            message: 'Teach Taylor',
            output: z.object({ answer: z.string() }),
        })
    ).toEqual({ answer: 'Hello Taylor' });

    const chunks: string[] = [];
    const result = await streamingAiCall({
        systemPrompt: 'Guide Taylor',
        message: 'Coach Taylor',
        options: {
            onChunk: async chunk => {
                chunks.push(chunk);
            },
        },
    });
    expect(chunks).toEqual(['Hello ', 'Taylor', '!']);
    expect(result).toBe(chunks.join(''));
    expect(await embeddingAiCall(['Profile for Taylor'])).toEqual([[0.1, 0.2]]);
    expect(structuredInput?.systemPrompt).not.toContain('Taylor');
    expect(structuredInput?.message).toBe(`Teach ${token}`);
    expect(streamingInput?.systemPrompt).not.toContain('Taylor');
    expect(streamingInput?.message).toBe(`Coach ${token}`);
    expect(embeddingInput).toEqual([`Profile for ${token}`]);
    expect(auditedOperations.map(({ provider, operation }) => ({ provider, operation }))).toEqual([
        { provider: 'bedrock', operation: 'structured-output' },
        { provider: 'bedrock', operation: 'streaming-output' },
        { provider: 'openai', operation: 'embedding' },
    ]);
    expect(auditedOperations.slice(0, 2).map(({ model }) => model)).toEqual([
        'us.openai.gpt-6-luna',
        'us.openai.gpt-6-luna',
    ]);
    expect(circuitRecipients).toEqual(['bedrock', 'bedrock', 'openai']);
});

test('restores validated native structured partials for the authenticated learner', async () => {
    const partials: unknown[] = [];
    const result = await streamingStructuredAiCall({
        systemPrompt: 'Help Taylor',
        message: 'Teach Taylor',
        model: 'gpt-6-luna-none',
        output: z.object({ answer: z.string(), done: z.boolean() }),
        toolName: 'answer',
        timeoutMs: 1_000,
        onPartial: async partial => {
            partials.push(partial);
        },
    });
    expect(partials).toEqual([{ answer: 'Hello Taylor' }, { answer: 'Hello Taylor', done: true }]);
    expect(result).toEqual({ answer: 'Hello Taylor', done: true });
    expect(auditedOperations.at(-1)).toEqual(
        expect.objectContaining({
            provider: 'bedrock',
            model: 'us.openai.gpt-6-luna',
            operation: 'structured-streaming-output',
        })
    );
    expect(circuitRecipients.at(-1)).toBe('bedrock');
});

test('rejects revoked consent after preprocessing before sending or returning model output', async () => {
    structuredInput = undefined;
    assertCurrentAiConsent.mockRejectedValueOnce(new Error('consent revoked'));
    await expect(
        aiCall({
            message: 'Teach Taylor',
            output: z.object({ answer: z.string() }),
        })
    ).rejects.toThrow('consent revoked');
    expect(structuredInput).toBeUndefined();

    assertCurrentAiConsent
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('consent revoked'));
    await expect(
        aiCall({
            message: 'Teach Taylor',
            output: z.object({ answer: z.string() }),
        })
    ).rejects.toThrow('consent revoked');
    expect(structuredInput).toEqual(expect.objectContaining({ message: `Teach ${token}` }));
});

test('external-model output stays masked and is checked before any callback', async () => {
    const restoresBefore = restoreProviderOutput.mock.calls.length;
    streamingSuffix = ' and Unlisted Visitor!';
    try {
        for (const accumulateContent of [true, false]) {
            const chunks: string[] = [];
            const result = await streamingAiCall({
                message: 'Coach Taylor',
                options: {
                    audience: 'external-model',
                    accumulateContent,
                    onChunk: async chunk => {
                        chunks.push(chunk);
                    },
                },
            });
            expect(chunks).toEqual([`Hello ${token} and {NAME}!`]);
            expect(result).toBe(accumulateContent ? chunks.join('') : '');
        }
        expect(filterOutput).toHaveBeenCalledWith(`Hello ${token} and Unlisted Visitor!`);
        expect(restoreProviderOutput.mock.calls.length).toBe(restoresBefore);
    } finally {
        streamingSuffix = '!';
    }
});

test('external-model callbacks receive nothing when output filtering fails', async () => {
    const onChunk = mock(async (_chunk: string) => undefined);
    rejectOutput = true;
    try {
        await expect(
            streamingAiCall({
                message: 'Coach Taylor',
                options: { audience: 'external-model', onChunk },
            })
        ).rejects.toThrow('output filter unavailable');
        expect(onChunk).not.toHaveBeenCalled();
    } finally {
        rejectOutput = false;
    }
});

test('external-model callbacks receive nothing if consent is revoked during generation', async () => {
    const onChunk = mock(async (_chunk: string) => undefined);
    assertCurrentAiConsent
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('consent revoked'));
    await expect(
        streamingAiCall({
            message: 'Coach Taylor',
            options: { audience: 'external-model', onChunk },
        })
    ).rejects.toThrow('consent revoked');
    expect(onChunk).not.toHaveBeenCalled();
});

test('MCP answer controller returns protected output and rejects another owner', async () => {
    expect(await getAnswerAboutUser('did:example:learner', 'What can Taylor do?')).toBe(
        `Hello ${token}!`
    );
    streamingInput = undefined;
    await expect(getAnswerAboutUser('did:example:other', 'What can they do?')).rejects.toThrow();
    expect(streamingInput).toBeUndefined();
});

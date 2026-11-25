import { beforeEach, expect, mock, test } from 'bun:test';
import { z } from 'zod';
import { BedrockResponsesProvider } from './bedrock-responses';
import { createBedrockResponsesClient } from './bedrock-generation';
import type { ConverseStreamOutput } from '@aws-sdk/client-bedrock-runtime';
import { textEvents, toolEvents } from './bedrock-test-fixture';

// Translate fixed fixture events only; the production Responses serializer/SSE decoder is real.
function responseFixture() {
    const requests: { body: unknown }[] = [];
    let source: ConverseStreamOutput[] = [];
    const client = createBedrockResponsesClient(
        {},
        async (_url: RequestInfo | URL, options?: RequestInit) => {
            requests.push({ body: JSON.parse(options?.body as string) });
            const events: unknown[] = [];
            let name: string | undefined;
            let args = '';
            const call = () => ({
                type: 'function_call',
                id: 'item-1',
                call_id: 'call-1',
                name,
                arguments: args,
                status: 'completed',
            });
            for (const event of source) {
                if (event.contentBlockStart?.start?.toolUse) {
                    name = event.contentBlockStart.start.toolUse.name;
                    events.push({
                        type: 'response.output_item.added',
                        output_index: 0,
                        item: { ...call(), status: 'in_progress' },
                    });
                } else if (event.contentBlockDelta?.delta?.toolUse) {
                    const delta = event.contentBlockDelta.delta.toolUse.input ?? '';
                    args += delta;
                    events.push({
                        type: 'response.function_call_arguments.delta',
                        item_id: 'item-1',
                        output_index: 0,
                        delta,
                    });
                } else if (event.contentBlockDelta?.delta?.text !== undefined) {
                    events.push({
                        type: 'response.output_text.delta',
                        delta: event.contentBlockDelta.delta.text,
                    });
                } else if (event.contentBlockStop && name) {
                    events.push({
                        type: 'response.function_call_arguments.done',
                        item_id: 'item-1',
                        output_index: 0,
                        arguments: args,
                    });
                    events.push({
                        type: 'response.output_item.done',
                        output_index: 0,
                        item: call(),
                    });
                } else if (event.messageStop) {
                    events.push({
                        type: 'response.completed',
                        response: { status: 'completed', output: name ? [call()] : [] },
                    });
                }
            }
            return new Response(
                events.map(event => `data: ${JSON.stringify(event)}\n\n`).join('') +
                    'data: [DONE]\n\n',
                { headers: { 'content-type': 'text/event-stream' } }
            );
        },
        () => async () => 'synthetic-gateway-token'
    );
    return {
        client,
        requests,
        events: (events: ConverseStreamOutput[]) => {
            source = events;
        },
    };
}
const fixture = responseFixture();
let ownerSignal: AbortSignal | undefined;
let onOutputMask: (() => void) | undefined;
const token = `{{NAME_${'b'.repeat(32)}}}`;
const audits: { provider: string; model: string }[] = [];
const consent = mock(async () => undefined);
function replace<Value>(value: Value, from: string, to: string): Value {
    if (typeof value === 'string') return value.replaceAll(from, to) as Value;
    if (Array.isArray(value)) return value.map(part => replace(part, from, to)) as Value;
    if (value !== null && typeof value === 'object')
        return Object.fromEntries(
            Object.entries(value).map(([key, part]) => [key, replace(part, from, to)])
        ) as Value;
    return value;
}

// Isolate only client construction; the gateway, Responses adapter, serializer and SSE decoder are real.
class GatewayResponsesProvider extends BedrockResponsesProvider {
    constructor() {
        super(() => fixture.client);
    }
}
mock.module('./bedrock-responses', () => ({
    BedrockResponsesProvider: GatewayResponsesProvider,
}));
mock.module('../constants/env', () => ({
    CHAT_MODEL: 'gpt-6-luna',
    EMBEDDING_MODEL: 'text-embedding-3-small',
    OPENAI_API_KEY: 'synthetic-embedding-key',
}));
mock.module('./privacy', () => ({ assertCurrentAiConsent: consent }));
mock.module('./pseudonymization', () => ({
    pseudonymizeProviderInput: async <Value>(value: Value, source = 'INPUT') => {
        const masked = replace(value, 'Taylor', token);
        if (source === 'OUTPUT') {
            onOutputMask?.();
            return replace(masked, 'Unlisted Visitor', '{NAME}');
        }
        return masked;
    },
    restoreProviderOutput: async <Value>(value: Value) => replace(value, token, 'Taylor'),
}));
mock.module('./audit', () => ({
    withAiAudit: async (
        operation: { provider: string; model: string },
        callback: () => Promise<unknown>
    ) => {
        audits.push(operation);
        return callback();
    },
}));
mock.module('./provider-circuit', () => ({
    withAiProviderCircuit: async (_provider: string, callback: () => Promise<unknown>) =>
        callback(),
}));
mock.module('../services/dataErasure', () => ({
    getCurrentOwnerOperation: () => (ownerSignal ? { signal: ownerSignal } : undefined),
}));

// Static gateway import would initialize its instances before these boundary fixtures.
const { streamingStructuredAiCall, streamingAiCall } = await import('./client');
beforeEach(() => {
    fixture.requests.length = 0;
    fixture.events([]);
    ownerSignal = undefined;
    onOutputMask = undefined;
    audits.length = 0;
    consent.mockClear();
});

const structured = (onPartial: (value: unknown) => void | Promise<void> = () => {}) =>
    streamingStructuredAiCall({
        model: 'gpt-6-luna',
        systemPrompt: 'Help Taylor',
        message: 'Teach Taylor',
        output: z.object({ answer: z.string(), done: z.boolean() }),
        toolName: 'answer',
        timeoutMs: 1_000,
        onPartial,
    });

test('Responses partials restore identities only after complete strings, with masked egress and Bedrock attribution', async () => {
    const events = toolEvents('');
    events.splice(
        2,
        1,
        ...['{"answer":"Hello ', token.slice(0, 8), token.slice(8), '",', '"done":true}'].map(
            input => ({
                contentBlockDelta: {
                    contentBlockIndex: 0,
                    delta: { toolUse: { input } },
                },
            })
        )
    );
    fixture.events(events);
    const partials: unknown[] = [];
    expect(
        await structured(value => {
            partials.push(value);
        })
    ).toEqual({ answer: 'Hello Taylor', done: true });
    expect(partials).toEqual([{ answer: 'Hello Taylor' }, { answer: 'Hello Taylor', done: true }]);
    expect(JSON.stringify(fixture.requests[0]!.body)).not.toContain('Taylor');
    expect(JSON.stringify(fixture.requests[0]!.body)).toContain(token);
    expect(audits).toEqual([
        expect.objectContaining({
            provider: 'bedrock',
            model: 'us.openai.gpt-6-luna',
        }),
    ]);
});

test('valid JSON partials cannot make a truncated Responses stream succeed', async () => {
    fixture.events(
        toolEvents('{"answer":"synthetic","done":true}').filter(
            event => !event.messageStop && !event.metadata
        )
    );
    const partials: unknown[] = [];
    await expect(
        structured(value => {
            partials.push(value);
        })
    ).rejects.toThrow(/did not complete/);
    expect(partials).toEqual([{ answer: 'synthetic', done: true }]);
});

test('owner erasure after a Responses partial cancels before final output', async () => {
    const owner = new AbortController();
    ownerSignal = owner.signal;
    fixture.events(toolEvents('{"answer":"synthetic","done":true}'));
    await expect(structured(() => owner.abort(new Error('owner erased')))).rejects.toThrow(
        'owner erased'
    );
});

test('external-model text is fully buffered and output-masked, never learner-restored', async () => {
    fixture.events(textEvents(`Hello ${token} and Unlisted Visitor`));
    const onChunk = mock(async (_text: string) => {});
    expect(
        await streamingAiCall({
            message: 'Coach Taylor',
            model: 'gpt-6-luna',
            options: { audience: 'external-model', timeoutMs: 1_000, onChunk },
        })
    ).toBe(`Hello ${token} and {NAME}`);
    expect(onChunk.mock.calls).toEqual([[`Hello ${token} and {NAME}`]]);
});

test('actual generation gateway accepts Responses text only after a valid completion marker', async () => {
    const onChunk = mock(async (_text: string) => {});
    const parameters = {
        message: 'Synthetic exercise',
        model: 'gpt-6-luna',
        options: { audience: 'external-model' as const, timeoutMs: 1_000, onChunk },
    };
    fixture.events(textEvents('Synthetic answer'));
    expect(await streamingAiCall(parameters)).toBe('Synthetic answer');
    expect(onChunk.mock.calls).toEqual([['Synthetic answer']]);
    onChunk.mockClear();
    fixture.events(textEvents('Synthetic answer').filter(event => !event.messageStop));
    await expect(streamingAiCall(parameters)).rejects.toThrow();
    expect(onChunk).not.toHaveBeenCalled();
});

test('owner erasure while output masking blocks the final external-model publication', async () => {
    const owner = new AbortController();
    ownerSignal = owner.signal;
    onOutputMask = () => owner.abort(new Error('owner erased'));
    fixture.events(textEvents(`Hello ${token}`));
    const onChunk = mock(async (_text: string) => {});
    await expect(
        streamingAiCall({
            message: 'Coach Taylor',
            options: { audience: 'external-model', timeoutMs: 1_000, onChunk },
        })
    ).rejects.toThrow('owner erased');
    expect(onChunk).not.toHaveBeenCalled();
});

test('revoked consent after Responses completion prevents final structured output', async () => {
    fixture.events(toolEvents('{"answer":"synthetic","done":true}'));
    consent.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('consent revoked'));
    await expect(structured()).rejects.toThrow('consent revoked');
});

import { afterEach, describe, expect, mock, spyOn, test } from 'bun:test';
import { z } from 'zod';
import { inspect } from 'node:util';
import { createBedrockResponsesClient } from './bedrock-generation';
import { BedrockResponsesProvider, buildResponsesRequest } from './bedrock-responses';

const originalEffort = process.env.OPENAI_REASONING_EFFORT;
afterEach(() => {
    if (originalEffort === undefined) delete process.env.OPENAI_REASONING_EFFORT;
    else process.env.OPENAI_REASONING_EFFORT = originalEffort;
});
const complete = {
    type: 'response.completed',
    response: { status: 'completed', output: [] },
};
function fixture(
    events: unknown[] = [{ type: 'response.output_text.delta', delta: 'Synthetic' }, complete]
) {
    const requests: {
        url: string;
        headers: Headers;
        body: Record<string, unknown>;
    }[] = [];
    const tokens = mock(async () => `synthetic-token-${requests.length + 1}`);
    const client = createBedrockResponsesClient(
        {},
        async (url: RequestInfo | URL, options?: RequestInit) => {
            requests.push({
                url: String(url),
                headers: new Headers(options?.headers),
                body: JSON.parse(options?.body as string),
            });
            return new Response(
                events.map(event => `data: ${JSON.stringify(event)}\n\n`).join('') +
                    'data: [DONE]\n\n',
                { headers: { 'content-type': 'text/event-stream' } }
            );
        },
        () => tokens
    );
    return {
        requests,
        tokens,
        provider: new BedrockResponsesProvider(() => client),
    };
}

describe('Responses effort contract', () => {
    for (const model of ['gpt-6.1-sol', 'gpt-6-luna']) {
        for (const effort of [
            'low',
            'medium',
            'high',
            'xhigh',
            'max',
            ...(model === 'gpt-6-luna' ? ['none'] : []),
        ]) {
            test(`${model} ${effort} passes unchanged`, () => {
                delete process.env.OPENAI_REASONING_EFFORT;
                const request = buildResponsesRequest({
                    model: `${model}-${effort}`,
                    message: 'Synthetic',
                });
                expect(request.model).toBe(`us.openai.${model}`);
                expect(String(request.reasoning?.effort)).toBe(effort);
                expect(request.store).toBe(false);
            });
        }
        test(`${model} defaults medium and validates global overrides`, () => {
            delete process.env.OPENAI_REASONING_EFFORT;
            expect(buildResponsesRequest({ model, message: 'Synthetic' }).reasoning).toEqual({
                effort: 'medium',
            });
            process.env.OPENAI_REASONING_EFFORT = 'minimal';
            expect(() =>
                buildResponsesRequest({ model: `${model}-high`, message: 'Synthetic' })
            ).toThrow();
        });
    }
    test('unsupported Sol none and unapproved profiles reject', () => {
        expect(() =>
            buildResponsesRequest({
                model: 'gpt-6.1-sol-none',
                message: 'Synthetic',
            })
        ).toThrow();
        expect(() => buildResponsesRequest({ model: 'gpt-6-sol', message: 'Synthetic' })).toThrow();
    });
    test('history keeps client-owned tool identifiers and results', () => {
        delete process.env.OPENAI_REASONING_EFFORT;
        const request = buildResponsesRequest({
            model: 'gpt-6.1-sol',
            systemPrompt: 'Synthetic instructions',
            message: [
                { role: 'developer', content: 'More instructions' },
                { role: 'user', content: 'Question' },
                {
                    role: 'assistant',
                    tool_calls: [
                        {
                            id: 'call-1',
                            type: 'function',
                            function: { name: 'answer', arguments: '{"x":1}' },
                        },
                    ],
                },
                { role: 'tool', tool_call_id: 'call-1', content: 'result' },
            ],
        });
        expect(request.input).toEqual([
            { role: 'user', content: 'Question' },
            {
                type: 'function_call',
                call_id: 'call-1',
                name: 'answer',
                arguments: '{"x":1}',
            },
            { type: 'function_call_output', call_id: 'call-1', output: 'result' },
        ]);
        expect(request.instructions).toBe('Synthetic instructions\nMore instructions');
    });
});

test('real SDK refreshes tokens, pins endpoint, disables storage and ambient headers', async () => {
    delete process.env.OPENAI_REASONING_EFFORT;
    const oldOrg = process.env.OPENAI_ORG_ID;
    const oldProject = process.env.OPENAI_PROJECT_ID;
    process.env.OPENAI_ORG_ID = 'ambient-org';
    process.env.OPENAI_PROJECT_ID = 'ambient-project';
    try {
        const f = fixture();
        const seen: string[] = [];
        expect(f.tokens).not.toHaveBeenCalled();
        expect(
            await f.provider.streamingCall({
                message: 'Synthetic',
                model: 'gpt-6.1-sol',
                options: {
                    onChunk: async chunk => {
                        seen.push(chunk);
                    },
                },
            })
        ).toBe('Synthetic');
        expect(
            await f.provider.streamingCall({
                message: 'Synthetic',
                model: 'gpt-6-luna-none',
                options: { accumulateContent: false },
            })
        ).toBe('');
        expect(seen).toEqual(['Synthetic']);
        expect(f.tokens).toHaveBeenCalledTimes(2);
        for (const [index, req] of f.requests.entries()) {
            expect(req.url).toBe(
                'https://bedrock-runtime.us-east-1.amazonaws.com/openai/v1/responses'
            );
            expect(req.headers.get('authorization')).toBe(`Bearer synthetic-token-${index + 1}`);
            expect(req.headers.has('openai-organization')).toBe(false);
            expect(req.headers.has('openai-project')).toBe(false);
            expect(req.body.store).toBe(false);
        }
        expect(f.requests[1]!.body.reasoning).toEqual({ effort: 'none' });
    } finally {
        if (oldOrg === undefined) delete process.env.OPENAI_ORG_ID;
        else process.env.OPENAI_ORG_ID = oldOrg;
        if (oldProject === undefined) delete process.env.OPENAI_PROJECT_ID;
        else process.env.OPENAI_PROJECT_ID = oldProject;
    }
});
for (const events of [
    [],
    [{ type: 'response.output_text.delta', delta: 'Truncated' }],
    [{ type: 'response.incomplete' }],
    [{ type: 'response.failed' }],
    [complete, { type: 'response.output_text.delta', delta: 'Late' }],
    [{ type: 'response.refusal.delta' }],
    [{ type: 'response.function_call_arguments.delta' }],
]) {
    test(`reject unsuccessful stream ${JSON.stringify(events)}`, async () => {
        delete process.env.OPENAI_REASONING_EFFORT;
        await expect(
            fixture(events).provider.streamingCall({
                message: 'Synthetic',
                model: 'gpt-6.1-sol',
            })
        ).rejects.toThrow();
    });
}
test('credential errors are redacted before real SDK receives them', async () => {
    const fetch = mock(async () => new Response('{}'));
    const client = createBedrockResponsesClient({}, fetch, () => async () => {
        throw new Error('synthetic-secret-token');
    });
    const error = await client.responses
        .create({ model: 'us.openai.gpt-6.1-sol', input: 'Synthetic' })
        .catch(error => error);
    expect(inspect(error)).not.toContain('synthetic-secret-token');
    expect(fetch).not.toHaveBeenCalled();
});
test('abort and deadline bound pending token resolution without a request', async () => {
    delete process.env.OPENAI_REASONING_EFFORT;
    const fetch = mock(async () => new Response('{}'));
    const client = createBedrockResponsesClient({}, fetch, () => () => new Promise(() => {}));
    const provider = new BedrockResponsesProvider(() => client);
    const owner = new AbortController();
    const promise = provider.streamingCall({
        message: 'Synthetic',
        model: 'gpt-6.1-sol',
        options: { signal: owner.signal, timeoutMs: 500 },
    });
    owner.abort();
    await expect(promise).rejects.toThrow();
    await expect(
        provider.streamingCall({
            message: 'Synthetic',
            model: 'gpt-6.1-sol',
            options: { timeoutMs: 10 },
        })
    ).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
});
test('callback backpressure and cancellation propagate', async () => {
    delete process.env.OPENAI_REASONING_EFFORT;
    const owner = new AbortController();
    const f = fixture();
    await expect(
        f.provider.streamingCall({
            message: 'Synthetic',
            model: 'gpt-6.1-sol',
            options: {
                signal: owner.signal,
                onChunk: async () => {
                    owner.abort();
                },
            },
        })
    ).rejects.toThrow();
});

function jsonFixture(output: unknown[], status = 'completed', error?: unknown) {
    const requests: Record<string, unknown>[] = [];
    const client = createBedrockResponsesClient(
        {},
        async (_url: RequestInfo | URL, options?: RequestInit) => {
            requests.push(JSON.parse(options?.body as string));
            return Response.json({ id: 'synthetic-response', status, output, error });
        },
        () => async () => 'synthetic-key'
    );
    return { requests, provider: new BedrockResponsesProvider(() => client) };
}
const functionCall = (argumentsText: string, name = 'function_0') => ({
    type: 'function_call',
    id: 'item-1',
    call_id: 'call-1',
    name,
    arguments: argumentsText,
    status: 'completed',
});
const answerSchema = z.object({
    answer: z.string().min(3),
    optional: z.string().optional(),
});
for (const model of ['gpt-6.1-sol', 'gpt-6-luna-none']) {
    test(`${model} keeps optional semantics and uses required non-strict client tools`, async () => {
        delete process.env.OPENAI_REASONING_EFFORT;
        const f = jsonFixture([functionCall('{"answer":"valid"}')]);
        expect(
            await f.provider.call({
                model,
                message: 'Synthetic',
                output: answerSchema,
            })
        ).toEqual({ answer: 'valid' });
        expect(f.requests[0]!.tool_choice).toBe('required');
        expect(f.requests[0]!.parallel_tool_calls).toBe(false);
        expect(f.requests[0]!.tools).toEqual([
            expect.objectContaining({
                type: 'function',
                name: 'function_0',
                strict: false,
                parameters: expect.objectContaining({ required: ['answer'] }),
            }),
        ]);
        expect(f.requests[0]!.store).toBe(false);
    });
}
for (const [label, output, status] of [
    ['missing', [], 'completed'],
    ['unknown', [functionCall('{"answer":"valid"}', 'function_9')], 'completed'],
    [
        'duplicate',
        [functionCall('{"answer":"valid"}'), functionCall('{"answer":"valid"}')],
        'completed',
    ],
    ['incomplete', [functionCall('{"answer":"valid"}')], 'incomplete'],
    ['bounds', [functionCall('{"answer":"x"}')], 'completed'],
    ['optional null', [functionCall('{"answer":"valid","optional":null}')], 'completed'],
    ['invalid JSON', [functionCall('{')], 'completed'],
    [
        'refusal',
        [
            functionCall('{"answer":"valid"}'),
            { type: 'message', content: [{ type: 'refusal', refusal: 'No' }] },
        ],
        'completed',
    ],
] as const) {
    test(`structured response rejects ${label}`, async () => {
        delete process.env.OPENAI_REASONING_EFFORT;
        await expect(
            jsonFixture([...output], status).provider.call({
                model: 'gpt-6.1-sol',
                message: 'Synthetic',
                output: answerSchema,
            })
        ).rejects.toThrow();
    });
}
test('selected array schema, wrapped scalars and async transformations retain original validation', async () => {
    delete process.env.OPENAI_REASONING_EFFORT;
    const transformed = z.object({
        answer: z.string().transform(async value => value.toUpperCase()),
    });
    expect(
        await jsonFixture([functionCall('{"answer":"valid"}', 'function_1')]).provider.call({
            model: 'gpt-6.1-sol',
            message: 'Synthetic',
            output: [z.object({ count: z.number() }), transformed],
        })
    ).toEqual({ answer: 'VALID' });
    expect(
        await jsonFixture([functionCall('{"args":"valid"}')]).provider.call({
            model: 'gpt-6-luna-none',
            message: 'Synthetic',
            output: z.string().min(3),
        })
    ).toBe('valid');
});
function structuredEvents(argumentsText: string, name = 'answer') {
    return [
        {
            type: 'response.output_item.added',
            output_index: 0,
            item: { ...functionCall('', name), status: 'in_progress' },
        },
        {
            type: 'response.function_call_arguments.delta',
            item_id: 'item-1',
            output_index: 0,
            delta: argumentsText,
        },
        {
            type: 'response.function_call_arguments.done',
            item_id: 'item-1',
            output_index: 0,
            arguments: argumentsText,
        },
        {
            type: 'response.output_item.done',
            output_index: 0,
            item: functionCall(argumentsText, name),
        },
        {
            type: 'response.completed',
            response: {
                status: 'completed',
                output: [functionCall(argumentsText, name)],
            },
        },
    ];
}
const streamParams = {
    model: 'gpt-6.1-sol',
    systemPrompt: 'Synthetic',
    message: 'Synthetic',
    output: answerSchema,
    toolName: 'answer',
    timeoutMs: 1000,
    onPartial: () => {},
};
test('structured streaming uses intended named tool and original final validator', async () => {
    delete process.env.OPENAI_REASONING_EFFORT;
    const f = fixture(structuredEvents('{"answer":"valid"}'));
    expect(await f.provider.structuredStreamingCall(streamParams)).toEqual({
        answer: 'valid',
    });
    expect(f.requests[0]!.body.tool_choice).toEqual({
        type: 'function',
        name: 'answer',
    });
    await expect(
        fixture(structuredEvents('{"answer":"x"}')).provider.structuredStreamingCall(streamParams)
    ).rejects.toThrow();
});
for (const [label, events] of [
    ['truncated', structuredEvents('{"answer":"valid"}').slice(0, -1)],
    ['wrong name', structuredEvents('{"answer":"valid"}', 'unknown')],
    [
        'missing argument done',
        structuredEvents('{"answer":"valid"}').filter(
            event => event.type !== 'response.function_call_arguments.done'
        ),
    ],
    [
        'duplicate tool',
        [structuredEvents('{"answer":"valid"}')[0], ...structuredEvents('{"answer":"valid"}')],
    ],
    [
        'mismatched final arguments',
        [
            ...structuredEvents('{"answer":"valid"}').slice(0, -1),
            {
                type: 'response.completed',
                response: {
                    status: 'completed',
                    output: [functionCall('{"answer":"changed"}', 'answer')],
                },
            },
        ],
    ],
] as const) {
    test(`structured stream rejects ${label}`, async () => {
        delete process.env.OPENAI_REASONING_EFFORT;
        await expect(
            fixture([...events]).provider.structuredStreamingCall(streamParams)
        ).rejects.toThrow();
    });
}
test('all nineteen default generation shapes serialize locally without model/effort gates', async () => {
    delete process.env.OPENAI_REASONING_EFFORT;
    const { generationSchemaInventory } = await import('./generation-schemas');
    const { buildResponsesTools } = await import('./bedrock-responses');
    expect(generationSchemaInventory.length).toBe(19);
    for (const entry of generationSchemaInventory) {
        const model =
            entry.role === 'chat' || entry.role === 'planning' ? 'gpt-6.1-sol' : 'gpt-6-luna-none';
        expect(buildResponsesRequest({ model, message: 'Synthetic' }).model).toMatch(
            /^us\.openai\./
        );
        const schemas = Array.isArray(entry.schema) ? entry.schema : [entry.schema];
        expect(
            buildResponsesTools(schemas, model, entry.toolName ? [entry.toolName] : undefined).tools
                .length
        ).toBe(schemas.length);
    }
});

test('real SDK does not retry failed Responses inference and refuses redirects', async () => {
    delete process.env.OPENAI_REASONING_EFFORT;
    let count = 0;
    const client = createBedrockResponsesClient(
        {},
        async (_url: RequestInfo | URL, options?: RequestInit) => {
            count += 1;
            expect(options?.redirect).toBe('error');
            return Response.json(
                {
                    error: { message: 'synthetic rate limit', type: 'rate_limit_error' },
                },
                { status: 429 }
            );
        },
        () => async () => 'synthetic-token'
    );
    await expect(
        new BedrockResponsesProvider(() => client).streamingCall({
            model: 'gpt-6.1-sol',
            message: 'Synthetic',
        })
    ).rejects.toMatchObject({ code: 'ai_provider_rate_limited' });
    expect(count).toBe(1);
});
test('Fly Responses client requires the configured web identity before token creation', () => {
    const factory = mock(() => async () => 'synthetic-token');
    expect(() =>
        createBedrockResponsesClient({ FLY_APP_NAME: 'synthetic-app' }, undefined, factory)
    ).toThrow('requires AWS_ROLE_ARN');
    expect(factory).not.toHaveBeenCalled();
});

test('argument done permits omitted name but rejects a wrong present name', async () => {
    const events = structuredEvents('{"answer":"valid"}');
    const done = events[2]! as Record<string, unknown>;
    done.name = 'wrong';
    await expect(fixture(events).provider.structuredStreamingCall(streamParams)).rejects.toThrow();
});
for (const structured of [false, true]) {
    test(`never-settling ${structured ? 'partial' : 'text'} callback respects deadline`, async () => {
        const f = fixture(structured ? structuredEvents('{"answer":"valid"}') : undefined);
        const pending = () => new Promise<void>(() => {});
        const started = performance.now();
        await expect(
            structured
                ? f.provider.structuredStreamingCall({
                      ...streamParams,
                      timeoutMs: 20,
                      onPartial: pending,
                  })
                : f.provider.streamingCall({
                      model: 'gpt-6.1-sol',
                      message: 'Synthetic',
                      options: { timeoutMs: 20, onChunk: pending },
                  })
        ).rejects.toThrow();
        expect(performance.now() - started).toBeLessThan(1000);
    });
}
test('SDK logging is disabled even with ambient debug logging', () => {
    const client = createBedrockResponsesClient({}, undefined, () => async () => 'synthetic');
    expect(client.logLevel).toBe('off');
});

for (const field of ['item_id', 'output_index', 'arguments']) {
    test(`argument done rejects wrong ${field}`, async () => {
        const events = structuredEvents('{"answer":"valid"}');
        (events[2]! as Record<string, unknown>)[field] = field === 'output_index' ? 9 : 'wrong';
        await expect(
            fixture(events).provider.structuredStreamingCall(streamParams)
        ).rejects.toThrow();
    });
}
test('final item rejects wrong output index', async () => {
    const events = structuredEvents('{"answer":"valid"}');
    events[3]!.output_index = 9;
    await expect(fixture(events).provider.structuredStreamingCall(streamParams)).rejects.toThrow();
});
test('reasoning before function and split escaped arguments retain tool identity', async () => {
    const text = JSON.stringify({ answer: 'quoted "answer" and \n newline' });
    const events = structuredEvents(text);
    for (const event of events) if ('output_index' in event) event.output_index = 1;
    const delta = events[1]!;
    const split = Math.floor(text.length / 2);
    const stream = [
        {
            type: 'response.output_item.added',
            output_index: 0,
            item: { type: 'reasoning', id: 'reasoning-1' },
        },
        events[0],
        { ...delta, delta: text.slice(0, split) },
        { ...delta, delta: text.slice(split) },
        ...events.slice(2),
    ];
    expect(await fixture(stream).provider.structuredStreamingCall(streamParams)).toEqual(
        JSON.parse(text)
    );
});
test('abort stops a never-settling callback without delivering later chunks', async () => {
    const owner = new AbortController();
    const entered = Promise.withResolvers<void>();
    const callback = mock(() => {
        entered.resolve();
        return new Promise<void>(() => {});
    });
    const f = fixture([
        { type: 'response.output_text.delta', delta: 'first' },
        { type: 'response.output_text.delta', delta: 'later' },
        complete,
    ]);
    const pending = f.provider.streamingCall({
        model: 'gpt-6.1-sol',
        message: 'Synthetic',
        options: { signal: owner.signal, onChunk: callback },
    });
    await entered.promise;
    owner.abort();
    await expect(pending).rejects.toThrow();
    expect(callback).toHaveBeenCalledTimes(1);
});
test('malformed SSE is rejected without logging its raw payload', async () => {
    const errorLog = spyOn(console, 'error').mockImplementation(() => {});
    try {
        const client = createBedrockResponsesClient(
            {},
            async () =>
                new Response('data: synthetic-private-invalid-json\n\n', {
                    headers: { 'content-type': 'text/event-stream' },
                }),
            () => async () => 'synthetic'
        );
        await expect(
            new BedrockResponsesProvider(() => client).streamingCall({
                model: 'gpt-6.1-sol',
                message: 'Synthetic',
            })
        ).rejects.toThrow();
        expect(errorLog).not.toHaveBeenCalled();
    } finally {
        errorLog.mockRestore();
    }
});

for (const model of ['gpt-6.1-sol', 'gpt-6-luna', 'gpt-6-luna-none']) {
    test(`${model} normalizes empty effort and preserves valid/invalid overrides`, () => {
        delete process.env.OPENAI_REASONING_EFFORT;
        const expected = buildResponsesRequest({ model, message: 'Synthetic' }).reasoning;
        process.env.OPENAI_REASONING_EFFORT = '';
        expect(buildResponsesRequest({ model, message: 'Synthetic' }).reasoning).toEqual(expected);
        process.env.OPENAI_REASONING_EFFORT = 'high';
        expect(buildResponsesRequest({ model, message: 'Synthetic' }).reasoning).toEqual({
            effort: model === 'gpt-6-luna-none' ? 'none' : 'high',
        });
        process.env.OPENAI_REASONING_EFFORT = 'invalid';
        expect(() => buildResponsesRequest({ model, message: 'Synthetic' })).toThrow(RangeError);
    });
}
for (const type of ['error', 'response.failed', 'response.incomplete', 'response.completed']) {
    for (const code of [
        'rate_limit_exceeded',
        'rate_limit_exceeded PRIVATE',
        'insufficient_quota',
        'server_error',
        'unrecognized',
    ]) {
        test(`${type} safely classifies ${code} without retry`, async () => {
            delete process.env.OPENAI_REASONING_EFFORT;
            const providerError = { code, message: 'PRIVATE synthetic payload' };
            const f = fixture([
                {
                    type,
                    ...(type === 'error'
                        ? providerError
                        : { response: { status: 'failed', output: [], error: providerError } }),
                },
            ]);
            let error: any;
            try {
                await f.provider.streamingCall({ model: 'gpt-6.1-sol', message: 'Synthetic' });
            } catch (caught) {
                error = caught;
            }
            expect(error).toBeDefined();
            expect(inspect(error)).not.toContain('PRIVATE');
            if (code.startsWith('rate_limit_exceeded')) {
                expect(error.code).toBe('ai_provider_rate_limited');
                expect(error.httpStatus).toBe(429);
                expect(error.retryable).toBe(true);
            } else if (code === 'insufficient_quota') {
                expect(error.code).toBe('ai_provider_quota_exhausted');
                expect(error.retryable).toBe(false);
            } else {
                expect(error.failureCode).toBe('incomplete_response_lifecycle');
            }
            expect(f.requests).toHaveLength(1);
        });
    }
}
for (const status of ['failed', 'incomplete', 'in_progress']) {
    test(`nonstream ${status} preserves rate limit classification without payload`, async () => {
        delete process.env.OPENAI_REASONING_EFFORT;
        const f = jsonFixture([], status, { code: 'rate_limit_exceeded', message: 'PRIVATE' });
        let error: any;
        try {
            await f.provider.call({
                model: 'gpt-6.1-sol',
                message: 'Synthetic',
                output: answerSchema,
            });
        } catch (caught) {
            error = caught;
        }
        expect(error.code).toBe('ai_provider_rate_limited');
        expect(error.httpStatus).toBe(429);
        expect(error.retryable).toBe(true);
        expect(inspect(error)).not.toContain('PRIVATE');
        expect(f.requests).toHaveLength(1);
    });
}

test('backfill generation cap reaches Responses and rejects invalid bounds before dispatch', async () => {
    const f = jsonFixture([functionCall('{"answer":"valid"}')]);
    const params = { model: 'gpt-6-luna-none', message: 'Synthetic', output: answerSchema };
    await f.provider.call({ ...params, maxOutputTokens: 4096 });
    expect(f.requests[0]!.max_output_tokens).toBe(4096);
    for (const maxOutputTokens of [0, -1, 4097, 1.5, Number.NaN]) {
        await expect(f.provider.call({ ...params, maxOutputTokens })).rejects.toThrow(
            'Bounded generation unavailable'
        );
    }
    expect(f.requests).toHaveLength(1);
});

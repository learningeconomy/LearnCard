import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import {
    InternalServerException,
    ServiceUnavailableException,
    ThrottlingException,
    type ConverseStreamOutput,
} from '@aws-sdk/client-bedrock-runtime';
import { z } from 'zod';
import {
    BedrockConverseProvider,
    buildConverseHistory,
    buildConverseRequest,
} from './bedrock-converse';
import { resolveBedrockGenerationModel } from './bedrock-generation';
import { nativeFixture, textEvents, toolEvents, type NativeFixture } from './bedrock-test-fixture';
import { normalizeAiProviderError, toAiErrorPayload } from './errors';
import {
    FileClassificationSchema,
    FileUploadTypesEnum,
    ParsedTranscriptSchema,
    generationSchemaInventory,
} from './generation-schemas';

let fixture: NativeFixture;
let provider: BedrockConverseProvider;
const model = 'gpt-6-luna';
const answerSchema = z.object({ answer: z.string() });
const common = {
    model,
    systemPrompt: 'Synthetic fixture',
    message: 'Synthetic exercise',
    timeoutMs: 1_000,
};
const single = (content: unknown[], stopReason = 'end_turn', role = 'assistant') => ({
    output: { message: { role, content } },
    stopReason,
    usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
    metrics: { latencyMs: 1 },
});
beforeEach(() => {
    fixture = nativeFixture();
    provider = new BedrockConverseProvider(() => fixture.client);
});
afterEach(() => fixture.client.destroy());

describe('native structured generation', () => {
    it('serializes JSON schema natively without making optional input fields required', async () => {
        const schema = z.object({
            answer: z.string(),
            optional: z.string().optional(),
            nullable: z.string().nullable(),
        });
        fixture.json(single([{ text: '{"answer":"synthetic","nullable":null}' }]));
        expect(await provider.call({ ...common, output: schema })).toEqual({
            answer: 'synthetic',
            nullable: null,
        });
        const wire = z
            .object({
                system: z.array(z.object({ text: z.string() })),
                messages: z.array(
                    z.object({
                        role: z.string(),
                        content: z.array(z.object({ text: z.string() })),
                    })
                ),
                additionalModelRequestFields: z.never().optional(),
                outputConfig: z.object({
                    textFormat: z.object({
                        type: z.literal('json_schema'),
                        structure: z.object({
                            jsonSchema: z.object({ schema: z.string() }),
                        }),
                    }),
                }),
            })
            .parse(fixture.requests[0]!.body);
        expect(JSON.parse(wire.outputConfig.textFormat.structure.jsonSchema.schema)).toEqual(
            expect.objectContaining({
                type: 'object',
                required: ['answer', 'nullable'],
                additionalProperties: false,
            })
        );
        expect(fixture.requests[0]!.path).toBe('/model/us.openai.gpt-6-luna/converse');
        expect(fixture.requests[0]!.headers.authorization).toBe('Bearer synthetic-native-fixture');
        expect(wire.system).toEqual([{ text: 'Synthetic fixture' }]);
        expect(wire.messages).toEqual([
            { role: 'user', content: [{ text: 'Synthetic exercise' }] },
        ]);
    });

    it.each(['gpt-6-luna', 'us.openai.gpt-6-luna'])(
        'resolves and builds bare Luna with no global effort, omitting native reasoning in every mode: %s',
        async model => {
            const previous = process.env.OPENAI_REASONING_EFFORT;
            try {
                delete process.env.OPENAI_REASONING_EFFORT;
                expect(resolveBedrockGenerationModel(model)).toBe('us.openai.gpt-6-luna');
                const request = buildConverseRequest({
                    model,
                    message: 'Synthetic exercise',
                });
                expect(request.modelId).toBe('us.openai.gpt-6-luna');
                expect(Object.hasOwn(request, 'additionalModelRequestFields')).toBe(false);
                fixture.json(single([{ text: '{"answer":"synthetic"}' }]));
                expect(await provider.call({ ...common, model, output: answerSchema })).toEqual({
                    answer: 'synthetic',
                });
                fixture.events(textEvents('synthetic'));
                expect(await provider.streamingCall({ ...common, model })).toBe('synthetic');
                fixture.events(toolEvents('{"answer":"synthetic"}'));
                expect(
                    await provider.structuredStreamingCall({
                        ...common,
                        model,
                        output: answerSchema,
                        toolName: 'answer',
                        onPartial: async () => {},
                    })
                ).toEqual({ answer: 'synthetic' });
                expect(
                    fixture.requests.map(({ body }) =>
                        Object.hasOwn(body as object, 'additionalModelRequestFields')
                    )
                ).toEqual([false, false, false]);
            } finally {
                if (previous === undefined) delete process.env.OPENAI_REASONING_EFFORT;
                else process.env.OPENAI_REASONING_EFFORT = previous;
            }
        }
    );

    it.each(
        ['none', 'low', 'medium', 'high', 'xhigh', 'max'].flatMap(effort => [
            `gpt-6-luna-${effort}`,
            `us.openai.gpt-6-luna-${effort}`,
        ])
    )(
        'rejects explicit Luna aliases before client/token/network in all native modes: %s',
        async model => {
            const factory = mock(() => fixture.client);
            const isolated = new BedrockConverseProvider(factory);
            await expect(
                isolated.call({ ...common, model, output: answerSchema })
            ).rejects.toThrow();
            await expect(isolated.streamingCall({ ...common, model })).rejects.toThrow();
            await expect(
                isolated.structuredStreamingCall({
                    ...common,
                    model,
                    output: answerSchema,
                    toolName: 'answer',
                    onPartial: async () => {},
                })
            ).rejects.toThrow();
            expect(factory).not.toHaveBeenCalled();
            expect(fixture.requests).toEqual([]);
        }
    );

    it.each(['none', 'low', 'medium', 'high', 'xhigh', 'max', ''])(
        'rejects explicit global Luna efforts without silently dropping them: %s',
        async effort => {
            const previous = process.env.OPENAI_REASONING_EFFORT;
            const factory = mock(() => fixture.client);
            const isolated = new BedrockConverseProvider(factory);
            try {
                process.env.OPENAI_REASONING_EFFORT = effort;
                await expect(isolated.call({ ...common, output: answerSchema })).rejects.toThrow();
                await expect(isolated.streamingCall(common)).rejects.toThrow();
                await expect(
                    isolated.structuredStreamingCall({
                        ...common,
                        output: answerSchema,
                        toolName: 'answer',
                        onPartial: async () => {},
                    })
                ).rejects.toThrow();
                expect(factory).not.toHaveBeenCalled();
                expect(fixture.requests).toEqual([]);
            } finally {
                if (previous === undefined) delete process.env.OPENAI_REASONING_EFFORT;
                else process.env.OPENAI_REASONING_EFFORT = previous;
            }
        }
    );

    it('rejects an explicitly unsupported Luna effort before client construction', async () => {
        const previous = process.env.OPENAI_REASONING_EFFORT;
        const factory = mock(() => fixture.client);
        try {
            process.env.OPENAI_REASONING_EFFORT = 'minimal';
            await expect(
                new BedrockConverseProvider(factory).call({
                    ...common,
                    output: answerSchema,
                })
            ).rejects.toBeInstanceOf(RangeError);
            expect(factory).not.toHaveBeenCalled();
            expect(fixture.requests).toEqual([]);
        } finally {
            if (previous === undefined) delete process.env.OPENAI_REASONING_EFFORT;
            else process.env.OPENAI_REASONING_EFFORT = previous;
        }
    });

    it.each([
        [z.array(z.string()), { args: ['halves', 'quarters'] }, ['halves', 'quarters']],
        [z.union([z.literal(null), z.object({ answer: z.string() })]), { args: null }, null],
    ])('preserves wrapped non-object output domains', async (schema, payload, expected) => {
        fixture.json(single([{ text: JSON.stringify(payload) }]));
        expect(await provider.call({ ...common, output: schema })).toEqual(expected);
    });

    it('selects exactly the returned strict tool and applies the original input transformation', async () => {
        const credential = z.object({
            id: z.string().transform(value => `definition:${value}`),
        });
        const declined = z.object({ reason: z.string() });
        fixture.json(
            single(
                [
                    {
                        toolUse: {
                            toolUseId: 'call',
                            name: 'function_0',
                            input: { id: 'synthetic' },
                        },
                    },
                ],
                'tool_use'
            )
        );
        expect(await provider.call({ ...common, output: [credential, declined] })).toEqual({
            id: 'definition:synthetic',
        });
        const wire = z
            .object({
                toolConfig: z.object({
                    tools: z.array(
                        z.object({
                            toolSpec: z.object({ name: z.string(), strict: z.literal(true) }),
                        })
                    ),
                    toolChoice: z.object({ any: z.object({}) }),
                }),
            })
            .parse(fixture.requests[0]!.body);
        expect(wire.toolConfig.tools.map(tool => tool.toolSpec.name)).toEqual([
            'function_0',
            'function_1',
        ]);
        fixture.json(
            single(
                [
                    {
                        toolUse: {
                            toolUseId: 'call',
                            name: 'function_1',
                            input: { reason: 'Not enough evidence' },
                        },
                    },
                ],
                'tool_use'
            )
        );
        expect(await provider.call({ ...common, output: [credential, declined] })).toEqual({
            reason: 'Not enough evidence',
        });
    });

    it.each([
        [
            'unknown tool',
            [
                {
                    toolUse: {
                        toolUseId: 'call',
                        name: 'function_9',
                        input: { answer: 'synthetic' },
                    },
                },
            ],
            'tool_use',
        ],
        [
            'two tool calls',
            [
                {
                    toolUse: {
                        toolUseId: 'a',
                        name: 'function_0',
                        input: { answer: 'a' },
                    },
                },
                {
                    toolUse: {
                        toolUseId: 'b',
                        name: 'function_0',
                        input: { answer: 'b' },
                    },
                },
            ],
            'tool_use',
        ],
        [
            'non-tool finish',
            [
                {
                    toolUse: {
                        toolUseId: 'call',
                        name: 'function_0',
                        input: { answer: 'synthetic' },
                    },
                },
            ],
            'end_turn',
        ],
    ])('rejects incompatible tool response: %s', async (_name, content, reason) => {
        fixture.json(single(content, reason));
        await expect(provider.call({ ...common, output: [answerSchema] })).rejects.toThrow(
            'Invalid Bedrock generation response'
        );
    });

    it.each(['max_tokens', 'guardrail_intervened', 'content_filtered', 'malformed_model_output'])(
        'rejects incomplete structured output despite valid JSON: %s',
        async reason => {
            fixture.json(single([{ text: '{"answer":"synthetic"}' }], reason));
            await expect(provider.call({ ...common, output: answerSchema })).rejects.toThrow(
                'Invalid Bedrock generation response'
            );
        }
    );

    it('rejects malformed JSON without exposing provider text in the failure', async () => {
        fixture.json(single([{ text: 'private provider envelope is not JSON' }]));
        await expect(provider.call({ ...common, output: answerSchema })).rejects.toThrow(
            /^Invalid Bedrock generation response$/
        );
    });

    it('rejects a provider output outside the original schema', async () => {
        fixture.json(single([{ text: '{"answer":42}' }]));
        await expect(provider.call({ ...common, output: answerSchema })).rejects.toThrow();
    });

    it('rejects unrepresentable input domains before constructing a client', async () => {
        const factory = mock(() => fixture.client);
        const isolated = new BedrockConverseProvider(factory);
        await expect(
            isolated.call({
                ...common,
                output: z.object({ confidence: z.unknown() }),
            })
        ).rejects.toThrow(/unconstrained|cannot be represented/i);
        expect(factory).not.toHaveBeenCalled();
        expect(fixture.requests).toEqual([]);
    });

    it.each([
        'gpt-6.1-sol',
        'us.openai.gpt-6.1-sol',
        ...['low', 'medium', 'high', 'xhigh', 'max'].flatMap(effort => [
            `gpt-6.1-sol-${effort}`,
            `us.openai.gpt-6.1-sol-${effort}`,
        ]),
    ])(
        'blocks unverified Bedrock Sol effort mapping before any client or request: %s',
        async model => {
            const factory = mock(() => fixture.client);
            const isolated = new BedrockConverseProvider(factory);
            await expect(
                isolated.call({ ...common, model, output: answerSchema })
            ).rejects.toThrow();
            await expect(
                isolated.streamingCall({
                    ...common,
                    model,
                    options: { timeoutMs: 1_000 },
                })
            ).rejects.toThrow();
            const onPartial = mock(async (_value: unknown) => {});
            await expect(
                isolated.structuredStreamingCall({
                    ...common,
                    model,
                    output: answerSchema,
                    toolName: 'answer',
                    onPartial,
                })
            ).rejects.toThrow();
            expect(onPartial).not.toHaveBeenCalled();
            expect(factory).not.toHaveBeenCalled();
            expect(fixture.requests).toEqual([]);
        }
    );

    it('emits a structural classification schema and still rejects out-of-range provider confidence without retry', async () => {
        const valid = {
            fileType: FileUploadTypesEnum.Transcript,
            confidence: 1,
            reason: 'Courses',
        };
        fixture.json(single([{ text: JSON.stringify(valid) }]));
        expect(await provider.call({ ...common, output: FileClassificationSchema })).toEqual(valid);
        const body = fixture.requests[0]!.body as {
            outputConfig: {
                textFormat: {
                    type: string;
                    structure: { jsonSchema: { schema: string } };
                };
            };
        };
        expect(body.outputConfig.textFormat.type).toBe('json_schema');
        const projected = JSON.parse(body.outputConfig.textFormat.structure.jsonSchema.schema);
        expect(projected.required).toEqual(['fileType', 'confidence', 'reason']);
        expect(projected.properties.confidence).toEqual({ type: 'number' });
        expect(projected.properties.fileType.enum).toEqual([
            'resume',
            'certificate',
            'transcript',
            'diploma',
            'unsupported',
        ]);
        for (const confidence of [-0.01, 1.01]) {
            fixture.json(single([{ text: JSON.stringify({ ...valid, confidence }) }]));
            await expect(
                provider.call({ ...common, output: FileClassificationSchema })
            ).rejects.toBeInstanceOf(z.ZodError);
        }
        expect(fixture.requests).toHaveLength(3);
    });

    it('emits transcript predicates as structural strict-tool input and rejects invalid final arguments', async () => {
        const valid = {
            institution: 'School',
            courses: [{ courseName: 'Math', credits: 3 }],
        };
        const onPartial = mock(async (_value: unknown) => {});
        fixture.events(toolEvents(JSON.stringify(valid), 'transcript'));
        const parameters = {
            ...common,
            output: ParsedTranscriptSchema,
            toolName: 'transcript',
            onPartial,
        };
        expect(await provider.structuredStreamingCall(parameters)).toEqual(valid);
        const body = fixture.requests[0]!.body as {
            toolConfig: {
                tools: {
                    toolSpec: {
                        strict: boolean;
                        inputSchema: { json: { properties: Record<string, unknown> } };
                    };
                }[];
            };
        };
        expect(body.toolConfig.tools[0]!.toolSpec.strict).toBe(true);
        expect(body.toolConfig.tools[0]!.toolSpec.inputSchema.json.properties.institution).toEqual({
            type: 'string',
        });
        onPartial.mockClear();
        fixture.events(toolEvents(JSON.stringify({ ...valid, institution: ' ' }), 'transcript'));
        await expect(provider.structuredStreamingCall(parameters)).rejects.toBeInstanceOf(
            z.ZodError
        );
        expect(onPartial).not.toHaveBeenCalled();
        expect(fixture.requests).toHaveLength(2);
    });

    it.each(
        generationSchemaInventory.filter(
            entry => entry.role === 'chat' || entry.role === 'planning'
        )
    )('does not project or reroute any Sol-owned request shape', async entry => {
        const factory = mock(() => fixture.client);
        await expect(
            new BedrockConverseProvider(factory).call({
                ...common,
                model: 'gpt-6.1-sol',
                output: entry.schema,
            })
        ).rejects.toThrow();
        expect(factory).not.toHaveBeenCalled();
        expect(fixture.requests).toEqual([]);
    });
});

describe('client-owned native history', () => {
    const history = [
        { role: 'system' as const, content: 'Second instruction' },
        { role: 'user' as const, content: 'First exercise' },
        {
            role: 'assistant' as const,
            tool_calls: [
                {
                    id: 'call-original',
                    type: 'function' as const,
                    function: { name: 'function_0', arguments: '{"answer":"original"}' },
                },
            ],
        },
        {
            role: 'tool' as const,
            tool_call_id: 'call-original',
            content: 'Original result',
        },
        { role: 'user' as const, content: 'Next exercise' },
    ];
    it('keeps instructions, tool identifiers, arguments and result ordering', () => {
        expect(buildConverseHistory('Primary instruction', history)).toEqual({
            system: [{ text: 'Primary instruction' }, { text: 'Second instruction' }],
            messages: [
                { role: 'user', content: [{ text: 'First exercise' }] },
                {
                    role: 'assistant',
                    content: [
                        {
                            toolUse: {
                                name: 'function_0',
                                toolUseId: 'call-original',
                                input: { answer: 'original' },
                            },
                        },
                    ],
                },
                {
                    role: 'user',
                    content: [
                        {
                            toolResult: {
                                toolUseId: 'call-original',
                                content: [{ text: 'Original result' }],
                            },
                        },
                        { text: 'Next exercise' },
                    ],
                },
            ],
        });
    });
    it('sends historical registered tools through strict native tool output', async () => {
        fixture.json(
            single(
                [
                    {
                        toolUse: {
                            toolUseId: 'next-call',
                            name: 'function_0',
                            input: { answer: 'next' },
                        },
                    },
                ],
                'tool_use'
            )
        );
        expect(
            await provider.call({
                ...common,
                message: history,
                output: answerSchema,
            })
        ).toEqual({ answer: 'next' });
        expect(fixture.requests[0]!.body).toHaveProperty('toolConfig');
    });
    it('fails closed when original historical tool definitions are not available', async () => {
        await expect(provider.streamingCall({ ...common, message: history })).rejects.toThrow(
            /original registered tool definitions/
        );
        expect(fixture.requests).toEqual([]);
    });
    it('maps Responses function-call history without converting tool results to ordinary text', () => {
        expect(
            buildConverseHistory('', [
                {
                    type: 'function_call',
                    name: 'function_0',
                    call_id: 'id-original',
                    arguments: '{"answer":"original"}',
                },
                {
                    type: 'function_call_output',
                    call_id: 'id-original',
                    output: 'Original result',
                },
            ])
        ).toEqual({
            messages: [
                {
                    role: 'assistant',
                    content: [
                        {
                            toolUse: {
                                name: 'function_0',
                                toolUseId: 'id-original',
                                input: { answer: 'original' },
                            },
                        },
                    ],
                },
                {
                    role: 'user',
                    content: [
                        {
                            toolResult: {
                                toolUseId: 'id-original',
                                content: [{ text: 'Original result' }],
                            },
                        },
                    ],
                },
            ],
        });
    });
});

describe('native stream state and cancellation', () => {
    const stream = (options = {}) =>
        provider.streamingCall({
            ...common,
            options: { timeoutMs: 1_000, ...options },
        });
    const structured = (
        options: {
            onPartial?: (value: unknown) => void | Promise<void>;
            signal?: AbortSignal;
        } = {}
    ) =>
        provider.structuredStreamingCall({
            ...common,
            output: answerSchema,
            toolName: 'answer',
            onPartial: options.onPartial ?? (() => {}),
            signal: options.signal,
        });

    it('decodes native text frames and honors accumulateContent false', async () => {
        fixture.events(textEvents('Synthetic answer'));
        const onChunk = mock(async (_text: string) => {});
        expect(await stream({ onChunk, accumulateContent: false })).toBe('');
        expect(onChunk.mock.calls).toEqual([['Synthetic answer']]);
    });

    it('decodes strict native tool frames and publishes only closed strings', async () => {
        const token = `{{NAME_${'a'.repeat(32)}}}`;
        const events = toolEvents('');
        events.splice(
            2,
            1,
            ...['{"answer":"Hello ', token.slice(0, 8), token.slice(8), '"}'].map(
                (input): ConverseStreamOutput => ({
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
            await structured({
                onPartial: value => {
                    partials.push(value);
                },
            })
        ).toEqual({ answer: `Hello ${token}` });
        expect(partials).toEqual([{ answer: `Hello ${token}` }]);
        expect(fixture.requests[0]!.path).toBe('/model/us.openai.gpt-6-luna/converse-stream');
        const wire = z
            .object({
                toolConfig: z.object({
                    tools: z.array(
                        z.object({
                            toolSpec: z.object({
                                name: z.literal('answer'),
                                strict: z.literal(true),
                            }),
                        })
                    ),
                    toolChoice: z.object({ any: z.object({}) }),
                }),
            })
            .parse(fixture.requests[0]!.body);
        expect(wire.toolConfig.tools).toHaveLength(1);
    });

    it.each(['text', 'tool'])('rejects valid %s deltas at EOF without messageStop', async kind => {
        fixture.events(
            (kind === 'text'
                ? textEvents('Synthetic answer')
                : toolEvents('{"answer":"synthetic"}')
            ).filter(event => !event.messageStop && !event.metadata)
        );
        await expect(kind === 'text' ? stream() : structured()).rejects.toThrow(/did not complete/);
    });

    it.each(['max_tokens', 'end_turn', 'guardrail_intervened', 'content_filtered'])(
        'rejects incompatible strict-tool stopReason %s',
        async stopReason => {
            const events = toolEvents('{"answer":"synthetic"}');
            events[4] = { messageStop: { stopReason } };
            fixture.events(events);
            await expect(structured()).rejects.toThrow(/did not complete/);
        }
    );

    it('rejects terminal state before closing the tool content block', async () => {
        fixture.events(
            toolEvents('{"answer":"synthetic"}').filter(event => !event.contentBlockStop)
        );
        await expect(structured()).rejects.toThrow(/did not complete/);
    });

    it('rejects another tool or content after completion without publishing it', async () => {
        fixture.events([
            ...toolEvents('{"answer":"synthetic"}'),
            {
                contentBlockDelta: {
                    contentBlockIndex: 0,
                    delta: { toolUse: { input: '{"answer":"late"}' } },
                },
            },
        ]);
        const partials: unknown[] = [];
        await expect(
            structured({
                onPartial: value => {
                    partials.push(value);
                },
            })
        ).rejects.toThrow(/did not complete/);
        expect(partials).toEqual([{ answer: 'synthetic' }]);
        fixture.events(toolEvents('{"answer":"synthetic"}', 'unexpected'));
        await expect(structured()).rejects.toThrow(/did not complete/);
    });

    it('does not request a stream after an already aborted signal', async () => {
        const controller = new AbortController();
        controller.abort(new Error('owner erased'));
        await expect(stream({ signal: controller.signal })).rejects.toThrow('owner erased');
        expect(fixture.requests).toEqual([]);
    });

    it('rejects owner cancellation after a partial without returning completed output', async () => {
        const controller = new AbortController();
        fixture.events(toolEvents('{"answer":"synthetic"}'));
        await expect(
            structured({
                signal: controller.signal,
                onPartial: () => controller.abort(new Error('owner erased')),
            })
        ).rejects.toThrow('owner erased');
    });

    it.each(['call', 'stream', 'structured-stream'] as const)(
        'cancels %s while bearer refresh is pending without sending a model request',
        async mode => {
            const requested = Promise.withResolvers<void>();
            const token = Promise.withResolvers<string>();
            const local = nativeFixture(() => async () => {
                requested.resolve();
                return token.promise;
            });
            const isolated = new BedrockConverseProvider(() => local.client);
            const owner = new AbortController();
            const onPartial = mock(() => {});
            const pending =
                mode === 'call'
                    ? isolated.call({
                          ...common,
                          output: answerSchema,
                          signal: owner.signal,
                      })
                    : mode === 'stream'
                      ? isolated.streamingCall({
                            ...common,
                            options: { signal: owner.signal },
                        })
                      : isolated.structuredStreamingCall({
                            ...common,
                            output: answerSchema,
                            toolName: 'answer',
                            signal: owner.signal,
                            onPartial,
                        });
            try {
                await requested.promise;
                owner.abort(new Error('owner erased'));
                await expect(pending).rejects.toThrow('owner erased');
                expect(local.requests).toEqual([]);
                expect(onPartial).not.toHaveBeenCalled();
            } finally {
                token.resolve('synthetic-after-abort');
                local.client.destroy();
            }
        }
    );

    it('enforces the request deadline while consuming streamed content', async () => {
        const timer = new AbortController();
        const timeout = spyOn(AbortSignal, 'timeout').mockReturnValue(timer.signal);
        fixture.events(textEvents('Synthetic answer'));
        try {
            await expect(
                stream({
                    timeoutMs: 5,
                    onChunk: async () =>
                        timer.abort(new DOMException('Request timed out', 'TimeoutError')),
                })
            ).rejects.toThrow(/timed out|timeout/i);
        } finally {
            timeout.mockRestore();
        }
    });
});

it.each([
    [503, { message: 'PRIVATE PROVIDER DIAGNOSTIC' }, 'ai_provider_unavailable', 503, true],
    [429, { message: 'PRIVATE PROVIDER DIAGNOSTIC' }, 'ai_provider_rate_limited', 429, true],
    [
        400,
        {
            __type: 'ServiceQuotaExceededException',
            message: 'PRIVATE PROVIDER DIAGNOSTIC',
        },
        'ai_provider_quota_exhausted',
        503,
        false,
    ],
] as const)(
    'classifies native SDK HTTP %s failures without exposing provider diagnostics',
    async (status, body, code, httpStatus, retryable) => {
        fixture.json(body, status);
        const error = await provider.call({ ...common, output: answerSchema }).then(
            () => {
                throw new Error('Expected native service rejection');
            },
            (value: unknown) => value
        );
        const normalized = normalizeAiProviderError(error, 'bedrock');
        expect(normalized).toEqual(
            expect.objectContaining({
                code,
                httpStatus,
                retryable,
                provider: 'bedrock',
            })
        );
        expect(JSON.stringify(toAiErrorPayload(normalized))).not.toContain('PRIVATE');
        expect(fixture.requests).toHaveLength(1);
    }
);

it.each([
    [
        {
            throttlingException: new ThrottlingException({
                $metadata: {},
                message: 'PRIVATE PROVIDER DIAGNOSTIC',
            }),
        },
        'ai_provider_rate_limited',
        429,
    ],
    [
        {
            serviceUnavailableException: new ServiceUnavailableException({
                $metadata: {},
                message: 'PRIVATE PROVIDER DIAGNOSTIC',
            }),
        },
        'ai_provider_unavailable',
        503,
    ],
    [
        {
            internalServerException: new InternalServerException({
                $metadata: {},
                message: 'PRIVATE PROVIDER DIAGNOSTIC',
            }),
        },
        'ai_provider_unavailable',
        503,
    ],
] as const)('preserves native modeled stream error categories', async (event, code, httpStatus) => {
    fixture.events([
        { messageStart: { role: 'assistant' } },
        {
            contentBlockDelta: {
                contentBlockIndex: 0,
                delta: { text: 'Provisional synthetic answer' },
            },
        },
        event,
    ]);
    const error = await provider.streamingCall({ ...common, options: { timeoutMs: 1_000 } }).then(
        () => {
            throw new Error('Expected native stream rejection');
        },
        (value: unknown) => value
    );
    const normalized = normalizeAiProviderError(error, 'bedrock');
    expect(normalized).toEqual(
        expect.objectContaining({
            code,
            httpStatus,
            retryable: true,
            provider: 'bedrock',
        })
    );
    expect(JSON.stringify(toAiErrorPayload(normalized))).not.toContain('PRIVATE');
    expect(fixture.requests).toHaveLength(1);
});

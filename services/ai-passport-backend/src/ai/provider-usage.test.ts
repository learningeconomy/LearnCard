import { afterEach, beforeEach, expect, mock, spyOn, test } from 'bun:test';
import { AsyncLocalStorage } from 'node:async_hooks';
import { z } from 'zod';
import { BedrockRuntimeClient } from '@aws-sdk/client-bedrock-runtime';
import {
    createUsageMeter,
    withProviderBudget,
    withUsageMeter,
    type UsageKind,
} from './usage-meter';

// All tests use fake transports/consent/audit. No credentials, models or DB calls.
const consent = mock(async () => undefined);
const ownerScope = new AsyncLocalStorage<AbortSignal>();
mock.module('../services/dataErasure', () => ({
    getCurrentOwnerOperation: () => {
        const signal = ownerScope.getStore();
        return signal
            ? {
                  did: 'did:example:synthetic',
                  subjectRef: 'synthetic',
                  token: 'synthetic',
                  signal,
              }
            : undefined;
    },
}));
mock.module('./privacy', () => ({ assertCurrentAiConsent: consent }));
mock.module('./audit', () => ({
    withAiAudit: async (_metadata: unknown, operation: (usage: () => void) => Promise<unknown>) =>
        operation(() => {}),
}));
const { createBedrockResponsesClient } = await import('./bedrock-generation');
const { BedrockResponsesProvider } = await import('./bedrock-responses');
const { createGuardrailMasker } = await import('./bedrock-guardrails');
const { novaEmbeddings } = await import('./nova-embeddings');
const { PRIVACY_PII_TYPES } = await import('./bedrock-config');

const savedEnv = { ...process.env };
beforeEach(() => {
    consent.mockReset();
    consent.mockImplementation(async () => undefined);
    delete process.env.OPENAI_REASONING_EFFORT;
    process.env.AWS_REGION = 'us-east-1';
    process.env.BEDROCK_EMBEDDINGS_ENABLED = 'true';
    for (const key of [
        'AWS_ENDPOINT_URL',
        'AWS_ENDPOINT_URL_BEDROCK',
        'AWS_ENDPOINT_URL_BEDROCK_RUNTIME',
    ])
        delete process.env[key];
});
afterEach(() => {
    mock.restore();
    for (const key of Object.keys(process.env)) if (!(key in savedEnv)) delete process.env[key];
    Object.assign(process.env, savedEnv);
});

const answer = {
    type: 'function_call',
    id: 'synthetic-item',
    call_id: 'synthetic-call',
    name: 'function_0',
    arguments: '{"answer":"yes"}',
    status: 'completed',
};
const completed = (usage: unknown = { input_tokens: 123, output_tokens: 7 }) => ({
    status: 'completed',
    output: [answer],
    usage,
});
const callParams = {
    model: 'gpt-6.1-sol',
    message: 'synthetic private input',
    output: z.object({ answer: z.string() }),
};
const provider = (transport: NonNullable<Parameters<typeof createBedrockResponsesClient>[1]>) =>
    new BedrockResponsesProvider(() =>
        createBedrockResponsesClient({}, transport, () => async () => 'synthetic-key')
    );
const responseProvider = (response: unknown) => provider(async () => Response.json(response));
const streamProvider = (events: unknown[]) =>
    provider(
        async () =>
            new Response(
                events.map(event => `data: ${JSON.stringify(event)}\n\n`).join('') +
                    'data: [DONE]\n\n',
                { headers: { 'content-type': 'text/event-stream' } }
            )
    );

test('generation reports usage even when structured validation fails; no payloads retained', async () => {
    const meter = createUsageMeter();
    await expect(
        withUsageMeter(meter, () =>
            responseProvider(completed()).call({
                ...callParams,
                output: z.object({ different: z.string() }),
            })
        )
    ).rejects.toThrow();
    expect(meter.generation).toEqual({
        requests: 1,
        measuredRequests: 1,
        inputTokens: 123,
        outputTokens: 7,
    });
    expect(JSON.stringify(meter)).not.toContain('synthetic');
});

test('generation only accepts complete bounded provider usage without cache assumptions', async () => {
    const meter = createUsageMeter();
    await withUsageMeter(meter, async () => {
        expect(
            await responseProvider(
                completed({
                    input_tokens: 123,
                    output_tokens: 7,
                    input_tokens_details: { cached_tokens: 120 },
                })
            ).call(callParams)
        ).toEqual({ answer: 'yes' });
        for (const usage of [
            null,
            {},
            { input_tokens: 12 },
            { input_tokens: '12', output_tokens: 2 },
            { input_tokens: 12, output_tokens: -1 },
        ])
            await responseProvider(completed(usage)).call(callParams);
    });
    expect(meter.generation).toEqual({
        requests: 6,
        measuredRequests: 1,
        inputTokens: 123,
        outputTokens: 7,
    });
});

test('generation counts dispatch errors and timeouts as unmeasured requests', async () => {
    const meter = createUsageMeter();
    await withUsageMeter(meter, async () => {
        await expect(
            provider(async () => {
                throw new Error('transport failure');
            }).call(callParams)
        ).rejects.toThrow();
        await expect(
            provider(async () => new Promise<Response>(() => {})).call({
                ...callParams,
                timeoutMs: 10,
            })
        ).rejects.toThrow();
    });
    expect(meter.generation).toEqual({
        requests: 2,
        measuredRequests: 0,
        inputTokens: 0,
        outputTokens: 0,
    });
});

test('invalid generation configuration and already aborted requests do not count dispatches', async () => {
    const meter = createUsageMeter();
    const unreachable = mock(async () => {
        throw new Error('must not dispatch');
    });
    await withUsageMeter(meter, async () => {
        await expect(
            provider(unreachable).call({ ...callParams, model: 'unapproved' })
        ).rejects.toThrow();
        await expect(
            provider(unreachable).call({
                ...callParams,
                signal: AbortSignal.abort(),
            })
        ).rejects.toThrow();
        await expect(
            new BedrockResponsesProvider(() => {
                throw new Error('invalid client config');
            }).call(callParams)
        ).rejects.toThrow();
    });
    expect(unreachable).not.toHaveBeenCalled();
    expect(meter.generation.requests).toBe(0);
});

for (const status of ['completed', 'failed', 'incomplete'] as const) {
    test(`stream terminal ${status} records usage exactly once without changing protocol handling`, async () => {
        const meter = createUsageMeter();
        const event = {
            type: `response.${status}`,
            response: {
                status,
                output: [],
                usage: { input_tokens: 20, output_tokens: 3 },
            },
        };
        const pending = withUsageMeter(meter, () =>
            streamProvider([event, event]).streamingCall({
                model: 'gpt-6.1-sol',
                message: 'synthetic',
            })
        );
        await expect(pending).rejects.toThrow();
        expect(meter.generation).toEqual({
            requests: 1,
            measuredRequests: 1,
            inputTokens: 20,
            outputTokens: 3,
        });
    });
}

test('streams without terminal usage remain unmeasured', async () => {
    const meter = createUsageMeter();
    await withUsageMeter(meter, async () => {
        await expect(
            streamProvider([]).streamingCall({
                model: 'gpt-6.1-sol',
                message: 'synthetic',
            })
        ).rejects.toThrow();
        expect(
            await streamProvider([
                {
                    type: 'response.completed',
                    response: { status: 'completed', output: [] },
                },
            ]).streamingCall({ model: 'gpt-6.1-sol', message: 'synthetic' })
        ).toBe('');
    });
    expect(meter.generation).toEqual({
        requests: 2,
        measuredRequests: 0,
        inputTokens: 0,
        outputTokens: 0,
    });
});

const guardrailConfig = {
    region: 'us-east-1' as const,
    guardrailIdentifier: 'synthetic123',
    guardrailVersion: '1',
};
const guardrailPolicy = {
    guardrailId: 'synthetic123',
    guardrailArn: 'arn:aws:bedrock:us-east-1:123456789012:guardrail/synthetic123',
    version: '1',
    status: 'READY',
    blockedInputMessaging: 'blocked input',
    blockedOutputsMessaging: 'blocked output',
    sensitiveInformationPolicy: {
        piiEntities: PRIVACY_PII_TYPES.map(type => ({
            type,
            action: 'ANONYMIZE',
            inputAction: 'ANONYMIZE',
            outputAction: 'ANONYMIZE',
            inputEnabled: true,
            outputEnabled: true,
        })),
    },
};
const guardrailResponse = {
    action: 'NONE',
    outputs: [],
    assessments: [{}],
    usage: {
        sensitiveInformationPolicyUnits: 2,
        sensitiveInformationPolicyFreeUnits: 1,
    },
};
const masker = (overrides: Partial<Parameters<typeof createGuardrailMasker>[0]> = {}) =>
    createGuardrailMasker({
        config: () => guardrailConfig,
        locale: () => 'en',
        assertConsent: async () => undefined,
        getPolicy: async () => guardrailPolicy,
        getLogging: async () => ({}),
        apply: async () => guardrailResponse,
        withAudit: async (_metadata, operation) => operation(() => {}),
        timeoutMs: 10,
        ...overrides,
    });

test('privacy counts only apply requests, retaining paid units before validation or consent-after failures', async () => {
    const meter = createUsageMeter();
    await withUsageMeter(meter, async () => {
        expect(await masker()('synthetic')).toBe('synthetic');
        await expect(
            masker({
                apply: async () => ({ ...guardrailResponse, action: 'malformed' }),
            })('synthetic')
        ).rejects.toThrow();
        let calls = 0;
        await expect(
            masker({
                assertConsent: async () => {
                    calls += 1;
                    if (calls === 2) throw new Error('revoked');
                },
            })('synthetic')
        ).rejects.toThrow();
    });
    expect(meter.privacy).toEqual({
        requests: 3,
        measuredRequests: 3,
        textUnits: 6,
        freeTextUnits: 3,
    });
});

test('privacy missing/invalid usage and timeouts remain unmeasured; validation remains fail-closed', async () => {
    const meter = createUsageMeter();
    await withUsageMeter(meter, async () => {
        for (const usage of [
            undefined,
            {
                sensitiveInformationPolicyUnits: -1,
                sensitiveInformationPolicyFreeUnits: 0,
            },
            { sensitiveInformationPolicyUnits: 1 },
        ]) {
            await expect(
                masker({ apply: async () => ({ ...guardrailResponse, usage }) })('synthetic')
            ).rejects.toThrow();
        }
        await expect(
            masker({ apply: async () => new Promise(() => {}) })('synthetic')
        ).rejects.toThrow();
        await expect(
            masker({
                apply: async () => {
                    throw new Error('transport');
                },
            })('synthetic')
        ).rejects.toThrow();
    });
    expect(meter.privacy).toEqual({
        requests: 5,
        measuredRequests: 0,
        textUnits: 0,
        freeTextUnits: 0,
    });
});

test('privacy failures before dispatch and empty text do not count requests', async () => {
    const meter = createUsageMeter();
    await withUsageMeter(meter, async () => {
        expect(await masker()('')).toBe('');
        await expect(masker({ getPolicy: async () => ({}) })('synthetic')).rejects.toThrow();
        await expect(
            masker({ getLogging: async () => ({ loggingConfig: {} }) })('synthetic')
        ).rejects.toThrow();
        await expect(
            masker({
                assertConsent: async () => {
                    throw new Error('denied');
                },
            })('synthetic')
        ).rejects.toThrow();
    });
    expect(meter.privacy.requests).toBe(0);
});

test('Nova counts each dispatched text without inventing token usage from undocumented fields', async () => {
    const meter = createUsageMeter();
    const send = spyOn(BedrockRuntimeClient.prototype, 'send').mockImplementation(
        async () =>
            ({
                body: new TextEncoder().encode(
                    JSON.stringify({
                        embeddings: [{ embeddingType: 'TEXT', embedding: Array(1024).fill(1) }],
                        inputTextTokenCount: 55,
                        usage: { inputTokens: 44 },
                    })
                ),
            }) as never
    );
    const result = await withUsageMeter(meter, () =>
        novaEmbeddings(['first', 'second'], 'document')
    );
    expect(result).toHaveLength(2);
    expect(result[0]![0]).toBe(1 / 32);
    expect(send).toHaveBeenCalledTimes(2);
    expect(meter.embedding).toEqual({
        requests: 2,
        measuredRequests: 0,
        inputTokens: 0,
    });
});

test('Nova counts rejected transports but not pre-dispatch consent, payload, config or abort failures', async () => {
    const meter = createUsageMeter();
    const send = spyOn(BedrockRuntimeClient.prototype, 'send').mockImplementation(async () => {
        throw new Error('synthetic transport');
    });
    await withUsageMeter(meter, async () => {
        await expect(novaEmbeddings(['synthetic'], 'document')).rejects.toThrow();
        await expect(novaEmbeddings([''], 'document')).rejects.toThrow();
        await expect(
            novaEmbeddings(['synthetic'], 'document', AbortSignal.abort())
        ).rejects.toThrow();
        consent.mockImplementation(async () => {
            throw new Error('denied');
        });
        await expect(novaEmbeddings(['synthetic'], 'document')).rejects.toThrow();
        process.env.AWS_REGION = 'invalid';
        await expect(novaEmbeddings(['synthetic'], 'document')).rejects.toThrow();
    });
    expect(send).toHaveBeenCalledTimes(1);
    expect(meter.embedding).toEqual({
        requests: 1,
        measuredRequests: 0,
        inputTokens: 0,
    });
});

// Every dispatch path uses only synthetic SDK transports or injected dependencies.
const budgetCases = ['structured', 'stream', 'privacy', 'embedding'] as const;
const budgetFixture = (mode: (typeof budgetCases)[number]) => {
    if (mode === 'privacy') {
        const dispatch = mock(async () => guardrailResponse);
        const apply = masker({ apply: dispatch, timeoutMs: 1000 });
        return {
            kind: 'privacy' as const,
            dispatch,
            run: (_signal?: AbortSignal): Promise<unknown> => apply('synthetic'),
        };
    }
    if (mode === 'embedding') {
        const dispatch = spyOn(BedrockRuntimeClient.prototype, 'send').mockImplementation(
            async () =>
                ({
                    body: new TextEncoder().encode(
                        JSON.stringify({
                            embeddings: [{ embeddingType: 'TEXT', embedding: Array(1024).fill(1) }],
                        })
                    ),
                }) as never
        );
        return {
            kind: 'embedding' as const,
            dispatch,
            run: (signal?: AbortSignal): Promise<unknown> =>
                novaEmbeddings(['synthetic'], 'document', signal),
        };
    }
    const dispatch = mock(async () =>
        mode === 'structured'
            ? Response.json(completed())
            : new Response(
                  `data: ${JSON.stringify({
                      type: 'response.completed',
                      response: {
                          status: 'completed',
                          output: [],
                          usage: { input_tokens: 4, output_tokens: 1 },
                      },
                  })}\n\ndata: [DONE]\n\n`,
                  { headers: { 'content-type': 'text/event-stream' } }
              )
    );
    const client = provider(dispatch);
    return {
        kind: 'generation' as const,
        dispatch,
        run: (signal?: AbortSignal): Promise<unknown> =>
            mode === 'structured'
                ? client.call({ ...callParams, signal })
                : client.streamingCall({
                      model: 'gpt-6.1-sol',
                      message: 'synthetic',
                      options: { signal },
                  }),
    };
};

for (const mode of budgetCases) {
    test(`${mode} fails closed without usage or dispatch when its reservation rejects`, async () => {
        const { kind, dispatch, run } = budgetFixture(mode);
        const meter = createUsageMeter();
        const reserve = mock(async (_kind: UsageKind) => {
            throw new Error('budget stopped');
        });
        await expect(
            withUsageMeter(meter, () => withProviderBudget(reserve, run))
        ).rejects.toThrow();
        expect(reserve).toHaveBeenCalledTimes(1);
        expect(reserve).toHaveBeenCalledWith(kind);
        expect(dispatch).not.toHaveBeenCalled();
        expect(meter).toEqual(createUsageMeter());
    });

    test(`${mode} awaits approval and dispatches exactly once with ordinary output and usage`, async () => {
        const { kind, dispatch, run } = budgetFixture(mode);
        const meter = createUsageMeter();
        const entered = Promise.withResolvers<void>();
        const approved = Promise.withResolvers<void>();
        const reserve = mock(async (_kind: UsageKind) => {
            entered.resolve();
            await approved.promise;
        });
        const pending = withUsageMeter(meter, () => withProviderBudget(reserve, run));
        await entered.promise;
        expect(dispatch).not.toHaveBeenCalled();
        expect(meter[kind].requests).toBe(0);
        approved.resolve();
        const result = await pending;
        expect(reserve).toHaveBeenCalledTimes(1);
        expect(reserve).toHaveBeenCalledWith(kind);
        expect(dispatch).toHaveBeenCalledTimes(1);
        expect(meter[kind].requests).toBe(1);
        if (mode === 'structured') expect(result).toEqual({ answer: 'yes' });
        else if (mode === 'stream') expect(result).toBe('');
        else if (mode === 'privacy') expect(result).toBe('synthetic');
        else expect(result).toEqual([Array(1024).fill(1 / 32)]);
        expect(meter[kind].measuredRequests).toBe(mode === 'embedding' ? 0 : 1);
    });
}

for (const mode of ['structured', 'stream', 'embedding'] as const) {
    test(`${mode} does not dispatch when a pending reservation resolves after cancellation`, async () => {
        const { dispatch, run } = budgetFixture(mode);
        const meter = createUsageMeter();
        const controller = new AbortController();
        const entered = Promise.withResolvers<void>();
        const approved = Promise.withResolvers<void>();
        const pending = withUsageMeter(meter, () =>
            withProviderBudget(
                async () => {
                    entered.resolve();
                    await approved.promise;
                },
                () => run(controller.signal)
            )
        );
        await entered.promise;
        controller.abort();
        // Responses already settles its outer abort race while the reservation waits.
        if (mode !== 'embedding') await expect(pending).rejects.toThrow();
        approved.resolve();
        await expect(pending).rejects.toThrow();
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(dispatch).not.toHaveBeenCalled();
        expect(meter).toEqual(createUsageMeter());
    });
}

test('privacy cannot dispatch when reservation resolves after the bounded request timed out', async () => {
    const dispatch = mock(async () => guardrailResponse);
    const apply = masker({ apply: dispatch, timeoutMs: 10 });
    const meter = createUsageMeter();
    const entered = Promise.withResolvers<void>();
    const approved = Promise.withResolvers<void>();
    const pending = withUsageMeter(meter, () =>
        withProviderBudget(
            async () => {
                entered.resolve();
                await approved.promise;
            },
            () => apply('synthetic')
        )
    );
    await entered.promise;
    await expect(pending).rejects.toThrow('timed out');
    approved.resolve();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(dispatch).not.toHaveBeenCalled();
    expect(meter).toEqual(createUsageMeter());
});

test('privacy cannot dispatch after owner cancellation during a pending reservation', async () => {
    const cancelled = budgetFixture('privacy');
    const active = budgetFixture('privacy');
    const meter = createUsageMeter();
    const owner = new AbortController();
    const otherOwner = new AbortController();
    const entered = Promise.withResolvers<void>();
    const approved = Promise.withResolvers<void>();
    const pending = ownerScope.run(owner.signal, () =>
        withUsageMeter(meter, () =>
            withProviderBudget(async () => {
                entered.resolve();
                await approved.promise;
            }, cancelled.run)
        )
    );
    await entered.promise;
    owner.abort(new Error('synthetic owner erasure'));
    // Owner cancellation settles promptly even if reservation storage is stalled.
    await expect(pending).rejects.toThrow('Managed privacy processing unavailable');
    expect(await ownerScope.run(otherOwner.signal, active.run)).toBe('synthetic');
    approved.resolve();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(cancelled.dispatch).not.toHaveBeenCalled();
    expect(active.dispatch).toHaveBeenCalledTimes(1);
    expect(meter).toEqual(createUsageMeter());
    // The completed owner scope must not affect subsequent ordinary calls.
    expect(await cancelled.run()).toBe('synthetic');
    expect(cancelled.dispatch).toHaveBeenCalledTimes(1);
});

test("privacy binds the dispatched transport to the active owner's cancellation", async () => {
    const owner = new AbortController();
    const entered = Promise.withResolvers<AbortSignal>();
    const apply = masker({
        timeoutMs: 1000,
        apply: async (_config, _text, _source, signal) => {
            entered.resolve(signal);
            return new Promise(() => {});
        },
    });
    const pending = ownerScope.run(owner.signal, () => apply('synthetic'));
    const signal = await entered.promise;
    owner.abort();
    await expect(pending).rejects.toThrow('Managed privacy processing unavailable');
    expect(signal.aborted).toBe(true);
});

test('Nova reserves every text separately and stops before the first denied dispatch', async () => {
    const { dispatch } = budgetFixture('embedding');
    const meter = createUsageMeter();
    const reserve = mock(async (_kind: UsageKind) => {
        if (reserve.mock.calls.length === 2) throw new Error('budget stopped');
    });
    await expect(
        withUsageMeter(meter, () =>
            withProviderBudget(reserve, () =>
                novaEmbeddings(['first', 'second', 'third'], 'document')
            )
        )
    ).rejects.toThrow('budget stopped');
    expect(reserve).toHaveBeenCalledTimes(2);
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(meter.embedding.requests).toBe(1);
});

test('pre-dispatch validation and consent failures do not reserve provider budget', async () => {
    const reserve = mock(async (_kind: UsageKind) => {});
    const dispatch = mock(async () => Response.json(completed()));
    await withProviderBudget(reserve, async () => {
        await expect(
            provider(dispatch).call({ ...callParams, model: 'invalid' })
        ).rejects.toThrow();
        await expect(
            provider(dispatch).call({ ...callParams, signal: AbortSignal.abort() })
        ).rejects.toThrow();
        await expect(
            new BedrockResponsesProvider(() => {
                throw new Error('invalid client config');
            }).call(callParams)
        ).rejects.toThrow();
        expect(await masker()('')).toBe('');
        await expect(masker({ getPolicy: async () => ({}) })('synthetic')).rejects.toThrow();
        await expect(
            masker({
                assertConsent: async () => {
                    throw new Error('denied');
                },
            })('synthetic')
        ).rejects.toThrow();
        await expect(novaEmbeddings([''], 'document')).rejects.toThrow();
        await expect(
            novaEmbeddings(['synthetic'], 'document', AbortSignal.abort())
        ).rejects.toThrow();
        consent.mockImplementation(async () => {
            throw new Error('denied');
        });
        await expect(novaEmbeddings(['synthetic'], 'document')).rejects.toThrow();
        process.env.AWS_REGION = 'invalid';
        await expect(novaEmbeddings(['synthetic'], 'document')).rejects.toThrow();
    });
    expect(reserve).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
});

test('Nova transport failures carry ordinal/timing/abort diagnostics without changing calls or retries', async () => {
    const { embeddingFailureDetails, withEmbeddingUnitDeadline } =
        await import('./embedding-diagnostics');
    const { normalizeAiProviderError } = await import('./errors');
    const raw = Object.assign(
        new Error(
            '@smithy/node-http-handler - the request socket did not establish a connection with the server within the configured timeout of 3000 ms.'
        ),
        { name: 'TimeoutError' }
    );
    const send = spyOn(BedrockRuntimeClient.prototype, 'send').mockImplementation(async () => {
        throw raw;
    });
    const meter = createUsageMeter();
    const result = await withUsageMeter(meter, () =>
        withEmbeddingUnitDeadline(Date.now() + 60000, () =>
            novaEmbeddings(['synthetic one', 'synthetic two'], 'document')
        )
    ).catch(e => e);
    expect(result).toBe(raw);
    expect(send).toHaveBeenCalledTimes(1);
    expect(meter.embedding.requests).toBe(1);
    const detail = embeddingFailureDetails(normalizeAiProviderError(result, 'bedrock-embeddings'))!;
    expect(detail.ordinal).toBe(1);
    expect(detail.sdkCategory).toBe('connection_timeout');
    expect(detail.callerAborted).toBe(false);
    expect(detail.unitRemainingMs).toBeGreaterThan(0);
});
test('Nova caller deadline is observable independently of an SDK AbortError', async () => {
    const { embeddingFailureDetails } = await import('./embedding-diagnostics');
    const caller = new AbortController();
    const send = spyOn(BedrockRuntimeClient.prototype, 'send').mockImplementation(async () => {
        caller.abort(new DOMException('synthetic deadline', 'TimeoutError'));
        throw Object.assign(new Error('synthetic SDK abort'), { name: 'AbortError' });
    });
    const error = await novaEmbeddings(['synthetic'], 'document', caller.signal).catch(e => e);
    const detail = embeddingFailureDetails(error)!;
    expect(send).toHaveBeenCalledTimes(1);
    expect(detail.callerAbortKind).toBe('deadline');
    expect(detail.callerAborted).toBe(true);
    expect(detail.sdkCategory).toBe('aborted');
});

test('generation request deadline records provider timeout evidence; caller deadlines/cancellation never do', async () => {
    const { generationFailureDetails } = await import('./generation-failure');
    const { normalizeAiProviderError } = await import('./errors');
    const { createBackfillFailure, sanitizeBackfillFailure } =
        await import('../admin/backfill-diagnostics');
    const meter = createUsageMeter();
    const raw = await withUsageMeter(meter, () =>
        provider(async () => new Promise<Response>(() => {})).call({ ...callParams, timeoutMs: 10 })
    ).catch(e => e);
    expect(generationFailureDetails(raw)).toBe('provider_timeout');
    const normalized = normalizeAiProviderError(raw, 'bedrock');
    const failure = createBackfillFailure(normalized, {
        stage: 'generation',
        record: 1,
        providerPipelineEntered: true,
        meter,
    });
    expect(failure?.generationFailure).toBe('provider_timeout');
    expect(failure?.code).toBe('ai_request_timeout');
    expect(failure?.providerOperation).toBe('request');
    expect(failure?.requests.generation).toBe(1);
    expect(
        sanitizeBackfillFailure({ ...failure, generationFailure: null })?.generationFailure
    ).toBeUndefined();
    for (const reason of [
        new DOMException('synthetic deadline', 'TimeoutError'),
        new DOMException('synthetic cancel', 'AbortError'),
    ]) {
        const caller = new AbortController();
        const error = await provider(async () => {
            caller.abort(reason);
            return new Promise<Response>(() => {});
        })
            .call({ ...callParams, signal: caller.signal })
            .catch(e => e);
        expect(generationFailureDetails(error)).toBe('caller_aborted');
    }
    const error = await provider(async () => {
        throw Object.assign(new Error('synthetic transport timeout'), { name: 'TimeoutError' });
    })
        .call(callParams)
        .catch(e => e);
    expect(generationFailureDetails(error)).toBe('provider_timeout');
});

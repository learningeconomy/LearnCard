import { createHash } from 'node:crypto';
import * as Sentry from '@sentry/node';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const providerMocks = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock('openai', () => ({
    default: class OpenAI {
        chat = { completions: { create: providerMocks.create } };
    },
}));

import { createOpenAIProvider } from '../src/agent/openAIProvider';
import { runAgent } from '../src/agent/runAgent';
import type { AgentProvider, AgentToolDefinition } from '../src/agent/types';
import {
    createAgentRunTelemetry,
    flushObservability,
    getOwnerTelemetryId,
    initializeObservability,
    recordAutonomyCycle,
    recordHttpRequest,
    recordServiceError,
    verifySentryDelivery,
    type SafeRunLogRecord,
} from '../src/observability';
import { runChatRequest } from '../src/server';
import { createSelfImprovementRuntime } from '../src/selfImprovement';
import { createMongoRuntime } from '../src/mongo';
import { createInMemoryRetroResultRepository } from '../src/selfImprovement/retro';
import {
    createInMemoryRunTraceRepository,
    createRunTraceService,
} from '../src/selfImprovement/runTrace';
import {
    createInMemoryUserDocRepository,
    createUserDocService,
} from '../src/selfImprovement/userDocs';
import { createSentryMemoryTransport, telemetryConfig as config } from './helpers/sentryTransport';

const memory = createSentryMemoryTransport();
const ownerDid = 'did:key:private-owner';
const runId = '370358db-2eb9-40b1-aa31-9ebd2f13e5af';
const correlationId = '6e9a7c1a-9bbd-4df8-b478-989f87a3dc80';
const usage = { inputTokens: 20, outputTokens: 10, totalTokens: 30 };
const successfulProvider: AgentProvider = {
    complete: async () => ({
        message: { role: 'assistant', content: 'Private response prose' },
        usage,
    }),
};
const telemetry = (sensitiveContent: string[] = [], id = runId) =>
    createAgentRunTelemetry({
        runId: id,
        correlationId,
        ownerDid,
        triggerType: 'interactive',
        config,
        sensitiveContent,
    });
const failures = (component: string) =>
    memory.events.filter(event => event.tags?.component === component);
const applicationLogEvents = (id = runId) =>
    memory.events.filter(
        event => event.tags?.recordKind === 'application-log' && event.tags.runId === id
    );
const approvedLogTags: Record<string, true> = {
    component: true,
    recordKind: true,
    runId: true,
    correlationId: true,
    ownerId: true,
    triggerType: true,
    phase: true,
    status: true,
};
const expectSafeLogStream = (id = runId) => {
    const events = applicationLogEvents(id);
    const records = events.map(event => event.extra?.logRecord as SafeRunLogRecord);
    for (const [index, event] of events.entries()) {
        const record = records[index]!;
        expect(event.tags).toMatchObject({ component: 'application-log', runId: id });
        for (const [key, value] of Object.entries(event.tags ?? {})) {
            expect(Object.hasOwn(approvedLogTags, key)).toBe(true);
            expect(typeof value).toBe('string');
            expect((value as string).length).toBeLessThanOrEqual(256);
        }
        expect(Object.keys(event.extra ?? {})).toEqual(['logRecord']);
        expect(record.fields.runId).toBe(id);
        expect(Number.isFinite(record.timestamp)).toBe(true);
        expect(Number.isSafeInteger(record.sequence)).toBe(true);
        if (index > 0) expect(record.sequence).toBeGreaterThan(records[index - 1]!.sequence);
        for (const value of Object.values(record.fields)) {
            expect(['string', 'number', 'boolean']).toContain(typeof value);
            if (typeof value === 'string') expect(value.length).toBeLessThanOrEqual(256);
        }
    }
    return records;
};

beforeAll(() => initializeObservability(config, memory.transport));
beforeEach(() => {
    memory.events.length = 0;
    memory.state.statusCode = 200;
    Sentry.configureScope(scope => scope.clear());
});
afterAll(() => Sentry.close());

describe('Sentry final SDK envelopes', () => {
    it('keeps run success and post-run events when trace sampling is zero', async () => {
        const result = await runChatRequest({
            body: { messages: [{ role: 'user', content: 'Private request prose' }] },
            ownerDid,
            runId,
            requestId: correlationId,
            config,
            provider: successfulProvider,
            tools: [],
        });
        expect(result.status).toBe(200);
        await result.afterResponse?.();
        await flushObservability();
        expect(
            memory.events
                .filter(event => event.tags?.recordKind !== 'application-log')
                .map(event => event.message)
        ).toEqual([
            'agent.run.started',
            'agent.model.completed',
            'agent.run.succeeded',
            'agent.post-run.started',
            'agent.post-run.succeeded',
        ]);
        const success = memory.events.find(event => event.message === 'agent.run.succeeded');
        expect(success?.tags).toMatchObject({
            runId,
            correlationId: expect.stringMatching(/^sha256:/),
            ownerId: getOwnerTelemetryId(ownerDid),
            triggerType: 'interactive',
            phase: 'main',
            status: 'succeeded',
            totalTokens: 30,
            modelCalls: 1,
            toolSuccesses: 0,
            toolFailures: 0,
        });
        expect(memory.events.some(event => event.type === 'transaction')).toBe(false);
        expect(JSON.stringify(memory.events)).not.toMatch(/Private (?:request|response) prose/);
    });

    it('does not forward HTTP completion or arbitrary console output as run logs', async () => {
        const output = vi.spyOn(console, 'log').mockImplementation(() => {});
        try {
            recordHttpRequest({
                requestId: correlationId,
                method: 'POST',
                route: '/api/agent/run',
                statusCode: 500,
                durationMs: 12,
                ownerId: getOwnerTelemetryId(ownerDid),
            });
            console.log('PRIVATE_UNSTRUCTURED_CONSOLE', { runId });
            const run = telemetry();
            run.started();
            await flushObservability();
            expect(expectSafeLogStream().map(record => record.event)).toEqual([
                'agent.run.started',
            ]);
            expect(JSON.stringify(memory.events)).not.toMatch(
                /http\.request\.completed|PRIVATE_UNSTRUCTURED_CONSOLE|\/api\/agent\/run/
            );
        } finally {
            output.mockRestore();
        }
    });

    it('forwards the full safe model/tool/main/post-run log stream despite SDK event and hint mutations', async () => {
        const privatePrompt = 'PRIVATE_FULL_LOG_PROMPT';
        const privateArgument = 'PRIVATE_FULL_LOG_ARGUMENT';
        const privateResult = 'PRIVATE_FULL_LOG_RESULT';
        const privateOutput = 'PRIVATE_FULL_LOG_OUTPUT';
        const privateException = 'PRIVATE_FULL_LOG_EXCEPTION';
        const privateCredential = 'SyntheticFullLogWalletCredential';
        const privateMutation = 'PRIVATE_FULL_LOG_PROCESSOR_MUTATION';
        const priorSeed = process.env.AI_AGENT_WALLET_SEED;
        process.env.AI_AGENT_WALLET_SEED = privateCredential;
        let active = true;
        Sentry.addGlobalEventProcessor((event, hint) => {
            if (!active) return event;
            event.message = privateMutation;
            event.tags = { privateMutation };
            if (event.extra?.logRecord) {
                const record = event.extra.logRecord as SafeRunLogRecord;
                record.event = privateMutation;
                record.sequence = -1;
                record.fields.privateMutation = privateMutation;
            }
            event.extra = { privateMutation };
            if (hint.data) {
                for (const value of Object.values(hint.data)) {
                    if (value && typeof value === 'object') {
                        Object.assign(value, {
                            message: privateMutation,
                            extra: { logRecord: { fields: { privateMutation } } },
                        });
                    }
                }
                hint.data.privateMutation = privateMutation;
            }
            return event;
        });
        try {
            expect(Sentry.getCurrentHub().getClient()?.getOptions().tracesSampleRate).toBe(0);
            let calls = 0;
            const result = await runChatRequest({
                body: { messages: [{ role: 'user', content: privatePrompt }] },
                ownerDid,
                runId,
                requestId: correlationId,
                config,
                tools: [
                    {
                        name: 'readApprovedData',
                        description: 'Offline approved read',
                        parameters: {},
                        execute: async () => ({ value: privateResult }),
                    },
                    {
                        name: 'recoverableRead',
                        description: 'Offline recoverable failure',
                        parameters: {},
                        execute: async () => {
                            throw new TypeError(
                                `Tool backend unavailable ${privateArgument} ${privateCredential}`
                            );
                        },
                    },
                ],
                provider: {
                    complete: async () =>
                        ++calls === 1
                            ? {
                                  message: {
                                      role: 'assistant',
                                      content: 'PRIVATE_FULL_LOG_PREFACE',
                                      toolCalls: [
                                          {
                                              id: 'PRIVATE_FULL_LOG_TOOL_ID',
                                              name: 'readApprovedData',
                                              arguments: { value: privateArgument },
                                          },
                                          {
                                              id: 'PRIVATE_FULL_LOG_FAILURE_ID',
                                              name: 'recoverableRead',
                                              arguments: { value: privateArgument },
                                          },
                                      ],
                                  },
                                  usage,
                              }
                            : { message: { role: 'assistant', content: privateOutput }, usage },
                },
            });
            expect(result.status).toBe(200);
            await result.afterResponse?.();
            recordServiceError(
                'http.async-handler',
                new Error(privateException),
                Object.assign(
                    {
                        runId,
                        correlationId,
                        ownerDid,
                        phase: 'post-run' as const,
                        sensitiveContent: [privateException],
                    },
                    { arbitraryPrivateField: privateResult }
                )
            );
            recordAutonomyCycle({
                triggerSource: 'offline',
                startedAt: '2026-01-01T00:00:00.000Z',
                completedAt: '2026-01-01T00:00:01.000Z',
                dueCount: 2,
                results: [
                    Object.assign(
                        {
                            ownerDid,
                            scheduleId: `schedule-${'x'.repeat(400)}`,
                            scheduledFor: '2026-01-01T00:00:00.000Z',
                            status: 'succeeded' as const,
                            runId,
                        },
                        { arbitraryPrivateField: privateResult }
                    ),
                    {
                        ownerDid,
                        scheduleId: 'without-run',
                        scheduledFor: '2026-01-01T00:00:00.000Z',
                        status: 'skipped',
                    },
                ],
            });
            await flushObservability();
            const records = expectSafeLogStream();
            expect(records.map(record => [record.event, record.level])).toEqual([
                ['agent.run.started', 'info'],
                ['agent.model.completed', 'info'],
                ['agent.tool.completed', 'info'],
                ['agent.tool.completed', 'warn'],
                ['agent.model.completed', 'info'],
                ['agent.run.succeeded', 'info'],
                ['agent.post-run.succeeded', 'info'],
                ['service.error', 'error'],
                ['autonomy.occurrence.completed', 'info'],
            ]);
            expect(records[1]?.fields).toMatchObject({
                modelCalls: 1,
                totalTokens: 30,
                cumulativeTotalTokens: 30,
                round: 0,
            });
            expect(records[2]?.fields).toMatchObject({
                toolName: 'readApprovedData',
                success: true,
                toolSuccesses: 1,
                toolFailures: 0,
            });
            expect(records[3]?.fields).toMatchObject({
                toolName: 'recoverableRead',
                success: false,
                toolSuccesses: 1,
                toolFailures: 1,
                errorType: 'TypeError',
            });
            for (const record of [records[5], records[6]]) {
                expect(record?.fields).toMatchObject({
                    modelCalls: 2,
                    toolCalls: 2,
                    toolSuccesses: 1,
                    toolFailures: 1,
                    totalTokens: 60,
                    cumulativeTotalTokens: 60,
                });
            }
            expect(records[6]?.fields.phase).toBe('post-run');
            expect(records[7]?.fields).toMatchObject({
                component: 'http.async-handler',
                phase: 'post-run',
                errorType: 'Error',
            });
            expect(records[8]?.fields).toMatchObject({
                status: 'succeeded',
                triggerSource: 'offline',
                ownerId: getOwnerTelemetryId(ownerDid),
            });
            expect(records[8]?.fields.scheduleId).toHaveLength(256);
            const lifecycleMessages = memory.events
                .filter(event => event.tags?.recordKind !== 'application-log' && event.message)
                .map(event => event.message);
            expect(lifecycleMessages).toEqual([
                'agent.run.started',
                'agent.model.completed',
                'agent.tool.completed',
                'agent.model.completed',
                'agent.run.succeeded',
                'agent.post-run.started',
                'agent.post-run.succeeded',
            ]);
            expect(failures('agent.tool')[0]?.exception?.values?.[0]?.type).toBe('TypeError');
            expect(failures('http.async-handler')[0]?.exception?.values?.[0]?.type).toBe('Error');
            expect(memory.events.some(event => event.type === 'transaction')).toBe(false);
            const payload = JSON.stringify(memory.events);
            for (const forbidden of [
                privatePrompt,
                privateArgument,
                privateResult,
                privateOutput,
                privateException,
                privateCredential,
                privateMutation,
                ownerDid,
                'PRIVATE_FULL_LOG_PREFACE',
                'PRIVATE_FULL_LOG_TOOL_ID',
                'PRIVATE_FULL_LOG_FAILURE_ID',
            ])
                expect(payload).not.toContain(forbidden);
            const logPayload = JSON.stringify(applicationLogEvents());
            expect(logPayload).not.toContain('Tool backend unavailable');
            expect(logPayload).not.toContain('exception');
        } finally {
            active = false;
            if (priorSeed === undefined) delete process.env.AI_AGENT_WALLET_SEED;
            else process.env.AI_AGENT_WALLET_SEED = priorSeed;
        }
    });

    it('does not truncate long emitted tool-log sequences or restart the process-local sequence', async () => {
        const toolCount = 130;
        let calls = 0;
        const result = await runChatRequest({
            body: { messages: [{ role: 'user', content: 'Offline repeated read' }] },
            ownerDid,
            runId,
            config,
            tools: [
                {
                    name: 'readApprovedData',
                    description: 'Offline read',
                    parameters: {},
                    execute: async () => ({ approved: true }),
                },
            ],
            provider: {
                complete: async () =>
                    ++calls === 1
                        ? {
                              message: {
                                  role: 'assistant',
                                  content: '',
                                  toolCalls: Array.from({ length: toolCount }, (_, index) => ({
                                      id: `tool-${index}`,
                                      name: 'readApprovedData',
                                      arguments: {},
                                  })),
                              },
                              usage,
                          }
                        : { message: { role: 'assistant', content: 'Finished reads' }, usage },
            },
        });
        expect(result.status).toBe(200);
        await result.afterResponse?.();
        await flushObservability();
        const records = expectSafeLogStream();
        expect(records.map(record => record.event)).toEqual([
            'agent.run.started',
            'agent.model.completed',
            ...Array.from({ length: toolCount }, () => 'agent.tool.completed'),
            'agent.model.completed',
            'agent.run.succeeded',
            'agent.post-run.succeeded',
        ]);
        expect(records.at(-1)?.fields).toMatchObject({
            toolCalls: toolCount,
            toolSuccesses: toolCount,
            toolFailures: 0,
            modelCalls: 2,
        });
        const lastSequence = records.at(-1)!.sequence;
        const nextId = 'd75b5f02-04a5-4db6-b676-f71dc42caf33';
        telemetry([], nextId).started();
        await flushObservability();
        expect(expectSafeLogStream(nextId)[0]?.sequence).toBeGreaterThan(lastSequence);
    });

    it('redacts configured LaunchDarkly and Mongo credentials and decoded URI userinfo from errors and causes', async () => {
        const sdkKey = 'sdk-01234567-89ab-cdef-0123-456789abcdef';
        const username = 'ConfiguredMongoUser@private';
        const password = 'ConfiguredMongoPassword/private?value';
        const rawUsername = encodeURIComponent(username);
        const rawPassword = encodeURIComponent(password);
        const mongoUri = `mongodb+srv://${rawUsername}:${rawPassword}@offline.invalid/private-db`;
        const runConfig = { ...config, launchDarklySdkKey: sdkKey, mongoUri };
        const cause = new TypeError(
            `Mongo connection refused ${mongoUri} ${rawUsername} ${rawPassword} ${username} ${password}`
        );
        const original = new Error(`LaunchDarkly evaluation failed ${sdkKey}`, { cause });
        const result = await runChatRequest({
            body: { messages: [{ role: 'user', content: 'Offline credential redaction' }] },
            ownerDid,
            runId,
            config: runConfig,
            tools: [],
            provider: {
                complete: async () => {
                    throw original;
                },
            },
        });
        expect(result.status).toBe(500);
        expect(result.failure).toBe(original);
        await flushObservability();
        for (const component of ['agent.model', 'agent.run']) {
            expect(failures(component)[0]?.exception?.values).toMatchObject([
                { type: 'TypeError', value: expect.stringContaining('Mongo connection refused') },
                { type: 'Error', value: expect.stringContaining('LaunchDarkly evaluation failed') },
            ]);
        }
        expect(expectSafeLogStream().map(record => [record.event, record.level])).toEqual([
            ['agent.run.started', 'info'],
            ['agent.model.failed', 'error'],
            ['agent.run.failed', 'error'],
        ]);
        const payload = JSON.stringify(memory.events);
        for (const forbidden of [sdkKey, mongoUri, rawUsername, rawPassword, username, password]) {
            expect(payload).not.toContain(forbidden);
        }
        expect(JSON.stringify(applicationLogEvents())).not.toMatch(
            /Mongo connection refused|LaunchDarkly evaluation failed/
        );
    });

    it('masks common prompt words in external diagnostics without exposing prompt output or tool echoes', async () => {
        const prompt = 'Please retry the connection after reviewing AmberLark context';
        const modelOutput = 'PrivateCompletionPhrase connection details';
        const toolContent = 'PrivateToolPhrase customer context';
        const run = telemetry([prompt]);
        run.observer.onSensitiveContent?.(modelOutput);
        run.observer.onSensitiveContent?.(toolContent);
        const original = new Error('Provider connection refused after retry', {
            cause: new TypeError(
                `Prompt echo: ${prompt}; output echo: ${modelOutput}; tool echo: ${toolContent}`
            ),
        });
        run.observer.onModelError?.({
            runId,
            model: config.model,
            round: 0,
            durationMs: 1,
            error: original,
        });
        run.failed(original, 2);
        await flushObservability();
        for (const component of ['agent.model', 'agent.run']) {
            const values = failures(component)[0]?.exception?.values;
            expect(values?.map(value => value.type)).toEqual(['TypeError', 'Error']);
            const diagnostic = values?.at(-1)?.value;
            expect(diagnostic).toContain('Provider');
            expect(diagnostic).toContain('refused');
            // Dropping common words from the registry would restore detail but
            // also permit indistinguishable private fragments to be echoed.
            expect(diagnostic).not.toMatch(/connection|after|retry/);
        }
        const payload = JSON.stringify(memory.events);
        for (const privateContent of [
            prompt,
            modelOutput,
            toolContent,
            'AmberLark',
            'PrivateCompletionPhrase',
            'PrivateToolPhrase',
        ])
            expect(payload).not.toContain(privateContent);
        expect(JSON.stringify(applicationLogEvents())).not.toMatch(/Provider|refused|echo/);
    });

    it('preserves original model/run failure type, message, cause and useful sanitized frames', async () => {
        const privatePrompt = 'An uncommon private narrative about AmberLark';
        const cause = new TypeError(`Provider refused ${privatePrompt}`);
        cause.stack = `TypeError: Provider refused ${privatePrompt}\n    at complete (/home/AmberLark/provider.ts:18:7)`;
        const original = new RangeError('Completion failed after upstream refusal', { cause });
        original.stack =
            'RangeError: Completion failed after upstream refusal\n    at run (/home/AmberLark/run.ts:41:9)';
        Object.assign(original, {
            request: { prompt: privatePrompt },
            customSecret: 'opaque-custom-secret',
        });
        const result = await runChatRequest({
            body: { messages: [{ role: 'user', content: privatePrompt }] },
            ownerDid,
            runId,
            requestId: correlationId,
            config,
            tools: [],
            provider: {
                complete: async () => {
                    throw original;
                },
            },
        });
        expect(result.status).toBe(500);
        expect(result.failure).toBe(original);
        await flushObservability();
        for (const component of ['agent.model', 'agent.run']) {
            const failure = failures(component)[0];
            expect(failure?.tags).toMatchObject({
                runId,
                correlationId: expect.stringMatching(/^sha256:/),
                phase: 'main',
                status: 'failed',
            });
            expect(failure?.exception?.values).toMatchObject([
                { type: 'TypeError', value: 'Provider refused [REDACTED]' },
                { type: 'RangeError', value: 'Completion failed after upstream refusal' },
            ]);
            expect(failure?.exception?.values?.[0]?.stacktrace?.frames).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        filename: `sha256:${createHash('sha256').update('/home/AmberLark/provider.ts').digest('hex').slice(0, 24)}`,
                        function: `sha256:${createHash('sha256').update('complete').digest('hex').slice(0, 24)}`,
                        lineno: 18,
                        colno: 7,
                    }),
                ])
            );
        }
        const payload = JSON.stringify(memory.events);
        expect(payload).not.toContain(privatePrompt);
        expect(payload).not.toContain('AmberLark');
        expect(payload).not.toContain('opaque-custom-secret');
        expect(payload).not.toContain(ownerDid);
    });

    it('records usage and provider correlation before a token-limit failure is thrown', async () => {
        const result = await runChatRequest({
            body: { messages: [{ role: 'user', content: 'A private budget request' }] },
            ownerDid,
            runId,
            config: { ...config, maxRunTokens: 29 },
            tools: [],
            provider: {
                complete: async () => ({
                    message: { role: 'assistant', content: 'Response must not enter telemetry' },
                    requestId: 'caller-name-4155550199',
                    usage,
                    privateCustomField: 'hidden-response-property',
                }),
            },
        });
        expect(result.status).toBe(500);
        await flushObservability();
        const failure = failures('agent.run')[0];
        expect(failure?.exception?.values?.[0]).toMatchObject({
            type: 'Error',
            value: 'Agent run exceeded its configured token limit.',
        });
        expect(failure?.tags).toMatchObject({
            totalTokens: 30,
            cumulativeTotalTokens: 30,
            maxRunTokens: 29,
            modelCalls: 1,
            phase: 'main',
            providerRequestId: expect.stringMatching(/^sha256:/),
        });
        const payload = JSON.stringify(memory.events);
        expect(payload).not.toContain('caller-name-4155550199');
        expect(payload).not.toContain('hidden-response-property');
        expect(payload).not.toContain('Response must not enter telemetry');
    });

    it('captures failed tools even when the agent subsequently succeeds, without tool args/results', async () => {
        const tools: AgentToolDefinition[] = [
            {
                name: 'readPrivateData',
                description: 'Reads data',
                parameters: {},
                execute: async () => {
                    throw new TypeError('Tool backend unavailable for tool-private-argument');
                },
            },
        ];
        let calls = 0;
        const result = await runChatRequest({
            body: { messages: [{ role: 'user', content: 'Obtain approved data' }] },
            ownerDid,
            runId,
            config,
            tools,
            provider: {
                complete: async () =>
                    ++calls === 1
                        ? {
                              message: {
                                  role: 'assistant',
                                  content: 'Private model tool preface',
                                  toolCalls: [
                                      {
                                          id: 'private-tool-id',
                                          name: 'readPrivateData',
                                          arguments: { value: 'tool-private-argument' },
                                      },
                                  ],
                              },
                              usage,
                          }
                        : {
                              message: {
                                  role: 'assistant',
                                  content: 'Recovered final private output',
                              },
                              usage,
                          },
            },
        });
        expect(result.status).toBe(200);
        await flushObservability();
        const toolFailure = failures('agent.tool')[0]?.exception?.values?.[0];
        expect(toolFailure?.type).toBe('TypeError');
        expect(toolFailure?.value).toContain('Tool backend unavailable');
        expect(failures('agent.tool')[0]?.tags).toMatchObject({
            toolName: 'readPrivateData',
            status: 'failed',
        });
        expect(
            memory.events.find(event => event.message === 'agent.run.succeeded')?.tags
        ).toMatchObject({
            toolFailures: 1,
            toolSuccesses: 0,
            toolCalls: 1,
            modelCalls: 2,
            cumulativeTotalTokens: 60,
        });
        expect(JSON.stringify(memory.events)).not.toMatch(
            /tool-private-argument|private-tool-id|Recovered final private output/
        );
    });

    it('registers tool result and custom response strings before subsequent provider failures', async () => {
        const run = telemetry(['Initial private context']);
        run.started();
        let calls = 0;
        const error = new Error('Provider refused tool-secret-result and response-custom-prose');
        await expect(
            runAgent({
                model: config.model,
                messages: [{ role: 'user', content: 'Initial private context' }],
                observer: run.observer,
                tools: [
                    {
                        name: 'readData',
                        description: 'Reads',
                        parameters: {},
                        execute: async () => ({ value: 'tool-secret-result' }),
                    },
                ],
                provider: {
                    complete: async () => {
                        if (++calls > 1) throw error;
                        return {
                            message: {
                                role: 'assistant',
                                content: '',
                                toolCalls: [{ id: 'id', name: 'readData', arguments: {} }],
                            },
                            custom: { value: 'response-custom-prose' },
                        };
                    },
                },
            })
        ).rejects.toBe(error);
        run.failed(error, 10);
        await flushObservability();
        expect(failures('agent.model')[0]?.exception?.values?.[0]?.value).toContain(
            'Provider refused'
        );
        expect(JSON.stringify(memory.events)).not.toMatch(
            /tool-secret-result|response-custom-prose/
        );
    });

    it('registers raw model arguments before malformed JSON can expose generated private output', async () => {
        const privateOutput = 'NewPrivateNarrativeFromModel';
        providerMocks.create.mockResolvedValue({
            id: 'provider-raw-response',
            choices: [
                {
                    message: {
                        content: 'Generated private prose',
                        tool_calls: [
                            {
                                id: 'tool-call',
                                function: { name: 'readData', arguments: privateOutput },
                            },
                        ],
                    },
                },
            ],
        });
        const result = await runChatRequest({
            body: { messages: [{ role: 'user', content: 'Perform the task' }] },
            ownerDid,
            runId,
            config,
            tools: [],
            provider: createOpenAIProvider('synthetic-key'),
        });
        expect(result.status).toBe(500);
        expect(result.failure).toBeInstanceOf(SyntaxError);
        await flushObservability();
        for (const component of ['agent.model', 'agent.run']) {
            expect(failures(component)[0]?.exception?.values).toEqual([
                expect.objectContaining({
                    type: 'SyntaxError',
                    value: 'Model returned malformed tool arguments.',
                }),
            ]);
        }
        expect(JSON.stringify(memory.events)).not.toContain(privateOutput);
        expect(JSON.stringify(memory.events)).not.toContain('Generated private prose');
        // Node's native SyntaxError quotes a prefix rather than the whole word.
        // Check partial previews too, including the structured application logs.
        expect(JSON.stringify(memory.events)).not.toContain(privateOutput.slice(0, 10));
        expect(JSON.stringify(memory.events)).not.toContain(privateOutput.slice(-10));
        expect(JSON.stringify(applicationLogEvents())).not.toMatch(
            /NewPrivate|NarrativeFrom|Model returned malformed tool arguments/
        );
    });

    it('hashes caller UUID credentials and scrubs custom error names in both types and tags', async () => {
        const privateName = 'PrivatePersonLabel';
        const callerCredential = '45d62b34-d953-4e70-b60c-a7a6647cbf89';
        initializeObservability({ ...config, sentryEnvironment: 'staging' }, memory.transport);
        const run = createAgentRunTelemetry({
            runId,
            correlationId: callerCredential,
            ownerDid,
            triggerType: 'interactive',
            config,
            sensitiveContent: [privateName],
        });
        const error = new Error('Backend unavailable');
        error.name = `${privateName}Error`;
        const errorLogs = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        try {
            run.failed(error, 5);
            await flushObservability();
            const failure = failures('agent.run')[0];
            expect(failure?.tags?.errorType).toBe(failure?.exception?.values?.[0]?.type);
            expect(failure?.tags?.correlationId).toMatch(/^sha256:/);
            expect(JSON.stringify(memory.events)).not.toContain(privateName);
            expect(JSON.stringify(memory.events)).not.toContain(callerCredential);
            expect(JSON.stringify(errorLogs.mock.calls)).toContain('agent.run.failed');
            expect(JSON.stringify(errorLogs.mock.calls)).not.toContain(privateName);
        } finally {
            initializeObservability(config, memory.transport);
            errorLogs.mockRestore();
        }
    });

    it('retains diagnostics after many distinct prompt, output, tool and retrospective words', async () => {
        const content = ['Prompt', 'Output', 'Tool', 'Retro'].map(prefix =>
            Array.from({ length: 300 }, (_, index) => `${prefix}SyntheticPrivateWord${index}`).join(
                ' '
            )
        );
        const run = telemetry([content[0]!]);
        for (const value of content.slice(1)) run.observer.onSensitiveContent?.(value);
        const original = new Error(`Provider unavailable: ${content[2]!.split(' ')[250]}`);
        original.name = 'SyntheticProviderError';
        original.stack =
            'SyntheticProviderError: unavailable\n    at SyntheticFunction (/home/SyntheticPerson/provider.ts:18:7)';
        run.observer.onModelError?.({
            runId,
            model: config.model,
            round: 0,
            durationMs: 1,
            error: original,
        });
        run.failed(original, 2);
        run.postRunStarted();
        run.postRunFailed(original, 3);
        await flushObservability();
        for (const component of ['agent.model', 'agent.run', 'agent.post-run']) {
            const exception = failures(component)[0]?.exception?.values?.[0];
            expect(exception).toMatchObject({
                type: `sha256:${createHash('sha256').update(original.name).digest('hex').slice(0, 24)}`,
                value: 'Provider unavailable: [REDACTED]',
                stacktrace: {
                    frames: [
                        {
                            filename: `sha256:${createHash('sha256').update('/home/SyntheticPerson/provider.ts').digest('hex').slice(0, 24)}`,
                            function: `sha256:${createHash('sha256').update('SyntheticFunction').digest('hex').slice(0, 24)}`,
                            lineno: 18,
                            colno: 7,
                        },
                    ],
                },
            });
        }
        expect(JSON.stringify(memory.events)).not.toMatch(
            /SyntheticPrivateWord|SyntheticPerson|SyntheticFunction|SyntheticProviderError/
        );
    });

    it.each([8_193, 20_000, 80_000])(
        'withholds oversized %i-character diagnostics before regex processing',
        async length => {
            // A cut-off email local part must not become a diagnostic preview.
            const email = `${'Z'.repeat(length)}@synthetic.example`;
            const run = telemetry();
            run.failed(new Error(email), 1);
            await flushObservability();
            expect(failures('agent.run')[0]?.exception?.values?.[0]).toMatchObject({
                type: 'Error',
                value: '[Message withheld: diagnostic exceeded length limit]',
            });
            expect(JSON.stringify(memory.events)).not.toContain('Z'.repeat(20));
            expect(JSON.stringify(memory.events)).not.toContain('synthetic.example');
        }
    );

    it('withholds uncertain diagnostics after capacity overflow but retains safe token-limit evidence', async () => {
        const run = telemetry(['Private'.repeat(3_000)]);
        run.failed(new Error('Unregistered private prose'), 1);
        run.failed(new Error('Agent run exceeded its configured token limit.'), 2);
        await flushObservability();
        expect(JSON.stringify(memory.events)).not.toContain('Unregistered private prose');
        expect(failures('agent.run')[1]?.exception?.values?.[0]).toMatchObject({
            type: 'Error',
            value: 'Agent run exceeded its configured token limit.',
        });
    });

    it('retains the real retrospective failure as the post-run cause and registers retro content', async () => {
        const runConfig = {
            ...config,
            selfImprovementEnabled: true,
            retroModel: 'retro-model',
            retroInputTokenCostUsdPerMillion: 1,
            retroOutputTokenCostUsdPerMillion: 2,
        };
        const retroError = new TypeError('Retrospective provider unavailable');
        retroError.stack =
            'TypeError: Retrospective provider unavailable\n    at complete (/home/PrivateOperator/retro.ts:33:4)';
        const runtime = createSelfImprovementRuntime({
            config: runConfig,
            mongoRuntime: createMongoRuntime({ mongoDbName: 'unused' }),
            services: {
                userDocs: createUserDocService(createInMemoryUserDocRepository()),
                runTraces: createRunTraceService(createInMemoryRunTraceRepository()),
                retroResults: createInMemoryRetroResultRepository(),
            },
            retroProvider: {
                complete: async () => {
                    throw retroError;
                },
            },
        });
        const result = await runChatRequest({
            body: { messages: [{ role: 'user', content: 'This private learning narrative' }] },
            ownerDid,
            runId,
            config: runConfig,
            provider: successfulProvider,
            tools: [],
            selfImprovementRuntime: runtime,
        });
        expect(result.status).toBe(200);
        await expect(result.afterResponse?.()).rejects.toMatchObject({ cause: retroError });
        await flushObservability();
        expect(failures('agent.post-run')[0]?.tags).toMatchObject({
            phase: 'post-run',
            status: 'failed',
            totalTokens: 30,
        });
        expect(failures('agent.post-run')[0]?.exception?.values).toMatchObject([
            { type: 'TypeError', value: 'Retrospective provider unavailable' },
            { type: 'Error', value: 'Retrospective failed; its audit result has been persisted.' },
        ]);
        expect(failures('agent.model')[0]?.tags).toMatchObject({
            phase: 'post-run',
            model: 'retro-model',
        });
        expect(JSON.stringify(memory.events)).not.toMatch(
            /PrivateOperator|private learning narrative|Private response prose/
        );
    });

    it('rejects ambient request, breadcrumb, user, env, custom fields and unchecked captures at the SDK boundary', async () => {
        const secret = 'test-wallet-seed-without-recognizable-format';
        const prior = process.env.AI_AGENT_WALLET_SEED;
        process.env.AI_AGENT_WALLET_SEED = secret;
        try {
            Sentry.configureScope(scope => {
                scope.setUser({ id: 'PersonName', email: 'person@example.org' });
                scope.setExtra('private', secret);
                scope.setContext('request', { body: 'ambient-private-body', env: { secret } });
                scope.addBreadcrumb({ message: 'ambient-private-breadcrumb', data: { secret } });
            });
            const run = telemetry(['Raw private personal prose from the learner']);
            run.started();
            const error = new Error(
                `Provider unavailable ${secret} person@example.org +1 415 555 0123 https://api.example.org?token=private`
            );
            Object.assign(error, {
                body: 'custom-request-body',
                environment: { secret },
                toJSON: () => {
                    throw new Error('must not be invoked');
                },
            });
            run.failed(error, 15);
            Sentry.captureException(new Error('unchecked-private-message'));
            recordServiceError(
                'http.async-handler',
                new Error('unchecked-private-service-message')
            );
            recordServiceError('http.async-handler', new RangeError('Invalid time value'));
            await flushObservability();
            const payload = JSON.stringify(memory.events);
            for (const forbidden of [
                secret,
                'PersonName',
                'person@example.org',
                '415 555 0123',
                'token=private',
                'ambient-private-body',
                'ambient-private-breadcrumb',
                'custom-request-body',
                'unchecked-private-message',
                'unchecked-private-service-message',
            ]) {
                expect(payload).not.toContain(forbidden);
            }
            for (const event of memory.events) {
                expect(event.request).toBeUndefined();
                expect(event.breadcrumbs).toBeUndefined();
                expect(event.user).toBeUndefined();
                expect(event.contexts).toBeUndefined();
                if (event.tags?.recordKind === 'application-log') {
                    expect(Object.keys(event.extra ?? {})).toEqual(['logRecord']);
                } else {
                    expect(event.extra).toBeUndefined();
                }
                expect(event.modules).toBeUndefined();
                expect(event.server_name).toBeUndefined();
            }
            expect(failures('http.async-handler').at(-1)?.exception?.values?.[0]).toMatchObject({
                type: 'RangeError',
                value: 'Invalid time value',
            });
        } finally {
            if (prior === undefined) delete process.env.AI_AGENT_WALLET_SEED;
            else process.env.AI_AGENT_WALLET_SEED = prior;
        }
    });

    it('bounds circular causes and never invokes hostile thrown-object getters or serializers', async () => {
        let reads = 0;
        const hostile = Object.create(null, {
            name: {
                get: () => {
                    reads += 1;
                    throw new Error('secret getter');
                },
            },
            message: {
                get: () => {
                    reads += 1;
                    throw new Error('secret getter');
                },
            },
            toJSON: {
                value: () => {
                    reads += 1;
                    throw new Error('secret serializer');
                },
            },
        });
        const run = telemetry();
        run.failed(hostile, 1);
        const cyclic = new Error('Backend exhausted');
        Object.defineProperty(cyclic, 'cause', { value: cyclic });
        run.failed(cyclic, 2);
        let chain: Error = new Error('Root diagnostic');
        for (let index = 0; index < 10; index += 1)
            chain = new Error(`Failure ${index}`, { cause: chain });
        run.failed(chain, 3);
        await flushObservability();
        expect(reads).toBe(0);
        expect(failures('agent.run')[0]?.exception?.values?.[0]?.type).toBe('UnknownError');
        expect(failures('agent.run')[1]?.exception?.values).toHaveLength(1);
        expect(failures('agent.run')[2]?.exception?.values).toHaveLength(5);
        expect(JSON.stringify(memory.events)).not.toMatch(/secret getter|secret serializer/);
    });

    it('isolates concurrent run redactors and hashes opaque user-supplied correlation IDs', async () => {
        let resolveA!: () => void;
        const gate = new Promise<void>(resolve => {
            resolveA = resolve;
        });
        const a = runChatRequest({
            body: {
                messages: [{ role: 'user', content: 'Backend-unavailable alpha-private-prose' }],
            },
            ownerDid,
            runId,
            requestId: 'PersonName-4155550100',
            config,
            tools: [],
            provider: {
                complete: async () => {
                    await gate;
                    throw new Error('Alpha refused alpha-private-prose');
                },
            },
        });
        const bId = '042c32d7-4ccf-4630-b46a-0897f93c5f09';
        const b = runChatRequest({
            body: { messages: [{ role: 'user', content: 'beta-private-prose' }] },
            ownerDid: 'did:key:second-private-owner',
            runId: bId,
            config,
            tools: [],
            provider: {
                complete: async () => {
                    resolveA();
                    throw new Error('Backend-unavailable beta-private-prose');
                },
            },
        });
        await Promise.all([a, b]);
        await flushObservability();
        const bFailure = failures('agent.run').find(event => event.tags?.runId === bId);
        expect(bFailure?.exception?.values?.[0]?.value).toBe('Backend-unavailable [REDACTED]');
        expect(
            failures('agent.run').find(event => event.tags?.runId === runId)?.tags?.correlationId
        ).toMatch(/^sha256:/);
        expect(JSON.stringify(memory.events)).not.toMatch(
            /alpha-private-prose|beta-private-prose|PersonName-4155550100/
        );
    });

    it('correlates autonomous failures and observes real transport delivery responses', async () => {
        const run = createAgentRunTelemetry({
            runId,
            correlationId,
            ownerDid,
            triggerType: 'autonomous',
            config,
        });
        run.started();
        run.failed(new Error('Autonomous backend unavailable'), 5);
        expect(await verifySentryDelivery(config)).toBe(true);
        memory.state.statusCode = 503;
        expect(await verifySentryDelivery(config)).toBe(false);
        expect(failures('agent.run')[0]?.tags).toMatchObject({
            triggerType: 'autonomous',
            runId,
            correlationId: expect.stringMatching(/^sha256:/),
        });
    });

    it('keeps approved snapshots private from SDK processors and rejects copied approval metadata', async () => {
        const privateValue = 'PrivateProcessorHintMutation';
        let active = true;
        let copiedData: Record<string, unknown> | undefined;
        Sentry.addGlobalEventProcessor((event, hint) => {
            if (active && hint.data) {
                for (const value of Object.values(hint.data)) {
                    if (value && typeof value === 'object') {
                        Object.assign(value, { extra: { privateValue } });
                    }
                }
                copiedData = structuredClone(hint.data);
            }
            return event;
        });
        try {
            telemetry().started();
            await flushObservability();
            Sentry.captureEvent({ message: 'Unapproved SDK event' }, { data: copiedData });
            await flushObservability();
        } finally {
            active = false;
        }
        expect(memory.events.some(event => event.message === 'agent.run.started')).toBe(true);
        expect(JSON.stringify(memory.events)).not.toContain(privateValue);
        expect(memory.events.some(event => event.message === 'Unapproved SDK event')).toBe(false);
    });
});

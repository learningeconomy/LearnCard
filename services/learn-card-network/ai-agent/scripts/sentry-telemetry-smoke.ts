import assert from 'node:assert/strict';
import * as Sentry from '@sentry/node';

import { runChatRequest } from '../src/server';
import {
    flushObservability,
    initializeObservability,
    recordAutonomyCycle,
    recordHttpRequest,
    recordServiceError,
    type SafeRunLogRecord,
} from '../src/observability';
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
import { createSentryMemoryTransport, telemetryConfig } from '../test/helpers/sentryTransport';

const memory = createSentryMemoryTransport();
const sdkKey = 'sdk-89abcdef-0123-4567-89ab-cdef01234567';
const mongoUsername = 'OfflineMongoUser@private';
const mongoPassword = 'OfflineMongoPassword/private?value';
const rawMongoUsername = encodeURIComponent(mongoUsername);
const rawMongoPassword = encodeURIComponent(mongoPassword);
const mongoUri = `mongodb+srv://${rawMongoUsername}:${rawMongoPassword}@offline.invalid/private-db`;
const config = {
    ...telemetryConfig,
    sentryEnvironment: 'staging',
    sentryRelease: 'e2b31ad721d7517d6c9391a44fa45d7f009140c5',
    launchDarklySdkKey: sdkKey,
    mongoUri,
};
const ownerDid = 'did:key:offline-private-owner';
const prompt = [
    'EchoPrivateNarrative about a confidential learning situation; retry the connection',
    ...Array.from({ length: 300 }, (_, index) => `PrivateWord${index}`),
].join(' ');
const secret = 'SyntheticWalletSeedNotRecognizableByRegex';
const priorSeed = process.env.AI_AGENT_WALLET_SEED;
process.env.AI_AGENT_WALLET_SEED = secret;
const usage = { inputTokens: 20, outputTokens: 10, totalTokens: 30 };
const requestBody = { messages: [{ role: 'user', content: prompt }] };
let processorActive = true;

try {
    initializeObservability(config, memory.transport);
    const tracesSampleRate = Sentry.getCurrentHub().getClient()?.getOptions().tracesSampleRate;
    assert.equal(tracesSampleRate, 0);
    Sentry.configureScope(scope => {
        scope.setUser({ email: 'private@example.org', id: 'PrivateScopeOwner' });
        scope.setExtra('wallet', secret);
        scope.setContext('private-request', { prompt });
        scope.addBreadcrumb({ message: 'PRIVATE_BREADCRUMB', data: { prompt } });
    });
    // Emulate ambient SDK processors adding and mutating sensitive fields. The
    // final event must be rebuilt from an independent sanitized snapshot.
    Sentry.addGlobalEventProcessor((event, hint) => {
        if (!processorActive) return event;
        event.request = { url: 'https://private.invalid?token=SECRET_QUERY', data: prompt };
        if (event.extra?.logRecord) {
            const record = event.extra.logRecord as SafeRunLogRecord;
            record.event = 'PRIVATE_PROCESSOR_LOG_EVENT';
            record.sequence = -1;
            record.fields.privateMutation = 'PRIVATE_PROCESSOR_LOG_FIELD';
        }
        event.extra = { privateCustomData: secret };
        event.contexts = { env: { wallet: secret } };
        event.server_name = 'PRIVATE_HOSTNAME';
        if (event.exception?.values?.[0])
            event.exception.values[0].value = 'PRIVATE_PROCESSOR_ERROR';
        if (hint.data) {
            for (const value of Object.values(hint.data)) {
                if (value && typeof value === 'object') {
                    Object.assign(value, {
                        extra: { logRecord: { fields: { privateHint: 'PRIVATE_PROCESSOR_HINT' } } },
                    });
                }
            }
            hint.data.privateHint = 'PRIVATE_PROCESSOR_HINT';
        }
        return event;
    });

    const root = new RangeError(
        `Backend rejected ${prompt} ${secret} ${mongoUri} ${rawMongoUsername} ${rawMongoPassword} ${mongoUsername} ${mongoPassword}`
    );
    root.stack = `RangeError: Backend rejected private content\n    at backend (/home/PrivateOperator/backend.ts:17:6)`;
    const original = new TypeError(`Provider exhausted connection pool ${sdkKey}`, { cause: root });
    Object.assign(original, { privateRequest: requestBody, environment: { secret } });
    const failure = await runChatRequest({
        body: requestBody,
        ownerDid,
        config,
        tools: [],
        requestId: 'PrivatePerson-4155550100',
        runId: '8ab2e4cf-8291-4d07-8962-b79d8c126abe',
        provider: {
            complete: async () => {
                throw original;
            },
        },
    });
    assert.equal(failure.status, 500);
    assert.equal(failure.failure, original);

    let calls = 0;
    const success = await runChatRequest({
        body: requestBody,
        ownerDid,
        config,
        runId: 'bbf91f0f-3377-4df1-90d7-3fe3a5b5a407',
        tools: [
            {
                name: 'readApprovedData',
                description: 'Offline successful probe',
                parameters: {},
                execute: async () => ({ value: 'PRIVATE_TOOL_RESULT' }),
            },
            {
                name: 'probePrivateTool',
                description: 'Offline probe',
                parameters: {},
                execute: async () => {
                    throw new TypeError('Tool transport refused tool-private-value');
                },
            },
        ],
        provider: {
            complete: async () =>
                ++calls === 1
                    ? {
                          message: {
                              role: 'assistant',
                              content: 'PRIVATE_MODEL_PREFACE',
                              toolCalls: [
                                  {
                                      id: 'PRIVATE_SUCCESS_TOOL_ID',
                                      name: 'readApprovedData',
                                      arguments: { value: 'tool-private-value' },
                                  },
                                  {
                                      id: 'PRIVATE_TOOL_ID',
                                      name: 'probePrivateTool',
                                      arguments: { value: 'tool-private-value' },
                                  },
                              ],
                          },
                          usage,
                          arbitraryPrivateResponse: { prose: 'PRIVATE_CUSTOM_RESPONSE' },
                      }
                    : { message: { role: 'assistant', content: 'PRIVATE_FINAL_OUTPUT' }, usage },
        },
    });
    assert.equal(success.status, 200);
    // HTTP records have no run ID and must not become forwarded run logs.
    recordHttpRequest({
        requestId: 'PrivateHttpCallerCredential',
        method: 'POST',
        route: '/api/agent/run',
        statusCode: success.status,
        durationMs: 1,
    });
    await success.afterResponse?.();

    const limited = await runChatRequest({
        body: requestBody,
        ownerDid,
        config: { ...config, maxRunTokens: 29 },
        tools: [],
        runId: 'ae24ce50-ced1-4d22-8122-f2e0ab87e71c',
        provider: {
            complete: async () => ({
                message: { role: 'assistant', content: 'PRIVATE_LIMIT_OUTPUT' },
                usage,
                requestId: 'PrivateProviderRequestId',
                customResponse: 'PRIVATE_LIMIT_CUSTOM_FIELD',
            }),
        },
    });
    assert.equal(limited.status, 500);

    const retroConfig = {
        ...config,
        selfImprovementEnabled: true,
        retroModel: 'retro-model',
        retroInputTokenCostUsdPerMillion: 1,
        retroOutputTokenCostUsdPerMillion: 2,
    };
    const retroError = new TypeError('Retrospective provider unavailable');
    const retroRuntime = createSelfImprovementRuntime({
        config: retroConfig,
        mongoRuntime: createMongoRuntime({ mongoDbName: 'offline-unused' }),
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
    const postRun = await runChatRequest({
        body: requestBody,
        ownerDid,
        config: retroConfig,
        selfImprovementRuntime: retroRuntime,
        tools: [],
        runOrigin: 'autonomous',
        runId: '3a02710b-adb6-4b6b-9b42-8a6c5f860a41',
        provider: {
            complete: async () => ({
                message: { role: 'assistant', content: 'PRIVATE_RETRO_INPUT' },
                usage,
            }),
        },
    });
    assert.equal(postRun.status, 200);
    await assert.rejects(
        postRun.afterResponse!(),
        error => error instanceof Error && error.cause === retroError
    );
    recordServiceError('offline.post-run', new Error('PRIVATE_SERVICE_EXCEPTION'), {
        runId: 'bbf91f0f-3377-4df1-90d7-3fe3a5b5a407',
        ownerDid,
        phase: 'post-run',
        sensitiveContent: ['PRIVATE_SERVICE_EXCEPTION'],
    });
    recordAutonomyCycle({
        triggerSource: 'offline',
        startedAt: '2026-01-01T00:00:00.000Z',
        completedAt: '2026-01-01T00:00:01.000Z',
        dueCount: 2,
        results: [
            {
                ownerDid,
                scheduleId: `offline-${'x'.repeat(400)}`,
                scheduledFor: '2026-01-01T00:00:00.000Z',
                status: 'succeeded',
                runId: 'bbf91f0f-3377-4df1-90d7-3fe3a5b5a407',
            },
            {
                ownerDid,
                scheduleId: 'without-run',
                scheduledFor: '2026-01-01T00:00:00.000Z',
                status: 'skipped',
            },
        ],
    });
    await flushObservability();

    const modelFailure = memory.events.find(
        event =>
            event.tags?.component === 'agent.model' &&
            event.tags.runId === '8ab2e4cf-8291-4d07-8962-b79d8c126abe'
    );
    assert.equal(modelFailure?.exception?.values?.at(-1)?.type, 'TypeError');
    const diagnostic = String(modelFailure?.exception?.values?.at(-1)?.value);
    assert.ok(diagnostic.includes('Provider exhausted'));
    assert.ok(diagnostic.includes('pool'));
    assert.equal(diagnostic.includes('connection'), false);
    assert.equal(modelFailure?.exception?.values?.[0]?.type, 'RangeError');
    assert.equal(modelFailure?.exception?.values?.[0]?.stacktrace?.frames?.[0]?.lineno, 17);
    assert.match(String(modelFailure?.tags?.correlationId), /^sha256:/);
    const successEvent = memory.events.find(
        event =>
            event.message === 'agent.run.succeeded' &&
            event.tags?.runId === 'bbf91f0f-3377-4df1-90d7-3fe3a5b5a407'
    );
    assert.equal(successEvent?.tags?.toolFailures, 1);
    assert.equal(successEvent?.tags?.toolSuccesses, 1);
    assert.equal(successEvent?.tags?.toolCalls, 2);
    assert.equal(successEvent?.tags?.modelCalls, 2);
    assert.equal(successEvent?.tags?.totalTokens, 60);
    const toolFailure = memory.events.find(event => event.tags?.component === 'agent.tool');
    assert.equal(toolFailure?.exception?.values?.[0]?.value, 'Tool transport refused [REDACTED]');
    const limitFailure = memory.events.find(
        event =>
            event.tags?.component === 'agent.run' &&
            event.tags.runId === 'ae24ce50-ced1-4d22-8122-f2e0ab87e71c'
    );
    assert.equal(
        limitFailure?.exception?.values?.[0]?.value,
        'Agent run exceeded its configured token limit.'
    );
    assert.equal(limitFailure?.tags?.totalTokens, 30);
    assert.equal(limitFailure?.tags?.maxRunTokens, 29);
    const postFailure = memory.events.find(event => event.tags?.component === 'agent.post-run');
    assert.equal(postFailure?.tags?.phase, 'post-run');
    assert.equal(postFailure?.tags?.triggerType, 'autonomous');
    assert.equal(postFailure?.exception?.values?.[0]?.value, 'Retrospective provider unavailable');
    assert.equal(
        postFailure?.exception?.values?.at(-1)?.value,
        'Retrospective failed; its audit result has been persisted.'
    );
    assert.equal(
        memory.events.some(event => event.type === 'transaction'),
        false
    );

    const expectedLogsByRun = [
        {
            runId: '8ab2e4cf-8291-4d07-8962-b79d8c126abe',
            sequence: [
                ['agent.run.started', 'info'],
                ['agent.model.failed', 'error'],
                ['agent.run.failed', 'error'],
            ],
        },
        {
            runId: 'bbf91f0f-3377-4df1-90d7-3fe3a5b5a407',
            sequence: [
                ['agent.run.started', 'info'],
                ['agent.model.completed', 'info'],
                ['agent.tool.completed', 'info'],
                ['agent.tool.completed', 'warn'],
                ['agent.model.completed', 'info'],
                ['agent.run.succeeded', 'info'],
                ['agent.post-run.succeeded', 'info'],
                ['service.error', 'error'],
                ['autonomy.occurrence.completed', 'info'],
            ],
        },
        {
            runId: 'ae24ce50-ced1-4d22-8122-f2e0ab87e71c',
            sequence: [
                ['agent.run.started', 'info'],
                ['agent.model.completed', 'info'],
                ['agent.run.failed', 'error'],
            ],
        },
        {
            runId: '3a02710b-adb6-4b6b-9b42-8a6c5f860a41',
            sequence: [
                ['agent.run.started', 'info'],
                ['agent.model.completed', 'info'],
                ['agent.run.succeeded', 'info'],
                ['agent.model.failed', 'error'],
                ['agent.post-run.failed', 'error'],
            ],
        },
    ];
    const logEvents = memory.events.filter(event => event.tags?.recordKind === 'application-log');
    const logRecords = logEvents.map(event => event.extra?.logRecord as SafeRunLogRecord);
    assert.equal(
        logRecords.length,
        expectedLogsByRun.reduce((count, expected) => count + expected.sequence.length, 0)
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
    for (const [index, event] of logEvents.entries()) {
        const record = logRecords[index]!;
        assert.equal(event.tags?.component, 'application-log');
        assert.equal(event.tags?.runId, record.fields.runId);
        for (const key of ['ownerId', 'correlationId', 'triggerType', 'phase']) {
            if (record.fields[key] !== undefined) {
                assert.equal(event.tags?.[key], record.fields[key]);
            }
        }
        for (const [key, value] of Object.entries(event.tags ?? {})) {
            assert.ok(Object.hasOwn(approvedLogTags, key));
            assert.equal(typeof value, 'string');
            assert.ok(String(value).length <= 256);
        }
        assert.equal(event.message, `Application log: ${record.event}`);
        assert.equal(event.level, record.level === 'warn' ? 'warning' : record.level);
        assert.deepEqual(Object.keys(event.extra ?? {}), ['logRecord']);
        assert.equal(Number.isFinite(record.timestamp), true);
        assert.equal(Number.isSafeInteger(record.sequence), true);
        if (index > 0) assert.ok(record.sequence > logRecords[index - 1]!.sequence);
        for (const value of Object.values(record.fields)) {
            assert.ok(['string', 'number', 'boolean'].includes(typeof value));
            if (typeof value === 'string') assert.ok(value.length <= 256);
        }
    }
    for (const expected of expectedLogsByRun) {
        const records = logRecords.filter(record => record.fields.runId === expected.runId);
        assert.deepEqual(
            records.map(record => [record.event, record.level]),
            expected.sequence
        );
    }
    const successfulLogs = logRecords.filter(
        record => record.fields.runId === 'bbf91f0f-3377-4df1-90d7-3fe3a5b5a407'
    );
    for (const record of successfulLogs) {
        if (record.event !== 'agent.run.succeeded' && record.event !== 'agent.post-run.succeeded')
            continue;
        assert.equal(record.fields.modelCalls, 2);
        assert.equal(record.fields.toolSuccesses, 1);
        assert.equal(record.fields.toolFailures, 1);
        assert.equal(record.fields.cumulativeTotalTokens, 60);
    }
    assert.equal(
        successfulLogs.find(record => record.event === 'agent.post-run.succeeded')?.fields.phase,
        'post-run'
    );
    assert.equal(
        String(
            successfulLogs.find(record => record.event === 'autonomy.occurrence.completed')?.fields
                .scheduleId
        ).length,
        256
    );
    assert.equal(JSON.stringify(logEvents).includes('Provider exhausted connection pool'), false);
    assert.equal(JSON.stringify(logEvents).includes('Tool transport refused'), false);

    const payload = JSON.stringify(memory.events);
    for (const forbidden of [
        prompt,
        'EchoPrivateNarrative',
        secret,
        'PrivateWord',
        sdkKey,
        mongoUri,
        rawMongoUsername,
        rawMongoPassword,
        mongoUsername,
        mongoPassword,
        ownerDid,
        'PrivateOperator',
        'PrivatePerson-4155550100',
        'PrivateScopeOwner',
        'private@example.org',
        'PrivateProviderRequestId',
        'PrivateHttpCallerCredential',
        'PRIVATE_BREADCRUMB',
        'PRIVATE_HOSTNAME',
        'PRIVATE_PROCESSOR_ERROR',
        'SECRET_QUERY',
        'PRIVATE_PROCESSOR_LOG_EVENT',
        'PRIVATE_PROCESSOR_LOG_FIELD',
        'PRIVATE_PROCESSOR_HINT',
        'PRIVATE_TOOL_RESULT',
        'PRIVATE_SUCCESS_TOOL_ID',
        'PRIVATE_SERVICE_EXCEPTION',
        'tool-private-value',
        'PRIVATE_MODEL_PREFACE',
        'PRIVATE_TOOL_ID',
        'PRIVATE_FINAL_OUTPUT',
        'PRIVATE_CUSTOM_RESPONSE',
        'PRIVATE_LIMIT_OUTPUT',
        'PRIVATE_LIMIT_CUSTOM_FIELD',
        'PRIVATE_RETRO_INPUT',
    ]) {
        assert.equal(payload.includes(forbidden), false, `Privacy boundary leaked ${forbidden}`);
    }
    for (const event of memory.events) {
        assert.equal(event.request, undefined);
        assert.equal(event.contexts, undefined);
        assert.equal(event.breadcrumbs, undefined);
        if (event.tags?.recordKind === 'application-log') {
            assert.deepEqual(Object.keys(event.extra ?? {}), ['logRecord']);
        } else {
            assert.equal(event.extra, undefined);
        }
        assert.equal(event.user, undefined);
        assert.equal(event.modules, undefined);
        assert.equal(event.server_name, undefined);
        assert.equal(event.environment, 'staging');
        assert.equal(event.release, config.sentryRelease);
    }
    console.log(
        JSON.stringify({
            sdk: Sentry.SDK_VERSION,
            transport: 'in-memory; no network',
            tracesSampleRate,
            applicationLogCount: logEvents.length,
            firstLogSequence: logRecords[0]?.sequence,
            lastLogSequence: logRecords.at(-1)?.sequence,
            safeRunLogSequences: expectedLogsByRun.map(expected => ({
                runId: expected.runId,
                records: logRecords
                    .filter(record => record.fields.runId === expected.runId)
                    .map(record => [record.event, record.level]),
            })),
            scenarios: [
                'model/run failure with cause/stack',
                'recovered tool failure',
                'token-limit usage',
                'autonomous post-run cause',
                'SDK final privacy firewall',
                'full safe run-log streams with model/tool/main/post-run records',
                'run-correlated service errors and autonomy occurrences',
                'configured LaunchDarkly and Mongo userinfo redaction',
                'diagnostic retention beyond 256 private words',
            ],
            result: 'passed',
        })
    );
} finally {
    processorActive = false;
    if (priorSeed === undefined) delete process.env.AI_AGENT_WALLET_SEED;
    else process.env.AI_AGENT_WALLET_SEED = priorSeed;
    await Sentry.close();
}

import { createHash } from 'node:crypto';

import {
    CloudWatchClient,
    PutMetricDataCommand,
    type Dimension,
    type MetricDatum,
} from '@aws-sdk/client-cloudwatch';
import * as Sentry from '@sentry/node';

import type { AgentRunObserver, AgentRunResult, AgentTokenUsage } from './agent/types';
import type { ServiceConfig } from './config';

type TelemetryValue = string | number | boolean | undefined;
type TelemetryFields = Record<string, TelemetryValue>;
type MetricUnit = 'Count' | 'Milliseconds' | 'None';
type SentryDeliveryState = 'disabled' | 'unchecked' | 'delivered' | 'failed';

interface MetricValue {
    name: string;
    unit: MetricUnit;
    value: number;
}

interface AgentRunTelemetryContext {
    runId: string;
    correlationId: string;
    ownerDid: string;
    triggerType: 'interactive' | 'autonomous';
    config: ServiceConfig;
}

interface AutonomyCycleTelemetry {
    triggerSource: string;
    startedAt: string;
    completedAt: string;
    dueCount: number;
    results: Array<{
        ownerDid: string;
        scheduleId: string;
        scheduledFor: string;
        status: 'succeeded' | 'failed' | 'contended' | 'skipped';
        runId?: string;
    }>;
}

const SERVICE_NAME = 'learncard-ai-agent';
const MAX_FIELD_LENGTH = 256;
const MAX_CLOUDWATCH_METRICS_PER_REQUEST = 1_000;
const CLOUDWATCH_FLUSH_DELAY_MS = 1_000;

let activeConfig: ServiceConfig | undefined;
let cloudWatchClient: CloudWatchClient | undefined;
let cloudWatchFlushPromise: Promise<void> | undefined;
let cloudWatchFlushTimer: ReturnType<typeof setTimeout> | undefined;
let sentryInitialized = false;
let sentryDeliveryState: SentryDeliveryState = 'disabled';
let pendingMetrics: MetricDatum[] = [];

const sanitizeField = (value: TelemetryValue): TelemetryValue =>
    typeof value === 'string' ? value.slice(0, MAX_FIELD_LENGTH) : value;

const sanitizeFields = (fields: TelemetryFields): TelemetryFields =>
    Object.fromEntries(
        Object.entries(fields)
            .filter(
                (entry): entry is [string, Exclude<TelemetryValue, undefined>] =>
                    entry[1] !== undefined
            )
            .map(([key, value]) => [key, sanitizeField(value)])
    );

const getEnvironment = (config?: ServiceConfig): string =>
    config?.sentryEnvironment ?? config?.nodeEnv ?? process.env.NODE_ENV ?? 'development';

const shouldEmitTelemetry = (config?: ServiceConfig): boolean => getEnvironment(config) !== 'test';

const formatLogValue = (value: Exclude<TelemetryValue, undefined>): string => {
    const normalized = String(value);

    return /^[A-Za-z0-9_.:/-]+$/.test(normalized) ? normalized : JSON.stringify(normalized);
};

const writeLog = (
    level: 'info' | 'warn' | 'error',
    event: string,
    fields: TelemetryFields = {}
): void => {
    if (!shouldEmitTelemetry(activeConfig)) return;

    const details = Object.entries(sanitizeFields(fields))
        .map(([key, value]) => `${key}=${formatLogValue(value)}`)
        .join(' ');
    const line = `${level.toUpperCase()} ${event}${details ? ` ${details}` : ''}`;

    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);
};

const toDimensions = (fields: TelemetryFields): Dimension[] =>
    Object.entries(sanitizeFields(fields)).map(([Name, value]) => ({
        Name,
        Value: String(value),
    }));

const flushCloudWatchMetrics = async (): Promise<void> => {
    if (cloudWatchFlushTimer) {
        clearTimeout(cloudWatchFlushTimer);
        cloudWatchFlushTimer = undefined;
    }

    if (!activeConfig?.cloudWatchMetricsEnabled || pendingMetrics.length === 0) return;
    if (cloudWatchFlushPromise) return cloudWatchFlushPromise;

    cloudWatchFlushPromise = (async () => {
        cloudWatchClient ??= new CloudWatchClient({});

        while (pendingMetrics.length > 0) {
            const MetricData = pendingMetrics.splice(0, MAX_CLOUDWATCH_METRICS_PER_REQUEST);

            try {
                await cloudWatchClient.send(
                    new PutMetricDataCommand({
                        Namespace: activeConfig?.metricsNamespace ?? 'LearnCard/AIAgent',
                        MetricData,
                    })
                );
            } catch (error) {
                writeLog('error', 'cloudwatch.metrics.failed', getSafeErrorFields(error));
                captureOperationalError('cloudwatch.metrics', error, {});
            }
        }
    })().finally(() => {
        cloudWatchFlushPromise = undefined;
    });

    return cloudWatchFlushPromise;
};

const scheduleCloudWatchFlush = (): void => {
    if (cloudWatchFlushTimer) return;

    cloudWatchFlushTimer = setTimeout(() => {
        cloudWatchFlushTimer = undefined;
        void flushCloudWatchMetrics();
    }, CLOUDWATCH_FLUSH_DELAY_MS);
    cloudWatchFlushTimer.unref();
};

const writeMetrics = (
    _event: string,
    metrics: MetricValue[],
    _fields: TelemetryFields = {},
    dimensions: TelemetryFields = {}
): void => {
    const config = activeConfig;
    if (!shouldEmitTelemetry(config) || !config?.cloudWatchMetricsEnabled) return;

    const baseDimensions = {
        Service: SERVICE_NAME,
        Environment: getEnvironment(config),
    };
    const specificDimensions = sanitizeFields(dimensions);
    const dimensionSets = [
        toDimensions(baseDimensions),
        ...(Object.keys(specificDimensions).length > 0
            ? [toDimensions({ ...baseDimensions, ...specificDimensions })]
            : []),
    ];
    const Timestamp = new Date();

    pendingMetrics.push(
        ...dimensionSets.flatMap(Dimensions =>
            metrics.map(
                ({ name: MetricName, unit: Unit, value: Value }): MetricDatum => ({
                    MetricName,
                    Unit,
                    Value,
                    Timestamp,
                    Dimensions,
                })
            )
        )
    );
    scheduleCloudWatchFlush();
};

const getSafeErrorFields = (error: unknown): TelemetryFields => {
    if (!error || typeof error !== 'object') return { errorType: typeof error };

    const candidate = error as { name?: unknown; status?: unknown };
    const httpStatus =
        typeof candidate.status === 'number' && Number.isInteger(candidate.status)
            ? candidate.status
            : undefined;

    return {
        errorType:
            typeof candidate.name === 'string' &&
            /^[A-Za-z][A-Za-z0-9_.-]{0,63}$/.test(candidate.name)
                ? candidate.name
                : 'UnknownError',
        httpStatus,
    };
};

const captureOperationalError = (
    component: string,
    error: unknown,
    fields: TelemetryFields
): void => {
    if (!activeConfig?.sentryDsn) return;

    const safeErrorFields = getSafeErrorFields(error);

    Sentry.captureException(new Error(`${component} failed`), {
        tags: sanitizeFields({ component, ...fields }),
        extra: safeErrorFields,
    });
};

const getEstimatedCostUsd = (usage: AgentTokenUsage, config: ServiceConfig): number | undefined => {
    if (
        config.inputTokenCostUsdPerMillion === undefined ||
        config.outputTokenCostUsdPerMillion === undefined
    ) {
        return undefined;
    }

    return (
        (usage.inputTokens * config.inputTokenCostUsdPerMillion +
            usage.outputTokens * config.outputTokenCostUsdPerMillion) /
        1_000_000
    );
};

export const getOwnerTelemetryId = (did: string): string =>
    createHash('sha256').update(did).digest('hex').slice(0, 16);

export const initializeObservability = (config: ServiceConfig): void => {
    activeConfig = config;
    sentryDeliveryState = config.sentryDsn ? 'unchecked' : 'disabled';

    if (config.sentryDsn && !sentryInitialized) {
        Sentry.init({
            dsn: config.sentryDsn,
            environment: config.sentryEnvironment ?? config.nodeEnv,
            release: config.sentryRelease,
            sendDefaultPii: false,
            tracesSampleRate: config.sentryTracesSampleRate ?? 0.1,
            integrations: integrations =>
                integrations.filter(
                    integration => !['Console', 'Http', 'RequestData'].includes(integration.name)
                ),
        });
        sentryInitialized = true;
    }

    writeLog('info', 'service.started', {
        model: config.model,
        cloudWatchMetrics: config.cloudWatchMetricsEnabled,
        sentryEnabled: Boolean(config.sentryDsn),
        release: config.sentryRelease,
    });
};

export const verifySentryDelivery = async (config: ServiceConfig): Promise<boolean> => {
    if (!config.sentryDsn || !sentryInitialized) return false;

    const client = Sentry.getCurrentHub().getClient();
    let eventId: string | undefined;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const response = new Promise<number | undefined>(resolve => {
        client?.on?.('afterSendEvent', (event, result) => {
            if (event.event_id === eventId) resolve(result?.statusCode);
        });
    });

    eventId = Sentry.captureMessage('AI Agent deployment observability check', {
        level: 'info',
        fingerprint: ['ai-agent-deployment-observability-check'],
        tags: sanitizeFields({
            component: 'service.startup',
            deploymentId: config.deploymentId,
        }),
    });

    const flush = Sentry.flush(5_000);
    const statusCode = await Promise.race([
        response,
        new Promise<undefined>(resolve => {
            timeout = setTimeout(resolve, 5_000);
        }),
    ]);
    clearTimeout(timeout);

    const flushed = await flush;
    const delivered = flushed && statusCode !== undefined && statusCode >= 200 && statusCode < 300;

    sentryDeliveryState = delivered ? 'delivered' : 'failed';
    writeLog(delivered ? 'info' : 'error', 'sentry.delivery.checked', {
        delivered,
        statusCode,
        eventId,
    });

    return delivered;
};

export const getObservabilityStatus = (): {
    cloudWatchMetrics: boolean;
    sentry: {
        enabled: boolean;
        delivery: SentryDeliveryState;
    };
} => ({
    cloudWatchMetrics: Boolean(activeConfig?.cloudWatchMetricsEnabled),
    sentry: {
        enabled: Boolean(activeConfig?.sentryDsn),
        delivery: sentryDeliveryState,
    },
});

export const flushObservability = async (): Promise<void> => {
    await flushCloudWatchMetrics();
    if (activeConfig?.sentryDsn) await Sentry.flush(2_000);
};

export const recordHttpRequest = ({
    requestId,
    method,
    route,
    statusCode,
    durationMs,
    ownerId,
}: {
    requestId: string;
    method: string;
    route: string;
    statusCode: number;
    durationMs: number;
    ownerId?: string;
}): void => {
    const failed = statusCode >= 500;
    const fields = { requestId, method, route, statusCode, durationMs, ownerId };

    writeLog(failed ? 'error' : 'info', 'http.request.completed', fields);
    writeMetrics(
        'http.request.metrics',
        [
            { name: 'HttpRequestCount', unit: 'Count', value: 1 },
            { name: 'HttpRequestFailure', unit: 'Count', value: failed ? 1 : 0 },
            { name: 'HttpRequestLatency', unit: 'Milliseconds', value: durationMs },
        ],
        fields
    );
};

type SentryTransaction = ReturnType<typeof Sentry.startTransaction>;

const startTrace = (
    name: string,
    operation: string,
    fields: TelemetryFields,
    startTimestamp?: number
): SentryTransaction | undefined => {
    if (!sentryInitialized) return undefined;

    const transaction = Sentry.startTransaction({
        name,
        op: operation,
        ...(startTimestamp === undefined ? {} : { startTimestamp }),
    });

    for (const [key, value] of Object.entries(sanitizeFields(fields))) {
        if (value !== undefined) transaction.setData(key, value);
    }

    return transaction;
};

const recordChildTrace = (
    transaction: SentryTransaction | undefined,
    name: string,
    operation: string,
    durationMs: number,
    success: boolean,
    fields: TelemetryFields
): void => {
    if (!transaction) return;

    const completedAt = Date.now() / 1_000;
    const span = transaction.startChild({
        description: name,
        op: operation,
        startTimestamp: completedAt - durationMs / 1_000,
    });

    for (const [key, value] of Object.entries(sanitizeFields(fields))) {
        if (value !== undefined) span.setData(key, value);
    }

    span.setStatus(success ? 'ok' : 'internal_error');
    span.finish(completedAt);
};

const recordCompletedTrace = (
    name: string,
    operation: string,
    durationMs: number,
    success: boolean,
    fields: TelemetryFields
): void => {
    const completedAt = Date.now() / 1_000;
    const transaction = startTrace(name, operation, fields, completedAt - durationMs / 1_000);

    if (!transaction) return;

    transaction.setStatus(success ? 'ok' : 'internal_error');
    transaction.finish(completedAt);
};

export const createAgentRunTelemetry = ({
    runId,
    correlationId,
    ownerDid,
    triggerType,
    config,
}: AgentRunTelemetryContext): {
    observer: AgentRunObserver;
    started: () => void;
    succeeded: (result: AgentRunResult, durationMs: number) => void;
    failed: (error: unknown, durationMs: number) => void;
    postRunSucceeded: (durationMs: number) => void;
    postRunFailed: (error: unknown, durationMs: number) => void;
} => {
    const ownerId = getOwnerTelemetryId(ownerDid);
    const baseFields = {
        runId,
        correlationId,
        ownerId,
        triggerType,
        model: config.model,
    };
    let runTrace: SentryTransaction | undefined;

    return {
        observer: {
            onModelComplete: ({ round, durationMs, requestId, usage }) => {
                const estimatedCostUsd = usage ? getEstimatedCostUsd(usage, config) : undefined;
                const fields = {
                    ...baseFields,
                    round,
                    durationMs,
                    providerRequestId: requestId,
                    inputTokens: usage?.inputTokens,
                    outputTokens: usage?.outputTokens,
                    totalTokens: usage?.totalTokens,
                    estimatedCostUsd,
                };
                const metrics: MetricValue[] = [
                    { name: 'ModelCallCount', unit: 'Count', value: 1 },
                    { name: 'ModelCallLatency', unit: 'Milliseconds', value: durationMs },
                ];

                if (usage) {
                    metrics.push(
                        { name: 'ModelInputTokens', unit: 'Count', value: usage.inputTokens },
                        { name: 'ModelOutputTokens', unit: 'Count', value: usage.outputTokens },
                        { name: 'ModelTotalTokens', unit: 'Count', value: usage.totalTokens }
                    );
                }
                if (estimatedCostUsd !== undefined) {
                    metrics.push({
                        name: 'EstimatedCostUsd',
                        unit: 'None',
                        value: estimatedCostUsd,
                    });
                }

                writeLog('info', 'agent.model.completed', fields);
                recordChildTrace(
                    runTrace,
                    `${config.model} completion`,
                    'ai.model',
                    durationMs,
                    true,
                    fields
                );
                writeMetrics('agent.model.metrics', metrics, fields, { Model: config.model });
            },
            onModelError: ({ round, durationMs, error }) => {
                const fields = {
                    ...baseFields,
                    round,
                    durationMs,
                    ...getSafeErrorFields(error),
                };

                writeLog('error', 'agent.model.failed', fields);
                writeMetrics(
                    'agent.model.failure',
                    [
                        { name: 'ModelFailureCount', unit: 'Count', value: 1 },
                        { name: 'ModelCallLatency', unit: 'Milliseconds', value: durationMs },
                    ],
                    fields,
                    { Model: config.model }
                );
                captureOperationalError('agent.model', error, baseFields);
                recordChildTrace(
                    runTrace,
                    `${config.model} completion`,
                    'ai.model',
                    durationMs,
                    false,
                    fields
                );
            },
            onToolComplete: ({ name, durationMs, success, error }) => {
                const fields = {
                    ...baseFields,
                    toolName: name,
                    durationMs,
                    success,
                    ...(error ? getSafeErrorFields(error) : {}),
                };

                writeLog(success ? 'info' : 'warn', 'agent.tool.completed', fields);
                writeMetrics(
                    'agent.tool.metrics',
                    [
                        { name: 'ToolCallCount', unit: 'Count', value: 1 },
                        { name: 'ToolFailureCount', unit: 'Count', value: success ? 0 : 1 },
                        { name: 'ToolCallLatency', unit: 'Milliseconds', value: durationMs },
                    ],
                    fields,
                    { ToolName: name }
                );
                recordChildTrace(runTrace, name, 'ai.tool', durationMs, success, fields);
            },
        },
        started: () => {
            writeLog('info', 'agent.run.started', baseFields);
            writeMetrics(
                'agent.run.started',
                [{ name: 'RunCount', unit: 'Count', value: 1 }],
                baseFields,
                { TriggerType: triggerType }
            );
            runTrace = startTrace('LearnCard AI Agent run', 'ai.agent.run', baseFields);
        },
        succeeded: (result, durationMs) => {
            const fields = {
                ...baseFields,
                durationMs,
                modelCalls: result.modelRuns.length,
                toolCalls: result.toolRuns.length,
                inputTokens: result.usage.inputTokens,
                outputTokens: result.usage.outputTokens,
                totalTokens: result.usage.totalTokens,
                estimatedCostUsd: result.usage.estimatedCostUsd,
            };

            writeLog('info', 'agent.run.succeeded', fields);
            writeMetrics(
                'agent.run.succeeded',
                [
                    { name: 'RunSuccessCount', unit: 'Count', value: 1 },
                    { name: 'RunLatency', unit: 'Milliseconds', value: durationMs },
                ],
                fields,
                { TriggerType: triggerType }
            );
            if (runTrace) {
                for (const [key, value] of Object.entries(sanitizeFields(fields))) {
                    if (value !== undefined) runTrace.setData(key, value);
                }

                runTrace.setStatus('ok');
                runTrace.finish();
                runTrace = undefined;
            }
        },
        failed: (error, durationMs) => {
            const fields = {
                ...baseFields,
                durationMs,
                ...getSafeErrorFields(error),
            };

            writeLog('error', 'agent.run.failed', fields);
            writeMetrics(
                'agent.run.failed',
                [
                    { name: 'RunFailureCount', unit: 'Count', value: 1 },
                    { name: 'RunLatency', unit: 'Milliseconds', value: durationMs },
                ],
                fields,
                { TriggerType: triggerType }
            );
            captureOperationalError('agent.run', error, baseFields);
            if (runTrace) {
                for (const [key, value] of Object.entries(sanitizeFields(fields))) {
                    if (value !== undefined) runTrace.setData(key, value);
                }

                runTrace.setStatus('internal_error');
                runTrace.finish();
                runTrace = undefined;
            }
        },
        postRunSucceeded: durationMs => {
            const fields = { ...baseFields, durationMs };

            writeLog('info', 'agent.post-run.succeeded', fields);
            writeMetrics(
                'agent.post-run.succeeded',
                [
                    { name: 'PostRunSuccessCount', unit: 'Count', value: 1 },
                    { name: 'PostRunLatency', unit: 'Milliseconds', value: durationMs },
                ],
                fields,
                { TriggerType: triggerType }
            );
            recordCompletedTrace(
                'LearnCard AI Agent post-run persistence',
                'ai.agent.post_run',
                durationMs,
                true,
                fields
            );
        },
        postRunFailed: (error, durationMs) => {
            const fields = {
                ...baseFields,
                durationMs,
                ...getSafeErrorFields(error),
            };

            writeLog('error', 'agent.post-run.failed', fields);
            writeMetrics(
                'agent.post-run.failed',
                [
                    { name: 'PostRunFailureCount', unit: 'Count', value: 1 },
                    { name: 'PostRunLatency', unit: 'Milliseconds', value: durationMs },
                ],
                fields,
                { TriggerType: triggerType }
            );
            captureOperationalError('agent.post-run', error, baseFields);
            recordCompletedTrace(
                'LearnCard AI Agent post-run persistence',
                'ai.agent.post_run',
                durationMs,
                false,
                fields
            );
        },
    };
};

export const recordAutonomyCycle = (summary: AutonomyCycleTelemetry): void => {
    const startedAt = new Date(summary.startedAt).getTime();
    const completedAt = new Date(summary.completedAt).getTime();
    const cycleFields = {
        triggerSource: summary.triggerSource,
        dueCount: summary.dueCount,
        durationMs: Math.max(0, completedAt - startedAt),
        resultCount: summary.results.length,
    };

    writeLog('info', 'autonomy.cycle.completed', cycleFields);
    writeMetrics(
        'autonomy.cycle.metrics',
        [
            { name: 'AutonomyCycleCount', unit: 'Count', value: 1 },
            { name: 'AutonomyDueCount', unit: 'Count', value: summary.dueCount },
            {
                name: 'AutonomyCycleLatency',
                unit: 'Milliseconds',
                value: Math.max(0, completedAt - startedAt),
            },
        ],
        cycleFields
    );

    for (const result of summary.results) {
        const fields = {
            ownerId: getOwnerTelemetryId(result.ownerDid),
            scheduleId: result.scheduleId,
            scheduledFor: result.scheduledFor,
            status: result.status,
            runId: result.runId,
            triggerSource: summary.triggerSource,
        };

        writeLog(
            result.status === 'failed' ? 'error' : 'info',
            'autonomy.occurrence.completed',
            fields
        );
        writeMetrics(
            'autonomy.occurrence.metrics',
            [
                { name: 'AutonomyOccurrenceCount', unit: 'Count', value: 1 },
                {
                    name: 'AutonomyOccurrenceFailureCount',
                    unit: 'Count',
                    value: result.status === 'failed' ? 1 : 0,
                },
                {
                    name: 'AutonomyOccurrenceContentionCount',
                    unit: 'Count',
                    value: result.status === 'contended' ? 1 : 0,
                },
                {
                    name: 'AutonomyDueLag',
                    unit: 'Milliseconds',
                    value: Math.max(0, startedAt - new Date(result.scheduledFor).getTime()),
                },
            ],
            fields,
            { AutonomyStatus: result.status }
        );
    }
};

export const recordServiceError = (component: string, error: unknown): void => {
    const fields = { component, ...getSafeErrorFields(error) };

    writeLog('error', 'service.error', fields);
    captureOperationalError(component, error, fields);
};

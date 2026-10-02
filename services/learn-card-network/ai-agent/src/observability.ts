import { createHash } from 'node:crypto';

import {
    CloudWatchClient,
    PutMetricDataCommand,
    type Dimension,
    type MetricDatum,
} from '@aws-sdk/client-cloudwatch';
import * as Sentry from '@sentry/node';

import type { AgentRunObserver, AgentRunResult, AgentTokenUsage } from './agent/types';
import { getModelTokenPricing, type ServiceConfig } from './config';

type TelemetryValue = string | number | boolean | undefined;
type TelemetryFields = Record<string, TelemetryValue>;

/** One bounded record in the complete per-run application-log event stream. */
export interface SafeRunLogRecord {
    event: string;
    level: 'info' | 'warn' | 'error';
    timestamp: number;
    /** Process-local ordering, not a cross-worker or cross-restart sequence. */
    sequence: number;
    fields: TelemetryFields;
}
type MetricUnit = 'Count' | 'Milliseconds' | 'None';
type SentryDeliveryState = 'disabled' | 'unchecked' | 'delivered' | 'failed';

interface SerializedTraceSpan {
    span_id: string;
    op?: string;
    start_timestamp: number;
    timestamp?: number;
    status?: string;
}

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
    sensitiveContent?: string[];
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
const pendingMetrics: MetricDatum[] = [];
let applicationLogSequence = 0;

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
    const safeFields = sanitizeFields(fields);
    if (activeConfig?.sentryDsn && typeof safeFields.runId === 'string') {
        // SDK 7 has no native structured Logs API. Emit one bounded record per
        // event instead of retaining/truncating a whole-run buffer or capturing
        // arbitrary console output. The existing private snapshot gate applies.
        const logRecord: SafeRunLogRecord = {
            event,
            level,
            timestamp: Date.now() / 1_000,
            sequence: ++applicationLogSequence,
            fields: safeFields,
        };
        captureSafeEvent({
            message: `Application log: ${event}`,
            level: level === 'warn' ? 'warning' : level,
            timestamp: logRecord.timestamp,
            fingerprint: [SERVICE_NAME, 'application-log', event],
            // Index only run identity/classification. All capped log fields,
            // including counters and tool/runtime values, stay in the record.
            tags: sanitizeFields({
                component: 'application-log',
                recordKind: 'application-log',
                runId: safeFields.runId,
                correlationId: safeFields.correlationId,
                ownerId: safeFields.ownerId,
                triggerType: safeFields.triggerType,
                phase: safeFields.phase,
                status: safeFields.status,
            }),
            extra: { logRecord },
        });
    }
    if (!shouldEmitTelemetry(activeConfig)) return;

    const details = Object.entries(safeFields)
        .map(([key, value]) => `${key}=${formatLogValue(value!)}`)
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
            metrics.map(({ name: MetricName, unit: Unit, value: Value }): MetricDatum => ({
                MetricName,
                Unit,
                Value,
                Timestamp,
                Dimensions,
            }))
        )
    );
    scheduleCloudWatchFlush();
};

// Node 24 exposes native Error.stack as an accessor. Only that intrinsic getter
// may be invoked; application getters and arbitrary thrown objects stay opaque.
const nativeStackGetter = Object.getOwnPropertyDescriptor(new Error(), 'stack')?.get;
const errorProperty = (error: unknown, key: string): unknown => {
    try {
        if (!(error instanceof Error)) return undefined;
        const descriptor = Object.getOwnPropertyDescriptor(error, key);
        if (descriptor && 'value' in descriptor) return descriptor.value;
        if (key === 'stack' && nativeStackGetter && descriptor?.get === nativeStackGetter) {
            return nativeStackGetter.call(error);
        }
        return undefined;
    } catch {
        return undefined;
    }
};

const getSafeErrorFields = (error: unknown): TelemetryFields => {
    const name = errorProperty(error, 'name');
    let errorType = 'UnknownError';
    try {
        if (error instanceof Error) {
            errorType =
                error instanceof TypeError
                    ? 'TypeError'
                    : error instanceof RangeError
                      ? 'RangeError'
                      : error instanceof SyntaxError
                        ? 'SyntaxError'
                        : error instanceof ReferenceError
                          ? 'ReferenceError'
                          : error instanceof URIError
                            ? 'URIError'
                            : error instanceof EvalError
                              ? 'EvalError'
                              : error instanceof AggregateError
                                ? 'AggregateError'
                                : typeof name === 'string' &&
                                    /^[A-Za-z][A-Za-z0-9_.-]{0,55}(?:Error|Exception)$/.test(name)
                                  ? hashIdentifier(name)
                                  : 'Error';
        }
    } catch {
        // Hostile thrown values are classified without invoking their properties.
    }
    return { errorType };
};

const hashIdentifier = (value: string): string =>
    `sha256:${createHash('sha256').update(value).digest('hex').slice(0, 24)}`;

// Preserve only service-generated run UUIDs. External correlation/provider IDs
// are hashed at their capture sites regardless of whether they resemble UUIDs.
const safeIdentifier = (value: string): string =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
        ? value
        : hashIdentifier(value);

const MAX_DIAGNOSTIC_CHARACTERS = 8_192;
const OVERSIZED_DIAGNOSTIC = '[Message withheld: diagnostic exceeded length limit]';

const scrubText = (value: string): string => {
    // Do not run unanchored patterns on unbounded provider bodies or expose
    // a private token truncated at the output boundary.
    if (value.length > MAX_DIAGNOSTIC_CHARACTERS) return OVERSIZED_DIAGNOSTIC;
    return value
        .replace(/https?:\/\/[^\s)]+/gi, '[URL]')
        .replace(/mongodb(?:\+srv)?:\/\/[^\s)]+/gi, '[URL]')
        .replace(/did:[^\s"',;]+/gi, '[DID]')
        .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[EMAIL]')
        .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[IP]')
        .replace(/\b\d{3}[- .]\d{2}[- .]\d{4}\b/g, '[SSN]')
        .replace(/(?:\+?\d[\d ().-]{7,}\d)/g, '[PHONE]')
        .replace(/\b(?:Bearer\s+|sdk[-_]|sk[-_]|eyJ)[A-Za-z0-9._/-]+/gi, '[SECRET]')
        .replace(
            /\b(?:password|secret|token|api[-_ ]?key|seed|mnemonic|authorization)\s*[:=]\s*["']?[^"',;\n]+/gi,
            '[SECRET]'
        )
        .replace(/\/(?:home|Users)\/[^/\s]+/g, '/home/[USER]');
};

const SAFE_INTERNAL_DIAGNOSTICS: Record<string, true> = {
    'Agent run exceeded its configured token limit.': true,
    'Agent run exceeded its configured cost limit.': true,
    'Agent run exceeded its configured time limit.': true,
    'Agent post-run exceeded its configured time limit.': true,
    'Agent reached the maximum tool-call rounds before producing a response.': true,
    'Retrospective failed; its audit result has been persisted.': true,
    'Retrospective exceeded the run time limit.': true,
    'Retrospective exceeded the run token or output limit.': true,
    'Retrospective exceeded the run cost limit.': true,
    'Model returned malformed tool arguments.': true,
    'Invalid time value': true,
    'Invalid Date': true,
};

const createContentRedactor = (initial: string[] = [], config = activeConfig) => {
    // Private to one run, never stored in a Sentry scope or a global registry.
    const fragments = new Set<string>();
    let orderedFragments: string[] | undefined;
    let registeredCharacters = 0;
    // The character budget bounds registry size; ordinary conversations must
    // not fail closed merely because they contain more than 256 distinct words.
    let overflowed = false;
    const register = (content: string | undefined): void => {
        if (overflowed || content === '') return;
        if (
            content === undefined ||
            content.length > 16_384 ||
            registeredCharacters + content.length > 65_536
        ) {
            overflowed = true;
            fragments.clear();
            orderedFragments = undefined;
            return;
        }
        registeredCharacters += content.length;
        orderedFragments = undefined;
        fragments.add(content);
        fragments.add(JSON.stringify(content).slice(1, -1));
        // Common words are intentionally included: an external diagnostic and
        // an echoed prompt/tool fragment have no trusted provenance distinction.
        for (const fragment of content.match(/[\p{L}\p{N}_@./:+-]{3,}/gu) ?? []) {
            fragments.add(fragment);
        }
    };
    initial.forEach(register);
    // Explicit credentials include values supplied directly through ServiceConfig,
    // not just secret-named environment variables. Mongo errors can echo decoded
    // userinfo separately from the original URI, including multi-host URIs.
    for (const credential of [
        config?.openAIApiKey,
        config?.walletSeed,
        config?.sentryDsn,
        config?.braveSearchApiKey,
        config?.debugToken,
        config?.launchDarklySdkKey,
        config?.triggerSecretKey,
        config?.mongoUri,
        process.env.LAUNCHDARKLY_SDK_KEY,
        process.env.AI_AGENT_MONGO_URI,
        process.env.MONGO_URI,
    ]) {
        if (!credential) continue;
        if (!fragments.has(credential)) register(credential);
        const authority = credential.match(/^mongodb(?:\+srv)?:\/\/([^/?#]*)/i)?.[1];
        const userInfoEnd = authority?.lastIndexOf('@') ?? -1;
        if (!authority || userInfoEnd < 0) continue;
        const userInfo = authority.slice(0, userInfoEnd);
        const passwordStart = userInfo.indexOf(':');
        for (const part of [
            userInfo,
            passwordStart < 0 ? userInfo : userInfo.slice(0, passwordStart),
            passwordStart < 0 ? '' : userInfo.slice(passwordStart + 1),
        ]) {
            if (!part) continue;
            if (!fragments.has(part)) register(part);
            try {
                const decoded = decodeURIComponent(part);
                if (!fragments.has(decoded)) register(decoded);
            } catch {
                register(undefined); // Undecodable credential content fails closed.
            }
        }
    }
    // Additional secret-valued environment entries are registered locally only.
    for (const [key, value] of Object.entries(process.env)) {
        if (
            /(?:secret|token|password|seed|mnemonic|api.?key|sdk.?key|private.?key|dsn)/i.test(
                key
            ) &&
            value
        ) {
            if (!fragments.has(value)) register(value);
        }
    }
    const redact = (text: string): string => {
        // Internal literals carry no user data and remain actionable even when
        // large VC/tool content forces the rest of the boundary to fail closed.
        if (Object.hasOwn(SAFE_INTERNAL_DIAGNOSTICS, text)) return text;
        if (overflowed) return '[Message withheld: sensitive content exceeded redaction capacity]';
        if (text.length > MAX_DIAGNOSTIC_CHARACTERS) return OVERSIZED_DIAGNOSTIC;
        let result = text;
        orderedFragments ??= [...fragments].sort((a, b) => b.length - a.length);
        for (const fragment of orderedFragments) {
            if (fragment.length < 3) {
                const escaped = fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                result = result.replace(
                    new RegExp(`(?<![\\p{L}\\p{N}_])${escaped}(?![\\p{L}\\p{N}_])`, 'gu'),
                    '[REDACTED]'
                );
            } else {
                result = result.split(fragment).join('[REDACTED]');
            }
        }
        return scrubText(result);
    };
    return { register, redact };
};

const sanitizedExceptions = (
    error: unknown,
    redact: (value: string) => string,
    includeMessage: boolean
): Sentry.Exception[] => {
    const seen = new Set<unknown>();
    const values: Sentry.Exception[] = [];
    let current = error;
    for (let depth = 0; current !== undefined && depth < 5 && !seen.has(current); depth += 1) {
        seen.add(current);
        const message = errorProperty(current, 'message');
        const stack = errorProperty(current, 'stack');
        const frames =
            typeof stack === 'string'
                ? Sentry.defaultStackParser(stack)
                      .slice(-50)
                      .map(frame => ({
                          filename:
                              typeof frame.filename === 'string'
                                  ? hashIdentifier(frame.filename)
                                  : undefined,
                          function:
                              typeof frame.function === 'string'
                                  ? hashIdentifier(frame.function)
                                  : undefined,
                          lineno: frame.lineno,
                          colno: frame.colno,
                          in_app: frame.in_app,
                      }))
                : undefined;
        values.unshift({
            type: String(getSafeErrorFields(current).errorType),
            value:
                includeMessage && typeof message === 'string'
                    ? redact(message)
                    : typeof message === 'string' &&
                        (message === 'Invalid time value' ||
                            message === 'Invalid Date' ||
                            message === 'Invalid array length' ||
                            message === 'Maximum call stack size exceeded')
                      ? message
                      : '[Message withheld: sensitive content unavailable]',
            ...(frames?.length ? { stacktrace: { frames } } : {}),
            mechanism: { type: depth === 0 ? 'generic' : 'chained', handled: true },
        });
        current = errorProperty(current, 'cause');
    }
    return values;
};

// SDK processors may mutate hint data; only an opaque identity leaves this map.
const approvedSentryEvents = new WeakMap<object, Sentry.Event>();

// Rebuild from the sanitized capture snapshot after *all* SDK processors. Never
// forward SDK-added requests, breadcrumbs, user, env, modules, custom contexts,
// originalException, attachments, or custom properties.
export const sanitizeSentryEvent = (
    event: Sentry.Event,
    hint: Sentry.EventHint
): Sentry.Event | null => {
    const token = hint.data?.aiAgentSafeToken;
    const snapshot =
        token && typeof token === 'object' ? approvedSentryEvents.get(token) : undefined;
    if (!snapshot) return null;
    const sanitized = structuredClone(snapshot);
    sanitized.event_id =
        typeof event.event_id === 'string' && /^[0-9a-f]{32}$/i.test(event.event_id)
            ? event.event_id
            : undefined;
    sanitized.timestamp =
        typeof event.timestamp === 'number' && Number.isFinite(event.timestamp)
            ? event.timestamp
            : undefined;
    return sanitized;
};

const sanitizeTraceEvent = (event: Sentry.Event): Sentry.Event | null => {
    if (
        event.transaction !== 'LearnCard AI Agent run' &&
        event.transaction !== 'LearnCard AI Agent post-run persistence'
    )
        return null;
    const trace = event.contexts?.trace;
    if (
        typeof trace?.trace_id !== 'string' ||
        !/^[0-9a-f]{32}$/.test(trace.trace_id) ||
        typeof trace.span_id !== 'string' ||
        !/^[0-9a-f]{16}$/.test(trace.span_id)
    )
        return null;
    // Trace context is deliberately narrower than persistent lifecycle events.
    // Never copy ambient SDK scope data, span data or descriptions.
    // SDK 7 declares live Span objects here, but beforeSendTransaction receives
    // their serialized toJSON payloads.
    const spans = event.spans as unknown as SerializedTraceSpan[] | undefined;
    return {
        type: 'transaction',
        event_id: event.event_id,
        timestamp: event.timestamp,
        start_timestamp: event.start_timestamp,
        transaction: event.transaction,
        platform: 'node',
        contexts: {
            trace: {
                trace_id: trace.trace_id,
                span_id: trace.span_id,
                op:
                    event.transaction === 'LearnCard AI Agent run'
                        ? 'ai.agent.run'
                        : 'ai.agent.post_run',
                status: trace.status === 'ok' ? 'ok' : 'internal_error',
            },
        },
        spans: spans
            ?.filter(span => span.op === 'ai.model' || span.op === 'ai.tool')
            .map(span => ({
                trace_id: trace.trace_id,
                span_id: /^[0-9a-f]{16}$/.test(span.span_id) ? span.span_id : undefined,
                parent_span_id: trace.span_id,
                op: span.op,
                start_timestamp: span.start_timestamp,
                timestamp: span.timestamp,
                status: span.status === 'ok' ? 'ok' : 'internal_error',
            })) as unknown as Sentry.Event['spans'],
    };
};

const captureSafeEvent = (event: Sentry.Event): string | undefined => {
    if (!activeConfig?.sentryDsn) return undefined;
    const environment = activeConfig.sentryEnvironment ?? activeConfig.nodeEnv;
    const release = activeConfig.sentryRelease;
    const snapshot: Sentry.Event = {
        ...event,
        platform: 'node',
        logger: SERVICE_NAME,
        environment: /^(?:production|staging|development|test|dev)$/.test(environment)
            ? environment
            : hashIdentifier(environment),
        release: release
            ? /^(?:sha-)?[0-9a-f]{7,40}$/i.test(release)
                ? release
                : hashIdentifier(release)
            : undefined,
    };
    const token = {};
    approvedSentryEvents.set(token, snapshot);
    return Sentry.getCurrentHub()
        .getClient()
        ?.captureEvent(
            structuredClone(snapshot),
            { data: { aiAgentSafeToken: token } },
            new Sentry.Scope()
        );
};

const captureOperationalError = (
    component: string,
    error: unknown,
    fields: TelemetryFields,
    redact = scrubText,
    includeMessage = false
): void => {
    const values = sanitizedExceptions(error, redact, includeMessage);
    captureSafeEvent({
        level: 'error',
        tags: sanitizeFields({ component, ...fields, errorType: values.at(-1)?.type }),
        exception: { values },
    });
};

const getEstimatedCostUsd = (
    usage: AgentTokenUsage,
    config: ServiceConfig,
    model: string
): number | undefined => {
    const pricing = getModelTokenPricing(config, model);
    if (
        pricing.inputTokenCostUsdPerMillion === undefined ||
        pricing.outputTokenCostUsdPerMillion === undefined
    ) {
        return undefined;
    }

    return (
        (usage.inputTokens * pricing.inputTokenCostUsdPerMillion +
            usage.outputTokens * pricing.outputTokenCostUsdPerMillion) /
        1_000_000
    );
};

export const getOwnerTelemetryId = (did: string): string =>
    createHash('sha256').update(did).digest('hex').slice(0, 16);

export const initializeObservability = (
    config: ServiceConfig,
    transport?: Sentry.NodeOptions['transport']
): void => {
    activeConfig = config;
    sentryDeliveryState = config.sentryDsn ? 'unchecked' : 'disabled';

    if (config.sentryDsn && !sentryInitialized) {
        Sentry.init({
            dsn: config.sentryDsn,
            transport,
            environment: config.sentryEnvironment ?? config.nodeEnv,
            release: config.sentryRelease,
            sendDefaultPii: false,
            sampleRate: 1,
            tracesSampleRate: config.sentryTracesSampleRate ?? 0.1,
            defaultIntegrations: false,
            autoSessionTracking: false,
            beforeBreadcrumb: () => null,
            beforeSend: sanitizeSentryEvent,
            // Explicit traces contain only our safe counters/identifiers. Drop
            // other transaction payloads rather than forwarding ambient context.
            beforeSendTransaction: event => sanitizeTraceEvent(event),
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
    let timeout: number | NodeJS.Timeout | undefined;
    const response = new Promise<number | undefined>(resolve => {
        client?.on?.('afterSendEvent', (event, result) => {
            if (event.event_id === eventId) resolve(result?.statusCode);
        });
    });

    const eventId = captureSafeEvent({
        message: 'AI Agent deployment observability check',
        level: 'info',
        fingerprint: ['ai-agent-deployment-observability-check'],
        tags: sanitizeFields({
            component: 'service.startup',
            deploymentId: config.deploymentId ? safeIdentifier(config.deploymentId) : undefined,
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
    const fields = {
        requestId: hashIdentifier(requestId),
        method,
        route,
        statusCode,
        durationMs,
        ownerId,
    };

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
    sensitiveContent = [],
}: AgentRunTelemetryContext): {
    observer: AgentRunObserver;
    started: () => void;
    succeeded: (result: AgentRunResult, durationMs: number) => void;
    failed: (error: unknown, durationMs: number) => void;
    postRunStarted: () => void;
    postRunSucceeded: (durationMs: number) => void;
    postRunFailed: (error: unknown, durationMs: number) => void;
    registerToolNames: (names: string[]) => void;
} => {
    const content = createContentRedactor([ownerDid, ...sensitiveContent], config);
    const knownTools = new Set(['listSkills', 'readSkill']);
    const safeModel = (model: string): string =>
        (model === config.model || model === config.retroModel) &&
        /^[a-z0-9][a-z0-9_.:/-]{0,100}$/i.test(model)
            ? model
            : hashIdentifier(model);
    const baseFields = {
        runId: safeIdentifier(runId),
        correlationId: hashIdentifier(correlationId),
        ownerId: getOwnerTelemetryId(ownerDid),
        triggerType,
        model: safeModel(config.model),
        maxRunTokens: config.maxRunTokens,
        maxRunCostUsd: config.maxRunCostUsd,
        maxOutputTokens: config.maxOutputTokens,
        maxToolRounds: config.maxToolRounds,
        runTimeoutMs: config.runTimeoutMs,
    };
    let runTrace: SentryTransaction | undefined;
    let phase: 'main' | 'post-run' = 'main';
    let inputTokens = 0;
    let outputTokens = 0;
    let totalTokens = 0;
    let modelCalls = 0;
    let toolSuccesses = 0;
    let toolFailures = 0;
    let providerRequestId: string | undefined;
    const runFields = (): TelemetryFields => ({
        cumulativeInputTokens: inputTokens,
        cumulativeOutputTokens: outputTokens,
        cumulativeTotalTokens: totalTokens,
        ...baseFields,
        phase,
        inputTokens,
        outputTokens,
        totalTokens,
        modelCalls,
        toolCalls: toolSuccesses + toolFailures,
        toolSuccesses,
        toolFailures,
        providerRequestId,
    });

    return {
        registerToolNames: names => {
            for (const name of names) {
                if (/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(name)) knownTools.add(name);
            }
        },
        observer: {
            onSensitiveContent: value => content.register(value),
            onModelComplete: ({ model, round, durationMs, requestId, usage }) => {
                modelCalls += 1;
                inputTokens += usage?.inputTokens ?? 0;
                outputTokens += usage?.outputTokens ?? 0;
                totalTokens += usage?.totalTokens ?? 0;
                providerRequestId = requestId ? hashIdentifier(requestId) : undefined;
                const estimatedCostUsd = usage
                    ? getEstimatedCostUsd(usage, config, model)
                    : undefined;
                const fields = {
                    ...runFields(),
                    model: safeModel(model),
                    round,
                    durationMs,
                    providerRequestId,
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
                captureSafeEvent({
                    message: 'agent.model.completed',
                    level: 'info',
                    tags: sanitizeFields({ ...fields, status: 'succeeded' }),
                });
                recordChildTrace(
                    runTrace,
                    'Model completion',
                    'ai.model',
                    durationMs,
                    true,
                    fields
                );
                writeMetrics('agent.model.metrics', metrics, fields, { Model: safeModel(model) });
            },
            onModelError: ({ model, round, durationMs, error }) => {
                const fields = {
                    ...runFields(),
                    model: safeModel(model),
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
                    { Model: safeModel(model) }
                );
                captureOperationalError(
                    'agent.model',
                    error,
                    { ...fields, status: 'failed' },
                    content.redact,
                    true
                );
                recordChildTrace(
                    runTrace,
                    'Model completion',
                    'ai.model',
                    durationMs,
                    false,
                    fields
                );
            },
            onToolComplete: ({ name, durationMs, success, error }) => {
                if (success) toolSuccesses += 1;
                else toolFailures += 1;
                const toolName = knownTools.has(name) ? name : hashIdentifier(name);
                const fields = {
                    ...runFields(),
                    toolName,
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
                    { ToolName: toolName }
                );
                if (success) {
                    captureSafeEvent({
                        message: 'agent.tool.completed',
                        level: 'info',
                        tags: sanitizeFields({ ...fields, status: 'succeeded' }),
                    });
                } else {
                    captureOperationalError(
                        'agent.tool',
                        error,
                        { ...fields, status: 'failed' },
                        content.redact,
                        true
                    );
                }
                recordChildTrace(
                    runTrace,
                    'Tool execution',
                    'ai.tool',
                    durationMs,
                    success,
                    fields
                );
            },
        },
        started: () => {
            captureSafeEvent({
                message: 'agent.run.started',
                level: 'info',
                tags: sanitizeFields({ ...runFields(), status: 'started' }),
            });
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
                ...runFields(),
                durationMs,
                modelCalls: result.modelRuns.length,
                toolCalls: result.toolRuns.length,
                inputTokens: result.usage.inputTokens,
                outputTokens: result.usage.outputTokens,
                totalTokens: result.usage.totalTokens,
                estimatedCostUsd: result.usage.estimatedCostUsd,
            };

            writeLog('info', 'agent.run.succeeded', fields);
            captureSafeEvent({
                message: 'agent.run.succeeded',
                level: 'info',
                tags: sanitizeFields({ ...fields, status: 'succeeded' }),
            });
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
                ...runFields(),
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
            captureOperationalError(
                'agent.run',
                error,
                { ...fields, status: 'failed' },
                content.redact,
                true
            );
            if (runTrace) {
                for (const [key, value] of Object.entries(sanitizeFields(fields))) {
                    if (value !== undefined) runTrace.setData(key, value);
                }

                runTrace.setStatus('internal_error');
                runTrace.finish();
                runTrace = undefined;
            }
        },
        postRunStarted: () => {
            phase = 'post-run';
            captureSafeEvent({
                message: 'agent.post-run.started',
                level: 'info',
                tags: sanitizeFields({ ...runFields(), status: 'started' }),
            });
        },
        postRunSucceeded: durationMs => {
            const fields = { ...runFields(), durationMs, phase: 'post-run' };

            writeLog('info', 'agent.post-run.succeeded', fields);
            captureSafeEvent({
                message: 'agent.post-run.succeeded',
                level: 'info',
                tags: sanitizeFields({ ...fields, status: 'succeeded' }),
            });
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
                ...runFields(),
                phase: 'post-run',
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
            captureOperationalError(
                'agent.post-run',
                error,
                { ...fields, status: 'failed' },
                content.redact,
                true
            );
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

export const recordServiceError = (
    component: string,
    error: unknown,
    context?: {
        runId: string;
        correlationId?: string;
        ownerDid: string;
        phase: 'main' | 'post-run' | 'autonomy';
        sensitiveContent?: string[];
    }
): void => {
    const fields: TelemetryFields = {
        component,
        ...getSafeErrorFields(error),
        ...(context
            ? {
                  runId: safeIdentifier(context.runId),
                  correlationId: hashIdentifier(context.correlationId ?? context.runId),
                  ownerId: getOwnerTelemetryId(context.ownerDid),
                  triggerType: 'autonomous',
                  phase: context.phase,
                  status: 'failed',
              }
            : {}),
    };
    const content = createContentRedactor([
        ...(context ? [context.ownerDid] : []),
        ...(context?.sensitiveContent ?? []),
    ]);
    writeLog('error', 'service.error', fields);
    captureOperationalError(
        component,
        error,
        fields,
        content.redact,
        Boolean(context?.sensitiveContent)
    );
};

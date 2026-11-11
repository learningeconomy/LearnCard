import { expect, test } from 'bun:test';
import { deserialize, serialize } from 'bson';
import { AiProviderError } from '../ai/errors';
import { markProviderFailure } from '../ai/provider-diagnostics';
import { markPrivacyFailure, withPrivacyInputOrigin } from '../ai/privacy-diagnostics';
import { createUsageMeter } from '../ai/usage-meter';
import {
    backfillPauseReason,
    createBackfillFailure,
    GENERIC_BACKFILL_PAUSE_REASON,
    sanitizeBackfillFailure,
} from './backfill-diagnostics';

const secret = 'did:example:private urn:credential:private secret-payload';
const attempt = {
    stage: 'coverage' as const,
    record: 106,
    providerPipelineEntered: false,
};
const optionalFailureFields = [
    'providerOperation',
    'providerFailureReason',
    'providerStatus',
    'privacyOperation',
    'privacyCategory',
    'privacyStatus',
    'privacyInputOrigin',
    'privacyLanguageReason',
] as const;
const bsonRoundTrip = (value: Record<string, unknown>) =>
    deserialize(serialize(value, { ignoreUndefined: false }));

test('predispatch diagnostics retain a fixed stage and ordinal without exception content', () => {
    const error = new Error(secret, { cause: { payload: secret } });
    error.stack = secret;
    const failure = createBackfillFailure(error, attempt)!;
    expect(failure).toMatchObject({
        version: 1,
        record: 106,
        stage: 'coverage',
        code: 'record_failed',
        dispatchStatus: 'not_dispatched',
        requests: { generation: 0, embedding: 0, privacy: 0 },
    });
    expect(new Date(failure.at).toISOString()).toBe(failure.at);
    expect(JSON.stringify(failure)).not.toContain(secret);
    expect(backfillPauseReason(failure)).toContain('Record 106 paused at coverage');
    expect(backfillPauseReason(failure)).toContain('No provider request started in this attempt');
});

test('pipeline entry and observed requests independently require possibly-dispatched semantics', () => {
    expect(
        createBackfillFailure(new Error(secret), {
            ...attempt,
            stage: 'generation',
            providerPipelineEntered: true,
        })?.dispatchStatus
    ).toBe('possibly_dispatched');
    const meter = createUsageMeter();
    meter.privacy.requests = 1;
    expect(createBackfillFailure(new Error(secret), { ...attempt, meter })).toMatchObject({
        dispatchStatus: 'possibly_dispatched',
        requests: { generation: 0, embedding: 0, privacy: 1 },
    });
});

test('safe provider metadata survives normalized provider errors without retaining their cause', () => {
    const cause = markProviderFailure(new Error(secret), {
        providerOperation: 'request',
        providerFailureReason: 'request_failed',
        providerStatus: 429,
    });
    const error = new AiProviderError({
        code: 'ai_provider_rate_limited',
        provider: 'bedrock',
        retryable: true,
        httpStatus: 429,
        cause,
    });
    const failure = createBackfillFailure(error, {
        ...attempt,
        stage: 'generation',
        providerPipelineEntered: true,
    })!;
    expect(failure).toMatchObject({
        code: 'ai_provider_rate_limited',
        providerOperation: 'request',
        providerFailureReason: 'request_failed',
        providerStatus: 429,
        dispatchStatus: 'possibly_dispatched',
    });
    expect(JSON.stringify(failure)).not.toContain(secret);
    expect(failure).not.toHaveProperty('cause');
    expect(failure).not.toHaveProperty('retryable');
    expect(backfillPauseReason(failure)).toContain('ai provider rate limited');
    expect(backfillPauseReason(failure)).toContain('HTTP 429');
});

test('privacy diagnostics retain only fixed operation, status, category and input origin', () => {
    const source = Object.assign(new Error(secret), {
        name: 'ThrottlingException',
        $metadata: { httpStatusCode: 429, requestId: secret },
    });
    const error = withPrivacyInputOrigin('source_cohort', () =>
        markPrivacyFailure(new Error(secret), 'guardrail_request', source)
    );
    const failure = createBackfillFailure(error, {
        ...attempt,
        stage: 'generation',
        providerPipelineEntered: true,
    })!;
    expect(failure).toMatchObject({
        code: 'privacy_failed',
        privacyOperation: 'guardrail_request',
        privacyCategory: 'throttled',
        privacyStatus: 429,
        privacyInputOrigin: 'source_cohort',
        dispatchStatus: 'possibly_dispatched',
    });
    expect(JSON.stringify(failure)).not.toContain(secret);
});

test('diagnostic creation never invokes error getters, messages, causes or serialization', () => {
    let accessed = 0;
    const error = Object.defineProperties(
        {},
        Object.fromEntries(
            ['name', 'code', 'message', 'stack', 'cause', 'toJSON'].map(key => [
                key,
                {
                    get() {
                        accessed += 1;
                        throw new Error(secret);
                    },
                },
            ])
        )
    );
    expect(createBackfillFailure(error, attempt)?.code).toBe('record_failed');
    expect(accessed).toBe(0);
    expect(
        createBackfillFailure(
            new Proxy(
                {},
                {
                    getOwnPropertyDescriptor() {
                        throw new Error(secret);
                    },
                }
            ),
            attempt
        )?.code
    ).toBe('record_failed');
});

test('presentation strips unrecognized fields without invoking stored accessors', () => {
    const failure = createBackfillFailure(new Error(secret), attempt)!;
    let accessed = 0;
    const value = Object.defineProperty(
        {
            ...failure,
            did: secret,
            uri: secret,
            contentHash: secret,
            payload: secret,
            message: secret,
            cause: secret,
        },
        'toJSON',
        {
            get() {
                accessed += 1;
                throw new Error(secret);
            },
        }
    );
    expect(sanitizeBackfillFailure(value)).toEqual(failure);
    expect(backfillPauseReason(value)).not.toContain(secret);
    expect(accessed).toBe(0);
    Object.defineProperty(value, 'stage', {
        get() {
            accessed += 1;
            throw new Error(secret);
        },
    });
    expect(sanitizeBackfillFailure(value)).toBeUndefined();
    expect(accessed).toBe(0);
});

test.each([
    { version: 2 },
    { record: 0 },
    { record: 10001 },
    { at: 'invalid' },
    { stage: secret },
    { code: secret },
    { providerStatus: 418 },
    { privacyStatus: 200 },
    { privacyCategory: secret },
    { requests: { generation: -1, embedding: 0, privacy: 0 } },
    { requests: { generation: Number.NaN, embedding: 0, privacy: 0 } },
    { requests: { generation: 1, embedding: 0, privacy: 0 } },
    { requests: { generation: 0, embedding: 1, privacy: 0 } },
    { requests: { generation: 0, embedding: 0, privacy: 1 } },
    { stage: 'generation' },
    { stage: 'source_recheck' },
    { stage: 'embedding' },
    { stage: 'final_consent' },
])('invalid durable diagnostic fields fail closed: %j', change => {
    const failure = createBackfillFailure(new Error(secret), attempt)!;
    expect(sanitizeBackfillFailure({ ...failure, ...change })).toBeUndefined();
});

test('older jobs without diagnostic fields retain the generic explicit-resume guidance', () => {
    expect(sanitizeBackfillFailure(undefined)).toBeUndefined();
    expect(backfillPauseReason(undefined)).toBe(
        'Record failed or result uncertain; inspect progress before explicit resume'
    );
});

test('new diagnostics survive the Mongo BSON undefined-to-null default with no absent optional properties', () => {
    expect(bsonRoundTrip({ optional: undefined })).toEqual({ optional: null });
    const failure = createBackfillFailure(new Error(secret), attempt)!;
    for (const key of optionalFailureFields) expect(Object.hasOwn(failure, key)).toBe(false);
    const persisted = bsonRoundTrip(failure);
    expect(sanitizeBackfillFailure(persisted)).toEqual(failure);
    expect(backfillPauseReason(persisted)).toBe(backfillPauseReason(failure));
    expect(backfillPauseReason(persisted)).not.toBe(GENERIC_BACKFILL_PAUSE_REASON);
    for (const key of optionalFailureFields) expect(Object.hasOwn(persisted, key)).toBe(false);
});

test.each([
    {},
    {
        providerOperation: 'request',
        providerFailureReason: 'request_failed',
        providerStatus: 429,
    },
    {
        privacyOperation: 'guardrail_request',
        privacyCategory: 'throttled',
        privacyStatus: 429,
        privacyInputOrigin: 'source_cohort',
    },
])('legacy BSON null optionals recover without losing valid diagnostic metadata: %j', metadata => {
    const failure = createBackfillFailure(new Error(secret), {
        ...attempt,
        stage: 'generation',
        providerPipelineEntered: true,
    })!;
    const legacy = bsonRoundTrip({
        ...failure,
        ...Object.fromEntries(optionalFailureFields.map(key => [key, undefined])),
        ...metadata,
    });
    for (const key of optionalFailureFields)
        if (!Object.hasOwn(metadata, key)) expect(legacy[key]).toBeNull();
    const normalized = sanitizeBackfillFailure(legacy)!;
    expect(normalized).toEqual({ ...failure, ...metadata });
    for (const key of optionalFailureFields)
        if (!Object.hasOwn(metadata, key)) expect(Object.hasOwn(normalized, key)).toBe(false);
    expect(sanitizeBackfillFailure(bsonRoundTrip(normalized))).toEqual(normalized);
    expect(backfillPauseReason(legacy)).toContain('Record 106 paused at generation');
    expect(backfillPauseReason(legacy)).toContain('Provider requests may have been attempted');
    if (Object.hasOwn(metadata, 'providerStatus') || Object.hasOwn(metadata, 'privacyStatus'))
        expect(backfillPauseReason(legacy)).toContain('HTTP 429');
});

test('legacy optional-null normalization keeps required values and enum validation strict', () => {
    const failure = createBackfillFailure(new Error(secret), attempt)!;
    const legacy = bsonRoundTrip({
        ...failure,
        ...Object.fromEntries(optionalFailureFields.map(key => [key, undefined])),
    });
    for (const key of ['version', 'at', 'record', 'stage', 'code', 'dispatchStatus', 'requests'])
        expect(sanitizeBackfillFailure({ ...legacy, [key]: null })).toBeUndefined();
    for (const key of ['generation', 'embedding', 'privacy'])
        expect(
            sanitizeBackfillFailure({
                ...legacy,
                requests: { ...legacy.requests, [key]: null },
            })
        ).toBeUndefined();
    for (const key of optionalFailureFields)
        expect(sanitizeBackfillFailure({ ...legacy, [key]: secret })).toBeUndefined();
    expect(
        sanitizeBackfillFailure({
            ...legacy,
            requests: { generation: 1, embedding: 0, privacy: 0 },
        })
    ).toBeUndefined();
    expect(sanitizeBackfillFailure({ ...legacy, stage: 'generation' })).toBeUndefined();
    expect(
        sanitizeBackfillFailure({
            ...legacy,
            did: secret,
            message: secret,
            payload: null,
        })
    ).toEqual(failure);
});

test('legacy normalization does not invoke optional-field accessors', () => {
    const failure = createBackfillFailure(new Error(secret), attempt)!;
    let accessed = 0;
    const legacy = Object.defineProperty({ ...failure }, 'providerOperation', {
        get() {
            accessed += 1;
            throw new Error(secret);
        },
    });
    expect(sanitizeBackfillFailure(legacy)).toEqual(failure);
    expect(accessed).toBe(0);
});

test('embedding timeout diagnostics survive normalization and safe persistence/admin presentation', async () => {
    const { markEmbeddingFailure } = await import('../ai/embedding-diagnostics');
    const { normalizeAiProviderError } = await import('../ai/errors');
    const original = Object.assign(
        new Error('@smithy/node-http-handler - the request socket timed out ' + secret),
        { name: 'TimeoutError', $metadata: { httpStatusCode: 504 }, body: secret }
    );
    markEmbeddingFailure(original, 1, performance.now() - 30);
    const error = normalizeAiProviderError(original, 'bedrock-embeddings');
    const meter = createUsageMeter();
    meter.generation.requests = 1;
    meter.embedding.requests = 1;
    meter.privacy.requests = 3;
    const failure = createBackfillFailure(error, {
        stage: 'embedding',
        record: 1525,
        providerPipelineEntered: true,
        meter,
    })!;
    expect(failure.code).toBe('ai_request_timeout');
    expect(failure.embeddingFailure?.sdkCategory).toBe('socket_timeout');
    const restored = sanitizeBackfillFailure(bsonRoundTrip({ ...failure, credential: secret }))!;
    expect(restored.embeddingFailure).toEqual(failure.embeddingFailure);
    const display = backfillPauseReason(restored);
    expect(display).toContain('Embedding 1: socket timeout; HTTP 504');
    expect(display).toContain('caller active');
    expect(JSON.stringify(restored)).not.toContain(secret);
    expect(display).not.toContain(secret);
    const legacy = { ...failure, embeddingFailure: null };
    expect(sanitizeBackfillFailure(legacy)).toBeDefined();
    expect(
        sanitizeBackfillFailure({
            ...failure,
            embeddingFailure: { ...failure.embeddingFailure, sdkCategory: secret },
        })?.embeddingFailure
    ).toBeUndefined();
});

test('embedding record deadline, retry headroom and attempt exhaustion remain distinct after normalization/BSON', async () => {
    const { markEmbeddingStop } = await import('../ai/embedding-recovery');
    const { normalizeAiProviderError } = await import('../ai/errors');
    for (const reason of ['record_deadline', 'retry_deadline', 'attempts_exhausted'] as const) {
        const raw = markEmbeddingStop(
            new DOMException('synthetic private timeout', 'TimeoutError'),
            reason
        );
        const failure = createBackfillFailure(normalizeAiProviderError(raw, 'bedrock-embeddings'), {
            record: 1,
            stage: 'embedding',
            providerPipelineEntered: true,
        });
        expect(failure?.embeddingStop).toBe(reason);
        if (!failure) throw new Error('Expected bounded embedding failure');
        const copy = sanitizeBackfillFailure(deserialize(serialize(failure)));
        expect(copy?.embeddingStop).toBe(reason);
        expect(backfillPauseReason(copy)).toContain(
            reason === 'record_deadline'
                ? 'record deadline exhausted'
                : reason === 'retry_deadline'
                  ? 'backoff cannot fit'
                  : 'attempt limit exhausted'
        );
        expect(JSON.stringify(copy)).not.toContain('synthetic private');
    }
});

test('bounded dispatched evidence survives guard failures, replaces only on a new dispatched failure, and never crosses records', async () => {
    const { retainDispatchedFailure } = await import('./backfill-diagnostics');
    const paid = {
        version: 1,
        at: '2026-10-15T19:40:00.000Z',
        record: 4296,
        stage: 'embedding',
        code: 'ai_request_timeout',
        dispatchStatus: 'possibly_dispatched',
        requests: { generation: 1, embedding: 7, privacy: 3 },
        embeddingStop: 'attempts_exhausted',
    };
    const guard = {
        ...paid,
        at: '2026-10-15T19:45:00.000Z',
        stage: 'job_guard',
        code: 'record_failed',
        dispatchStatus: 'not_dispatched',
        requests: { generation: 0, embedding: 0, privacy: 0 },
    };
    const first = retainDispatchedFailure(paid, undefined, 4296);
    expect(first).toBeDefined();
    expect(retainDispatchedFailure(guard, deserialize(serialize(first!)), 4296)).toEqual(first);
    const next = { ...paid, at: '2026-10-15T19:41:00.000Z' };
    expect(retainDispatchedFailure(next, first, 4296)?.at).toBe(next.at);
    expect(retainDispatchedFailure(guard, first, 4297)).toBeUndefined();
    expect(
        retainDispatchedFailure(
            { ...paid, secret: 'never retain private payload' },
            undefined,
            4296
        )
    ).not.toHaveProperty('secret');
    const hostile = Object.defineProperty({}, 'requests', {
        get() {
            throw new Error('Accessor executed');
        },
    });
    expect(retainDispatchedFailure(guard, hostile, 4296)).toBeUndefined();
});

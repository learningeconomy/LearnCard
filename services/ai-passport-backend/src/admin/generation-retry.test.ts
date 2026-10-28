import { expect, test } from 'bun:test';
import { deserialize, serialize } from 'bson';
import type { BackfillJob } from './backfill';
import {
    GENERATION_RETRY_POLICY,
    GENERATION_RETRY_DELAYS_MS,
    isRetryableGenerationFailure,
} from './generation-retry';

type Fixture = Record<string, any>;
function candidates(status = 500) {
    const before: Fixture = {
        errors: 4,
        snapshotIndex: 455,
        cursor: 'opaque-cursor',
        written: 400,
        skipped: 55,
        usage: { totals: { generation: { measuredRequests: 7 } } },
    };
    const result: Fixture = {
        ...structuredClone(before),
        errors: 5,
        lastError: 'record_failed_or_budget_exhausted_cursor_preserved',
        lastFailure: {
            version: 1,
            at: '2026-10-14T16:00:00.000Z',
            record: 456,
            stage: 'generation',
            code: 'ai_provider_unavailable',
            dispatchStatus: 'possibly_dispatched',
            requests: { generation: 1, embedding: 0, privacy: 2 },
            providerOperation: 'request',
            providerFailureReason: 'request_failed',
            providerStatus: status,
        },
    };
    return { before, result };
}
const eligible = (before: Fixture, result: Fixture | null | undefined) =>
    isRetryableGenerationFailure(
        before as BackfillJob,
        result as BackfillJob | null | undefined,
        455
    );

test('the approved retry policy has exactly three increasing bounded delays', () => {
    expect(GENERATION_RETRY_POLICY).toBe('http5xx-v1');
    expect(GENERATION_RETRY_DELAYS_MS).toEqual([30000, 120000, 300000]);
});

test.each([500, 502, 503])(
    'explicit generation HTTP %i with unchanged checkpoints is a retry candidate',
    status => {
        const { before, result } = candidates(status);
        expect(eligible(before, result)).toBe(true);
        expect(result.lastFailure.dispatchStatus).toBe('possibly_dispatched');
    }
);

const negativeCases: [string, (before: Fixture, result: Fixture) => void][] = [
    [
        'no new error',
        (before, result) => {
            result.errors = before.errors;
        },
    ],
    [
        'multiple unseen errors',
        (before, result) => {
            result.errors = before.errors + 2;
        },
    ],
    [
        'different last error',
        (_before, result) => {
            result.lastError = 'snapshot_source_changed';
        },
    ],
    [
        'different initial item',
        before => {
            before.snapshotIndex = 454;
        },
    ],
    [
        'advanced snapshot cursor',
        (_before, result) => {
            result.snapshotIndex = 456;
        },
    ],
    [
        'advanced raw cursor',
        (_before, result) => {
            result.cursor = 'advanced-cursor';
        },
    ],
    [
        'written output',
        (_before, result) => {
            result.written += 1;
        },
    ],
    [
        'skipped output',
        (_before, result) => {
            result.skipped += 1;
        },
    ],
    [
        'missing diagnostic',
        (_before, result) => {
            delete result.lastFailure;
        },
    ],
    [
        'stale diagnostic ordinal',
        (_before, result) => {
            result.lastFailure.record = 455;
        },
    ],
    [
        'embedding-stage error',
        (_before, result) => {
            result.lastFailure.stage = 'embedding';
        },
    ],
    [
        'timeout code',
        (_before, result) => {
            result.lastFailure.code = 'ai_request_timeout';
        },
    ],
    [
        'unknown error code',
        (_before, result) => {
            result.lastFailure.code = 'record_failed';
        },
    ],
    [
        'missing HTTP response status',
        (_before, result) => {
            delete result.lastFailure.providerStatus;
        },
    ],
    [
        'HTTP timeout',
        (_before, result) => {
            result.lastFailure.providerStatus = 504;
        },
    ],
    [
        'HTTP rate limit',
        (_before, result) => {
            result.lastFailure.providerStatus = 429;
        },
    ],
    [
        'HTTP access denial',
        (_before, result) => {
            result.lastFailure.providerStatus = 403;
        },
    ],
    [
        'partial output validation',
        (_before, result) => {
            result.lastFailure.providerOperation = 'response_validation';
        },
    ],
    [
        'invalid output reason',
        (_before, result) => {
            result.lastFailure.providerFailureReason = 'response_shape';
        },
    ],
    [
        'missing request observation',
        (_before, result) => {
            result.lastFailure.requests.generation = 0;
        },
    ],
    [
        'multiple generation requests',
        (_before, result) => {
            result.lastFailure.requests.generation = 2;
        },
    ],
    [
        'partial embedding dispatch',
        (_before, result) => {
            result.lastFailure.requests.embedding = 1;
        },
    ],
    [
        'privacy operation',
        (_before, result) => {
            result.lastFailure.privacyOperation = 'guardrail_request';
        },
    ],
    [
        'privacy category',
        (_before, result) => {
            result.lastFailure.privacyCategory = 'service_unavailable';
        },
    ],
    [
        'privacy HTTP status',
        (_before, result) => {
            result.lastFailure.privacyStatus = 500;
        },
    ],
    [
        'privacy input origin',
        (_before, result) => {
            result.lastFailure.privacyInputOrigin = 'source_cohort';
        },
    ],
    [
        'privacy language evidence',
        (_before, result) => {
            result.lastFailure.privacyLanguageReason = 'locale';
        },
    ],
    [
        'measured generation response',
        (_before, result) => {
            result.usage.totals.generation.measuredRequests += 1;
        },
    ],
];
test.each(negativeCases)('retry eligibility rejects %s', (_name, change) => {
    const { before, result } = candidates();
    change(before, result);
    expect(eligible(before, result)).toBe(false);
});

test('missing step result cannot authorize a retry', () => {
    const { before } = candidates();
    expect(eligible(before, undefined)).toBe(false);
    expect(eligible(before, null)).toBe(false);
});

test('eligibility survives real BSON storage without treating legacy null privacy fields as failures', () => {
    const { before, result } = candidates();
    result.lastFailure = {
        ...result.lastFailure,
        privacyOperation: undefined,
        privacyCategory: undefined,
        privacyStatus: undefined,
        privacyInputOrigin: undefined,
        privacyLanguageReason: undefined,
    };
    const persisted = deserialize(serialize(result, { ignoreUndefined: false }));
    expect(persisted.lastFailure.privacyOperation).toBeNull();
    expect(eligible(before, persisted)).toBe(true);
});

test('v2 retries only confirmed provider request timeouts; legacy authorization remains HTTP-only', () => {
    const { before, result } = candidates();
    result.lastFailure.code = 'ai_request_timeout';
    delete result.lastFailure.providerStatus;
    result.lastFailure.generationFailure = 'provider_timeout';
    const check = () =>
        isRetryableGenerationFailure(
            before as BackfillJob,
            result as BackfillJob,
            455,
            'transient-v2'
        );
    expect(check()).toBe(true);
    expect(eligible(before, result)).toBe(false);
    expect(
        isRetryableGenerationFailure(
            before as BackfillJob,
            deserialize(serialize(result)) as BackfillJob,
            455,
            'transient-v2'
        )
    ).toBe(true);
    for (const evidence of [undefined, null, 'caller_aborted', 'anything']) {
        result.lastFailure.generationFailure = evidence;
        expect(check()).toBe(false);
    }
    result.lastFailure.generationFailure = 'provider_timeout';
    result.usage.totals.generation.measuredRequests += 1;
    expect(check()).toBe(false);
    result.usage.totals.generation.measuredRequests -= 1;
    result.lastFailure.requests.embedding = 1;
    expect(check()).toBe(false);
    result.lastFailure.requests.embedding = 0;
    result.lastFailure.providerStatus = 403;
    expect(check()).toBe(false);
});

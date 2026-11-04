import { AsyncLocalStorage } from 'node:async_hooks';
import { z } from 'zod';
import { PROVIDER_STATUSES } from './provider-diagnostics';

export const EMBEDDING_SDK_CATEGORIES = [
    'connection_timeout',
    'socket_timeout',
    'request_timeout',
    'upstream_timeout',
    'sdk_timeout',
    'socket_reset',
    'socket_pipe',
    'aborted',
    'http_error',
    'unknown',
] as const;
const timing = z.number().int().min(0).max(3_600_000);
const fields = {
    elapsedMs: timing,
    unitRemainingMs: timing.optional(),
    ordinal: z.number().int().min(1).max(10000),
    sdkCategory: z.enum(EMBEDDING_SDK_CATEGORIES),
    httpStatus: z
        .number()
        .refine(v => PROVIDER_STATUSES.some(s => s === v))
        .optional(),
};
export const embeddingFailureSchema = z.discriminatedUnion('callerAbortKind', [
    z
        .object({
            ...fields,
            callerAbortKind: z.literal('none'),
            callerAborted: z.literal(false),
        })
        .strict(),
    z
        .object({
            ...fields,
            callerAbortKind: z.literal('deadline'),
            callerAborted: z.literal(true),
        })
        .strict(),
    z
        .object({
            ...fields,
            callerAbortKind: z.literal('cancelled'),
            callerAborted: z.literal(true),
        })
        .strict(),
]);
export type EmbeddingFailure = z.infer<typeof embeddingFailureSchema>;
const own = (value: unknown, key: string): unknown => {
    try {
        return value !== null && (typeof value === 'object' || typeof value === 'function')
            ? Object.getOwnPropertyDescriptor(value, key)?.value
            : undefined;
    } catch {
        return undefined;
    }
};
const keys = [
    'elapsedMs',
    'unitRemainingMs',
    'ordinal',
    'sdkCategory',
    'httpStatus',
    'callerAbortKind',
    'callerAborted',
] as const;
export function sanitizeEmbeddingFailure(value: unknown): EmbeddingFailure | undefined {
    const candidate: Record<string, unknown> = {};
    for (const key of keys) {
        const field = own(value, key);
        if (
            (key === 'unitRemainingMs' || key === 'httpStatus') &&
            (field === null || field === undefined)
        )
            continue;
        candidate[key] = field;
    }
    const result = embeddingFailureSchema.safeParse(candidate);
    return result.success ? result.data : undefined;
}
const scope = new AsyncLocalStorage<number>();
export const withEmbeddingUnitDeadline = <T>(deadline: number, action: () => T): T =>
    scope.run(deadline, action);
const details = new WeakMap<object, EmbeddingFailure>();
const object = (value: unknown): value is object =>
    value !== null && (typeof value === 'object' || typeof value === 'function');
export const embeddingFailureDetails = (error: unknown) =>
    object(error) ? details.get(error) : undefined;
export function copyEmbeddingFailureDetails(source: unknown, target: object) {
    const value = embeddingFailureDetails(source);
    if (value) details.set(target, value);
}
function deadlineReason(reason: unknown): boolean {
    if (own(reason, 'name') === 'TimeoutError') return true;
    try {
        // Invoke only the native getter, never a getter on the supplied reason.
        return (
            reason instanceof DOMException &&
            Object.getOwnPropertyDescriptor(DOMException.prototype, 'name')?.get?.call(reason) ===
                'TimeoutError'
        );
    } catch {
        return false;
    }
}
const bounded = (n: number) =>
    Number.isFinite(n) ? Math.max(0, Math.min(3_600_000, Math.floor(n))) : 0;
export function markEmbeddingFailure(
    error: unknown,
    ordinal: number,
    started: number,
    signal?: AbortSignal
) {
    if (!object(error)) return;
    const name = own(error, 'name'),
        code = own(error, 'code'),
        message = own(error, 'message');
    // Inspect known SDK prefixes in memory only. Never retain messages, URLs or bodies.
    const text = typeof message === 'string' ? message : '';
    const status =
        own(error, 'status') ??
        own(error, 'statusCode') ??
        own(own(error, '$metadata'), 'httpStatusCode');
    const httpStatus =
        typeof status === 'number' && PROVIDER_STATUSES.some(s => s === status)
            ? status
            : undefined;
    let sdkCategory: EmbeddingFailure['sdkCategory'] = 'unknown';
    if (name === 'ModelTimeoutException') sdkCategory = 'upstream_timeout';
    else if (code === 'ECONNRESET') sdkCategory = 'socket_reset';
    else if (code === 'EPIPE') sdkCategory = 'socket_pipe';
    else if (
        name === 'TimeoutError' &&
        text.startsWith(
            '@smithy/node-http-handler - the request socket did not establish a connection'
        )
    )
        sdkCategory = 'connection_timeout';
    else if (
        name === 'TimeoutError' &&
        text.startsWith('@smithy/node-http-handler - the request socket timed out')
    )
        sdkCategory = 'socket_timeout';
    else if (
        name === 'TimeoutError' &&
        text.startsWith('@smithy/node-http-handler - [ERROR] a request has exceeded the configured')
    )
        sdkCategory = 'request_timeout';
    else if (name === 'AbortError') sdkCategory = 'aborted';
    else if (name === 'TimeoutError' || code === 'ETIMEDOUT') sdkCategory = 'sdk_timeout';
    else if (httpStatus !== undefined) sdkCategory = 'http_error';
    const deadline = scope.getStore();
    const callerAbortKind = signal?.aborted
        ? deadlineReason(signal.reason)
            ? 'deadline'
            : 'cancelled'
        : 'none';
    const value = sanitizeEmbeddingFailure({
        elapsedMs: bounded(performance.now() - started),
        ...(deadline === undefined ? {} : { unitRemainingMs: bounded(deadline - Date.now()) }),
        ordinal,
        sdkCategory,
        ...(httpStatus === undefined ? {} : { httpStatus }),
        callerAbortKind,
        callerAborted: Boolean(signal?.aborted),
    });
    if (value) details.set(error, value);
}
export function embeddingFailureSummary(value: unknown): string | undefined {
    const d = sanitizeEmbeddingFailure(value);
    if (!d) return undefined;
    return `Embedding ${d.ordinal}: ${d.sdkCategory.replaceAll('_', ' ')}${d.httpStatus === undefined ? '' : `; HTTP ${d.httpStatus}`}; ${d.elapsedMs} ms elapsed${d.unitRemainingMs === undefined ? '' : `; ${d.unitRemainingMs} ms unit remaining`}; caller ${d.callerAbortKind === 'none' ? 'active' : d.callerAbortKind}.`;
}

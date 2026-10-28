import type { EmbeddingPrivacyRecovery } from './embedding-privacy-recovery';
import { AsyncLocalStorage } from 'node:async_hooks';
import { setTimeout as delay } from 'node:timers/promises';
import { embeddingFailureDetails } from './embedding-diagnostics';

export const EMBEDDING_STOP_REASONS = [
    'record_deadline',
    'retry_deadline',
    'attempts_exhausted',
] as const;
export type EmbeddingStopReason = (typeof EMBEDDING_STOP_REASONS)[number];
const stopReasons = new WeakMap<object, EmbeddingStopReason>();
export function markEmbeddingStop<T>(error: T, reason: EmbeddingStopReason): T {
    if (error !== null && typeof error === 'object') stopReasons.set(error, reason);
    return error;
}
export const embeddingStopDetails = (error: unknown) =>
    error !== null && typeof error === 'object' ? stopReasons.get(error) : undefined;
export function copyEmbeddingStop(source: unknown, target: object) {
    const reason = embeddingStopDetails(source);
    if (reason) stopReasons.set(target, reason);
}
export const EMBEDDING_MAX_ATTEMPTS = 3;
export const MANAGED_EMBEDDING_TIMEOUT_MS = 60_000;
export const EMBEDDING_WRITE_RESERVE_MS = 15_000;
export const embeddingRetryDelay = (attempt: number) => (attempt === 1 ? 1_000 : 4_000);
export type EmbeddingRecovery = {
    privacy?: EmbeddingPrivacyRecovery;
    deadline: number;
    // Called for every dispatch, including the initial one. Must durably claim
    // the attempt and reserve the existing run budget before returning.
    reserve: (ordinal: number, timeoutMs: number, signal?: AbortSignal) => Promise<void>;
    failed: (ordinal: number) => Promise<boolean>;
};
const scope = new AsyncLocalStorage<EmbeddingRecovery | undefined>();
export const withEmbeddingRecovery = <T>(
    recovery: EmbeddingRecovery | undefined,
    action: () => T
): T => scope.run(recovery, action);
export const currentEmbeddingRecovery = () => scope.getStore();
export async function waitForEmbeddingRetry(until: number, signal?: AbortSignal) {
    signal?.throwIfAborted();
    if (until > Date.now()) await delay(until - Date.now(), undefined, { signal });
    signal?.throwIfAborted();
}
export function managedEmbeddingTimeout(deadline: number, now = Date.now()) {
    const remaining = deadline - now - EMBEDDING_WRITE_RESERVE_MS;
    if (remaining <= 0)
        throw markEmbeddingStop(
            new DOMException('Embedding finalization deadline elapsed', 'TimeoutError'),
            'record_deadline'
        );
    return Math.min(MANAGED_EMBEDDING_TIMEOUT_MS, remaining);
}
export function retryableEmbeddingFailure(error: unknown, signal?: AbortSignal) {
    if (signal?.aborted) return false;
    const d = embeddingFailureDetails(error);
    if (!d || d.callerAborted) return false;
    return (
        [
            'connection_timeout',
            'socket_timeout',
            'request_timeout',
            'upstream_timeout',
            'sdk_timeout',
            'socket_reset',
            'socket_pipe',
        ].includes(d.sdkCategory) ||
        (d.sdkCategory === 'http_error' && [429, 500, 502, 503, 504].includes(d.httpStatus ?? 0))
    );
}

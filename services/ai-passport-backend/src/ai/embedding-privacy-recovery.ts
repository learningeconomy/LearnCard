import { AsyncLocalStorage } from 'node:async_hooks';
import { setTimeout as delay } from 'node:timers/promises';

export const EMBEDDING_PRIVACY_MAX_RETRIES = 2;
export const EMBEDDING_PRIVACY_RETRY_DELAYS_MS = [1_000, 4_000] as const;
export type EmbeddingPrivacyRecovery = {
    prepare: (signal?: AbortSignal) => Promise<void>;
    retry: (signal?: AbortSignal) => Promise<boolean>;
};
const callers = new AsyncLocalStorage<AbortSignal | undefined>();
const requestTimeouts = new WeakSet<object>();
export const privacyRequestCaller = () => callers.getStore();
export function markPrivacyRequestTimeout<T>(error: T): T {
    if (error !== null && typeof error === 'object') requestTimeouts.add(error);
    return error;
}
export function copyPrivacyRequestTimeout(source: unknown, target: unknown) {
    if (source !== null && typeof source === 'object' && requestTimeouts.has(source))
        markPrivacyRequestTimeout(target);
}
export const hasPrivacyRequestTimeout = (error: unknown) =>
    error !== null && typeof error === 'object' && requestTimeouts.has(error);
export async function waitForPrivacyRetry(until: number, signal?: AbortSignal) {
    signal?.throwIfAborted();
    if (until > Date.now()) await delay(until - Date.now(), undefined, { signal });
    signal?.throwIfAborted();
}
/** Retry the complete privacy operation, including fresh audit, logging and consent checks. */
export function recoverEmbeddingPrivacy<T>(
    recovery: EmbeddingPrivacyRecovery | undefined,
    signal: AbortSignal | undefined,
    operation: () => Promise<T>
): Promise<T> {
    return callers.run(signal, async () => {
        await recovery?.prepare(signal);
        for (let attempt = 0; ; attempt += 1) {
            signal?.throwIfAborted();
            try {
                return await operation();
            } catch (error) {
                if (
                    !recovery ||
                    signal?.aborted ||
                    !hasPrivacyRequestTimeout(error) ||
                    attempt >= EMBEDDING_PRIVACY_MAX_RETRIES ||
                    !(await recovery.retry(signal))
                )
                    throw error;
            }
        }
    });
}

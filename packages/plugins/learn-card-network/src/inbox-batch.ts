import type { InboxBatchStatus } from '@learncard/types';
import type { WaitForInboxCredentialBatchOptions } from './types';

/** Read failures with no server response, throttling, timeouts and server errors can recover. */
const isTransientReadError = (error: unknown): boolean => {
    const data = (error as { data?: { httpStatus?: number; code?: string } } | null)?.data;
    if (data?.httpStatus !== undefined) {
        return data.httpStatus >= 500 || data.httpStatus === 408 || data.httpStatus === 429;
    }
    if (data?.code) {
        return [
            'INTERNAL_SERVER_ERROR',
            'TIMEOUT',
            'TOO_MANY_REQUESTS',
            'BAD_GATEWAY',
            'SERVICE_UNAVAILABLE',
            'GATEWAY_TIMEOUT',
        ].includes(data.code);
    }
    return true;
};

/** Poll without resubmitting. Timeout/abort stops waiting; the durable job keeps running. */
export const waitForInboxCredentialBatch = async (
    batchId: string,
    read: (signal: AbortSignal) => Promise<InboxBatchStatus>,
    options: WaitForInboxCredentialBatchOptions = {}
): Promise<InboxBatchStatus> => {
    const withBatchId = (cause: unknown): Error & { batchId: string } => {
        const message = `${cause instanceof Error ? cause.message : String(cause)} (batchId: ${batchId})`;
        return Object.assign(
            cause instanceof RangeError ? new RangeError(message) : new Error(message),
            {
                name: cause instanceof Error ? cause.name : 'Error',
                cause,
                batchId,
            }
        );
    };
    const { timeoutMs = 600_000, intervalMs = 2_000, signal, onProgress } = options;
    if (
        !Number.isFinite(timeoutMs) ||
        timeoutMs <= 0 ||
        timeoutMs > 2_147_483_647 ||
        !Number.isFinite(intervalMs) ||
        intervalMs <= 0 ||
        intervalMs > 2_147_483_647
    ) {
        throw withBatchId(
            new RangeError('timeoutMs and intervalMs must be positive finite timer durations.')
        );
    }
    const controller = new AbortController();
    const abort = (): void => controller.abort(signal?.reason);
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) abort();
    const timeout = setTimeout(() => {
        const error = new Error(
            'Timed out waiting for inbox batch. Keep the batch ID to check again.'
        );
        error.name = 'TimeoutError';
        controller.abort(error);
    }, timeoutMs);

    // Race each operation so an unresponsive transport cannot defeat the deadline.
    const cancellable = <T>(operation: () => Promise<T>): Promise<T> =>
        new Promise((resolve, reject) => {
            const interrupted = (): void => reject(controller.signal.reason);
            if (controller.signal.aborted) return interrupted();
            controller.signal.addEventListener('abort', interrupted, { once: true });
            Promise.resolve()
                .then(() => {
                    if (controller.signal.aborted) throw controller.signal.reason;
                    return operation();
                })
                .then(resolve, reject)
                .finally(() => controller.signal.removeEventListener('abort', interrupted));
        });
    let delay = intervalMs;
    let sleepTimer: ReturnType<typeof setTimeout> | undefined;
    try {
        while (true) {
            let batch: InboxBatchStatus | undefined;
            try {
                batch = await cancellable(() => read(controller.signal));
            } catch (error) {
                if (controller.signal.aborted || !isTransientReadError(error)) throw error;
            }
            if (batch) {
                onProgress?.(batch);
                if (batch.done) return batch;
            }
            await cancellable(
                () =>
                    new Promise<void>(resolve => {
                        sleepTimer = setTimeout(resolve, delay);
                    })
            );
            delay = Math.min(delay * 1.5, Math.max(intervalMs, 10_000));
        }
    } catch (error) {
        throw withBatchId(error);
    } finally {
        clearTimeout(timeout);
        clearTimeout(sleepTimer);
        signal?.removeEventListener('abort', abort);
    }
};

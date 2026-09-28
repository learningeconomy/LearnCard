import type { InboxBatchStatus } from '@learncard/types';
import type { WaitForInboxCredentialBatchOptions } from './types';

/** Poll without resubmitting. Timeout/abort stops waiting; the durable job keeps running. */
export const waitForInboxCredentialBatch = async (
    read: (signal: AbortSignal) => Promise<InboxBatchStatus>,
    options: WaitForInboxCredentialBatchOptions = {}
): Promise<InboxBatchStatus> => {
    const { timeoutMs = 600_000, intervalMs = 2_000, signal, onProgress } = options;
    if (
        !Number.isFinite(timeoutMs) ||
        timeoutMs <= 0 ||
        timeoutMs > 2_147_483_647 ||
        !Number.isFinite(intervalMs) ||
        intervalMs <= 0 ||
        intervalMs > 2_147_483_647
    ) {
        throw new RangeError('timeoutMs and intervalMs must be positive finite timer durations.');
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
            const batch = await cancellable(() => read(controller.signal));
            onProgress?.(batch);
            if (batch.done) return batch;
            await cancellable(
                () =>
                    new Promise<void>(resolve => {
                        sleepTimer = setTimeout(resolve, delay);
                    })
            );
            delay = Math.min(delay * 1.5, Math.max(intervalMs, 10_000));
        }
    } finally {
        clearTimeout(timeout);
        clearTimeout(sleepTimer);
        signal?.removeEventListener('abort', abort);
    }
};

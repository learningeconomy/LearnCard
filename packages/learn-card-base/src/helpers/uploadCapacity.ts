const MAX_WAIT_MS = 120_000;
// The deadline is the primary bound; this cap also limits short Retry-After loops.
const MAX_RETRIES = 24;

export const isUploadCapacityRejection = (status: number, body: unknown): boolean => {
    if (!body || typeof body !== 'object' || !('code' in body)) return false;
    return (
        (status === 503 && body.code === 'upload_capacity_exceeded') ||
        (status === 429 && body.code === 'upload_in_progress')
    );
};

const assertNotAborted = (signal?: AbortSignal): void => {
    if (signal?.aborted) throw new DOMException('Upload cancelled', 'AbortError');
};

const wait = (ms: number, signals: (AbortSignal | undefined)[]): Promise<void> =>
    new Promise((resolve, reject) => {
        signals.forEach(assertNotAborted);
        const cleanup = () =>
            signals.forEach(signal => signal?.removeEventListener('abort', abort));
        const abort = () => {
            clearTimeout(timer);
            cleanup();
            reject(new DOMException('Upload cancelled', 'AbortError'));
        };
        const timer = setTimeout(() => {
            cleanup();
            resolve();
        }, ms);
        signals.forEach(signal => signal?.addEventListener('abort', abort, { once: true }));
    });

/** Retry only explicit admission rejections, never work that may have started. */
export const waitForUploadCapacity = async (
    send: (retry: number) => Promise<Response>,
    options: {
        signal?: AbortSignal;
        waitSignal?: AbortSignal;
        onWaiting?: (waiting: boolean) => void;
        maxRetries?: number;
    } = {}
): Promise<Response> => {
    const deadline = Date.now() + MAX_WAIT_MS;
    let previous: Response | undefined;
    let waiting = false;
    try {
        for (let retry = 0; ; retry += 1) {
            assertNotAborted(options.signal);
            if (retry) {
                assertNotAborted(options.waitSignal);
                if (Date.now() >= deadline) {
                    if (!previous) throw new Error('Missing upload admission response');
                    return previous;
                }
            }
            const response = await send(retry);
            assertNotAborted(options.signal);
            if (response.status !== 429 && response.status !== 503) return response;
            let body: unknown;
            try {
                body = await response.clone().json();
            } catch {
                return response;
            }
            assertNotAborted(options.signal);
            if (
                !isUploadCapacityRejection(response.status, body) ||
                retry >= Math.min(MAX_RETRIES, options.maxRetries ?? MAX_RETRIES)
            )
                return response;
            assertNotAborted(options.waitSignal);
            const header = response.headers.get('Retry-After')?.trim();
            let delay =
                header && /^\d+$/.test(header)
                    ? Number(header) * 1000
                    : header
                      ? Date.parse(header) - Date.now()
                      : NaN;
            // Past HTTP dates use the conservative fallback rather than an immediate retry.
            if (!Number.isFinite(delay) || delay < 0) delay = Math.min(20_000, 5000 * 2 ** retry);
            // Positive jitter prevents clients from retrying in lockstep; never retry early.
            delay = Math.max(1000, delay) + Math.floor(Math.random() * 501);
            if (Date.now() + delay > deadline) return response;
            previous = response;
            // Stay in one waiting state through retry round trips; admission is not yet known.
            if (!waiting) {
                waiting = true;
                options.onWaiting?.(true);
            }
            await wait(delay, [options.signal, options.waitSignal]);
        }
    } finally {
        if (waiting) options.onWaiting?.(false);
    }
};

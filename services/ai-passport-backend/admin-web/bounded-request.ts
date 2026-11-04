/** Bound both the network request and its caller, even if a fetch ignores abort. */
export function boundedRequest<T>(
    read: (signal: AbortSignal) => Promise<T>,
    parentSignal?: AbortSignal,
    timeoutMs = 20000
): Promise<T> {
    const controller = new AbortController();
    const signal = parentSignal
        ? AbortSignal.any([parentSignal, controller.signal])
        : controller.signal;
    const timer = setTimeout(
        () => controller.abort(new DOMException('Read timed out', 'TimeoutError')),
        timeoutMs
    );
    let removeAbortListener = () => {};
    return new Promise<T>((resolve, reject) => {
        const abort = () => reject(signal.reason);
        signal.addEventListener('abort', abort, { once: true });
        removeAbortListener = () => signal.removeEventListener('abort', abort);
        if (signal.aborted) abort();
        else {
            try {
                read(signal).then(value => (signal.aborted ? abort() : resolve(value)), reject);
            } catch (error) {
                reject(error);
            }
        }
    }).finally(() => {
        clearTimeout(timer);
        removeAbortListener();
    });
}

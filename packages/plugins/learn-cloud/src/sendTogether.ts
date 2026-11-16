/** Longest a ready request waits for the others started with it. */
export const SEND_TOGETHER_MAX_WAIT_MS = 100;

/**
 * Requests started together are sent together. Each one first builds its encrypted input, and
 * in the browser that takes real time (one awaited hash per field), so without this the
 * quickest is sent before the rest are ready and httpBatchLink splits them across HTTP
 * requests (LC-2413). A ready request waits until every request started with it is ready,
 * then all are sent in the same tick. The wait is capped, so one slow input can't hold the rest.
 */
export const createSendTogether = () => {
    let preparing = 0;
    let ready: Array<() => void> = [];
    let timer: ReturnType<typeof setTimeout> | undefined;

    const flush = () => {
        if (timer) clearTimeout(timer);
        timer = undefined;
        const sends = ready;
        ready = [];
        sends.forEach(send => send());
    };

    return async <T>(prepare: () => Promise<() => Promise<T>>): Promise<T> => {
        preparing += 1;
        let send: () => Promise<T>;
        try {
            send = await prepare();
        } catch (error) {
            preparing -= 1;
            if (preparing === 0) flush();
            throw error;
        }
        return new Promise<T>((resolve, reject) => {
            ready.push(() => {
                try {
                    send().then(resolve, reject);
                } catch (error) {
                    reject(error);
                }
            });
            preparing -= 1;
            if (preparing === 0) flush();
            else timer ??= setTimeout(flush, SEND_TOGETHER_MAX_WAIT_MS);
        });
    };
};

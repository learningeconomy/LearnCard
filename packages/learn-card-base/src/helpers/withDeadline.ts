/**
 * withDeadline — bound any async operation with a hard timeout.
 *
 * Boot-time network calls (auth session checks, key-status fetches, wallet
 * init) must never hang the app on a flaky/absent connection. `withDeadline`
 * races the operation against a timer and rejects with a `DeadlineError` if the
 * budget is exceeded. When the operation is given as a function it receives an
 * `AbortSignal` so signal-aware callers (fetch) can cancel in-flight work; the
 * signal is also aborted on timeout.
 *
 * The underlying promise may keep running after a timeout (JS can't force-kill
 * a promise) — callers must treat the result as discarded. Pair with a
 * generation guard when a late result could clobber newer state.
 */

export class DeadlineError extends Error {
    readonly label: string;
    readonly ms: number;

    constructor(label: string, ms: number) {
        super(`Operation "${label}" exceeded ${ms}ms deadline`);
        this.name = 'DeadlineError';
        this.label = label;
        this.ms = ms;
    }
}

export const isDeadlineError = (e: unknown): e is DeadlineError => e instanceof DeadlineError;

export interface WithDeadlineOptions {
    ms: number;
    label?: string;
    signal?: AbortSignal;
    onTimeout?: () => void;
}

type Operation<T> = Promise<T> | ((signal: AbortSignal) => Promise<T>);

/**
 * Race `operation` against a timeout. Rejects with `DeadlineError` on timeout,
 * or with the operation's own error, or with an AbortError if `signal` fires.
 */
export const withDeadline = <T>(operation: Operation<T>, opts: WithDeadlineOptions): Promise<T> => {
    const { ms, label = 'operation', signal: external, onTimeout } = opts;
    const controller = new AbortController();

    if (external) {
        if (external.aborted) controller.abort();
        else external.addEventListener('abort', () => controller.abort(), { once: true });
    }

    const promise = typeof operation === 'function' ? operation(controller.signal) : operation;

    return new Promise<T>((resolve, reject) => {
        let settled = false;

        const timer = setTimeout(() => {
            if (settled) return;
            settled = true;
            controller.abort();
            onTimeout?.();
            reject(new DeadlineError(label, ms));
        }, ms);

        const finish = (fn: () => void) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            fn();
        };

        promise.then(
            value => finish(() => resolve(value)),
            error => finish(() => reject(error))
        );
    });
};

/**
 * Like `withDeadline` but resolves to `fallback` instead of rejecting when the
 * operation times out OR throws. Use for opportunistic boot calls where a
 * failure/timeout should degrade gracefully (e.g. "assume no auth session").
 */
export const withDeadlineOr = async <T>(
    operation: Operation<T>,
    fallback: T,
    opts: WithDeadlineOptions
): Promise<T> => {
    try {
        return await withDeadline(operation, opts);
    } catch {
        return fallback;
    }
};

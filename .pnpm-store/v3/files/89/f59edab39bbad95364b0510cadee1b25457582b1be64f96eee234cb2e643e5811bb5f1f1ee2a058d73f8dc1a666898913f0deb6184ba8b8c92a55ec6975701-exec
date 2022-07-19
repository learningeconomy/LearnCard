import { timer, fromEvent, merge } from 'rxjs';
import { first } from 'rxjs/operators';
export function mergeAbortSignals(signals) {
    const controller = new AbortController();
    if (signals.length === 0) {
        throw Error('Need abort signals to create a merged abort signal');
    }
    if (signals.some((signal) => signal.aborted)) {
        controller.abort();
        return controller.signal;
    }
    merge(...signals.map((signal) => fromEvent(signal, 'abort')))
        .pipe(first())
        .subscribe(() => {
        controller.abort();
    });
    return controller.signal;
}
export class TimedAbortSignal {
    constructor(timeout) {
        const controller = new AbortController();
        this.signal = controller.signal;
        if (timeout <= 0) {
            controller.abort();
            return;
        }
        this._subscription = timer(timeout).subscribe(() => {
            controller.abort();
        });
    }
    clear() {
        this._subscription?.unsubscribe();
    }
}
export async function abortable(original, fn) {
    const controller = new AbortController();
    const onAbort = () => {
        controller.abort();
    };
    original.addEventListener('abort', onAbort);
    if (original.aborted)
        controller.abort();
    return fn(controller.signal).finally(() => {
        original.removeEventListener('abort', onAbort);
    });
}
//# sourceMappingURL=abort-signal-utils.js.map
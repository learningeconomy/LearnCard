/** One in-flight refresh, identity invalidation, abort and bounded scheduling. */
export function createAdminPoller<T>(options: {
    read: (signal: AbortSignal) => Promise<T>;
    identity: () => string | null;
    publish: (value: T) => void;
    clear: () => void;
    error: (error: unknown) => void;
    interval?: number;
}) {
    let stopped = false,
        suspended = false,
        revision = 0,
        timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined, inFlight: Promise<void> | undefined;
    const refresh = (): Promise<void> => {
        if (stopped || suspended) return Promise.resolve();
        if (inFlight) return inFlight;
        clearTimeout(timer);
        const mine = revision,
            identity = options.identity();
        controller = new AbortController();
        const signal = controller.signal;
        inFlight = options
            .read(signal)
            .then(value => {
                if (
                    !stopped &&
                    mine === revision &&
                    !signal.aborted &&
                    identity === options.identity()
                )
                    options.publish(value);
            })
            .catch(error => {
                if (
                    !stopped &&
                    mine === revision &&
                    !signal.aborted &&
                    identity === options.identity()
                )
                    options.error(error);
            })
            .finally(() => {
                inFlight = undefined;
                if (!stopped && !suspended)
                    timer = setTimeout(
                        refresh,
                        mine === revision ? (options.interval ?? 15000) : 0
                    );
            });
        return inFlight;
    };
    return {
        refresh,
        invalidate() {
            suspended = !options.identity();
            revision += 1;
            controller?.abort();
            options.clear();
            clearTimeout(timer);
            if (!inFlight && !stopped && !suspended) timer = setTimeout(refresh, 0);
        },
        stop() {
            stopped = true;
            revision += 1;
            clearTimeout(timer);
            controller?.abort();
            options.clear();
        },
    };
}

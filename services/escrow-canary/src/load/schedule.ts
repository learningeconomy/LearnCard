/**
 * Open-loop arrivals: each start is scheduled at a fixed time regardless of how
 * earlier starts are doing, so server latency growth shows up as latency and
 * in-flight growth rather than a silently lower request rate. A start that would
 * exceed `maxInFlight` is DROPPED (counted), never queued; a start that fires
 * more than `lateMs` after its scheduled time is counted late (the generator,
 * not the server, is then the limit).
 */
export interface Scheduled {
    /** Offset from the schedule start, ms. */
    atMs: number;
}

export interface ScheduleOptions {
    maxInFlight: number;
    lateMs: number;
}

export interface ScheduleDeps {
    now(): number;
    sleep(ms: number): Promise<void>;
}

export interface ScheduleHooks<T extends Scheduled> {
    /** Must not throw synchronously; rejections are swallowed (record them inside). */
    start(item: T): Promise<void>;
    dropped(item: T, reason: 'in_flight' | 'stopped'): void;
    late(item: T, lateMs: number): void;
    /** Checked before each start; once true, every remaining item is dropped as stopped. */
    shouldStop(item: T): boolean;
}

export interface ScheduleResult {
    started: number;
    dropped: number;
    late: number;
}

export const runOpenLoop = async <T extends Scheduled>(
    items: Iterable<T>,
    options: ScheduleOptions,
    deps: ScheduleDeps,
    hooks: ScheduleHooks<T>
): Promise<ScheduleResult> => {
    if (!Number.isInteger(options.maxInFlight) || options.maxInFlight < 1)
        throw new Error('maxInFlight must be a positive integer');
    const origin = deps.now();
    const pending = new Set<Promise<void>>();
    const result = { started: 0, dropped: 0, late: 0 };
    let stopped = false;
    for (const item of items) {
        if (!stopped) {
            const wait = origin + item.atMs - deps.now();
            if (wait > 0) await deps.sleep(wait);
            stopped = hooks.shouldStop(item);
        }
        if (stopped) {
            result.dropped += 1;
            hooks.dropped(item, 'stopped');
            continue;
        }
        const lateness = deps.now() - (origin + item.atMs);
        if (lateness > options.lateMs) {
            result.late += 1;
            hooks.late(item, lateness);
        }
        if (pending.size >= options.maxInFlight) {
            result.dropped += 1;
            hooks.dropped(item, 'in_flight');
            continue;
        }
        result.started += 1;
        let run: Promise<void>;
        try {
            run = hooks.start(item).catch(() => undefined);
        } catch {
            run = Promise.resolve();
        }
        const tracked: Promise<void> = run.finally(() => pending.delete(tracked));
        pending.add(tracked);
    }
    while (pending.size > 0) await Promise.all([...pending]);
    return result;
};

import { safeLogMaintenance } from './telemetry';
import type { ShareLinkMaintenanceLogger, ShareLinkMaintenanceRunSummary } from './types';

export type ShareLinkMaintenanceSchedulerDependencies = {
    runOnce: (options?: { remainingTimeMs?: number }) => Promise<unknown>;
    intervalMs: number;
    logger: ShareLinkMaintenanceLogger;
    setTimeoutFn?: (handler: () => void, timeoutMs: number) => unknown;
    clearTimeoutFn?: (handle: unknown) => void;
};

export type ShareLinkMaintenanceScheduler = {
    /** Idempotent; schedules the first bounded pass one interval from now. */
    start: () => void;
    /** Stops scheduling and drains an in-flight pass. */
    stop: () => Promise<void>;
    /** Runs one pass now, coalescing with an in-flight pass (no overlap). */
    trigger: () => Promise<void>;
    isRunning: () => boolean;
};

const defaultSetTimeout = (handler: () => void, timeoutMs: number): unknown =>
    setTimeout(handler, timeoutMs);

const defaultClearTimeout = (handle: unknown): void => {
    clearTimeout(handle as ReturnType<typeof setTimeout>);
};

const fixedFailureSummary = (intervalMs: number): ShareLinkMaintenanceRunSummary => ({
    status: 'failed',
    durationMs: 0,
    budgetMs: intervalMs,
    recovery: null,
    cleanup: null,
    receiptPrune: null,
    categories: { share_link_maintenance_pass_failed: 1 },
});

/**
 * Non-overlapping maintenance loop.
 *
 * The next tick is scheduled only *after* the awaited pass settles, so a slow
 * pass can never stack timers. `trigger` coalesces with an in-flight pass, which
 * is the per-process overlap guard; other processes are fenced by the durable
 * repository claims. `stop` is terminal: it clears the pending tick, awaits the
 * in-flight pass, and rejects any later explicit trigger or already-queued timer
 * callback. Nothing here registers a timer at module import, and a logger failure
 * cannot corrupt the loop state.
 */
export const createShareLinkMaintenanceScheduler = (
    dependencies: ShareLinkMaintenanceSchedulerDependencies
): ShareLinkMaintenanceScheduler => {
    const setTimeoutFn = dependencies.setTimeoutFn ?? defaultSetTimeout;
    const clearTimeoutFn = dependencies.clearTimeoutFn ?? defaultClearTimeout;

    let started = false;
    let stopped = false;
    let timer: unknown = null;
    let inFlight: Promise<void> | null = null;

    const scheduleNext = (): void => {
        if (stopped || !started) return;

        timer = setTimeoutFn(() => {
            void tick();
        }, dependencies.intervalMs);
    };

    const tick = async (): Promise<void> => {
        await trigger();
        scheduleNext();
    };

    const trigger = (): Promise<void> => {
        // Stop is terminal: nothing, including an explicit trigger or an already
        // queued timer callback, may start work after `stop()`.
        if (stopped) return Promise.resolve();

        if (inFlight) return inFlight;

        // An `async` wrapper converts a synchronous `runOnce` throw into a
        // rejected promise, and `.finally` always settles on a microtask, so the
        // assignment below can never race the clearing callback and leave
        // `inFlight` stuck on an already-settled promise.
        const run = async (): Promise<void> => {
            try {
                await dependencies.runOnce();
            } catch {
                safeLogMaintenance(
                    dependencies.logger,
                    fixedFailureSummary(dependencies.intervalMs)
                );
            }
        };

        const pass = run().finally(() => {
            if (inFlight === pass) inFlight = null;
        });

        inFlight = pass;

        return pass;
    };

    return {
        start: () => {
            if (started || stopped) return;

            started = true;
            scheduleNext();
        },
        stop: async () => {
            stopped = true;
            started = false;

            if (timer !== null) {
                clearTimeoutFn(timer);
                timer = null;
            }

            if (inFlight) await inFlight;
        },
        trigger,
        isRunning: () => inFlight !== null,
    };
};

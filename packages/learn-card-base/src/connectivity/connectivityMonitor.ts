/**
 * Shared connectivity monitor — the single owner of verified reachability.
 *
 * One instance per app (Task 2 wires it). It combines:
 *
 *  - `reportTransport(connected)` — raw Capacitor Network hints. A hint is a
 *    HINT, never proof: a negative hint triggers a probe without flipping a
 *    verified `online` to `offline`, and a positive hint restores `online`
 *    immediately (optimistic, so native Wi-Fi-without-WAN still recovers the
 *    UI) then verifies once asynchronously.
 *  - `probeConnectivity` — the actual verification. Only transport failure or
 *    deadline may set `offline`; inconclusive endpoint/config results drop to
 *    permissive `unknown` with a retained diagnostic reason.
 *  - Offline retry backoff: 5s, 10s, 20s, 40s, then capped at 60s. Automatic
 *    retries pause while backgrounded; foreground resume checks immediately,
 *    then backoff resumes. There is NO idle online polling: a verified
 *    `reachable` clears every timer.
 *  - Generations supersede stale work: a late probe result can never override
 *    a newer hint, a stop, or a resume.
 *  - `connectionQuality` — advisory slow/unstable evidence. Quality never
 *    influences status, auth, or the React Query online bridge.
 *
 * Pure module: fetch/timers/clock are injectable; the store bridge at the
 * bottom is the only zustood touchpoint and is optional.
 */

import { connectivityStore, type ConnectivityStatus } from '../stores/connectivityStore';

import {
    createConnectionQualityTracker,
    type ConnectionQuality,
    type ConnectionQualityReason,
    type ConnectionQualitySample,
    type ConnectionQualityThresholds,
} from './connectionQuality';
import { probeConnectivity, type ProbeOutcome, type ProbeTargetConfig } from './probeConnectivity';

/** Default offline retry schedule; the last entry is the cap. */
export const DEFAULT_OFFLINE_RETRY_DELAYS_MS: readonly number[] = [
    5000, 10_000, 20_000, 40_000, 60_000,
];

export interface ConnectivitySnapshot {
    status: ConnectivityStatus;
    quality: ConnectionQuality;
    qualityReason: ConnectionQualityReason | null;
    /** Why the last check was not a clean verification (diagnostics only). */
    lastDiagnosticReason: string | null;
    lastOnlineAt: number | null;
    lastCheckAt: number | null;
    foreground: boolean;
    running: boolean;
}

export interface ConnectivityMonitorOptions {
    /**
     * Resolve the probe target for the current environment (Task 2 wires the
     * HTTPS tenant domain on native, the app origin on web dev). Return `null`
     * to force an inconclusive result instead of probing.
     */
    getProbeTarget: () => ProbeTargetConfig | string | null;
    /** Test seam. Defaults to {@link probeConnectivity}. */
    probe?: (target: ProbeTargetConfig | string) => Promise<ProbeOutcome>;
    now?: () => number;
    setTimeoutFn?: (handler: () => void, ms: number) => unknown;
    clearTimeoutFn?: (handle: unknown) => void;
    offlineRetryDelaysMs?: readonly number[];
    qualityThresholds?: Partial<ConnectionQualityThresholds>;
    /** Notified on every state change (used by the store bridge). */
    onStateChange?: (snapshot: ConnectivitySnapshot) => void;
}

export interface ConnectivityMonitor {
    start: () => void;
    stop: () => void;
    isRunning: () => boolean;
    /** Feed a Capacitor Network hint. Ignored before `start()`. */
    reportTransport: (connected: boolean) => void;
    /**
     * Request a coalesced verification through the same singleton operation as
     * automatic retries and hints (manual retry UI must NOT call
     * `Network.getStatus` itself). Resolves with the resulting status.
     */
    check: () => Promise<ConnectivityStatus>;
    /** Pause automatic retries when backgrounded; resume with an immediate check. */
    setActive: (active: boolean) => void;
    /** Feed an externally observed sample (real request timing) to the quality policy. */
    reportSample: (
        sample: Omit<ConnectionQualitySample, 'source'> & {
            source?: ConnectionQualitySample['source'];
        }
    ) => void;
    getState: () => ConnectivitySnapshot;
    subscribe: (listener: (snapshot: ConnectivitySnapshot) => void) => () => void;
}

export const createConnectivityMonitor = (
    options: ConnectivityMonitorOptions
): ConnectivityMonitor => {
    const now = options.now ?? (() => Date.now());
    const setTimeoutFn =
        options.setTimeoutFn ?? ((handler: () => void, ms: number) => setTimeout(handler, ms));
    const clearTimeoutFn =
        options.clearTimeoutFn ?? (handle => clearTimeout(handle as ReturnType<typeof setTimeout>));
    const retryDelays = options.offlineRetryDelaysMs ?? DEFAULT_OFFLINE_RETRY_DELAYS_MS;
    const runProbe =
        options.probe ?? ((target: ProbeTargetConfig | string) => probeConnectivity(target));

    const quality = createConnectionQualityTracker({ now, thresholds: options.qualityThresholds });

    let running = false;
    let foreground = true;
    let status: ConnectivityStatus = 'unknown';
    let lastOnlineAt: number | null = null;
    let lastCheckAt: number | null = null;
    let lastDiagnosticReason: string | null = null;

    /** Incremented whenever all outstanding probe results become stale. */
    let generation = 0;
    /** The cycle currently allowed to apply its result, if any. */
    let activeCycle: { generation: number } | null = null;
    let coalesceRequested = false;
    let retryTimer: unknown = null;
    let backoffIndex = 0;

    /** Bumped each time an outcome is applied; `check()` waiters key off it. */
    let appliedOutcomeCount = 0;
    type CheckWaiter = { seenOutcomes: number; resolve: (status: ConnectivityStatus) => void };
    let checkWaiters: CheckWaiter[] = [];

    const listeners = new Set<(snapshot: ConnectivitySnapshot) => void>();

    const snapshot = (): ConnectivitySnapshot => {
        const qualitySnapshot = quality.snapshot();
        return {
            status,
            quality: qualitySnapshot.quality,
            qualityReason: qualitySnapshot.reason,
            lastDiagnosticReason,
            lastOnlineAt,
            lastCheckAt,
            foreground,
            running,
        };
    };

    const emit = (): void => {
        const current = snapshot();
        listeners.forEach(listener => listener(current));
        options.onStateChange?.(current);
    };

    /** Resolve `check()` promises whose requested verification has settled. */
    const settleChecks = (): void => {
        if (checkWaiters.length === 0) return;
        const remaining: CheckWaiter[] = [];
        for (const waiter of checkWaiters) {
            if (appliedOutcomeCount > waiter.seenOutcomes || !running) waiter.resolve(status);
            else remaining.push(waiter);
        }
        checkWaiters = remaining;
    };

    const clearRetryTimer = (): void => {
        if (retryTimer !== null) {
            clearTimeoutFn(retryTimer);
            retryTimer = null;
        }
    };

    const scheduleRetry = (): void => {
        clearRetryTimer();
        if (!running || !foreground) return; // paused in background; resume handles it
        const delay = retryDelays[Math.min(backoffIndex, retryDelays.length - 1)];
        backoffIndex += 1;
        retryTimer = setTimeoutFn(() => {
            retryTimer = null;
            void startCycle();
        }, delay);
    };

    const applyOutcome = (outcome: ProbeOutcome): void => {
        switch (outcome.kind) {
            case 'reachable':
                backoffIndex = 0;
                clearRetryTimer();
                status = 'online';
                lastOnlineAt = now();
                lastDiagnosticReason = null;
                quality.reportSample({
                    at: now(),
                    ok: true,
                    durationMs: outcome.durationMs,
                    source: 'probe',
                });
                break;
            case 'unreachable':
                status = 'offline';
                lastDiagnosticReason = `unreachable: ${outcome.reason}`;
                quality.reportSample({ at: now(), ok: false, source: 'probe' });
                scheduleRetry();
                break;
            case 'inconclusive':
                // Something answered or the config is wrong — never claim
                // offline. Drop to permissive `unknown`, keep the reason, and
                // retry on the capped backoff (bounded, no storm).
                status = 'unknown';
                lastDiagnosticReason = `inconclusive: ${outcome.reason}${
                    outcome.detail ? ` (${outcome.detail})` : ''
                }`;
                scheduleRetry();
                break;
            default:
                break;
        }
        appliedOutcomeCount += 1;
    };

    const startCycle = (): void => {
        if (!running) return;
        if (activeCycle) {
            coalesceRequested = true;
            return;
        }
        // A manual check supersedes any pending automatic retry; retries are
        // rescheduled by the outcome itself.
        clearRetryTimer();

        const cycle = { generation };
        activeCycle = cycle;
        lastCheckAt = now();
        emit();

        void (async () => {
            let outcome: ProbeOutcome;
            try {
                const target = options.getProbeTarget();
                if (target === null) {
                    outcome = {
                        kind: 'inconclusive',
                        reason: 'invalid-url',
                        durationMs: 0,
                        detail: 'no probe target configured',
                    };
                } else {
                    outcome = await runProbe(target);
                }
            } catch {
                // Probes must never throw through the monitor.
                outcome = { kind: 'unreachable', reason: 'network-error', durationMs: 0 };
            }

            // A newer hint/stop/resume supersedes this result entirely.
            if (cycle.generation !== generation) {
                activeCycle = null;
                // A request (e.g. a positive hint) may have arrived while this
                // stale cycle was in flight; honor it with a fresh cycle so
                // the pending verification is not silently lost.
                if (coalesceRequested && running) {
                    coalesceRequested = false;
                    void startCycle();
                }
                return;
            }

            activeCycle = null;
            applyOutcome(outcome);
            emit();
            settleChecks();

            if (coalesceRequested && running) {
                coalesceRequested = false;
                void startCycle();
            }
        })();
    };

    return {
        start: () => {
            if (running) return;
            running = true;
            generation += 1; // anything in flight from a previous run is stale
            clearRetryTimer();
            emit();
            void startCycle(); // initial verification
        },

        stop: () => {
            if (!running) return;
            running = false;
            generation += 1;
            clearRetryTimer();
            settleChecks(); // release pending check() callers
            emit();
        },

        isRunning: () => running,

        reportTransport: connected => {
            if (!running) return;

            if (connected) {
                // Positive hint: restore service optimistically (native
                // Wi-Fi-without-WAN must not stay locked out), cancel stale
                // work, and verify exactly once asynchronously.
                generation += 1;
                clearRetryTimer();
                status = 'online';
                lastOnlineAt = now();
                emit();
                void startCycle();
                return;
            }

            if (status === 'offline') {
                // Already known-offline: keep the existing backoff cadence; a
                // hint burst must not become a probe storm. Only (re)schedule
                // if nothing is pending (e.g. retries paused in background).
                if (!retryTimer && !activeCycle) scheduleRetry();
                return;
            }

            // Negative hint from a seemingly-connected state: verify with a
            // probe but do NOT preemptively flip online → offline.
            void startCycle();
        },

        check: () => {
            if (!running) return Promise.resolve(status);
            const waiter: CheckWaiter = {
                seenOutcomes: appliedOutcomeCount,
                resolve: () => undefined,
            };
            const promise = new Promise<ConnectivityStatus>(resolve => {
                waiter.resolve = resolve;
            });
            checkWaiters.push(waiter);
            startCycle();
            return promise;
        },

        setActive: active => {
            if (foreground === active) return;
            foreground = active;
            if (!active) {
                // Pause automatic work; results spanning the background are
                // superseded so nothing stale lands on resume.
                generation += 1;
                clearRetryTimer();
                settleChecks();
                emit();
                return;
            }
            if (running) {
                // Foreground: check immediately, then backoff resumes for
                // subsequent failures.
                generation += 1;
                clearRetryTimer();
                emit();
                void startCycle();
            }
        },

        reportSample: sample => {
            quality.reportSample({ source: 'observed', ...sample });
            emit();
        },

        getState: snapshot,

        subscribe: listener => {
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
            };
        },
    };
};

/**
 * Push monitor state into the shared connectivity store. The store keeps its
 * existing `report(boolean)` action untouched for debug/test callers; this
 * bridge is how the monitor's richer snapshot reaches the app.
 */
export const attachConnectivityMonitorToStore = (monitor: ConnectivityMonitor): (() => void) => {
    const apply = (snapshot: ConnectivitySnapshot): void => {
        connectivityStore.set.status(snapshot.status);
        connectivityStore.set.lastOnlineAt(snapshot.lastOnlineAt);
        connectivityStore.set.quality(snapshot.quality);
        connectivityStore.set.qualityReason(snapshot.qualityReason);
        connectivityStore.set.lastDiagnosticReason(snapshot.lastDiagnosticReason);
        connectivityStore.set.lastCheckAt(snapshot.lastCheckAt);
    };

    apply(monitor.getState());
    return monitor.subscribe(apply);
};

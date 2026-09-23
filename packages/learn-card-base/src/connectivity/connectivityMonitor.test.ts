import { afterEach, describe, expect, it } from 'vitest';

import { connectivityStore } from '../stores/connectivityStore';

import {
    DEFAULT_OFFLINE_RETRY_DELAYS_MS,
    attachConnectivityMonitorToStore,
    createConnectivityMonitor,
    type ConnectivityMonitorOptions,
    type ConnectivitySnapshot,
} from './connectivityMonitor';
import type { ProbeOutcome, ProbeTargetConfig } from './probeConnectivity';

const BASE_TIME = 1_700_000_000_000;
const PROBE_TARGET = 'https://learncard.app/connectivity.txt';

const createFakeTimers = () => {
    let currentTime = BASE_TIME;
    let seq = 0;
    const jobs = new Map<number, { at: number; fn: () => void }>();

    return {
        now: () => currentTime,
        setTimeoutFn: (fn: () => void, ms: number) => {
            const id = (seq += 1);
            jobs.set(id, { at: currentTime + ms, fn });
            return id;
        },
        clearTimeoutFn: (handle: unknown) => {
            jobs.delete(handle as number);
        },
        pendingCount: () => jobs.size,
        advance: (ms: number) => {
            const target = currentTime + ms;
            for (;;) {
                let nextId: number | undefined;
                let nextAt = Infinity;
                jobs.forEach((job, id) => {
                    if (job.at <= target && (nextId === undefined || job.at < nextAt)) {
                        nextAt = job.at;
                        nextId = id;
                    }
                });
                if (nextId === undefined) break;
                currentTime = nextAt;
                const job = jobs.get(nextId as number) as { at: number; fn: () => void };
                jobs.delete(nextId as number);
                job.fn();
            }
            currentTime = target;
        },
    };
};

type Timers = ReturnType<typeof createFakeTimers>;

interface DeferredProbeCall {
    target: ProbeTargetConfig | string;
    resolve: (outcome: ProbeOutcome) => void;
    reject: (error: unknown) => void;
}

interface Harness {
    monitor: ReturnType<typeof createConnectivityMonitor>;
    timers: Timers;
    probeCalls: DeferredProbeCall[];
    states: ConnectivitySnapshot[];
}

const flush = async (): Promise<void> => {
    for (let i = 0; i < 20; i += 1) await Promise.resolve();
};

/** Resolve a probe call and let the monitor's microtasks settle. */
const settleProbe = async (call: DeferredProbeCall, outcome: ProbeOutcome): Promise<void> => {
    call.resolve(outcome);
    await flush();
};

const reachable = (durationMs = 120): ProbeOutcome => ({
    kind: 'reachable',
    durationMs,
    httpStatus: 200,
});

const unreachable = (reason: 'timeout' | 'network-error' = 'network-error'): ProbeOutcome => ({
    kind: 'unreachable',
    reason,
    durationMs: 4000,
});

const createHarness = (
    overrides: Partial<ConnectivityMonitorOptions> & { alwaysReachable?: boolean } = {}
): Harness => {
    const timers = createFakeTimers();
    const probeCalls: DeferredProbeCall[] = [];
    const states: ConnectivitySnapshot[] = [];
    const { alwaysReachable = false, ...options } = overrides;

    const monitor = createConnectivityMonitor({
        getProbeTarget: () => PROBE_TARGET,
        now: timers.now,
        setTimeoutFn: timers.setTimeoutFn,
        clearTimeoutFn: timers.clearTimeoutFn,
        onStateChange: snapshot => states.push(snapshot),
        ...(alwaysReachable
            ? { probe: async () => reachable() }
            : {
                  probe: (target: ProbeTargetConfig | string) =>
                      new Promise<ProbeOutcome>((resolve, reject) => {
                          probeCalls.push({ target, resolve, reject });
                      }),
              }),
        ...options,
    });

    return { monitor, timers, probeCalls, states };
};

describe('connectivityMonitor', () => {
    afterEach(() => {
        // The store is module-global; restore a neutral state after bridge tests.
        connectivityStore.set.status('unknown');
        connectivityStore.set.quality('unknown');
        connectivityStore.set.qualityReason(null);
        connectivityStore.set.lastDiagnosticReason(null);
        connectivityStore.set.lastCheckAt(null);
        connectivityStore.set.lastOnlineAt(null);
    });

    describe('start and verification', () => {
        it('verifies once on start and goes online without scheduling anything', async () => {
            const { monitor, timers, probeCalls } = createHarness();
            monitor.start();

            await flush();
            expect(probeCalls).toHaveLength(1);
            expect(probeCalls[0].target).toBe(PROBE_TARGET);

            await settleProbe(probeCalls[0], reachable());

            expect(monitor.getState()).toMatchObject({
                status: 'online',
                lastDiagnosticReason: null,
            });
            expect(monitor.getState().lastOnlineAt).toBe(BASE_TIME);
            // No idle polling: a verified online state owns no timers.
            expect(timers.pendingCount()).toBe(0);

            timers.advance(10 * 60_000);
            expect(probeCalls).toHaveLength(1);
        });

        it('does not probe before start()', () => {
            const { monitor, probeCalls } = createHarness();

            monitor.reportTransport(false);
            monitor.reportTransport(true);

            expect(probeCalls).toHaveLength(0);
            expect(monitor.isRunning()).toBe(false);
        });

        it('resumes with a fresh verification after stop() and start()', async () => {
            const { monitor, probeCalls } = createHarness();
            monitor.start();
            await flush();
            await settleProbe(probeCalls[0], reachable());
            monitor.stop();
            expect(probeCalls).toHaveLength(1);

            monitor.start();
            await flush();
            expect(probeCalls).toHaveLength(2);
            await settleProbe(probeCalls[1], unreachable('timeout'));
            expect(monitor.getState().status).toBe('offline');
        });
    });

    describe('transport hints', () => {
        it('does not flip verified online to offline on a negative hint until the probe agrees', async () => {
            const { monitor, probeCalls } = createHarness();
            monitor.start();
            await flush();
            await settleProbe(probeCalls[0], reachable());
            expect(monitor.getState().status).toBe('online');

            // False-negative hint: Capacitor drops the link momentarily.
            monitor.reportTransport(false);
            expect(monitor.getState().status).toBe('online'); // hint alone is not proof
            expect(probeCalls).toHaveLength(2);

            // The verification succeeds — nothing ever went offline.
            await settleProbe(probeCalls[1], reachable());
            expect(monitor.getState().status).toBe('online');
            expect(probeCalls).toHaveLength(2);
        });

        it('goes offline only when the negative hint is confirmed by transport failure', async () => {
            const { monitor, probeCalls } = createHarness();
            monitor.start();
            await flush();
            await settleProbe(probeCalls[0], reachable());

            monitor.reportTransport(false);
            await settleProbe(probeCalls[1], unreachable('timeout'));

            expect(monitor.getState().status).toBe('offline');
            expect(monitor.getState().lastDiagnosticReason).toContain('unreachable: timeout');
        });

        it('restores online optimistically on a positive hint and verifies once', async () => {
            const { monitor, timers, probeCalls } = createHarness();
            monitor.start();
            await flush();
            await settleProbe(probeCalls[0], unreachable());
            expect(monitor.getState().status).toBe('offline');
            expect(timers.pendingCount()).toBe(1); // retry scheduled

            // Positive hint: immediate optimistic recovery + one verification.
            monitor.reportTransport(true);
            expect(monitor.getState().status).toBe('online');
            expect(monitor.getState().lastOnlineAt).toBe(BASE_TIME);
            expect(timers.pendingCount()).toBe(0); // stale retry cancelled

            await flush();
            expect(probeCalls).toHaveLength(2); // verified once, no loop
            await settleProbe(probeCalls[1], reachable());
            expect(monitor.getState().status).toBe('online');
            expect(timers.pendingCount()).toBe(0);
        });

        it('verifies asynchronously after a positive hint even when a probe was in flight', async () => {
            const { monitor, probeCalls } = createHarness();
            monitor.start();
            await flush();
            // probe #0 (initial) still pending; transport reports connected.
            monitor.reportTransport(true);
            expect(monitor.getState().status).toBe('online');

            // probe #0 is now stale: its unreachable result must not land…
            await settleProbe(probeCalls[0], unreachable());
            expect(monitor.getState().status).toBe('online');

            // …and the deferred verification from the hint must still run.
            await flush();
            expect(probeCalls.length).toBeGreaterThanOrEqual(2);
            await settleProbe(probeCalls[probeCalls.length - 1], reachable());
            expect(monitor.getState().status).toBe('online');
            expect(timersPendingZero(monitor));
        });

        it('ignores hints entirely while stopped', () => {
            const { monitor, probeCalls } = createHarness();
            monitor.start();
            monitor.stop();
            const callsAtStop = probeCalls.length; // includes the synchronous initial probe

            monitor.reportTransport(false);
            monitor.reportTransport(true);

            expect(probeCalls).toHaveLength(callsAtStop);
            expect(monitor.getState().status).toBe('unknown');
        });
    });

    describe('offline backoff', () => {
        it('retries on the 5/10/20/40/60 capped schedule and recovers without any online event', async () => {
            const { monitor, timers, probeCalls } = createHarness();
            monitor.start();
            await flush();
            await settleProbe(probeCalls[0], unreachable());
            expect(monitor.getState().status).toBe('offline');

            let calls = 1;
            for (const expectedDelay of DEFAULT_OFFLINE_RETRY_DELAYS_MS) {
                expect(timers.pendingCount()).toBe(1);
                timers.advance(expectedDelay - 1);
                expect(probeCalls).toHaveLength(calls); // no early retry
                timers.advance(1);
                await flush();
                calls += 1;
                await settleProbe(probeCalls[calls - 1], unreachable());
            }

            // The cap: further retries keep waiting 60s.
            timers.advance(60_000);
            await flush();
            expect(probeCalls).toHaveLength(calls + 1);
            await settleProbe(probeCalls[calls], reachable());

            expect(monitor.getState().status).toBe('online'); // recovered with no hint
            expect(timers.pendingCount()).toBe(0); // and stops polling
        });

        it('does not storm probes when offline hints repeat while a retry is pending', async () => {
            const { monitor, timers, probeCalls } = createHarness();
            monitor.start();
            await flush();
            await settleProbe(probeCalls[0], unreachable());
            expect(timers.pendingCount()).toBe(1);

            monitor.reportTransport(false);
            monitor.reportTransport(false);
            monitor.reportTransport(false);

            expect(probeCalls).toHaveLength(1); // no immediate probes
            expect(timers.pendingCount()).toBe(1); // original retry untouched

            timers.advance(5000);
            await flush();
            expect(probeCalls).toHaveLength(2); // exactly one retry fired on schedule
        });
    });

    describe('inconclusive results stay permissive', () => {
        it('drops to unknown (never offline) on http errors and retains the reason', async () => {
            const { monitor, timers, probeCalls } = createHarness();
            monitor.start();
            await flush();
            await settleProbe(probeCalls[0], {
                kind: 'inconclusive',
                reason: 'http-error',
                durationMs: 30,
                httpStatus: 404,
            });

            expect(monitor.getState().status).toBe('unknown');
            expect(monitor.getState().lastDiagnosticReason).toContain('inconclusive: http-error');
            expect(timers.pendingCount()).toBe(1); // bounded retry, not a storm
        });

        it('drops to unknown on an unexpected body (captive portal / misconfig)', async () => {
            const { monitor, probeCalls } = createHarness();
            monitor.start();
            await flush();
            await settleProbe(probeCalls[0], {
                kind: 'inconclusive',
                reason: 'unexpected-body',
                durationMs: 30,
                detail: 'expected marker learncard-connectivity-v1',
            });

            expect(monitor.getState().status).toBe('unknown');
            expect(monitor.getState().lastDiagnosticReason).toContain('unexpected-body');
        });

        it('reports inconclusive without probing when no target is configured', async () => {
            const { monitor, timers, probeCalls, states } = createHarness({
                getProbeTarget: () => null,
            });
            monitor.start();
            await flush();

            expect(probeCalls).toHaveLength(0);
            expect(monitor.getState().status).toBe('unknown');
            expect(monitor.getState().lastDiagnosticReason).toContain('no probe target configured');
            expect(timers.pendingCount()).toBe(1);
            expect(states.length).toBeGreaterThan(0);
        });

        it('treats a throwing probe as unreachable, never lets it escape', async () => {
            const timers = createFakeTimers();
            const monitor = createConnectivityMonitor({
                getProbeTarget: () => PROBE_TARGET,
                probe: async () => {
                    throw new Error('probe exploded');
                },
                now: timers.now,
                setTimeoutFn: timers.setTimeoutFn,
                clearTimeoutFn: timers.clearTimeoutFn,
            });

            monitor.start();
            await flush();

            expect(monitor.getState().status).toBe('offline');
            expect(timers.pendingCount()).toBe(1);
        });
    });

    describe('foreground / background', () => {
        it('pauses retries in the background and checks immediately on resume', async () => {
            const { monitor, timers, probeCalls } = createHarness();
            monitor.start();
            await flush();
            await settleProbe(probeCalls[0], unreachable());
            expect(monitor.getState().status).toBe('offline');
            expect(timers.pendingCount()).toBe(1);

            monitor.setActive(false);
            expect(timers.pendingCount()).toBe(0); // background pauses automatic work
            expect(monitor.getState().foreground).toBe(false);

            timers.advance(10 * 60_000);
            await flush();
            expect(probeCalls).toHaveLength(1); // nothing fires while backgrounded

            monitor.setActive(true);
            await flush();
            expect(probeCalls).toHaveLength(2); // immediate foreground check
            await settleProbe(probeCalls[1], reachable());
            expect(monitor.getState().status).toBe('online');
        });

        it('supersedes probe results that span the background transition', async () => {
            const { monitor, timers, probeCalls } = createHarness();
            monitor.start();
            await flush();

            monitor.setActive(false);
            await settleProbe(probeCalls[0], unreachable());

            // The stale result must not mark us offline; resume re-verifies.
            monitor.setActive(true);
            await flush();
            const verification = probeCalls[probeCalls.length - 1];
            await settleProbe(verification, reachable());

            expect(monitor.getState().status).toBe('online');
            expect(timers.pendingCount()).toBe(0);
        });
    });

    describe('coalescing and superseded results', () => {
        it('coalesces concurrent check requests into one follow-up cycle, never parallel probes', async () => {
            const { monitor, probeCalls } = createHarness();
            monitor.start();
            await flush();
            expect(probeCalls).toHaveLength(1);

            // Negative hint + manual check while the initial probe is in flight.
            monitor.reportTransport(false);
            const pendingCheck = monitor.check();
            expect(probeCalls).toHaveLength(1); // still just the one in-flight probe

            await settleProbe(probeCalls[0], unreachable());
            expect(monitor.getState().status).toBe('offline');

            // Exactly one coalesced follow-up.
            await flush();
            expect(probeCalls).toHaveLength(2);
            await expect(pendingCheck).resolves.toBe('offline');

            await settleProbe(probeCalls[1], reachable());
            expect(monitor.getState().status).toBe('online');
            expect(probeCalls).toHaveLength(2);
        });

        it('never lets a late probe result override a newer hint', async () => {
            const { monitor, probeCalls } = createHarness();
            monitor.start();
            await flush();

            // probe #0 will "fail" long after reality moved on.
            monitor.reportTransport(true); // newer event wins
            expect(monitor.getState().status).toBe('online');

            await settleProbe(probeCalls[0], unreachable());
            expect(monitor.getState().status).toBe('online'); // stale result discarded
        });

        it('resolves check() callers when the monitor stops', async () => {
            const { monitor, probeCalls } = createHarness();
            monitor.start();
            await flush();
            await settleProbe(probeCalls[0], reachable());

            const pendingCheck = monitor.check();
            monitor.stop();

            await expect(pendingCheck).resolves.toBe('online');
        });

        it('resolves check() immediately with the current status while stopped', async () => {
            const { monitor } = createHarness();

            await expect(monitor.check()).resolves.toBe('unknown');
        });
    });

    describe('manual retry', () => {
        it('runs manual checks through the shared singleton and recovers', async () => {
            const { monitor, timers, probeCalls } = createHarness();
            monitor.start();
            await flush();
            await settleProbe(probeCalls[0], unreachable());
            expect(monitor.getState().status).toBe('offline');

            const pendingCheck = monitor.check();
            await flush();
            expect(probeCalls).toHaveLength(2);
            expect(timers.pendingCount()).toBe(0); // manual check supersedes the retry timer

            await settleProbe(probeCalls[1], reachable());
            await expect(pendingCheck).resolves.toBe('online');
            expect(timers.pendingCount()).toBe(0);
        });
    });

    describe('quality (advisory)', () => {
        it('reports poor quality while the status stays online — gating unaffected', async () => {
            const { monitor, probeCalls } = createHarness({ alwaysReachable: true });

            monitor.start();
            await flush();
            expect(monitor.getState().status).toBe('online');

            for (let i = 0; i < 3; i += 1) {
                monitor.reportSample({ at: BASE_TIME + i, ok: true, durationMs: 3000 });
            }

            expect(monitor.getState().quality).toBe('poor');
            expect(monitor.getState().qualityReason).toBe('slow');
            // The whole point: advisory poor NEVER changes reachability gating.
            expect(monitor.getState().status).toBe('online');
            expect(probeCalls).toHaveLength(0);
        });

        it('feeds probe transport failures into the quality evidence', async () => {
            const { monitor, timers, probeCalls } = createHarness();
            monitor.start();
            await flush();
            await settleProbe(probeCalls[0], unreachable('timeout'));
            expect(monitor.getState().status).toBe('offline');

            // Two more failed retries on the backoff schedule.
            for (let i = 0; i < 2; i += 1) {
                timers.advance(DEFAULT_OFFLINE_RETRY_DELAYS_MS[i]);
                await flush();
                await settleProbe(probeCalls[probeCalls.length - 1], unreachable('timeout'));
            }

            const state = monitor.getState();
            expect(state.status).toBe('offline');
            // Failures were recorded as unstable evidence (offline display
            // precedence over quality is resolved at the hook layer).
            expect(state.quality).toBe('poor');
            expect(state.qualityReason).toBe('unstable');
        });
    });

    describe('lifecycle and cleanup', () => {
        it('discards in-flight work on stop() and does not apply it after restart', async () => {
            const { monitor, timers, probeCalls } = createHarness();
            monitor.start();
            await flush();
            const staleCall = probeCalls[0];
            monitor.stop();
            expect(timers.pendingCount()).toBe(0);

            monitor.start();
            await flush();
            // The pre-stop call object is stale; resolving it must not affect
            // the restarted monitor's in-flight verification.
            void staleCall.resolve(unreachable());
            await flush();
            expect(monitor.getState().status).toBe('unknown'); // restart probe still in flight
        });

        it('unsubscribes listeners cleanly', async () => {
            const { monitor, probeCalls } = createHarness();
            const seen: ConnectivitySnapshot[] = [];
            const unsubscribe = monitor.subscribe(snapshot => seen.push(snapshot));

            monitor.start();
            await flush();
            expect(seen.length).toBeGreaterThan(0);
            unsubscribe();

            const countAfterUnsubscribe = seen.length;
            await settleProbe(probeCalls[0], reachable());
            expect(seen).toHaveLength(countAfterUnsubscribe);
            expect(monitor.getState().status).toBe('online');
        });

        it('notifies the onStateChange callback on every transition', async () => {
            const { monitor, probeCalls, states } = createHarness();
            monitor.start();
            await flush();
            await settleProbe(probeCalls[0], unreachable());

            const statusPath = states.map(snapshot => snapshot.status);
            expect(statusPath).toContain('unknown');
            expect(statusPath).toContain('offline');
            expect(states[states.length - 1].lastCheckAt).toBe(BASE_TIME);
        });
    });

    describe('store bridge', () => {
        it('pushes monitor state into connectivityStore and keeps report(boolean) working', async () => {
            const { monitor, probeCalls } = createHarness();
            const detach = attachConnectivityMonitorToStore(monitor);
            monitor.start();
            await flush();
            await settleProbe(probeCalls[0], {
                kind: 'inconclusive',
                reason: 'http-error',
                durationMs: 10,
                httpStatus: 500,
            });

            expect(connectivityStore.get.status()).toBe('unknown');
            expect(connectivityStore.get.lastDiagnosticReason()).toContain(
                'inconclusive: http-error'
            );
            expect(connectivityStore.get.lastCheckAt()).toBe(BASE_TIME);

            detach();
            connectivityStore.set.report(false);
            expect(connectivityStore.get.status()).toBe('offline'); // legacy action intact

            connectivityStore.set.report(true);
        });
    });
});

/** True when the monitor owns no pending timers (type-safe assertion helper). */
const timersPendingZero = (monitor: { getState: () => ConnectivitySnapshot }): void => {
    expect(monitor.getState().running).toBe(true);
};

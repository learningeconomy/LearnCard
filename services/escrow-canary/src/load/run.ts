import { EMAILS_PER_PIN_RECOVERY, scheduleArrivals, type Arrival, type LoadPlan } from './plan';
import { loadReason } from './reasons';
import { runOpenLoop, type ScheduleDeps } from './schedule';
import {
    enrol,
    pinRecovery,
    pinSetup,
    type LoadStep,
    type PinUser,
    type ScenarioDeps,
    type SyntheticUser,
} from './scenarios';
import { Recorder, type DropReason } from './stats';
import { syntheticEmail, type AdminAuth, type RunAddress } from './identity';
import { LoadError } from './errors';

/**
 * Orchestrates one load run:
 *
 * 1. **setup** (not part of the measured stages): create every Firebase user the
 *    plan needs at `setupRate` (each recorded in the run manifest right after
 *    `createUser`), and prepare the PIN pool (`pinSetup`). Account
 *    creation is not part of the user flows being measured, so it is kept out of
 *    the stage numbers and cannot become an artificial first bottleneck.
 * 2. **stages**: open-loop arrivals. `enrol` takes the next fresh user;
 *    `pin` leases a free PIN-pool user (one operation per user at a time, since
 *    the server allows one pending PIN hold per account). A user whose PIN
 *    recovery fails is retired rather than reused, except when the server
 *    refused the START with a 429 (no hold was created): that user goes back to
 *    the pool.
 *
 * Stops scheduling (remaining arrivals counted as dropped/stopped) on operator
 * interrupt, on a fatal token guard, or when a stage's failure ratio exceeds
 * `stopErrorRate` after 20 completions (client-IP throttling is not counted as
 * failure). A fatal guard or interrupt raised by an operation still in flight
 * when the stages end is recorded too.
 */
export interface RunOptions {
    plan: LoadPlan;
    address: RunAddress;
    pinRatio: number;
    enrolWithPin: boolean;
    /** Explicit opt-in (`enableEscrowRecovery`) instead of the app's automatic enrolment. */
    enrolOptIn?: boolean;
    /** Re-set the same PIN after each PIN recovery, as the canary does. */
    resetPinAfterRecovery?: boolean;
    maxInFlight: number;
    lateMs: number;
    setupRate: number;
    progressSec: number;
    stopErrorRate: number;
}

export interface RunDeps extends Omit<ScenarioDeps, 'time' | 'customToken'>, ScheduleDeps {
    admin: Pick<AdminAuth, 'createUser' | 'createCustomToken'>;
    /**
     * Durably records a created user in the run manifest (the only cleanup
     * source) before it is used. A throw stops the run (`fatal_manifest_write`).
     */
    recordUser(user: { uid: string; email: string }): void;
    out(line: string): void;
    /** Repeating timer; returns a cancel function. */
    every(ms: number, callback: () => void): () => void;
}

export interface StopSignal {
    requested: boolean;
}

interface SetupItem {
    n: number;
    atMs: number;
    /** PIN-pool user (prepared with a PIN) rather than a fresh user for an enrol arrival. */
    pool: boolean;
}

/**
 * A token for the wrong project/user means the guards were bypassed; a user that
 * cannot be recorded in the manifest could not be cleaned up: stop everything.
 */
const FATAL = new Set(['token_project', 'token_issuer', 'token_email', 'manifest_write']);

export const runLoad = async (
    options: RunOptions,
    deps: RunDeps,
    stop: StopSignal
): Promise<Record<string, unknown>> => {
    const { plan } = options;
    const recorder = new Recorder([
        {
            label: 'setup',
            targetRate: options.setupRate,
            durationSec: Math.ceil(plan.users / options.setupRate),
            scheduled: plan.users,
        },
        ...plan.stages.map((stage, index) => ({
            label: `s${index + 1}`,
            targetRate: stage.rate,
            durationSec: stage.durationSec,
            scheduled: scheduleArrivals([stage], 0).length,
        })),
    ]);
    let stopReason: string | null = null;
    let fatal: string | null = null;
    let current = 0;
    let inFlight = 0;
    const started = deps.now();
    const freshUsers: SyntheticUser[] = [];
    const freePin: PinUser[] = [];
    let pinPrepared = 0;
    let pinRetired = 0;
    let pinStarted = 0;
    let pinStartRefused = 0;

    const scenarioDeps = (stage: number): ScenarioDeps => ({
        ...deps,
        customToken: uid => deps.admin.createCustomToken(uid),
        time: async <T>(step: LoadStep, operation: () => Promise<T>): Promise<T> => {
            const begin = deps.now();
            try {
                const value = await operation();
                recorder.step(stage, step, deps.now() - begin);
                return value;
            } catch (error) {
                recorder.step(stage, step, deps.now() - begin, loadReason(error));
                throw error;
            }
        },
    });

    /** Runs one scenario, recording its total latency and outcome. */
    const measured = async <T>(
        stage: number,
        name: string,
        operation: (deps: ScenarioDeps) => Promise<T>
    ): Promise<{ ok: true; value: T } | { ok: false; noHold: boolean }> => {
        recorder.started(stage);
        inFlight += 1;
        const begin = deps.now();
        try {
            const value = await operation(scenarioDeps(stage));
            recorder.scenario(stage, name, deps.now() - begin);
            return { ok: true, value };
        } catch (error) {
            const reason = loadReason(error);
            recorder.scenario(stage, name, deps.now() - begin, reason);
            if (FATAL.has(reason)) {
                fatal = reason;
                stop.requested = true;
            }
            return { ok: false, noHold: error instanceof LoadError && !!error.detail.noHold };
        } finally {
            inFlight -= 1;
        }
    };

    const createUser = async (scenario: ScenarioDeps, n: number): Promise<SyntheticUser> => {
        const email = syntheticEmail(options.address, n);
        const { uid } = await scenario.time('createUser', () =>
            deps.admin.createUser({ email, emailVerified: true })
        );
        try {
            deps.recordUser({ uid, email });
        } catch {
            throw new LoadError('manifest_write');
        }
        return { n, email, uid };
    };

    const shouldStop = (stage: number): boolean => {
        if (stop.requested) {
            stopReason ??= fatal ? `fatal_${fatal}` : 'interrupted';
            return true;
        }
        if (recorder.errorRate(stage) > options.stopErrorRate) {
            stopReason ??= `error_rate_${stage === 0 ? 'setup' : `s${stage}`}`;
            stop.requested = true;
            return true;
        }
        return false;
    };
    const dropped = (stage: number) => (_item: unknown, reason: DropReason) =>
        recorder.dropped(stage, reason);

    const cancelProgress =
        options.progressSec > 0
            ? deps.every(options.progressSec * 1000, () =>
                  deps.out(recorder.progressLine(current, inFlight, (deps.now() - started) / 1000))
              )
            : () => undefined;

    try {
        // 1. Setup: PIN pool first, then the fresh users for enrol arrivals.
        const setupItems: SetupItem[] = Array.from({ length: plan.users }, (_, n) => ({
            n,
            atMs: (n * 1000) / options.setupRate,
            pool: n < plan.pinPool,
        }));
        await runOpenLoop<SetupItem>(
            setupItems,
            { maxInFlight: options.maxInFlight, lateMs: options.lateMs },
            deps,
            {
                start: async item => {
                    if (item.pool) {
                        const result = await measured(0, 'pinSetup', async scenario =>
                            pinSetup(scenario, await createUser(scenario, item.n))
                        );
                        if (result.ok) {
                            freePin.push(result.value);
                            pinPrepared += 1;
                        }
                        return;
                    }
                    const result = await measured(0, 'createUser', scenario =>
                        createUser(scenario, item.n)
                    );
                    if (result.ok) freshUsers.push(result.value);
                },
                dropped: dropped(0),
                late: (_item, ms) => recorder.late(0, ms),
                shouldStop: () => shouldStop(0),
            }
        );
        if (plan.pinOps > 0 && freePin.length === 0 && !stop.requested) {
            stopReason = 'pin_pool_empty';
            stop.requested = true;
        }

        // 2. Measured stages.
        const arrivals = scheduleArrivals(plan.stages, options.pinRatio);
        await runOpenLoop<Arrival>(
            arrivals,
            { maxInFlight: options.maxInFlight, lateMs: options.lateMs },
            deps,
            {
                start: async arrival => {
                    const stage = arrival.stage + 1;
                    if (arrival.kind === 'pin') {
                        const user = freePin.shift();
                        if (!user) {
                            recorder.dropped(stage, 'pin_pool_busy');
                            return;
                        }
                        pinStarted += 1;
                        const result = await measured(stage, 'pinRecovery', scenario =>
                            pinRecovery(scenario, user, {
                                resetPin: options.resetPinAfterRecovery,
                            })
                        );
                        if (result.ok) freePin.push(user);
                        else if (result.noHold) {
                            pinStartRefused += 1;
                            freePin.push(user);
                        } else pinRetired += 1;
                        return;
                    }
                    const user = freshUsers.shift();
                    if (!user) {
                        recorder.dropped(stage, 'no_user');
                        return;
                    }
                    const result = await measured(stage, 'enrol', scenario =>
                        enrol(scenario, user, {
                            withPin: options.enrolWithPin,
                            optIn: options.enrolOptIn,
                        })
                    );
                    if (result.ok && result.value) freePin.push(result.value);
                },
                dropped: (arrival, reason) => recorder.dropped(arrival.stage + 1, reason),
                late: (arrival, ms) => recorder.late(arrival.stage + 1, ms),
                shouldStop: arrival => {
                    current = arrival.stage + 1;
                    return shouldStop(current);
                },
            }
        );
    } finally {
        cancelProgress();
    }
    // An operation still in flight after the last start can hit the token guard, and
    // Ctrl-C can arrive while waiting for it: neither went through `shouldStop`.
    if (fatal) stopReason = `fatal_${fatal}`;
    else if (stop.requested) stopReason ??= 'interrupted';

    return {
        runId: options.address.runId,
        stopped: stopReason,
        plan: {
            arrivals: plan.arrivals,
            enrolOps: plan.enrolOps,
            pinOps: plan.pinOps,
            pinPool: plan.pinPool,
            users: plan.users,
            durationSec: plan.durationSec,
        },
        pinPool: {
            prepared: pinPrepared,
            retired: pinRetired,
            returnedAfterStartRefused: pinStartRefused,
            free: freePin.length,
        },
        emails: {
            plannedExpected: plan.expectedEmails,
            plannedUpperBound: plan.maxEmails,
            pinRecoveriesStarted: pinStarted,
            pinStartsRefused: pinStartRefused,
            // A start refused with 429 created no hold, so sent no notice.
            estimatedSent: (pinStarted - pinStartRefused) * EMAILS_PER_PIN_RECOVERY,
        },
        stages: recorder.summary(),
    };
};

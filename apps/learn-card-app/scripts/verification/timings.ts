import { writeFile } from 'node:fs/promises';

export type TimingPhase =
    | 'preflight'
    | 'build'
    | 'prepare'
    | 'compose'
    | 'readiness'
    | 'startup'
    | 'catalog'
    | 'teardown'
    | 'command-total'
    | 'stack-reuse-check'
    | 'session-reuse-check'
    | 'bootstrap'
    | 'bootstrap-browser-launch'
    | 'bootstrap-harness-setup'
    | 'bootstrap-learner-sign-in'
    | 'bootstrap-learner-reload'
    | 'bootstrap-learner-evidence'
    | 'bootstrap-recipient-sign-in'
    | 'bootstrap-recipient-reload'
    | 'bootstrap-recipient-evidence'
    | 'bootstrap-evidence-close'
    | 'bootstrap-browser-close'
    | 'post-bootstrap-doctor'
    | 'catalog-stack-check'
    | 'catalog-browser-launch'
    | 'script-stack-check'
    | 'script-load'
    | 'script-browser-launch'
    | 'script-harness-setup'
    | 'script-execution'
    | 'script-evidence-close'
    | 'command-cleanup';

export type TimingStatus = 'running' | 'passed' | 'failed' | 'interrupted';
export type FinishTiming = (status: Exclude<TimingStatus, 'running'>) => Promise<void>;

interface PhaseTiming {
    phase: TimingPhase;
    status: TimingStatus;
    durationMs: number | null;
}

/** Persist each boundary, including failures, without copying command output or credentials. */
export const createTimings = (path: string, completed: readonly PhaseTiming[] = []) => {
    const timings: PhaseTiming[] = [...completed];
    let initialized = false;
    let unavailable = false;
    const save = async (): Promise<void> => {
        if (unavailable) return;
        try {
            await writeFile(path, `${JSON.stringify(timings, null, 2)}\n`, {
                mode: 0o600,
                flag: initialized ? 'w' : 'wx',
            });
            initialized = true;
        } catch {
            unavailable = true;
            // Timing output is diagnostic: never prevent an action or hide its real error.
            console.error(
                '[lc verify] Phase timings could not be saved; continuing without timing updates.'
            );
        }
    };
    const start = async (phase: TimingPhase): Promise<FinishTiming> => {
        const timing: PhaseTiming = { phase, status: 'running', durationMs: null };
        timings.push(timing);
        await save();
        const started = performance.now();
        return async status => {
            timing.status = status;
            timing.durationMs = Math.round(performance.now() - started);
            await save();
        };
    };
    const measure = async <T>(phase: TimingPhase, action: () => Promise<T>): Promise<T> => {
        const finish = await start(phase);
        try {
            const result = await action();
            await finish('passed');
            return result;
        } catch (error) {
            await finish('failed');
            throw error;
        }
    };
    return Object.assign(measure, { start });
};

export type TimingRecorder = ReturnType<typeof createTimings>;

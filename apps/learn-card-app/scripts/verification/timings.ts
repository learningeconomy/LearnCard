import { writeFile } from 'node:fs/promises';

export type TimingPhase =
    | 'preflight'
    | 'build'
    | 'prepare'
    | 'compose'
    | 'readiness'
    | 'startup'
    | 'catalog'
    | 'teardown';

interface PhaseTiming {
    phase: TimingPhase;
    status: 'running' | 'passed' | 'failed';
    durationMs: number | null;
}

/** Persist each boundary, including failures, without copying command output or credentials. */
export const createTimings = (path: string) => {
    const timings: PhaseTiming[] = [];
    let initialized = false;
    const save = async (): Promise<void> => {
        await writeFile(path, `${JSON.stringify(timings, null, 2)}\n`, {
            mode: 0o600,
            flag: initialized ? 'w' : 'wx',
        });
        initialized = true;
    };
    return async <T>(phase: TimingPhase, action: () => Promise<T>): Promise<T> => {
        const timing: PhaseTiming = { phase, status: 'running', durationMs: null };
        timings.push(timing);
        await save();
        const started = performance.now();
        try {
            const result = await action();
            timing.status = 'passed';
            return result;
        } catch (error) {
            timing.status = 'failed';
            throw error;
        } finally {
            timing.durationMs = Math.round(performance.now() - started);
            await save();
        }
    };
};

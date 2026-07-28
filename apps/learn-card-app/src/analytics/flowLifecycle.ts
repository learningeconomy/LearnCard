import { newFlowId } from './sharedContext';

export interface FlowLifecycle {
    readonly id: string;
    readonly startedAt: number;
    hasTerminated(): boolean;
    durationMs(): number;
    /**
     * Claims the single terminal slot for this flow. Returns `true`
     * exactly once; callers skip firing their terminal event on `false`.
     */
    terminate(): boolean;
}

/**
 * Enforces the funnel invariant: one `*_started` → exactly one terminal
 * (`succeeded` / `failed` / `cancelled`) per flow_id. Create it when the
 * user triggers the flow, guard every terminal track call with
 * `terminate()`.
 */
export const createFlowLifecycle = (id: string = newFlowId()): FlowLifecycle => {
    const startedAt = Date.now();
    let terminated = false;

    return {
        id,
        startedAt,
        hasTerminated: () => terminated,
        durationMs: () => Date.now() - startedAt,
        terminate: () => {
            if (terminated) return false;
            terminated = true;
            return true;
        },
    };
};

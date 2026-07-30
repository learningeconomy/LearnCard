/**
 * useHistory — React wrapper around the pure `historyReducer` ops.
 *
 * Usage:
 *
 *   const { commit, undo, redo, canUndo, canRedo } = useHistory(
 *     activePathway,
 *     pathwayStore.set.upsertPathway,
 *     { idKey: activePathway?.id ?? null },
 *   );
 *
 *   // Replace all direct calls to `pathwayStore.set.upsertPathway`
 *   // with `commit(next)` so every author action is undoable.
 *
 * ## Why refs + manual state split
 *
 * The reducer is pure and returns `{ state, applied }`. The "applied"
 * side effect (writing to the store) must happen once per user
 * action; running it inside a `setState` callback is fragile under
 * React's strict mode double-invocation.
 *
 * We therefore:
 *
 *   - Keep the stack state in a ref so we can read-and-write without
 *     a stale-closure hazard.
 *
 *   - Maintain a separate `{ canUndo, canRedo }` useState purely for
 *     render triggering. Setting it is idempotent (same booleans
 *     produce same state), so strict-mode double-invocation is a
 *     no-op.
 *
 *   - Call `apply(result.applied)` synchronously *outside* the
 *     setter, once per user action. Exactly-once under strict mode.
 *
 * ## Reset-on-pathway-change
 *
 * History is per-pathway-session. When `idKey` changes (author
 * switches active pathway), the stacks are cleared so undo doesn't
 * teleport you into another pathway's edit history. Pass
 * `activePathway?.id ?? null` as `idKey`.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import {
    DEFAULT_MAX_HISTORY,
    commit as commitOp,
    emptyHistoryState,
    redo as redoOp,
    undo as undoOp,
    type HistoryState,
} from './historyReducer';

export interface UseHistoryResult<T> {
    commit: (next: T) => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
}

export interface UseHistoryOptions {
    maxDepth?: number;
    /**
     * Key that, when changed, clears the history. Typically the
     * active pathway's id. `null` when there's no active pathway.
     */
    idKey?: string | null;
}

export function useHistory<T>(
    current: T | null,
    apply: (value: T) => void,
    options: UseHistoryOptions = {},
): UseHistoryResult<T> {
    const { maxDepth = DEFAULT_MAX_HISTORY, idKey = null } = options;

    // Stacks live in a ref — mutations are synchronous and we never
    // want stale-closure reads. Render is triggered via the `can`
    // booleans below.
    const stateRef = useRef<HistoryState<T>>(emptyHistoryState<T>());

    // Latest `apply` + `current` via refs so our callback identities
    // don't churn every render.
    const applyRef = useRef(apply);
    const currentRef = useRef(current);

    useEffect(() => {
        applyRef.current = apply;
    }, [apply]);

    useEffect(() => {
        currentRef.current = current;
    }, [current]);

    // `can*` booleans drive re-renders. Setting to the same value is
    // idempotent so strict-mode double-invocation is a no-op.
    const [flags, setFlags] = useState({ canUndo: false, canRedo: false });

    const updateFlags = useCallback((next: HistoryState<T>) => {
        setFlags(prev => {
            const nextCanUndo = next.past.length > 0;
            const nextCanRedo = next.future.length > 0;

            if (prev.canUndo === nextCanUndo && prev.canRedo === nextCanRedo) {
                return prev;
            }

            return { canUndo: nextCanUndo, canRedo: nextCanRedo };
        });
    }, []);

    // Reset stacks whenever the active pathway changes. Avoids
    // teleporting the author into another pathway's edit history.
    useEffect(() => {
        stateRef.current = emptyHistoryState<T>();
        updateFlags(stateRef.current);
    }, [idKey, updateFlags]);

    const commit = useCallback(
        (next: T) => {
            const result = commitOp(
                stateRef.current,
                currentRef.current,
                next,
                maxDepth,
            );

            stateRef.current = result.state;

            if (result.applied !== null) {
                applyRef.current(result.applied);
            }

            updateFlags(result.state);
        },
        [maxDepth, updateFlags],
    );

    const undo = useCallback(() => {
        const result = undoOp(stateRef.current, currentRef.current);

        stateRef.current = result.state;

        if (result.applied !== null) {
            applyRef.current(result.applied);
        }

        updateFlags(result.state);
    }, [updateFlags]);

    const redo = useCallback(() => {
        const result = redoOp(stateRef.current, currentRef.current);

        stateRef.current = result.state;

        if (result.applied !== null) {
            applyRef.current(result.applied);
        }

        updateFlags(result.state);
    }, [updateFlags]);

    return {
        commit,
        undo,
        redo,
        canUndo: flags.canUndo,
        canRedo: flags.canRedo,
    };
}

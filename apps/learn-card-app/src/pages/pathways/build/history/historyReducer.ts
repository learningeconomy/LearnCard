/**
 * historyReducer — pure past/future stack operations for undo/redo.
 *
 * Generic over `T` so the same reducer drives any "edit and roll
 * back" surface (today: `Pathway`; tomorrow: whatever else). Kept
 * free of React so the invariants (bounded depth, identity-preserving
 * no-ops, single-direction stack moves) are directly testable.
 *
 * The reducer is split into three named operations rather than a
 * single `reduce(action)` switch because:
 *   - Each call site needs exactly one op; a switch adds a
 *     discriminator case with no payoff.
 *   - Per-op tests are clearer than one big table of inputs.
 *
 * ## Semantics
 *
 *   `commit(state, current, next)`
 *     Push `current` into the past stack, apply `next`.
 *     Clears future — any redo history is invalidated by a new edit.
 *     If `current === next`, treated as a no-op (no push, no apply);
 *     callers that use identity-preserving ops like
 *     `setDestinationNode(sameId)` don't pollute history with
 *     phantom transactions.
 *
 *   `undo(state, current)`
 *     Pop the most recent past entry, push `current` into future,
 *     apply the popped value. No-op if past is empty.
 *
 *   `redo(state, current)`
 *     Shift the oldest future entry, push `current` into past,
 *     apply the shifted value. No-op if future is empty.
 *
 * ## Return shape
 *
 * Each op returns `{ state, applied }`. `applied` is what the caller
 * should write to the underlying store; `null` means "no change,
 * don't write". This shape matches how React hooks typically thread
 * results through `useEffect` / commit points.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HistoryState<T> {
    past: T[];
    future: T[];
}

export interface HistoryResult<T> {
    state: HistoryState<T>;
    /** Value the caller should write. `null` means no change. */
    applied: T | null;
}

/**
 * Default bounded depth. 50 transactions is generous for author
 * sessions (typical workflow is a few dozen edits per sit-down)
 * without risking unbounded memory for pathways with large nested
 * subgraphs.
 */
export const DEFAULT_MAX_HISTORY = 50;

export const emptyHistoryState = <T>(): HistoryState<T> => ({
    past: [],
    future: [],
});

// ---------------------------------------------------------------------------
// commit
// ---------------------------------------------------------------------------

export const commit = <T>(
    state: HistoryState<T>,
    current: T | null,
    next: T,
    maxDepth: number = DEFAULT_MAX_HISTORY,
): HistoryResult<T> => {
    // Identity-preserving no-op: don't pollute the undo stack with
    // phantom transactions. Callers that used `setDestinationNode`
    // on the already-destination node (which returns the same
    // reference) correctly skip history here.
    if (current === next) {
        return { state, applied: null };
    }

    // First commit — no prior value to push. The future stack is
    // also cleared defensively; if it wasn't already empty, the
    // caller's "current" state is out of sync with history anyway.
    if (current === null) {
        return {
            state: { past: [], future: [] },
            applied: next,
        };
    }

    // Bounded depth: drop the oldest entries once we exceed maxDepth.
    // We keep the MOST RECENT maxDepth entries — losing the oldest
    // transactions is the right trade-off (you rarely want to undo
    // your first edit from two hours ago).
    const past = [...state.past, current].slice(-maxDepth);

    return {
        state: { past, future: [] },
        applied: next,
    };
};

// ---------------------------------------------------------------------------
// undo
// ---------------------------------------------------------------------------

export const undo = <T>(
    state: HistoryState<T>,
    current: T | null,
): HistoryResult<T> => {
    // Can't undo without a prior value or a current state to save.
    if (state.past.length === 0 || current === null) {
        return { state, applied: null };
    }

    const prev = state.past[state.past.length - 1];
    const newPast = state.past.slice(0, -1);
    const newFuture = [current, ...state.future];

    return {
        state: { past: newPast, future: newFuture },
        applied: prev,
    };
};

// ---------------------------------------------------------------------------
// redo
// ---------------------------------------------------------------------------

export const redo = <T>(
    state: HistoryState<T>,
    current: T | null,
): HistoryResult<T> => {
    if (state.future.length === 0 || current === null) {
        return { state, applied: null };
    }

    const [next, ...rest] = state.future;
    const newPast = [...state.past, current];

    return {
        state: { past: newPast, future: rest },
        applied: next,
    };
};

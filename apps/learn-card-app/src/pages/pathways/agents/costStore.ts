/**
 * costStore — persisted learner invocation ledger.
 *
 * Wraps the pure helpers in `costAccounting.ts` so callers don't have
 * to thread history around. Reads from localStorage via zustood's
 * `persist` option.
 *
 * When the brain-service proxy lands (Phase 3a/b), it will keep its own
 * authoritative ledger on the server side; this client ledger remains
 * useful for client-side throttling and the `learnerCost.snapshot`
 * telemetry event.
 */

import { createStore } from '@udecode/zustood';

import type { Capability } from '../types';

import {
    buildCostSnapshot,
    computeBudgetState,
    dailyInvocationsFor,
    monthToDateCents,
    recordInvocation as recordInvocationPure,
    type CostSnapshot,
    type InvocationEvent,
} from './costAccounting';

interface CostState {
    history: InvocationEvent[];
    /** ISO date string (YYYY-MM-DD) of the most recently emitted snapshot. */
    lastSnapshotDate: string | null;
}

const initialState: CostState = {
    history: [],
    lastSnapshotDate: null,
};

export const costStore = createStore('pathwaysCostStore')<CostState>(
    initialState,
    { persist: { name: 'pathwaysCostStore', enabled: true } },
).extendActions(set => ({
    recordInvocation: (event: InvocationEvent) => {
        set.state(draft => {
            draft.history = recordInvocationPure(draft.history, event);
        });
    },

    markSnapshotEmitted: (isoDate: string) => {
        set.lastSnapshotDate(isoDate);
    },
})).extendSelectors((state, get) => ({
    monthToDateCents: (now: string): number => monthToDateCents(get.history(), now),

    dailyInvocationsFor: (capability: Capability, now: string): number =>
        dailyInvocationsFor(get.history(), capability, now),

    budgetState: (input: {
        capability: Capability;
        projectedCostCents: number;
        tenantMonthToDateCents?: number;
        now: string;
    }) =>
        computeBudgetState({
            history: get.history(),
            ...input,
        }),

    snapshot: (learnerDid: string, now: string): CostSnapshot =>
        buildCostSnapshot(get.history(), learnerDid, now),
}));

export default costStore;

/**
 * Agent proxy — the single client-side seam for every capability
 * invocation.
 *
 * Responsibilities, in order:
 *   1. Estimate cost.
 *   2. Check the budget against the four caps (per-invocation,
 *      per-learner daily, per-learner monthly, per-tenant monthly).
 *   3. Dispatch to the provider (mock in Phase 3a; brain-service in
 *      3b+). One function signature for both — the `dispatch` strategy
 *      is injected, so swapping providers doesn't touch callers.
 *   4. Record the actual cost to the ledger.
 *   5. Store the proposal and emit telemetry.
 *
 * This is the *only* place on the client that actually invokes an
 * agent. Everything else either (a) reads proposals out of the store
 * or (b) asks this module to create one.
 */

import { AnalyticsEvents, type EventPayload } from '../../../analytics';
import { proposalStore } from '../../../stores/pathways';
import type { Capability, Pathway, Proposal } from '../types';

import { CAPABILITY_BUDGETS, decideBudget } from './budgets';
import { costStore } from './costStore';
import { runMockAgent, type MockAgentResult } from './mockAgent';

// -----------------------------------------------------------------
// Types
// -----------------------------------------------------------------

export interface InvokeRequest {
    capability: Capability;
    pathway: Pathway | null;
    ownerDid: string;
    /** ISO. Injectable for testing. */
    now?: string;
    /** Tenant-level month-to-date cents. Wired later; defaults to 0. */
    tenantMonthToDateCents?: number;
}

export type InvokeResult =
    | {
          ok: true;
          proposal: Proposal;
          costCents: number;
          latencyMs: number;
      }
    | {
          ok: false;
          cappedAt: 'per-invocation' | 'per-learner-daily' | 'per-learner-monthly' | 'per-tenant-monthly';
          reason: string;
      };

// -----------------------------------------------------------------
// Provider strategy — swap-ready for brain-service
// -----------------------------------------------------------------

export type AgentDispatch = (request: InvokeRequest) => Promise<MockAgentResult>;

/** Phase 3a default: scripted proposals, no network. */
const mockDispatch: AgentDispatch = async request => {
    return runMockAgent({
        capability: request.capability,
        pathway: request.pathway,
        ownerDid: request.ownerDid,
        now: request.now ?? new Date().toISOString(),
    });
};

// The active dispatch can be overridden at boot when the brain-service
// endpoint is configured. Everything in the app reaches agents through
// `invokeAgent`, so replacing this one reference flips the entire app
// over to real proposals with zero call-site churn.
let currentDispatch: AgentDispatch = mockDispatch;

export const setAgentDispatch = (dispatch: AgentDispatch): void => {
    currentDispatch = dispatch;
};

export const resetAgentDispatchForTest = (): void => {
    currentDispatch = mockDispatch;
};

// -----------------------------------------------------------------
// Cost estimator
// -----------------------------------------------------------------

/**
 * Cheap upstream estimate. Half the per-invocation ceiling by default —
 * good enough to surface ceiling-exceeding attempts and to pre-book
 * against the monthly cap. The real brain-service returns the true
 * cost in the response body, which overwrites this projection.
 */
const projectedCost = (capability: Capability): number =>
    Math.max(1, Math.round(CAPABILITY_BUDGETS[capability].perInvocationCents * 0.5));

// -----------------------------------------------------------------
// Public API
// -----------------------------------------------------------------

export const invokeAgent = async (
    request: InvokeRequest,
    track?: (
        event: (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents],
        payload: EventPayload<(typeof AnalyticsEvents)[keyof typeof AnalyticsEvents]>,
    ) => void,
): Promise<InvokeResult> => {
    const now = request.now ?? new Date().toISOString();
    const projected = projectedCost(request.capability);

    const state = costStore.get.budgetState({
        capability: request.capability,
        projectedCostCents: projected,
        tenantMonthToDateCents: request.tenantMonthToDateCents ?? 0,
        now,
    });

    const decision = decideBudget(state);

    if (!decision.allowed) {
        track?.(AnalyticsEvents.PATHWAYS_AGENT_BUDGET_EXCEEDED, {
            agent: request.capability,
            tier:
                CAPABILITY_BUDGETS[request.capability].perInvocationCents <= 2
                    ? 'low'
                    : CAPABILITY_BUDGETS[request.capability].perInvocationCents <= 8
                        ? 'medium'
                        : 'high',
            cappedAt: decision.cappedAt,
        });

        return {
            ok: false,
            cappedAt: decision.cappedAt,
            reason: decision.reason,
        };
    }

    // -- Dispatch ---------------------------------------------------------

    const startedAt = Date.now();

    const result = await currentDispatch({ ...request, now });

    const latencyMs = Date.now() - startedAt;

    // -- Bookkeeping ------------------------------------------------------

    costStore.set.recordInvocation({
        capability: request.capability,
        costCents: result.costCents,
        at: now,
    });

    proposalStore.set.addProposal(result.proposal);

    track?.(AnalyticsEvents.PATHWAYS_PROPOSAL_CREATED, {
        agent: result.proposal.agent,
        pathwayId: result.proposal.pathwayId,
        tokensIn: result.tokensIn,
        tokensOut: result.tokensOut,
        latencyMs,
        costCents: result.costCents,
    });

    return {
        ok: true,
        proposal: result.proposal,
        costCents: result.costCents,
        latencyMs,
    };
};

/**
 * credentialBinder — deterministic VC → proposal observer.
 *
 * When a new verifiable credential lands in the learner's wallet,
 * the binder walks every active pathway's `outcomes[]` and emits a
 * `Proposal` for each signal whose predicate the VC satisfies AND
 * whose trust-tier requirement the issuer clears.
 *
 * Everything here is pure and synchronous — no store access, no
 * network, no LLM. The matcher decides the data question; the binder
 * layers trust-tier enforcement on top; callers (the wallet-observer
 * hook, not yet wired) persist the emitted proposals through
 * `proposalStore.set.addProposal`. That keeps the pipeline identical
 * to agent-origin proposals: *the learner always commits*.
 *
 * Why a separate module from `mockAgent.ts` / `proxy.ts`:
 *   - The binder is deterministic. There is no LLM, no budget burn,
 *     and no need for the cost ledger. Running it through `invokeAgent`
 *     would force a budget check on a free operation.
 *   - The binder can emit *multiple* proposals from a single
 *     invocation (one per matching outcome across one or more
 *     pathways). The agent proxy's contract is one-proposal-per-invoke.
 *   - Proposals still flow into the same `proposalStore` so the UI
 *     renders and accepts them uniformly.
 *
 * The proposals use `capability: 'interpretation'` and
 * `agent: 'recorder'` — semantically, "I noticed this VC satisfies
 * your outcome" IS interpretation, just the deterministic subset of it.
 */

import { v4 as uuid } from 'uuid';

import {
    classifyIssuerTrust,
    type IssuerTrustRegistry,
    matchVcAgainstOutcome,
    checkWindow,
    type VcLike,
} from '../core/outcomeMatcher';
import type {
    OutcomeBinding,
    OutcomeSignal,
    OutcomeTrustTier,
    Pathway,
    Proposal,
} from '../types';
import { meetsTrustTier } from '../types';

// -----------------------------------------------------------------
// Inputs / outputs
// -----------------------------------------------------------------

export interface BindRequest {
    vc: VcLike;
    /** Stable URI for the credential (wallet URI, hash, CID). */
    credentialUri: string;
    /** Pathways to consider. Typically every non-archived pathway the learner owns. */
    pathways: Pathway[];
    ownerDid: string;
    /** Trust registry used to classify the issuer. */
    trustRegistry?: IssuerTrustRegistry;
    /** Injectable for testing; defaults to `new Date().toISOString()`. */
    now?: string;
    /** Injectable for testing; defaults to `crypto.randomUUID()` (via uuid). */
    makeId?: () => string;
    /** TTL in days for the emitted proposal. Defaults to 14. */
    expiresInDays?: number;
}

/**
 * Why a matched-or-near-matched outcome did NOT yield a proposal.
 * Union of `MatchFailureReason` (shaped by the matcher) plus the two
 * binder-layer rejections (`already-bound`, `trust-too-low`).
 */
export type BindSkipReason =
    | 'already-bound'
    | 'trust-too-low'
    | 'type-mismatch'
    | 'issuer-mismatch'
    | 'field-missing'
    | 'field-not-numeric'
    | 'threshold-unmet'
    | 'kind-unsupported'
    | 'pending-implementation';

export interface SkippedBind {
    pathwayId: string;
    outcomeId: string;
    reason: BindSkipReason;
}

export interface BindResult {
    proposals: Proposal[];
    /**
     * Signals that matched the VC data-wise but were *not* proposed —
     * already bound, or the issuer's trust tier didn't clear the
     * signal's minimum. Exposed so the caller (and tests) can
     * distinguish "nothing matched" from "we decided not to propose."
     */
    skipped: SkippedBind[];
}

// -----------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------

const issuerDid = (vc: VcLike): string | null => {
    const issuer = vc.issuer;

    if (!issuer) return null;
    if (typeof issuer === 'string') return issuer;
    if (typeof issuer === 'object' && typeof issuer.id === 'string') return issuer.id;

    return null;
};

const reasonString = (
    outcome: OutcomeSignal,
    pathway: Pathway,
    observedValue?: number | string,
): string => {
    const base = `A new credential satisfies "${outcome.label}" on "${pathway.title}".`;

    if (observedValue === undefined) return base;

    return `${base} (observed: ${String(observedValue)})`;
};

// -----------------------------------------------------------------
// Core
// -----------------------------------------------------------------

/**
 * Walk every pathway and outcome, emit a proposal for each match
 * that clears the trust gate and hasn't already been bound.
 *
 * The returned `Proposal[]` is ready to hand to
 * `proposalStore.set.addProposal`; no further transformation is
 * required. Each proposal carries a single `setOutcomeBindings`
 * entry so the learner can accept/reject them independently — a
 * VC that satisfies five outcomes produces five proposals, not
 * one bundle. That matches the accept-proposal UX and lets the
 * learner stop one without stopping all.
 */
export const bindCredentialToOutcomes = (request: BindRequest): BindResult => {
    const now = request.now ?? new Date().toISOString();
    const makeId = request.makeId ?? (() => uuid());
    const expiresInDays = request.expiresInDays ?? 14;

    const issuer = issuerDid(request.vc);
    const issuerTier = classifyIssuerTrust(issuer, request.trustRegistry ?? {});

    const proposals: Proposal[] = [];
    const skipped: BindResult['skipped'] = [];

    for (const pathway of request.pathways) {
        if (!pathway.outcomes || pathway.outcomes.length === 0) continue;

        for (const outcome of pathway.outcomes) {
            // Already bound — skip silently. Re-binding requires a
            // prior clear proposal (`binding: null`). The learner
            // explicitly chose the existing record; we don't override.
            if (outcome.binding) {
                skipped.push({
                    pathwayId: pathway.id,
                    outcomeId: outcome.id,
                    reason: 'already-bound',
                });

                continue;
            }

            const match = matchVcAgainstOutcome(outcome, request.vc);

            if (!match.matched) {
                skipped.push({
                    pathwayId: pathway.id,
                    outcomeId: outcome.id,
                    reason: match.reason,
                });

                continue;
            }

            // Trust gate — the *issuer's* tier must clear the signal's
            // minimum. A self-attested "I got a 1600 SAT" is legal data
            // but doesn't warrant an auto-proposal for a signal that
            // requires `institution`.
            const requiredTier: OutcomeTrustTier = outcome.minTrustTier;

            if (!meetsTrustTier(issuerTier, requiredTier)) {
                skipped.push({
                    pathwayId: pathway.id,
                    outcomeId: outcome.id,
                    reason: 'trust-too-low',
                });

                continue;
            }

            // Window check — late bindings still propose, but get
            // flagged so cohort analytics can split in-window vs
            // out-of-window effectiveness. Don't short-circuit.
            const { inWindow } = checkWindow(outcome, request.vc, {
                createdAt: pathway.createdAt,
                // `updatedAt` is our best proxy for pathway completion
                // until we track a dedicated `completedAt` — good
                // enough for window math, conservative (errs toward
                // marking things in-window).
                completedAt: pathway.updatedAt,
            });

            const binding: OutcomeBinding = {
                credentialUri: request.credentialUri,
                boundAt: now,
                boundVia: 'auto',
                issuerTrustTier: issuerTier,
                observedValue: match.observedValue,
                outOfWindow: !inWindow,
            };

            const expiresAt = new Date(
                new Date(now).getTime() + expiresInDays * 24 * 60 * 60 * 1000,
            ).toISOString();

            const proposal: Proposal = {
                id: makeId(),
                pathwayId: pathway.id,
                ownerDid: request.ownerDid,
                agent: 'recorder',
                capability: 'interpretation',
                reason: reasonString(outcome, pathway, match.observedValue),
                diff: {
                    addNodes: [],
                    updateNodes: [],
                    removeNodeIds: [],
                    addEdges: [],
                    removeEdgeIds: [],
                    setOutcomeBindings: [
                        {
                            outcomeId: outcome.id,
                            binding,
                        },
                    ],
                },
                status: 'open',
                createdAt: now,
                expiresAt,
            };

            proposals.push(proposal);
        }
    }

    return { proposals, skipped };
};

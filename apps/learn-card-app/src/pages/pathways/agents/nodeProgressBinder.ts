/**
 * nodeProgressBinder — deterministic event → completion-proposal observer.
 *
 * The node-level analogue of `credentialBinder.ts`. Where that module
 * walks pathway-level `OutcomeSignal`s and emits binding proposals,
 * this one walks every active pathway's *nodes* and emits
 * `completeNodes` proposals when a `WalletEvent` satisfies the node's
 * termination.
 *
 * Two termination kinds are in scope today:
 *
 *   - `requirement-satisfied` — matched against a `CredentialIngested`
 *     event by running the `NodeRequirement` predicate over the VC's
 *     `CredentialIdentity` and applying the trust-tier gate.
 *   - `session-completed`     — matched against an `AiSessionCompleted`
 *     event by comparing `topicUri` (and, optionally, the session
 *     duration against `minDurationSec`).
 *
 * Everything is pure and synchronous. No store access, no network.
 * The caller (the reactor) owns the side effect of pushing the
 * resulting proposals into `proposalStore`.
 *
 * ## Why a separate binder
 *
 * It would be tempting to widen `credentialBinder.ts`. The reason we
 * don't is the same reason that module exists alongside the agent
 * proxy: the *contract* is different.
 *
 *   - `credentialBinder` produces **outcome bindings** (pathway-
 *     level) — one per outcome, per matching VC.
 *   - `nodeProgressBinder` produces **node completions** (node-
 *     level) — one per node, per matching event.
 *
 * The trust model, idempotency key, and diff shape are different.
 * Keeping them as sibling modules with the same ergonomic API (same
 * inputs, parallel `BindResult`) lets the reactor drive both in a
 * single pass per event without either module leaking into the other.
 *
 * ## Idempotency
 *
 * The binder skips any node already in `progress.status === 'completed'`.
 * That's the dedup key at this layer: a credential event that fires
 * twice on the same node produces one proposal (first time) and one
 * `already-completed` skip (second time). `applyProposal` itself
 * adds a belt-and-braces guard: even if a proposal somehow slips
 * through, it no-ops on completed nodes.
 *
 * Cross-device race conditions (two devices ingesting the same
 * credential simultaneously) produce two proposals, but
 * `applyProposal` still commits at most one completion. The second
 * proposal resolves to `accepted` status with a no-op diff — a
 * tolerable outcome for v0.5 and the telemetry signal for a future
 * dedup.
 */

import { v4 as uuid } from 'uuid';

import { extractCredentialIdentity } from '../core/credentialIdentity';
import { matchRequirement } from '../core/nodeRequirementMatcher';
import {
    classifyIssuerTrust,
    type IssuerTrustRegistry,
    type VcLike,
} from '../core/outcomeMatcher';
import type {
    AiSessionCompletedEvent,
    CredentialIngestedEvent,
    OutcomeTrustTier,
    Pathway,
    PathwayNode,
    Proposal,
    Termination,
    WalletEvent,
} from '../types';
import { meetsTrustTier } from '../types';

// ---------------------------------------------------------------------------
// Inputs / outputs
// ---------------------------------------------------------------------------

export interface NodeBindRequest {
    event: WalletEvent;
    pathways: readonly Pathway[];
    ownerDid: string;
    trustRegistry?: IssuerTrustRegistry;
    /** Injectable for testing; defaults to `new Date().toISOString()`. */
    now?: string;
    /** Injectable for testing; defaults to `uuidv4()`. */
    makeId?: () => string;
    /** TTL in days for the emitted proposal. Defaults to 14. */
    expiresInDays?: number;
}

/**
 * Per-skip reason union, enumerating both the matcher-layer failures
 * and the binder-layer policy rejections. Exposed so the reactor can
 * surface "didn't match because …" diagnostics in dev builds without
 * re-running the matcher.
 */
export type NodeBindSkipReason =
    | 'already-completed'
    | 'termination-not-applicable'
    | 'event-kind-unsupported'
    | 'requirement-not-matched'
    | 'trust-too-low'
    | 'topic-uri-mismatch'
    | 'session-too-short';

export interface SkippedNodeBind {
    pathwayId: string;
    nodeId: string;
    reason: NodeBindSkipReason;
}

export interface NodeBindResult {
    proposals: Proposal[];
    skipped: SkippedNodeBind[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const issuerIdFromVc = (vc: VcLike): string | null => {
    const issuer = vc.issuer;

    if (!issuer) return null;
    if (typeof issuer === 'string') return issuer;
    if (typeof issuer === 'object' && typeof issuer.id === 'string') return issuer.id;

    return null;
};

const evidenceLabelFor = (event: WalletEvent): string => {
    if (event.kind === 'credential-ingested') return 'a new credential';
    if (event.kind === 'ai-session-completed') return 'the tutor session';

    return 'an event';
};

const reasonStringFor = (
    event: WalletEvent,
    node: PathwayNode,
    pathway: Pathway,
): string =>
    `${evidenceLabelFor(event)} satisfies "${node.title}" on "${pathway.title}"`;

const makeProposal = (
    pathway: Pathway,
    node: PathwayNode,
    event: WalletEvent,
    completion: {
        evidenceKind: 'credential' | 'ai-session';
        evidenceRef: string;
        observedValue?: number | string;
    },
    ownerDid: string,
    now: string,
    makeId: () => string,
    expiresInDays: number,
): Proposal => {
    const expiresAt = new Date(
        new Date(now).getTime() + expiresInDays * 24 * 60 * 60 * 1000,
    ).toISOString();

    return {
        id: makeId(),
        pathwayId: pathway.id,
        ownerDid,
        // `recorder` is the same agent attribution used by the
        // outcome-level binder — these are both deterministic
        // "I noticed X" observations, not planning/routing work.
        agent: 'recorder',
        capability: 'interpretation',
        reason: reasonStringFor(event, node, pathway),
        diff: {
            addNodes: [],
            updateNodes: [],
            removeNodeIds: [],
            addEdges: [],
            removeEdgeIds: [],
            completeNodes: [
                {
                    nodeId: node.id,
                    completedAt: now,
                    evidence: {
                        kind: completion.evidenceKind,
                        ref: completion.evidenceRef,
                        ...(completion.observedValue !== undefined
                            ? { observedValue: completion.observedValue }
                            : {}),
                    },
                },
            ],
        },
        status: 'open',
        createdAt: now,
        expiresAt,
    };
};

// ---------------------------------------------------------------------------
// Per-event processing
// ---------------------------------------------------------------------------

/**
 * Evaluate a single credential event against a single node's
 * termination. Returns either a proposal-ready completion descriptor
 * or a skip reason.
 */
const tryBindCredentialAgainstNode = (
    event: CredentialIngestedEvent,
    node: PathwayNode,
    trustRegistry: IssuerTrustRegistry | undefined,
): {
    accepted: true;
    observedValue?: number | string;
} | { accepted: false; reason: NodeBindSkipReason } => {
    const { termination } = node.stage;

    if (termination.kind !== 'requirement-satisfied') {
        return { accepted: false, reason: 'termination-not-applicable' };
    }

    const identity = extractCredentialIdentity(event.vc as VcLike, {
        boostUri: event.boostUri,
        contractUri: event.contractUri,
    });

    const verdict = matchRequirement(termination.requirement, identity);

    if (!verdict.matched) {
        return { accepted: false, reason: 'requirement-not-matched' };
    }

    // Trust gate: issuer's tier must clear the termination's minimum.
    // We classify the issuer DID once per call — the registry lookup
    // is cheap (Set.has) and localising it keeps the binder pure.
    const issuerTier: OutcomeTrustTier = classifyIssuerTrust(
        issuerIdFromVc(event.vc as VcLike),
        trustRegistry ?? {},
    );

    if (!meetsTrustTier(issuerTier, termination.minTrustTier)) {
        return { accepted: false, reason: 'trust-too-low' };
    }

    return {
        accepted: true,
        ...(verdict.matched && 'observedValue' in verdict && verdict.observedValue !== undefined
            ? { observedValue: verdict.observedValue }
            : {}),
    };
};

/**
 * Evaluate a session-ended event against a single node's termination.
 */
const trySessionAgainstNode = (
    event: AiSessionCompletedEvent,
    node: PathwayNode,
): { accepted: true } | { accepted: false; reason: NodeBindSkipReason } => {
    const { termination } = node.stage;

    if (termination.kind !== 'session-completed') {
        return { accepted: false, reason: 'termination-not-applicable' };
    }

    // topicUri must match exactly. Missing event.topicUri (onboarding
    // / skill-profile sessions) counts as a non-match — we don't want
    // those flows to accidentally complete pathway nodes.
    if (!event.topicUri || event.topicUri !== termination.topicUri) {
        return { accepted: false, reason: 'topic-uri-mismatch' };
    }

    const floor = termination.minDurationSec ?? 0;

    if (floor > 0) {
        // Missing durationSec counts as zero — the conservative
        // choice given authors who set a floor presumably care about
        // it.
        const observed = event.durationSec ?? 0;

        if (observed < floor) {
            return { accepted: false, reason: 'session-too-short' };
        }
    }

    return { accepted: true };
};

// ---------------------------------------------------------------------------
// Core entry point
// ---------------------------------------------------------------------------

/**
 * Walk every active pathway and node, emit a completion proposal for
 * each node whose termination the event satisfies (and whose trust
 * gate clears, and which isn't already completed).
 *
 * The returned `Proposal[]` is ready to hand to
 * `proposalStore.set.addProposal` — no further transformation
 * required.
 */
export const bindEventToNodes = (request: NodeBindRequest): NodeBindResult => {
    const now = request.now ?? new Date().toISOString();
    const makeId = request.makeId ?? (() => uuid());
    const expiresInDays = request.expiresInDays ?? 14;

    const proposals: Proposal[] = [];
    const skipped: SkippedNodeBind[] = [];

    for (const pathway of request.pathways) {
        for (const node of pathway.nodes) {
            // Idempotency: never re-propose a completion for a node
            // that's already done. `applyProposal` guards this too;
            // catching it here keeps the proposal list clean and
            // the skip telemetry honest.
            if (node.progress.status === 'completed') {
                // Only emit `already-completed` skips when the
                // termination *would* have matched — otherwise the
                // skip list is dominated by uninteresting noise
                // (every node in every pathway ever).
                if (
                    isApplicableTerminationFor(node.stage.termination, request.event)
                ) {
                    skipped.push({
                        pathwayId: pathway.id,
                        nodeId: node.id,
                        reason: 'already-completed',
                    });
                }

                continue;
            }

            if (request.event.kind === 'credential-ingested') {
                const result = tryBindCredentialAgainstNode(
                    request.event,
                    node,
                    request.trustRegistry,
                );

                if (!result.accepted) {
                    // Only record skips for terminations that were
                    // in-scope for this event kind; noise otherwise.
                    if (result.reason !== 'termination-not-applicable') {
                        skipped.push({
                            pathwayId: pathway.id,
                            nodeId: node.id,
                            reason: result.reason,
                        });
                    }

                    continue;
                }

                proposals.push(
                    makeProposal(
                        pathway,
                        node,
                        request.event,
                        {
                            evidenceKind: 'credential',
                            evidenceRef: request.event.credentialUri,
                            observedValue: result.observedValue,
                        },
                        request.ownerDid,
                        now,
                        makeId,
                        expiresInDays,
                    ),
                );

                continue;
            }

            if (request.event.kind === 'ai-session-completed') {
                const result = trySessionAgainstNode(request.event, node);

                if (!result.accepted) {
                    if (result.reason !== 'termination-not-applicable') {
                        skipped.push({
                            pathwayId: pathway.id,
                            nodeId: node.id,
                            reason: result.reason,
                        });
                    }

                    continue;
                }

                proposals.push(
                    makeProposal(
                        pathway,
                        node,
                        request.event,
                        {
                            evidenceKind: 'ai-session',
                            evidenceRef: request.event.threadId,
                        },
                        request.ownerDid,
                        now,
                        makeId,
                        expiresInDays,
                    ),
                );

                continue;
            }

            // Forward-compat: any new event kind lands here. We
            // record one skip per pathway (not per node) to keep the
            // noise bounded. Today this branch is unreachable — the
            // exhaustive `request.event.kind` checks above cover every
            // WalletEvent member.
            skipped.push({
                pathwayId: pathway.id,
                nodeId: node.id,
                reason: 'event-kind-unsupported',
            });
        }
    }

    return { proposals, skipped };
};

/**
 * Cheap pre-check: is this termination even in-scope for this event?
 * Factored out so the `already-completed` path can quietly filter
 * the skip list without duplicating the applicability rules.
 */
const isApplicableTerminationFor = (
    termination: Termination,
    event: WalletEvent,
): boolean => {
    if (event.kind === 'credential-ingested') {
        return termination.kind === 'requirement-satisfied';
    }

    if (event.kind === 'ai-session-completed') {
        return termination.kind === 'session-completed';
    }

    return false;
};

/**
 * Proposal schema — agent-origin changes waiting on learner commit.
 *
 * Proposals live in their OWN collection keyed by pathwayId (docs § 3.5).
 * They have a different lifecycle than the pathway itself (TTL, expiry,
 * per-agent rate limits, cross-pathway Matcher proposals).
 */

import { z } from 'zod';

import { PathwayNodeSchema, EdgeSchema } from './pathway';
import { OutcomeBindingSchema } from './outcome';

// -----------------------------------------------------------------
// Agent capabilities (docs § 7.2) — what the agent layer must do.
// v1 ships these as five named agents, but the contract is the
// capability, not the name.
// -----------------------------------------------------------------

export const CapabilitySchema = z.enum([
    'planning',
    'interpretation',
    'nudging',
    'routing',
    'matching',
]);
export type Capability = z.infer<typeof CapabilitySchema>;

// Legacy v1 agent names, retained so telemetry can attribute proposals
// to an implementation without breaking the capability contract.
export const AgentNameSchema = z.enum([
    'planner',
    'coach',
    'recorder',
    'router',
    'matcher',
]);
export type AgentName = z.infer<typeof AgentNameSchema>;

// -----------------------------------------------------------------
// Pathway diff
// -----------------------------------------------------------------

export const NodePatchSchema = PathwayNodeSchema.partial().extend({
    id: z.string().uuid(),
});
export type NodePatch = z.infer<typeof NodePatchSchema>;

export const PathwayDiffSchema = z.object({
    addNodes: z.array(PathwayNodeSchema).default([]),
    updateNodes: z.array(NodePatchSchema).default([]),
    removeNodeIds: z.array(z.string().uuid()).default([]),

    addEdges: z.array(EdgeSchema).default([]),
    removeEdgeIds: z.array(z.string().uuid()).default([]),

    /**
     * **Route swap** — overwrite the pathway's `chosenRoute` with the
     * supplied ordered list of node ids. Applied *after* any
     * structural add/remove work, so a single diff can legitimately
     * remove a node *and* supply a new route that reflects the
     * removal.
     *
     * The most important use is What-If scenario acceptance: a
     * "fast-track" scenario is a **route swap, not graph surgery** —
     * the review nodes stay in the graph (still available in Map,
     * still visible in the record) but drop off the committed walk.
     * This is more honest and reversible than destructive removal.
     *
     * Callers pass ids only; `applyProposal` filters against the
     * surviving node set and drops the field entirely (same
     * semantics as `pruneChosenRoute`) if the result can't form a
     * walk. Pass an empty array to clear chosenRoute.
     */
    setChosenRoute: z.array(z.string().uuid()).optional(),

    /**
     * **Outcome bindings** — record (or clear) which wallet credential
     * satisfied a pathway's `outcomes[i]`. The credential binder
     * (`agents/credentialBinder.ts`) emits these when a new VC
     * matches an outcome predicate; the learner still confirms the
     * binding (agents never write outcome state directly).
     *
     * Each entry targets a single outcome by id. `binding === null`
     * clears a previous binding (the learner disputed the match, or
     * an issuer was revoked). Unknown outcome ids are silently
     * ignored at apply time so a stale proposal can't wedge the
     * pathway.
     */
    setOutcomeBindings: z
        .array(
            z.object({
                outcomeId: z.string().uuid(),
                binding: OutcomeBindingSchema.nullable(),
            }),
        )
        .optional(),

    /**
     * **Node completions** — mark one or more nodes as completed,
     * optionally recording the evidence that triggered the flip.
     * Narrow, intentionally distinct from `updateNodes`:
     *
     *   - `updateNodes` is *authoring* state (policy, termination,
     *     title, description). `applyProposal` pins `progress` off-
     *     limits on that path because progress is learner-owned and
     *     should not be silently overwritten by authoring diffs.
     *   - `completeNodes` is *progress* state — one narrow channel
     *     a proposal can use to flip a node to `completed` when an
     *     external event (credential claim, AI session end)
     *     satisfied the node's termination. The learner still
     *     accepts the proposal; agents never commit directly.
     *
     * Having the two channels keeps the trust model honest: an
     * agent that wants to mark a node done must *explicitly* declare
     * it in this field, not disguise it inside a grab-bag `stage`
     * patch. `applyProposal` idempotently ignores entries for nodes
     * that are already `completed`, so a re-applied / replayed
     * proposal is a no-op rather than a progress-bumping hazard.
     *
     * `evidence` is optional context recorded on the node's
     * progress for post-hoc auditing ("why did this tick off?").
     * Unknown node ids are silently dropped so stale proposals
     * can't wedge the pathway — same policy as the outcome binding
     * channel.
     */
    completeNodes: z
        .array(
            z.object({
                nodeId: z.string().uuid(),
                completedAt: z.string().datetime(),
                evidence: z
                    .object({
                        /**
                         * Where the completing event originated.
                         * Discriminates how `ref` should be interpreted.
                         */
                        kind: z.enum([
                            'credential',
                            'ai-session',
                            'artifact',
                            'self-attest',
                            'manual',
                        ]),
                        /**
                         * Stable reference for the evidence — a VC
                         * wallet URI for `credential`, a chat thread
                         * id for `ai-session`, etc. Opaque to
                         * `applyProposal`; preserved as-is so later
                         * surfaces can resolve it back to its origin.
                         */
                        ref: z.string().min(1),
                        /**
                         * Observed numeric/string value, for
                         * score-threshold style matches. Stored so UI
                         * can render "you scored 1450 (target 1400)"
                         * without re-reading the VC.
                         */
                        observedValue: z
                            .union([z.number(), z.string()])
                            .optional(),
                    })
                    .optional(),
            }),
        )
        .optional(),

    // For Planner drafting an entire new pathway.
    newPathway: z
        .object({
            title: z.string(),
            goal: z.string(),
            templateRef: z.string().optional(),
        })
        .optional(),
});
export type PathwayDiff = z.infer<typeof PathwayDiffSchema>;

// -----------------------------------------------------------------
// Tradeoffs (for Router / Matcher proposals)
// -----------------------------------------------------------------

export const TradeoffSchema = z.object({
    dimension: z.enum(['time', 'cost', 'effort', 'difficulty', 'external-dependency']),
    deltaDescription: z.string(),
    direction: z.enum(['better', 'worse', 'neutral']),
});
export type Tradeoff = z.infer<typeof TradeoffSchema>;

// -----------------------------------------------------------------
// Proposal
// -----------------------------------------------------------------

export const ProposalStatusSchema = z.enum([
    'open',
    'accepted',
    'rejected',
    'expired',
    'superseded',
]);
export type ProposalStatus = z.infer<typeof ProposalStatusSchema>;

export const ProposalSchema = z.object({
    id: z.string().uuid(),
    /** null = cross-pathway (e.g. Matcher suggesting a brand-new pathway). */
    pathwayId: z.string().uuid().nullable(),
    ownerDid: z.string(),

    agent: AgentNameSchema,
    capability: CapabilitySchema,

    reason: z.string(),
    diff: PathwayDiffSchema,
    tradeoffs: z.array(TradeoffSchema).optional(),

    status: ProposalStatusSchema,
    createdAt: z.string().datetime(),
    expiresAt: z.string().datetime().optional(),
});
export type Proposal = z.infer<typeof ProposalSchema>;

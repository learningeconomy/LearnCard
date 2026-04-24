/**
 * Pathways data model — Zod schemas and inferred TS types.
 *
 * See `apps/learn-card-app/docs/pathways-architecture.md` § 3.
 *
 * Phase 0: lives in-app. Promoted to `@learncard/pathways-types` at end of
 * Phase 1 once the shapes are stable (Section 15).
 */

import { z } from 'zod';

import { ActionDescriptorSchema } from './action';
import { NodeRequirementSchema } from './nodeRequirement';
import { OutcomeSignalSchema, OutcomeTrustTierSchema } from './outcome';

// -----------------------------------------------------------------
// References
// -----------------------------------------------------------------

export const NodeRefSchema = z.object({
    pathwayId: z.string().uuid(),
    nodeId: z.string().uuid(),
});
export type NodeRef = z.infer<typeof NodeRefSchema>;

export const EndorsementRefSchema = z.object({
    endorsementId: z.string(),
    endorserDid: z.string(),
    endorserRelationship: z.enum(['mentor', 'peer', 'guardian', 'institution']),
    trustTier: z.enum(['self', 'peer', 'trusted', 'institution']).default('peer'),
    receivedAt: z.string().datetime().optional(),
});
export type EndorsementRef = z.infer<typeof EndorsementRefSchema>;

export const AlignmentRefSchema = z.object({
    targetName: z.string(),
    targetUrl: z.string().url().optional(),
    targetFramework: z.string().optional(),
    targetCode: z.string().optional(),
});
export type AlignmentRef = z.infer<typeof AlignmentRefSchema>;

// -----------------------------------------------------------------
// Stage: CST primitive (Initiation / Policy / Termination)
// See docs § 3.1–3.3
// -----------------------------------------------------------------

export const CadenceSchema = z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly', 'ad-hoc']),
    perPeriod: z.number().int().positive().default(1),
});
export type Cadence = z.infer<typeof CadenceSchema>;

export const ArtifactTypeSchema = z.enum([
    'text',
    'image',
    'audio',
    'video',
    'pdf',
    'link',
    'code',
    'other',
]);
export type ArtifactType = z.infer<typeof ArtifactTypeSchema>;

export const FsrsParamsSchema = z.object({
    stability: z.number().nonnegative().default(0),
    difficulty: z.number().nonnegative().default(0),
    lastReviewAt: z.string().datetime().optional(),
    dueAt: z.string().datetime().optional(),
});
export type FsrsParams = z.infer<typeof FsrsParamsSchema>;

export const RubricSchema = z.object({
    criteria: z.array(
        z.object({
            id: z.string(),
            description: z.string(),
            weight: z.number().nonnegative().default(1),
        }),
    ),
});
export type Rubric = z.infer<typeof RubricSchema>;

export const McpToolRefSchema = z.object({
    serverId: z.string(),
    toolName: z.string(),
    defaultArgs: z.record(z.string(), z.unknown()).optional(),
});
export type McpToolRef = z.infer<typeof McpToolRefSchema>;

/**
 * Render-style for composite nodes. Composition and nesting are the
 * same primitive (a node that represents "completion of a sub-graph");
 * this flag picks the UX:
 *
 *   - `inline-expandable` — nesting: render a mini map/list of the
 *     referenced pathway inline inside the parent's NodeDetail.
 *   - `link-out`          — composition: render a small card that
 *     jumps the learner to that pathway's Today view.
 *
 * Defaulting to `inline-expandable` matches author intent most of the
 * time ("chunk this node into sub-steps"). Authors flip to `link-out`
 * when the referenced pathway has its own strong identity the learner
 * should feel ("Complete AI Fundamentals first").
 */
export const CompositeRenderStyleSchema = z.enum([
    'inline-expandable',
    'link-out',
]);
export type CompositeRenderStyle = z.infer<typeof CompositeRenderStyleSchema>;

/**
 * Policy — what the learner does during the stage. Discriminated union so
 * "daily writing for 30 days" and "pass an assessment" share the same
 * primitive without stringly-typed fields.
 *
 * `composite` is load-bearing: it lets a single node represent the
 * completion of another pathway. Combined with a `pathway-completed`
 * termination, a composite node says "you're done with me when you
 * finish pathway X". This is how we get both **nesting** (substeps
 * inside a node) and **composition** (cross-pathway dependencies) out
 * of one primitive — see `CompositeRenderStyleSchema`.
 */
export const PolicySchema = z.discriminatedUnion('kind', [
    z.object({
        kind: z.literal('practice'),
        cadence: CadenceSchema,
        artifactTypes: z.array(ArtifactTypeSchema).min(1),
    }),
    z.object({
        kind: z.literal('review'),
        fsrs: FsrsParamsSchema,
    }),
    z.object({
        kind: z.literal('assessment'),
        rubric: RubricSchema,
    }),
    z.object({
        kind: z.literal('artifact'),
        prompt: z.string(),
        expectedArtifact: ArtifactTypeSchema,
    }),
    z.object({
        kind: z.literal('external'),
        mcp: McpToolRefSchema,
    }),
    z.object({
        kind: z.literal('composite'),
        /** The pathway whose completion satisfies this node. */
        pathwayRef: z.string().uuid(),
        renderStyle: CompositeRenderStyleSchema.default('inline-expandable'),
    }),
]);
export type Policy = z.infer<typeof PolicySchema>;

// Termination is recursive (composite branches). Keep the non-composite
// variants as their own schema so the composite case can reference them.
const BaseTerminationSchema = z.union([
    z.object({
        kind: z.literal('artifact-count'),
        count: z.number().int().positive(),
        artifactType: ArtifactTypeSchema,
    }),
    z.object({
        kind: z.literal('endorsement'),
        minEndorsers: z.number().int().positive(),
        trustedIssuers: z.array(z.string()).optional(),
    }),
    z.object({
        kind: z.literal('self-attest'),
        prompt: z.string(),
    }),
    z.object({
        kind: z.literal('assessment-score'),
        min: z.number(),
    }),
    /**
     * `pathway-completed` — the natural partner of a `composite` policy.
     * Termination is satisfied iff the referenced pathway has its
     * destination marked complete. Stored as a pathway id (not a node
     * id) because completion semantics live at the pathway level, and
     * the termination should survive a destination-node swap.
     */
    z.object({
        kind: z.literal('pathway-completed'),
        pathwayRef: z.string().uuid(),
    }),
    /**
     * `requirement-satisfied` — the node is complete when a wallet
     * credential (or other evidence) satisfies a `NodeRequirement`
     * predicate. This is the node-level analogue of the pathway-level
     * `OutcomeSignal.credential-received` — same trust-tier model,
     * but flexible enough to express modern identity schemes (boost
     * URIs, CTDL CTIDs, OB achievements/alignments, skill tags,
     * composite AND/OR trees). See `types/nodeRequirement.ts` for
     * the requirement DSL and `core/nodeRequirementMatcher.ts` for
     * the matcher.
     *
     * `minTrustTier` mirrors the outcomes system: the issuer of the
     * satisfying evidence must clear this tier before the node
     * auto-completes. Defaults to `trusted`.
     */
    z.object({
        kind: z.literal('requirement-satisfied'),
        requirement: NodeRequirementSchema,
        minTrustTier: OutcomeTrustTierSchema.default('trusted'),
    }),
    /**
     * `session-completed` — the node is complete when a first-party
     * LearnCard AI tutor session ends on the specified topic. Pairs
     * naturally with an `ai-session` action: same `topicUri`,
     * learner engages, session ends, node ticks off.
     *
     * `minDurationSec` is an optional floor on session length; the
     * binder will decline to auto-complete very short sessions (the
     * learner opened and immediately closed the tutor) when this
     * threshold is set. Omitting it means any session ending counts.
     */
    z.object({
        kind: z.literal('session-completed'),
        topicUri: z.string().min(1),
        minDurationSec: z.number().int().nonnegative().optional(),
    }),
]);

export type Termination =
    | z.infer<typeof BaseTerminationSchema>
    | {
          kind: 'composite';
          of: Termination[];
          require: 'all' | 'any';
      };

export const TerminationSchema: z.ZodType<Termination> = z.lazy(() =>
    z.union([
        BaseTerminationSchema,
        z.object({
            kind: z.literal('composite'),
            of: z.array(TerminationSchema).min(1),
            require: z.enum(['all', 'any']),
        }),
    ]),
);

export const StageSchema = z.object({
    initiation: z.array(NodeRefSchema),
    policy: PolicySchema,
    termination: TerminationSchema,
});
export type Stage = z.infer<typeof StageSchema>;

// -----------------------------------------------------------------
// Projection to Open Badges 3.0 (docs § 3.6)
// A node does NOT store a VC; it stores a projection used at issuance.
// -----------------------------------------------------------------

/**
 * Where the learner actually *goes* to earn this credential. CTDL
 * exposes two candidate URL fields per component/credential that we
 * surface (`ceterms:proxyFor` exists but resolves to a registry JSON
 * endpoint, useless as a destination — we resolve proxies upstream in
 * the importer and pull the proxied credential's own `subjectWebpage`
 * / `sourceData` through, tagging them with their *actual* field
 * rather than the proxy indirection).
 *
 *   - `sourceData`: the issuer's "earn it here" URL. A click here is
 *     meaningfully "go start the work."
 *   - `subjectWebpage`: the issuer's human landing page. A click here
 *     is "read about it"; we never promise it earns anything.
 *
 * Separation matters: saying "Earn this badge ↗" and dropping someone
 * on a 404 or a marketing page is worse than not surfacing a link at
 * all, so the CTA resolver degrades copy to match the source.
 */
export const EarnUrlSourceSchema = z.enum([
    'sourceData',
    'subjectWebpage',
]);
export type EarnUrlSource = z.infer<typeof EarnUrlSourceSchema>;

export const AchievementProjectionSchema = z.object({
    achievementType: z.string(),
    criteria: z.string(),
    image: z.string().url().optional(),
    alignment: z.array(AlignmentRefSchema).optional(),
    /** Issuer URL where the learner can go to actually earn this. */
    earnUrl: z.string().url().optional(),
    /** Which CTDL field the `earnUrl` came from. */
    earnUrlSource: EarnUrlSourceSchema.optional(),
});
export type AchievementProjection = z.infer<typeof AchievementProjectionSchema>;

// -----------------------------------------------------------------
// NodeProgress
// -----------------------------------------------------------------

export const EvidenceSchema = z.object({
    id: z.string().uuid(),
    artifactType: ArtifactTypeSchema,
    uri: z.string().optional(),
    note: z.string().optional(),
    submittedAt: z.string().datetime(),
});
export type Evidence = z.infer<typeof EvidenceSchema>;

export const NodeProgressSchema = z.object({
    status: z.enum(['not-started', 'in-progress', 'stalled', 'completed', 'skipped']),
    artifacts: z.array(EvidenceSchema).default([]),
    reviewsDue: z.number().int().nonnegative().default(0),
    streak: z
        .object({
            current: z.number().int().nonnegative().default(0),
            longest: z.number().int().nonnegative().default(0),
            lastActiveAt: z.string().datetime().optional(),
        })
        .default({ current: 0, longest: 0 }),
    startedAt: z.string().datetime().optional(),
    completedAt: z.string().datetime().optional(),
});
export type NodeProgress = z.infer<typeof NodeProgressSchema>;

// -----------------------------------------------------------------
// PathwayNode
// -----------------------------------------------------------------

export const PathwayNodeSchema = z.object({
    id: z.string().uuid(),
    pathwayId: z.string().uuid(),
    title: z.string(),
    description: z.string().optional(),

    stage: StageSchema,

    credentialProjection: AchievementProjectionSchema.optional(),

    endorsements: z.array(EndorsementRefSchema).default([]),

    progress: NodeProgressSchema,

    createdBy: z.enum(['learner', 'agent', 'template']),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),

    // -------------------------------------------------------------
    // Action descriptor (optional) — where the learner goes to act
    // on this node. Orthogonal to `policy` (what kind of work) and
    // `termination` (how we know it's done). See `types/action.ts`
    // for the full discriminated union and `core/action.ts` for the
    // dispatch helper used by Today / NodeDetail to turn this into a
    // primary CTA. Absence is honored — `resolveNodeAction` falls
    // back to the legacy `earnUrl` / `policy.external.mcp` paths so
    // nodes authored before this field existed keep working.
    // -------------------------------------------------------------
    action: ActionDescriptorSchema.optional(),

    // -------------------------------------------------------------
    // Provenance (optional) — populated when this node originated
    // outside our system (CTDL import, OBv3 achievement, etc.).
    //
    // `sourceUri` is the canonical linked-data identifier of the
    // foreign resource (e.g. a Credential Engine Registry URL).
    // `sourceCtid` is the short CTID form (`ce-<uuid>`) when the
    // source is CTDL.
    //
    // Keeping both lets us render provenance honestly ("from IMA's
    // AI in Finance pathway") and lets a re-import *update* the
    // node rather than duplicate it.
    // -------------------------------------------------------------
    sourceUri: z.string().optional(),
    sourceCtid: z.string().optional(),
});
export type PathwayNode = z.infer<typeof PathwayNodeSchema>;

// -----------------------------------------------------------------
// Edges
// -----------------------------------------------------------------

export const EdgeTypeSchema = z.enum([
    'prerequisite',
    'sibling',
    'alternative',
    'reinforces',
    'satisfies',
]);
export type EdgeType = z.infer<typeof EdgeTypeSchema>;

export const EdgeSchema = z.object({
    id: z.string().uuid(),
    from: z.string().uuid(),
    to: z.string().uuid(),
    type: EdgeTypeSchema,
});
export type Edge = z.infer<typeof EdgeSchema>;

// -----------------------------------------------------------------
// Visibility
// -----------------------------------------------------------------

export const VisibilitySchema = z.object({
    self: z.literal(true).default(true),
    mentors: z.boolean().default(false),
    guardians: z.boolean().default(false),
    publicProfile: z.boolean().default(false),
});
export type Visibility = z.infer<typeof VisibilitySchema>;

// -----------------------------------------------------------------
// Pathway (proposals live in their OWN collection — see proposal.ts)
// -----------------------------------------------------------------

export const PathwayStatusSchema = z.enum(['active', 'archived', 'sunset']);
export type PathwayStatus = z.infer<typeof PathwayStatusSchema>;

export const PathwaySourceSchema = z.enum([
    'template',
    'generated',
    'authored',
    'ctdl-imported',
]);
export type PathwaySource = z.infer<typeof PathwaySourceSchema>;

// -----------------------------------------------------------------
// Altitude — the altitude of the learner's arrival intent.
//
// A learner doesn't always arrive with a stated goal; sometimes they
// arrive with a question ("how does neural network training work?"),
// an immediate action intention ("I want to write a scene today"),
// or pure curiosity ("I've been reading fiction lately"). The CST
// primitive (Initiation / Policy / Termination) is altitude-agnostic,
// but the UI surfaces (Today banner, onboarding suggestions,
// next-action framing) currently force-aspirationalize everything.
//
// Recording the altitude that was *detected* at capture lets each
// surface render honestly — a question-altitude pathway doesn't need
// "Becoming what is conflict" on the Today banner; it can say
// "Following a thread" instead.
//
// The field is optional on `Pathway` (pre-existing pathways have no
// altitude) — callers fall back to a heuristic or default to
// 'aspiration' when absent, preserving current behavior.
// -----------------------------------------------------------------
export const AltitudeSchema = z.enum([
    'aspiration',
    'question',
    'action',
    'exploration',
]);
export type Altitude = z.infer<typeof AltitudeSchema>;

// -----------------------------------------------------------------
// Schema version + revision — see `pathways-storage-and-sync.md` § 5.1
//
// `schemaVersion` is the document-level migration hinge: the number
// we stamp on every pathway so `deserializePathway` can fan into the
// right migrator when shapes change. It is NOT bumped on content
// edits — it is bumped only when `PathwaySchema` itself changes in a
// way that needs a migration. Currently 1.
//
// `revision` is a monotonic counter bumped on *every* write (learner
// edit, proposal acceptance, composite rollup — anything that
// mutates the pathway). When the server wire-up lands, this is the
// CAS hinge that lets us do optimistic-concurrency writes: the
// client sends `ifRevision = current`, the server rejects with
// `conflict: { currentRevision }` if the value has moved, and the
// client re-applies its local intent as a fresh diff or spills it
// into the proposal queue.
//
// Neither field is surfaced to authoring UI; both are plumbing.
// They're required rather than optional because the sync story gets
// harder if we have to tolerate `revision: undefined`.
// -----------------------------------------------------------------

/**
 * The current `schemaVersion` value — bump this (and add a migrator
 * in `core/serialize.ts`) whenever `PathwaySchema` changes shape in
 * a way that existing persisted documents can't satisfy. Purely
 * additive changes (new optional fields) do NOT require a bump.
 */
export const CURRENT_PATHWAY_SCHEMA_VERSION = 1 as const;

export const PathwaySchema = z.object({
    id: z.string().uuid(),
    ownerDid: z.string(),
    /**
     * Monotonic revision counter bumped on every mutation. Starts at
     * 0 for a freshly-created pathway. See `bumpRevision` in
     * `build/buildOps.ts` and the sync docs for how this flows
     * through learner edits, proposal acceptance, and (future)
     * server-side optimistic-concurrency writes.
     */
    revision: z.number().int().nonnegative().default(0),
    /**
     * Document-level migration hinge. Distinct from `revision` —
     * `schemaVersion` tracks the *shape* of this JSON, not how many
     * times it's been written. See `CURRENT_PATHWAY_SCHEMA_VERSION`.
     */
    schemaVersion: z.number().int().positive().default(CURRENT_PATHWAY_SCHEMA_VERSION),
    title: z.string(),
    goal: z.string(),
    nodes: z.array(PathwayNodeSchema),
    edges: z.array(EdgeSchema),
    status: PathwayStatusSchema,
    visibility: VisibilitySchema,
    source: PathwaySourceSchema,
    templateRef: z.string().optional(),

    /**
     * The node a learner is ultimately earning — the terminal of the
     * pathway graph. Mirrors CTDL's `ceterms:hasDestinationComponent`:
     * exactly one node per pathway (zero in degenerate cases).
     *
     * Stored on the pathway rather than as a boolean on the node so the
     * uniqueness constraint is structural: "there is one destination"
     * can't be violated by editing a second node's flag.
     */
    destinationNodeId: z.string().uuid().optional(),

    /**
     * The altitude of the learner's arrival intent. Set at capture
     * from a heuristic classifier (`classifyAltitude`) over the
     * learner's free-text input. Optional for backwards compatibility
     * with pathways created before the field existed.
     */
    intentAltitude: AltitudeSchema.optional(),

    /**
     * **Chosen route** — the learner's committed linear walk through
     * the pathway graph. An ordered list of `PathwayNode.id`s, where
     * the first id is typically the entry point and the last is the
     * destination. Completed nodes stay in the route (it's a *route*,
     * not a cursor) so surfaces can render "step N of M" honestly.
     *
     * The field is the single source of truth shared by the three
     * pathway surfaces:
     *
     *   - **Today** — picks the first uncompleted, available id as
     *     the "next action" (turn-by-turn).
     *   - **Map** — draws the chosenRoute emerald-solid; every other
     *     edge stays visible but desaturated.
     *   - **What-If** — proposes alternate chosenRoutes (route swaps),
     *     not destructive graph edits.
     *
     * Why optional:
     *   1. Backwards compatibility — pathways created before this
     *      field existed keep working; consumers fall back to ranking.
     *   2. Pathways without a destination (question- /
     *      exploration-altitude) don't have a terminal, so committing
     *      to a route doesn't apply.
     *
     * See `core/chosenRoute.ts` for `seedChosenRoute`,
     * `pruneChosenRoute`, and `pickNextOnRoute` — the pure algebra
     * callers use to derive, maintain, and consume the field.
     */
    chosenRoute: z.array(z.string().uuid()).optional(),

    // -------------------------------------------------------------
    // Outcome signals (optional) — real-world results the pathway is
    // trying to produce (SAT score uplift, enrollment, employment,
    // wage change, narrative self-reports, …). Distinct from node
    // terminations: termination asks "did the learner execute the
    // pathway?", outcomes ask "did executing it work?".
    //
    // See `types/outcome.ts` for the `OutcomeSignal` union and
    // `core/outcomeMatcher.ts` for the wallet-VC matcher. Bindings
    // are recorded on `OutcomeSignal.binding` by the credential
    // binder (`agents/credentialBinder.ts`) through a proposal, so
    // the learner still confirms every bind — agents never write
    // outcome state directly.
    // -------------------------------------------------------------
    outcomes: z.array(OutcomeSignalSchema).optional(),

    // -------------------------------------------------------------
    // Provenance (optional) — see `PathwayNodeSchema` for rationale.
    // When a pathway was imported from the Credential Engine Registry,
    // `sourceCtid` holds the CTID and `sourceUri` holds the canonical
    // resource URL. Together they let us de-duplicate re-imports and
    // surface "imported from IMA's AI in Finance pathway" provenance.
    // -------------------------------------------------------------
    sourceUri: z.string().optional(),
    sourceCtid: z.string().optional(),

    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});
export type Pathway = z.infer<typeof PathwaySchema>;

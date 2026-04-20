/**
 * Pathways data model — Zod schemas and inferred TS types.
 *
 * See `apps/learn-card-app/docs/pathways-architecture.md` § 3.
 *
 * Phase 0: lives in-app. Promoted to `@learncard/pathways-types` at end of
 * Phase 1 once the shapes are stable (Section 15).
 */

import { z } from 'zod';

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
 * Policy — what the learner does during the stage. Discriminated union so
 * "daily writing for 30 days" and "pass an assessment" share the same
 * primitive without stringly-typed fields.
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

export const AchievementProjectionSchema = z.object({
    achievementType: z.string(),
    criteria: z.string(),
    image: z.string().url().optional(),
    alignment: z.array(AlignmentRefSchema).optional(),
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

export const PathwaySourceSchema = z.enum(['template', 'generated', 'authored']);
export type PathwaySource = z.infer<typeof PathwaySourceSchema>;

export const PathwaySchema = z.object({
    id: z.string().uuid(),
    ownerDid: z.string(),
    title: z.string(),
    goal: z.string(),
    nodes: z.array(PathwayNodeSchema),
    edges: z.array(EdgeSchema),
    status: PathwayStatusSchema,
    visibility: VisibilitySchema,
    source: PathwaySourceSchema,
    templateRef: z.string().optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});
export type Pathway = z.infer<typeof PathwaySchema>;

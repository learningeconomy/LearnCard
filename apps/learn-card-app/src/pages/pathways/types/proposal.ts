/**
 * Proposal schema — agent-origin changes waiting on learner commit.
 *
 * Proposals live in their OWN collection keyed by pathwayId (docs § 3.5).
 * They have a different lifecycle than the pathway itself (TTL, expiry,
 * per-agent rate limits, cross-pathway Matcher proposals).
 */

import { z } from 'zod';

import { PathwayNodeSchema, EdgeSchema } from './pathway';

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

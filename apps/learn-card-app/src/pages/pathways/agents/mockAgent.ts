/**
 * mockAgent — scripted proposal generator for Phase 3a.
 *
 * Produces deterministic `Proposal` values per capability so the full
 * pipeline (invoke → budget → audit → propose → learner accepts →
 * applyProposal → pathway changes) can be exercised end-to-end without
 * an LLM in the loop (docs § 17, Phase 3a kill criteria).
 *
 * When the brain-service proxy lands, the proxy routes real calls
 * through the provider and keeps this module for testing and for the
 * agents-offline degradation path.
 */

import { v4 as uuid } from 'uuid';

import { CAPABILITY_BUDGETS } from './budgets';
import type {
    AgentName,
    Capability,
    Pathway,
    PathwayDiff,
    PathwayNode,
    Proposal,
} from '../types';
import { availableNodes } from '../core/graphOps';

// -----------------------------------------------------------------
// Inputs / outputs
// -----------------------------------------------------------------

export interface MockAgentRequest {
    capability: Capability;
    pathway: Pathway | null;
    ownerDid: string;
    now: string;
}

export interface MockAgentResult {
    proposal: Proposal;
    /** Cents the caller should record against the learner's ledger. */
    costCents: number;
    latencyMs: number;
    tokensIn?: number;
    tokensOut?: number;
}

// -----------------------------------------------------------------
// Agent name per capability (matches the v1 implementation mapping
// documented in docs § 7.2)
// -----------------------------------------------------------------

const AGENT_BY_CAPABILITY: Record<Capability, AgentName> = {
    planning: 'planner',
    interpretation: 'recorder',
    nudging: 'coach',
    routing: 'router',
    matching: 'matcher',
};

// -----------------------------------------------------------------
// Per-capability proposal bodies
// -----------------------------------------------------------------

const expiryFor = (now: string, days: number): string => {
    const t = new Date(now).getTime() + days * 24 * 60 * 60 * 1000;

    return new Date(t).toISOString();
};

const emptyDiff = (): PathwayDiff => ({
    addNodes: [],
    updateNodes: [],
    removeNodeIds: [],
    addEdges: [],
    removeEdgeIds: [],
});

const targetNodeFor = (pathway: Pathway): PathwayNode | null => {
    const avail = availableNodes(pathway);

    return avail[0] ?? pathway.nodes[0] ?? null;
};

const makeInterpretationProposal = (
    { pathway, now, ownerDid }: MockAgentRequest,
): Proposal => {
    if (!pathway) {
        throw new Error('Interpretation needs an active pathway');
    }

    const target = targetNodeFor(pathway);

    if (!target) {
        throw new Error('Interpretation needs at least one node');
    }

    const diff: PathwayDiff = {
        ...emptyDiff(),
        updateNodes: [
            {
                id: target.id,
                description:
                    (target.description ? target.description + ' · ' : '') +
                    '(mock) Interpreted from recent activity: this looks like it fits here.',
            },
        ],
    };

    return {
        id: uuid(),
        pathwayId: pathway.id,
        ownerDid,
        agent: AGENT_BY_CAPABILITY.interpretation,
        capability: 'interpretation',
        reason: `This artifact maps to "${target.title}".`,
        diff,
        status: 'open',
        createdAt: now,
        expiresAt: expiryFor(now, 7),
    };
};

const makePlanningProposal = (
    { pathway, now, ownerDid }: MockAgentRequest,
): Proposal => {
    if (!pathway) {
        throw new Error('Planning needs an active pathway');
    }

    const target = targetNodeFor(pathway);

    const newNode: PathwayNode = {
        id: uuid(),
        pathwayId: pathway.id,
        title: '(Proposed) Reflect briefly on the work so far',
        description: 'A short 3-sentence reflection — what worked, what did not, what is next.',
        stage: {
            initiation: [],
            policy: {
                kind: 'artifact',
                prompt: 'Write three sentences of reflection.',
                expectedArtifact: 'text',
            },
            termination: { kind: 'self-attest', prompt: 'Reflection written.' },
        },
        endorsements: [],
        progress: {
            status: 'not-started',
            artifacts: [],
            reviewsDue: 0,
            streak: { current: 0, longest: 0 },
        },
        createdBy: 'agent',
        createdAt: now,
        updatedAt: now,
    };

    const diff: PathwayDiff = {
        ...emptyDiff(),
        addNodes: [newNode],
        addEdges: target
            ? [{ id: uuid(), from: target.id, to: newNode.id, type: 'prerequisite' }]
            : [],
    };

    return {
        id: uuid(),
        pathwayId: pathway.id,
        ownerDid,
        agent: AGENT_BY_CAPABILITY.planning,
        capability: 'planning',
        reason: 'A short reflection step will make the rest of this pathway more deliberate.',
        diff,
        status: 'open',
        createdAt: now,
        expiresAt: expiryFor(now, 7),
    };
};

const makeNudgingProposal = (
    { pathway, now, ownerDid }: MockAgentRequest,
): Proposal => {
    if (!pathway) {
        throw new Error('Nudging needs an active pathway');
    }

    const target = targetNodeFor(pathway);

    if (!target) {
        throw new Error('Nudging needs at least one node');
    }

    const diff: PathwayDiff = {
        ...emptyDiff(),
        updateNodes: [
            {
                id: target.id,
                stage: {
                    ...target.stage,
                    termination: {
                        kind: 'self-attest',
                        prompt: 'I took one small step on this today.',
                    },
                },
            },
        ],
    };

    return {
        id: uuid(),
        pathwayId: pathway.id,
        ownerDid,
        agent: AGENT_BY_CAPABILITY.nudging,
        capability: 'nudging',
        reason: 'A gentler termination prompt might lower the activation cost.',
        diff,
        status: 'open',
        createdAt: now,
        expiresAt: expiryFor(now, 3),
    };
};

const makeRoutingProposal = (
    { pathway, now, ownerDid }: MockAgentRequest,
): Proposal => {
    if (!pathway) {
        throw new Error('Routing needs an active pathway');
    }

    const target = targetNodeFor(pathway);

    const alt: PathwayNode = {
        id: uuid(),
        pathwayId: pathway.id,
        title: '(Alt route) Short written reflection',
        description: 'A lower-friction alternative if the current step has stalled.',
        stage: {
            initiation: [],
            policy: {
                kind: 'artifact',
                prompt: 'Write one paragraph covering the same ground.',
                expectedArtifact: 'text',
            },
            termination: { kind: 'self-attest', prompt: 'Alternative done.' },
        },
        endorsements: [],
        progress: {
            status: 'not-started',
            artifacts: [],
            reviewsDue: 0,
            streak: { current: 0, longest: 0 },
        },
        createdBy: 'agent',
        createdAt: now,
        updatedAt: now,
    };

    const diff: PathwayDiff = {
        ...emptyDiff(),
        addNodes: [alt],
        addEdges: target
            ? [{ id: uuid(), from: target.id, to: alt.id, type: 'alternative' }]
            : [],
    };

    return {
        id: uuid(),
        pathwayId: pathway.id,
        ownerDid,
        agent: AGENT_BY_CAPABILITY.routing,
        capability: 'routing',
        reason: "You've been here a while — here is a lighter alternative path.",
        diff,
        tradeoffs: [
            {
                dimension: 'effort',
                deltaDescription: 'Lower effort than the current route',
                direction: 'better',
            },
            {
                dimension: 'difficulty',
                deltaDescription: 'Less growth than the current route',
                direction: 'worse',
            },
        ],
        status: 'open',
        createdAt: now,
        expiresAt: expiryFor(now, 7),
    };
};

const makeMatchingProposal = (
    { now, ownerDid }: MockAgentRequest,
): Proposal => ({
    id: uuid(),
    pathwayId: null,
    ownerDid,
    agent: AGENT_BY_CAPABILITY.matching,
    capability: 'matching',
    reason: 'A matching opportunity outside your current pathway — worth a look.',
    diff: {
        ...emptyDiff(),
        newPathway: {
            title: 'Apply to one role this week',
            goal: 'Submit one tailored application by Friday',
        },
    },
    tradeoffs: [
        {
            dimension: 'time',
            deltaDescription: 'About 2 hours of focused work',
            direction: 'neutral',
        },
    ],
    status: 'open',
    createdAt: now,
    expiresAt: expiryFor(now, 14),
});

// -----------------------------------------------------------------
// Public entry
// -----------------------------------------------------------------

const builderFor = (capability: Capability) => {
    switch (capability) {
        case 'interpretation':
            return makeInterpretationProposal;
        case 'planning':
            return makePlanningProposal;
        case 'nudging':
            return makeNudgingProposal;
        case 'routing':
            return makeRoutingProposal;
        case 'matching':
            return makeMatchingProposal;
    }
};

export const runMockAgent = (request: MockAgentRequest): MockAgentResult => {
    const proposal = builderFor(request.capability)(request);

    // Fake cost: half the per-invocation ceiling. Good enough for dev
    // so the ledger moves but nothing looks out of whack.
    const ceiling = CAPABILITY_BUDGETS[request.capability].perInvocationCents;
    const costCents = Math.max(1, Math.round(ceiling * 0.5));

    return {
        proposal,
        costCents,
        latencyMs: 120,
        tokensIn: 400,
        tokensOut: 120,
    };
};

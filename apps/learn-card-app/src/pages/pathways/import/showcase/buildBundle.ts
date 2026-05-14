/**
 * buildBundle — shared assembler for showcase bundles.
 *
 * A showcase is a set of related pathways authored by slug that
 * reference each other via `composite` policies and
 * `pathway-completed` terminations. This module owns the two-phase
 * slug → UUID resolution that every showcase needs:
 *
 *   Phase 1: allocate a pathway id per spec (slug → id).
 *   Phase 2: allocate a node id per (pathway, slug) pair.
 *
 * Then realize each spec into a concrete `Pathway`, rewriting
 * `composite-ref` and `pathway-completed-ref` placeholders to the
 * concrete pathway ids from phase 1.
 *
 * Keeping the assembler here (rather than duplicating in every
 * showcase module) means new showcases only author *content* —
 * specs, slugs, edges — without re-writing the plumbing.
 */

import { seedChosenRoute } from '../../core/chosenRoute';
import type {
    AchievementProjection,
    Edge,
    Pathway,
    PathwayNode,
    Policy,
    Termination,
} from '../../types';
import { CURRENT_PATHWAY_SCHEMA_VERSION } from '../../types';

import type { BuildShowcaseOptions, ShowcaseBundle } from './types';

// ---------------------------------------------------------------------------
// Public spec shapes (what each showcase module authors)
// ---------------------------------------------------------------------------

/**
 * Composite-ref builder — describes "this node's policy is a
 * composite whose sub-pathway is identified by slug". The assembler
 * resolves the slug to a concrete pathway id at realization time.
 */
export type PolicyBuilder = {
    __kind: 'composite-ref';
    pathwaySlug: string;
    renderStyle?: 'inline-expandable' | 'link-out';
};

export type TerminationBuilder = {
    __kind: 'pathway-completed-ref';
    pathwaySlug: string;
};

export const compositeRef = (
    pathwaySlug: string,
    renderStyle: 'inline-expandable' | 'link-out' = 'inline-expandable',
): PolicyBuilder => ({
    __kind: 'composite-ref',
    pathwaySlug,
    renderStyle,
});

export const pathwayCompletedRef = (pathwaySlug: string): TerminationBuilder => ({
    __kind: 'pathway-completed-ref',
    pathwaySlug,
});

export interface NodeSpec {
    slug: string;
    title: string;
    description?: string;
    policy: Policy | PolicyBuilder;
    termination: Termination | TerminationBuilder;
    credentialProjection?: AchievementProjection;
    sourceUri?: string;
    sourceCtid?: string;
}

export interface EdgeSpec {
    from: string;
    to: string;
}

export interface PathwaySpec {
    slug: string;
    title: string;
    goal: string;
    nodes: NodeSpec[];
    edges: EdgeSpec[];
    destinationSlug?: string;
    /** Set when the pathway mirrors a real CE / Coursera / etc. resource. */
    sourceUri?: string;
    sourceCtid?: string;
}

// ---------------------------------------------------------------------------
// Shared policy / termination shorthands
//
// Every showcase uses these same helpers — keeping them here means
// a change to the default artifact type or the artifact-count
// signature only has to happen once.
// ---------------------------------------------------------------------------

export const artifactPolicy = (
    prompt: string,
    expectedArtifact: 'text' | 'link' | 'pdf' = 'text',
): Policy => ({
    kind: 'artifact',
    prompt,
    expectedArtifact,
});

export const practicePolicy = (
    frequency: 'daily' | 'weekly' | 'monthly' | 'ad-hoc',
    perPeriod: number = 1,
): Policy => ({
    kind: 'practice',
    cadence: { frequency, perPeriod },
    artifactTypes: ['text'],
});

/**
 * `review` policy — spaced-repetition step. FSRS params default to
 * zeros since the scheduler recalculates from learner activity; the
 * showcase doesn't need to pin specific stability / difficulty.
 */
export const reviewPolicy = (): Policy => ({
    kind: 'review',
    fsrs: { stability: 0, difficulty: 0 },
});

/**
 * `external` policy — reaches a tool outside the app via MCP.
 * Showcase authors pass the server + tool names they want the
 * learner's MCP client to launch.
 */
export const externalPolicy = (serverId: string, toolName: string): Policy => ({
    kind: 'external',
    mcp: { serverId, toolName },
});

/**
 * `assessment` policy — rubric-based evaluation. Criteria default
 * to an empty list since the showcase surfaces the framing, not the
 * rubric, but we accept an override so authors can demonstrate
 * weighted rubrics when that's the point of the pathway.
 */
export const assessmentPolicy = (
    criteria: { id: string; description: string; weight?: number }[] = [],
): Policy => ({
    kind: 'assessment',
    rubric: {
        criteria: criteria.map(c => ({
            id: c.id,
            description: c.description,
            weight: c.weight ?? 1,
        })),
    },
});

export const selfAttest = (prompt: string): Termination => ({
    kind: 'self-attest',
    prompt,
});

export const artifactCount = (
    count: number,
    artifactType: 'text' | 'link' | 'pdf' = 'text',
): Termination => ({
    kind: 'artifact-count',
    count,
    artifactType,
});

export const endorsement = (
    minEndorsers: number,
    trustedIssuers?: string[],
): Termination => ({
    kind: 'endorsement',
    minEndorsers,
    ...(trustedIssuers ? { trustedIssuers } : {}),
});

// ---------------------------------------------------------------------------
// ID factory
// ---------------------------------------------------------------------------

type IdFactory = () => string;

const defaultGenerateId: IdFactory = () => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
    }

    // Node-less fallback — in practice we always have crypto.randomUUID
    // in the browser and jsdom/vitest test environment.
    // eslint-disable-next-line no-console
    console.warn('[showcase] crypto.randomUUID unavailable; falling back to Math.random id');
    const part = () => Math.random().toString(16).slice(2, 10);
    return `${part()}-${part().slice(0, 4)}-${part().slice(0, 4)}-${part().slice(0, 4)}-${part()}${part().slice(0, 4)}`;
};

// ---------------------------------------------------------------------------
// Assembler
// ---------------------------------------------------------------------------

export interface AssembleOptions extends BuildShowcaseOptions {
    /** All pathway specs in the bundle. */
    specs: PathwaySpec[];
    /** The slug whose realized pathway should be returned as `primary`. */
    primarySlug: string;
    /** Stamped onto every pathway's `templateRef` so imports can be de-duped later. */
    templateRef: string;
}

/**
 * Resolve slug-keyed specs into a `ShowcaseBundle` with fresh UUIDs.
 * Throws on structurally invalid specs (unknown slug references,
 * missing primary) — these are author bugs we want to catch at
 * import time, not smear into the store.
 */
export const assembleBundle = (opts: AssembleOptions): ShowcaseBundle => {
    const {
        specs,
        primarySlug,
        templateRef,
        ownerDid,
        now = new Date().toISOString(),
        generateId = defaultGenerateId,
    } = opts;

    const primarySpec = specs.find(s => s.slug === primarySlug);
    if (!primarySpec) {
        throw new Error(
            `[showcase] primary slug "${primarySlug}" not found in specs: ${specs.map(s => s.slug).join(', ')}`,
        );
    }

    const pathwayIdBySlug: Record<string, string> = {};
    for (const s of specs) pathwayIdBySlug[s.slug] = generateId();

    const nodeIdKey = (pathwaySlug: string, nodeSlug: string) =>
        `${pathwaySlug}::${nodeSlug}`;
    const nodeIdByKey: Record<string, string> = {};
    for (const s of specs) {
        for (const n of s.nodes) nodeIdByKey[nodeIdKey(s.slug, n.slug)] = generateId();
    }

    const resolvePolicy = (builderOrPolicy: Policy | PolicyBuilder): Policy => {
        if ('__kind' in builderOrPolicy && builderOrPolicy.__kind === 'composite-ref') {
            const refPathwayId = pathwayIdBySlug[builderOrPolicy.pathwaySlug];

            if (!refPathwayId) {
                throw new Error(
                    `[showcase] composite ref to unknown pathway slug: ${builderOrPolicy.pathwaySlug}`,
                );
            }

            return {
                kind: 'composite',
                pathwayRef: refPathwayId,
                renderStyle: builderOrPolicy.renderStyle ?? 'inline-expandable',
            };
        }

        return builderOrPolicy as Policy;
    };

    const resolveTermination = (
        builderOrTermination: Termination | TerminationBuilder,
    ): Termination => {
        if (
            '__kind' in builderOrTermination
            && builderOrTermination.__kind === 'pathway-completed-ref'
        ) {
            const refPathwayId = pathwayIdBySlug[builderOrTermination.pathwaySlug];

            if (!refPathwayId) {
                throw new Error(
                    `[showcase] pathway-completed ref to unknown pathway slug: ${builderOrTermination.pathwaySlug}`,
                );
            }

            return { kind: 'pathway-completed', pathwayRef: refPathwayId };
        }

        return builderOrTermination as Termination;
    };

    const realize = (spec: PathwaySpec): Pathway => {
        const pathwayId = pathwayIdBySlug[spec.slug]!;

        const nodes: PathwayNode[] = spec.nodes.map(n => ({
            id: nodeIdByKey[nodeIdKey(spec.slug, n.slug)]!,
            pathwayId,
            title: n.title,
            description: n.description,
            stage: {
                initiation: [],
                policy: resolvePolicy(n.policy),
                termination: resolveTermination(n.termination),
            },
            credentialProjection: n.credentialProjection,
            endorsements: [],
            progress: {
                status: 'not-started',
                artifacts: [],
                reviewsDue: 0,
                streak: { current: 0, longest: 0 },
            },
            createdBy: 'template',
            createdAt: now,
            updatedAt: now,
            sourceUri: n.sourceUri,
            sourceCtid: n.sourceCtid,
        }));

        const edges: Edge[] = spec.edges.map(e => {
            const fromId = nodeIdByKey[nodeIdKey(spec.slug, e.from)];
            const toId = nodeIdByKey[nodeIdKey(spec.slug, e.to)];

            if (!fromId || !toId) {
                throw new Error(
                    `[showcase] edge references unknown slug in pathway "${spec.slug}": ${e.from} → ${e.to}`,
                );
            }

            return {
                id: generateId(),
                from: fromId,
                to: toId,
                type: 'prerequisite',
            };
        });

        const destinationNodeId = spec.destinationSlug
            ? nodeIdByKey[nodeIdKey(spec.slug, spec.destinationSlug)]
            : undefined;

        const pathway: Pathway = {
            id: pathwayId,
            ownerDid,
            revision: 0,
            schemaVersion: CURRENT_PATHWAY_SCHEMA_VERSION,
            title: spec.title,
            goal: spec.goal,
            nodes,
            edges,
            status: 'active',
            visibility: {
                self: true,
                mentors: false,
                guardians: false,
                publicProfile: false,
            },
            source: spec.sourceCtid ? 'ctdl-imported' : 'template',
            templateRef,
            destinationNodeId,
            sourceUri: spec.sourceUri,
            sourceCtid: spec.sourceCtid,
            createdAt: now,
            updatedAt: now,
        };

        // Seed chosenRoute now that the pathway shape is final. Showcases
        // always name a destination (that's the point — a destination is
        // what makes a showcase narratively coherent), so the seed will
        // typically produce a non-empty route covering every ancestor of
        // the destination. Authoring a showcase without a destination
        // falls back to no route, matching `instantiateTemplate`.
        const seededRoute = seedChosenRoute(pathway);

        return seededRoute.length > 0
            ? { ...pathway, chosenRoute: seededRoute }
            : pathway;
    };

    const primary = realize(primarySpec);
    const supporting: Pathway[] = specs
        .filter(s => s.slug !== primarySlug)
        .map(realize);

    return { primary, supporting };
};

/**
 * fromCtdlPathway — pure import function.
 *
 * Takes a parsed CTDL pathway graph (the root `ceterms:Pathway` plus
 * every referenced `ceterms:PathwayComponent`) and produces a
 * LearnCard `Pathway`.
 *
 * Design principles:
 *
 *   1. **Import is lossy-but-enrichable.** CTDL describes *what* a
 *      pathway contains (credentials, assessments, etc.); our CST
 *      primitive (initiation/policy/termination) describes *how* you
 *      walk it. The gap is closed by assigning sensible default stages
 *      based on the CTDL component type. The learner refines via Build
 *      mode. This is the "lossy default, Build refines" contract the
 *      user approved.
 *
 *   2. **Provenance is preserved.** Every imported node carries
 *      `sourceUri` (+`sourceCtid` when present) so the UI can render
 *      "from IMA's AI in Finance pathway", and a re-import can update
 *      rather than duplicate.
 *
 *   3. **Honest warnings instead of silent simplifications.** When
 *      CTDL features aren't yet supported (SelectionComponent,
 *      conditions other than AllOf, etc.), the import succeeds and
 *      the `warnings[]` array tells the caller what was simplified.
 *
 *   4. **Pure function.** No fetch, no stores, no randomness unless
 *      you pass your own `generateId`. Trivially testable. The network
 *      shell lives in `fetchCtdlPathway.ts`.
 *
 * References:
 *   - Architecture §3: CST primitive
 *   - Architecture §3.6: projection path (the mirror of this module)
 *   - CTDL Pathway Builder guide (see `ctdlTypes.ts`)
 */

import type {
    Cadence,
    Edge,
    Evidence,
    Pathway,
    PathwayNode,
    Policy,
    Termination,
} from '../types';

import {
    extractCtidFromUri,
    extractRefIds,
    getLocalizedString,
    getPathwayMemberRefs,
    type CtdlGraph,
    type CtdlPathway,
    type CtdlPathwayComponent,
} from './ctdlTypes';

// ---------------------------------------------------------------------------
// Public surface
// ---------------------------------------------------------------------------

export interface FromCtdlOptions {
    graph: CtdlGraph;
    ownerDid: string;
    /** ISO timestamp to stamp on every `createdAt` / `updatedAt`. */
    now: string;
    /**
     * UUID factory. Injected so tests can produce deterministic output;
     * production callers can omit and we fall back to `crypto.randomUUID`.
     */
    generateId?: () => string;
    preferredLocale?: string;
}

export interface FromCtdlResult {
    pathway: Pathway;
    /**
     * Map from every CTDL component's `@id` → the pathway-node UUID
     * we assigned it. Useful when the caller needs to correlate
     * imported nodes with the upstream CTDL source (e.g. to resolve
     * `ceterms:hasCondition` refs in a follow-up pass).
     */
    idMap: Record<string, string>;
    warnings: string[];
}

/**
 * Transform a CTDL pathway graph into a `Pathway`.
 */
export const fromCtdlPathway = (opts: FromCtdlOptions): FromCtdlResult => {
    const {
        graph,
        ownerDid,
        now,
        generateId = defaultGenerateId,
        preferredLocale = 'en-US',
    } = opts;

    const warnings: string[] = [];

    const pathwayId = generateId();
    const idMap: Record<string, string> = {};

    // ---------------------------------------------------------------
    // 1) Discover every component reachable from the pathway root.
    // ---------------------------------------------------------------
    //
    // CTDL leaves us free to include components the pathway never
    // references; we only import what's reachable via hasChild +
    // hasDestinationComponent from the root, to keep imports honest.
    const reachableIds = collectReachableComponentIds(graph);

    // Assign a fresh node UUID to every reachable component.
    for (const uri of reachableIds) {
        idMap[uri] = generateId();
    }

    // ---------------------------------------------------------------
    // 2) Build one `PathwayNode` per reachable component.
    // ---------------------------------------------------------------
    const nodes: PathwayNode[] = [];

    for (const uri of reachableIds) {
        const component = graph.components[uri];

        if (!component) {
            warnings.push(
                `Referenced component "${uri}" was not provided in the CTDL graph and has been skipped.`,
            );

            continue;
        }

        nodes.push(buildNode({
            pathwayId,
            nodeId: idMap[uri],
            component,
            preferredLocale,
            now,
            warnings,
        }));
    }

    // ---------------------------------------------------------------
    // 3) Build edges from hasChild relationships.
    // ---------------------------------------------------------------
    const edges: Edge[] = buildEdges({
        graph,
        idMap,
        generateId,
        warnings,
    });

    // ---------------------------------------------------------------
    // 4) Resolve the destination node.
    // ---------------------------------------------------------------
    const destinationRefs = extractRefIds(
        graph.pathway['ceterms:hasDestinationComponent'],
    );

    let destinationNodeId: string | undefined;

    if (destinationRefs.length === 0) {
        warnings.push(
            'No destination component found — this pathway has no terminal node.',
        );
    } else {
        if (destinationRefs.length > 1) {
            warnings.push(
                `Multiple destination components found (${destinationRefs.length}); using the first. Secondary destinations were dropped.`,
            );
        }

        destinationNodeId = idMap[destinationRefs[0]];
    }

    // ---------------------------------------------------------------
    // 5) Assemble the pathway shell.
    // ---------------------------------------------------------------
    const title = getLocalizedString(graph.pathway['ceterms:name'], preferredLocale)
        || 'Imported pathway';

    const description = getLocalizedString(
        graph.pathway['ceterms:description'],
        preferredLocale,
    );

    // Goal is derived from the destination's name when present (what
    // you're *earning*) because "AI in Finance Micro-credential
    // Certificate" reads as a goal better than "IMA - AI in Finance
    // Micro-credential" (which is the *pathway's* marketing title).
    const goal = (() => {
        if (destinationNodeId) {
            const destNode = nodes.find(n => n.id === destinationNodeId);

            if (destNode) return destNode.title;
        }

        return title;
    })();

    const ctid = graph.pathway['ceterms:ctid'] ?? extractCtidFromUri(graph.pathway['@id']);

    const pathway: Pathway = {
        id: pathwayId,
        ownerDid,
        title,
        goal,
        nodes,
        edges,
        status: 'active',
        visibility: {
            self: true,
            mentors: false,
            guardians: false,
            publicProfile: false,
        },
        source: 'ctdl-imported',
        templateRef: ctid,
        destinationNodeId,
        sourceUri: graph.pathway['@id'],
        sourceCtid: ctid,
        createdAt: now,
        updatedAt: now,
    };

    if (description) {
        // Description lives on the destination node's description by
        // default so it gets surfaced in NodeDetail; the pathway itself
        // doesn't have a description field.
        const destNode = pathway.nodes.find(n => n.id === destinationNodeId);

        if (destNode && !destNode.description) {
            destNode.description = description;
        }
    }

    return { pathway, idMap, warnings };
};

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

const defaultGenerateId = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    throw new Error(
        'fromCtdlPathway: crypto.randomUUID is unavailable; pass options.generateId explicitly.',
    );
};

/**
 * Breadth-first walk from the pathway root through `hasChild` and
 * `hasDestinationComponent`. Returns ids in deterministic order
 * (BFS, insertion-ordered) so downstream edge/node construction is
 * stable across runs.
 *
 * Two phases: (1) exhaust `hasChild` reachability first so ordering
 * reflects the natural sequence of the pathway, (2) then append any
 * destination components not already visited. This keeps the terminal
 * at the end of the node list — which is what consumers expect and
 * what makes the linear-pathway case read as a clean chain.
 */
const collectReachableComponentIds = (graph: CtdlGraph): string[] => {
    const visited = new Set<string>();
    const order: string[] = [];

    const walk = (seeds: string[]) => {
        const queue = [...seeds];

        while (queue.length > 0) {
            const uri = queue.shift()!;

            if (visited.has(uri)) continue;

            visited.add(uri);
            order.push(uri);

            const component = graph.components[uri];

            if (!component) continue;

            for (const childUri of extractRefIds(component['ceterms:hasChild'])) {
                if (!visited.has(childUri)) queue.push(childUri);
            }
        }
    };

    // Phase 1: walk every component referenced at the pathway root,
    // via `hasPart` (standard) or `hasChild` (legacy), exhaustively.
    walk(getPathwayMemberRefs(graph.pathway));

    // Phase 2: add destinations that weren't already reached via
    // hasChild. In a linear pathway the destination is typically the
    // tail of the hasChild chain and has already been visited — this
    // pass is a no-op there. In a fan-in pathway the destination is
    // standalone and gets appended last.
    walk(extractRefIds(graph.pathway['ceterms:hasDestinationComponent']));

    return order;
};

/**
 * Assemble every edge — both the explicit `component.hasChild`
 * relationships and the implicit fan-in from top-level pathway
 * children to the destination.
 */
interface BuildEdgesArgs {
    graph: CtdlGraph;
    idMap: Record<string, string>;
    generateId: () => string;
    warnings: string[];
}

const buildEdges = ({ graph, idMap, generateId, warnings }: BuildEdgesArgs): Edge[] => {
    const edges: Edge[] = [];
    const seen = new Set<string>(); // dedupe key "from->to"

    const pushEdge = (fromUri: string, toUri: string) => {
        const from = idMap[fromUri];
        const to = idMap[toUri];

        if (!from || !to) return;

        const key = `${from}->${to}`;

        if (seen.has(key)) return;

        seen.add(key);

        edges.push({
            id: generateId(),
            from,
            to,
            type: 'prerequisite',
        });
    };

    // Explicit hasChild edges: parent-component → child-component means
    // "complete parent first, then child becomes available." Our
    // `prerequisite` edge type encodes exactly that: from is a
    // prerequisite of to.
    for (const [uri, component] of Object.entries(graph.components)) {
        if (!idMap[uri]) continue; // component not reachable

        const children = extractRefIds(component['ceterms:hasChild']);

        for (const childUri of children) {
            if (!idMap[childUri]) continue;
            pushEdge(uri, childUri);
        }
    }

    // Implicit fan-in: every root-level member of the pathway flows
    // into the destination component, unless it already leads there
    // via a hasChild chain. This captures the common "complete all N
    // components to earn the destination credential" topology (the
    // IMA AI in Finance pathway is exactly this shape).
    const topLevel = getPathwayMemberRefs(graph.pathway);
    const destRefs = extractRefIds(graph.pathway['ceterms:hasDestinationComponent']);

    if (destRefs.length > 0 && topLevel.length > 0) {
        const destUri = destRefs[0]; // primary destination only

        for (const topUri of topLevel) {
            // Don't create a self-loop from the destination back to
            // itself — registries commonly list the destination as
            // both a `hasPart` member AND the `hasDestinationComponent`.
            if (topUri === destUri) continue;

            // If there's already a directed path topUri → destUri
            // in the edges we just built, don't add a redundant
            // direct edge. Otherwise the graph would have redundant
            // parallel edges that draw awkwardly on the map.
            if (hasPath(graph, topUri, destUri)) continue;

            pushEdge(topUri, destUri);
        }
    }

    if (edges.length === 0 && Object.keys(idMap).length > 1) {
        warnings.push(
            'Imported pathway has nodes but no explicit sequencing — all components are available in parallel.',
        );
    }

    return edges;
};

/**
 * Cheap DFS over `component.hasChild` edges to check whether there's
 * already a directed path `fromUri → toUri`. Used to avoid adding
 * redundant fan-in edges.
 */
const hasPath = (graph: CtdlGraph, fromUri: string, toUri: string): boolean => {
    if (fromUri === toUri) return true;

    const visited = new Set<string>();
    const stack: string[] = [fromUri];

    while (stack.length > 0) {
        const uri = stack.pop()!;

        if (visited.has(uri)) continue;

        visited.add(uri);

        const component = graph.components[uri];

        if (!component) continue;

        const children = extractRefIds(component['ceterms:hasChild']);

        for (const childUri of children) {
            if (childUri === toUri) return true;
            if (!visited.has(childUri)) stack.push(childUri);
        }
    }

    return false;
};

// ---------------------------------------------------------------------------
// Node construction & stage defaults
// ---------------------------------------------------------------------------

interface BuildNodeArgs {
    pathwayId: string;
    nodeId: string;
    component: CtdlPathwayComponent;
    preferredLocale: string;
    now: string;
    warnings: string[];
}

const buildNode = ({
    pathwayId,
    nodeId,
    component,
    preferredLocale,
    now,
    warnings,
}: BuildNodeArgs): PathwayNode => {
    const title = getLocalizedString(component['ceterms:name'], preferredLocale)
        || '(untitled component)';

    const description = getLocalizedString(
        component['ceterms:description'],
        preferredLocale,
    );

    const { policy, termination } = pickStageDefaults(component, warnings);

    const node: PathwayNode = {
        id: nodeId,
        pathwayId,
        title,
        description: description || undefined,
        stage: {
            initiation: [],
            policy,
            termination,
        },
        credentialProjection: buildProjection(component, title, description),
        endorsements: [],
        progress: {
            status: 'not-started',
            artifacts: [] as Evidence[],
            reviewsDue: 0,
            streak: { current: 0, longest: 0 },
        },
        createdBy: 'template',
        createdAt: now,
        updatedAt: now,
        sourceUri: component['@id'],
        sourceCtid:
            component['ceterms:ctid'] ?? extractCtidFromUri(component['@id']),
    };

    // Conditions beyond the simple fan-in model aren't supported yet.
    // Flag any condition refs so the caller knows what was dropped.
    const conditionRefs = extractRefIds(component['ceterms:hasCondition']);

    if (conditionRefs.length > 0) {
        warnings.push(
            `Component "${title}" has ${conditionRefs.length} condition(s) that were simplified to an AND of all children. N-of-M / alternate gating will arrive in a future version.`,
        );
    }

    return node;
};

/**
 * Pick a sensible `(policy, termination)` pair based on the CTDL
 * component's type. These are *defaults* — the learner is expected to
 * refine them in Build mode. The goal is that an imported pathway is
 * *walkable* the moment it lands, not *optimally* shaped.
 */
const pickStageDefaults = (
    component: CtdlPathwayComponent,
    warnings: string[],
): { policy: Policy; termination: Termination } => {
    const type = String(component['@type']);
    const title =
        getLocalizedString(component['ceterms:name']) || '(untitled)';

    const adHoc: Cadence = { frequency: 'ad-hoc', perPeriod: 1 };

    switch (type) {
        case 'ceterms:CredentialComponent':
            return {
                policy: {
                    kind: 'artifact',
                    prompt:
                        'Earn this credential and attach proof (a link to the badge, certificate PDF, or similar).',
                    expectedArtifact: 'link',
                },
                termination: {
                    kind: 'endorsement',
                    minEndorsers: 1,
                },
            };

        case 'ceterms:AssessmentComponent':
            return {
                policy: {
                    kind: 'assessment',
                    rubric: { criteria: [] },
                },
                termination: {
                    kind: 'assessment-score',
                    min: 70,
                },
            };

        case 'ceterms:CourseComponent':
            return {
                policy: {
                    kind: 'artifact',
                    prompt:
                        'Complete this course and attach the completion link or certificate.',
                    expectedArtifact: 'link',
                },
                termination: {
                    kind: 'artifact-count',
                    count: 1,
                    artifactType: 'link',
                },
            };

        case 'ceterms:CompetencyComponent':
            return {
                policy: {
                    kind: 'practice',
                    cadence: { frequency: 'weekly', perPeriod: 1 },
                    artifactTypes: ['text', 'link'],
                },
                termination: {
                    kind: 'self-attest',
                    prompt:
                        'I have demonstrated this competency with concrete evidence.',
                },
            };

        case 'ceterms:JobComponent':
            return {
                policy: {
                    kind: 'practice',
                    cadence: adHoc,
                    artifactTypes: ['text', 'link'],
                },
                termination: {
                    kind: 'self-attest',
                    prompt: 'I have reached this job / role milestone.',
                },
            };

        case 'ceterms:SelectionComponent':
            warnings.push(
                `Component "${title}" is a SelectionComponent ("pick N of these"); treated as a single basic step for now. Dedicated selection support lands in a future version.`,
            );

            return basicStage();

        case 'ceterms:ExtensionComponent':
            warnings.push(
                `Component "${title}" is an ExtensionComponent (custom CTDL extension); treated as a basic step for now.`,
            );

            return basicStage();

        case 'ceterms:BasicComponent':
        default:
            return basicStage();
    }
};

const basicStage = (): { policy: Policy; termination: Termination } => ({
    policy: {
        kind: 'practice',
        cadence: { frequency: 'ad-hoc', perPeriod: 1 },
        artifactTypes: ['text'],
    },
    termination: {
        kind: 'self-attest',
        prompt: 'I have completed this step.',
    },
});

/**
 * Derive an `AchievementProjection` (our OBv3 projection primitive)
 * from a CTDL component. Only credentialing components — those that
 * represent something the learner actually *earns* — get a projection.
 * Basic / Selection / Extension components are waypoints in the graph
 * but not directly issuable.
 */
const buildProjection = (
    component: CtdlPathwayComponent,
    title: string,
    description: string,
) => {
    const type = String(component['@type']);

    const issuable = new Set<string>([
        'ceterms:CredentialComponent',
        'ceterms:CourseComponent',
        'ceterms:AssessmentComponent',
    ]);

    if (!issuable.has(type)) return undefined;

    const achievementType = (() => {
        if (type === 'ceterms:CourseComponent') return 'Course';
        if (type === 'ceterms:AssessmentComponent') return 'Assessment';

        // For CredentialComponents, CTDL's `ceterms:credentialType`
        // ("Badge", "Certificate", "Diploma", ...) is closer to what
        // OBv3 wants than a generic "Achievement".
        const rawType = component['ceterms:credentialType'];

        if (rawType) {
            const typeArray = Array.isArray(rawType) ? rawType : [rawType];
            const firstType = typeArray[0];
            const typeString =
                typeof firstType === 'string'
                    ? firstType
                    : firstType && typeof firstType === 'object'
                        ? firstType['@id']
                        : undefined;

            if (typeString) {
                // Strip the CTDL prefix ("ceterms:Badge" → "Badge") and
                // strip URL prefixes if present.
                const cleaned = typeString
                    .replace(/^ceterms:/, '')
                    .replace(/^.*\//, '');

                if (cleaned) return cleaned;
            }
        }

        return 'Achievement';
    })();

    return {
        achievementType,
        criteria: description || `Complete the requirements for "${title}".`,
    };
};

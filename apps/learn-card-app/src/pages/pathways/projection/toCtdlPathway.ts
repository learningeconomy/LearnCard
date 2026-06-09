/**
 * toCtdlPathway — project a LearnCard `Pathway` into a CTDL JSON-LD
 * pathway graph suitable for publication to the Credential Engine
 * Registry.
 *
 * Mirrors `projection/toAchievementCredential.ts`: pure, dependency-free,
 * no network. Produces *unsigned* JSON-LD; the cryptographic step
 * (signing the publisher's commitment, minting CTIDs for new nodes)
 * happens elsewhere.
 *
 * Design notes:
 *
 *   - **Only issuable nodes become CredentialComponents.** Nodes with
 *     no `credentialProjection` are "waypoints" — they exist in our
 *     graph for the learner's benefit but don't correspond to anything
 *     publishable. They project as `BasicComponent` so the CTDL graph
 *     stays connected, but flagged in `warnings` so the caller knows.
 *
 *   - **Round-trip preserves provenance.** If a node was itself
 *     imported from CTDL (i.e. has `sourceCtid` / `sourceUri`), we
 *     re-use those identifiers on export. If it was learner-authored
 *     we mint fresh CTIDs (tagged as draft — the real CTID gets
 *     assigned by the registry on publication).
 *
 *   - **Destination is honored.** `pathway.destinationNodeId` → CTDL
 *     `ceterms:hasDestinationComponent`. Every *other* node becomes a
 *     top-level `ceterms:hasChild` of the pathway.
 *
 *   - **Edges round-trip.** Every `prerequisite` edge becomes a
 *     `hasChild` on the source component.
 */

import type { Pathway, PathwayNode } from '../types';

import {
    extractRefIds,
    type CtdlPathway,
    type CtdlPathwayComponent,
    type CtdlRef,
} from '../import/ctdlTypes';

export interface ToCtdlOptions {
    pathway: Pathway;
    /**
     * Base URI for minting new CTDL identifiers. Nodes that were
     * imported keep their `sourceUri`; nodes we author get a URI of
     * the form `${baseUri}/${ctid}`. Typical production value:
     * `"https://pathways.learncard.com/resources"`.
     */
    baseUri?: string;
}

export interface ToCtdlResult {
    graph: {
        pathway: CtdlPathway;
        components: Record<string, CtdlPathwayComponent>;
    };
    warnings: string[];
}

const DEFAULT_BASE_URI = 'https://pathways.learncard.com/resources';

/**
 * Project a `Pathway` into a CTDL graph.
 */
export const toCtdlPathway = (opts: ToCtdlOptions): ToCtdlResult => {
    const { pathway, baseUri = DEFAULT_BASE_URI } = opts;
    const warnings: string[] = [];

    // -----------------------------------------------------------------
    // 1) Assign every node a CTDL URI.
    //
    // Imported nodes re-use their `sourceUri`; authored nodes get a
    // URI derived from their CTID (pre-existing `sourceCtid` or a
    // draft CTID minted from the node UUID).
    // -----------------------------------------------------------------
    const uriByNodeId: Record<string, string> = {};
    const ctidByNodeId: Record<string, string> = {};

    for (const node of pathway.nodes) {
        const ctid = node.sourceCtid ?? `ce-draft-${node.id}`;
        const uri = node.sourceUri ?? `${baseUri}/${ctid}`;

        uriByNodeId[node.id] = uri;
        ctidByNodeId[node.id] = ctid;
    }

    // -----------------------------------------------------------------
    // 2) Project each node into a CTDL component.
    // -----------------------------------------------------------------
    const components: Record<string, CtdlPathwayComponent> = {};

    for (const node of pathway.nodes) {
        const uri = uriByNodeId[node.id];
        const component = projectNode({
            node,
            uri,
            ctid: ctidByNodeId[node.id],
            isDestination: node.id === pathway.destinationNodeId,
            warnings,
        });

        components[uri] = component;
    }

    // -----------------------------------------------------------------
    // 3) Edges → hasChild relationships on the source component.
    // -----------------------------------------------------------------
    for (const edge of pathway.edges) {
        if (edge.type !== 'prerequisite') {
            // v1 only exports strict prerequisite ordering. Alternative
            // / sibling / reinforces / satisfies edges have no direct
            // CTDL equivalent yet.
            warnings.push(
                `Edge of type "${edge.type}" was skipped (no CTDL equivalent). Consider expressing it as a prerequisite.`,
            );

            continue;
        }

        const fromUri = uriByNodeId[edge.from];
        const toUri = uriByNodeId[edge.to];

        if (!fromUri || !toUri) continue;

        const fromComponent = components[fromUri];

        if (!fromComponent) continue;

        const existing = toArray(fromComponent['ceterms:hasChild']);

        // Dedupe — an imported-then-edited pathway may contain both
        // the implicit fan-in edge AND an explicit component hasChild.
        // `extractRefIds` normalizes bare-string and object ref forms
        // so dedupe works regardless of what the registry sent us.
        const existingIds = extractRefIds(existing);

        if (!existingIds.includes(toUri)) {
            fromComponent['ceterms:hasChild'] = [...existing, { '@id': toUri }];
        }
    }

    // -----------------------------------------------------------------
    // 4) Build the pathway root.
    // -----------------------------------------------------------------
    const pathwayCtid = pathway.sourceCtid ?? `ce-draft-${pathway.id}`;
    const pathwayUri = pathway.sourceUri ?? `${baseUri}/${pathwayCtid}`;

    // Root-level `hasPart` is the **standard** CTDL vocabulary for
    // pathway membership — we emit that rather than `hasChild` so
    // round-tripped output matches what the Credential Engine Registry
    // actually publishes. The destination is still listed here: real
    // registry data treats the destination as *both* a member of
    // `hasPart` AND the value of `hasDestinationComponent`.
    const hasPart: CtdlRef[] = pathway.nodes.map(n => ({
        '@id': uriByNodeId[n.id],
    }));

    const destinationComponent: CtdlRef | undefined = pathway.destinationNodeId
        ? { '@id': uriByNodeId[pathway.destinationNodeId] }
        : undefined;

    if (!destinationComponent) {
        warnings.push(
            'Pathway has no destination node — CTDL consumers expect `ceterms:hasDestinationComponent`. Consider marking one node as the destination before publishing.',
        );
    }

    const ctdlPathway: CtdlPathway = {
        '@id': pathwayUri,
        '@type': 'ceterms:Pathway',
        'ceterms:ctid': pathwayCtid,
        'ceterms:name': { 'en-US': pathway.title },
        ...(pathway.goal ? { 'ceterms:description': { 'en-US': pathway.goal } } : {}),
        ...(hasPart.length > 0 ? { 'ceterms:hasPart': hasPart } : {}),
        ...(destinationComponent
            ? { 'ceterms:hasDestinationComponent': [destinationComponent] }
            : {}),
    };

    return {
        graph: {
            pathway: ctdlPathway,
            components,
        },
        warnings,
    };
};

// ---------------------------------------------------------------------------
// Component projection
// ---------------------------------------------------------------------------

interface ProjectNodeArgs {
    node: PathwayNode;
    uri: string;
    ctid: string;
    isDestination: boolean;
    warnings: string[];
}

const projectNode = ({
    node,
    uri,
    ctid,
    isDestination,
    warnings,
}: ProjectNodeArgs): CtdlPathwayComponent => {
    const typeUri = pickCtdlType(node, warnings);

    const component: CtdlPathwayComponent = {
        '@id': uri,
        '@type': typeUri,
        'ceterms:ctid': ctid,
        'ceterms:name': { 'en-US': node.title },
    };

    if (node.description) {
        component['ceterms:description'] = { 'en-US': node.description };
    }

    if (isDestination) {
        component['ceterms:componentCategory'] = 'Destination';
    }

    if (node.credentialProjection?.alignment?.length) {
        component['ceterms:targetCompetency'] = node.credentialProjection.alignment
            .map(a => (a.targetUrl ? { '@id': a.targetUrl } : a.targetName))
            .filter(
                (v): v is CtdlRef | string =>
                    typeof v === 'string'
                        ? v.length > 0
                        : !!v && typeof v === 'object' && v['@id'].length > 0,
            );
    }

    return component;
};

/**
 * Infer the CTDL component type from a node's projection + stage. The
 * mapping is the *inverse* of `pickStageDefaults` in `fromCtdlPathway`.
 *
 * We lean on `credentialProjection.achievementType` first because that
 * field is explicit. Stage-kind is the fallback.
 */
const pickCtdlType = (node: PathwayNode, warnings: string[]): string => {
    const achType = node.credentialProjection?.achievementType?.toLowerCase();

    if (achType) {
        if (achType === 'course') return 'ceterms:CourseComponent';
        if (achType === 'assessment') return 'ceterms:AssessmentComponent';
        if (/(badge|certificate|diploma|degree|license|credential)/.test(achType)) {
            return 'ceterms:CredentialComponent';
        }
    }

    switch (node.stage.policy.kind) {
        case 'assessment':
            return 'ceterms:AssessmentComponent';

        case 'artifact':
            // Artifact + endorsement termination ≈ credential.
            if (
                node.stage.termination.kind === 'endorsement' ||
                (node.credentialProjection && !achType)
            ) {
                return 'ceterms:CredentialComponent';
            }

            return 'ceterms:CourseComponent';

        case 'review':
            warnings.push(
                `Node "${node.title}" has a review (FSRS) policy that has no direct CTDL analog; projected as a CompetencyComponent.`,
            );

            return 'ceterms:CompetencyComponent';

        case 'composite':
            // Composite nodes point at another LearnCard pathway. The
            // current CTDL export pass is flat — we project the node
            // as a BasicComponent so the graph stays connected, but
            // the reference to the nested pathway is *lost*. Emitting
            // a specific warning (rather than swallowing it in the
            // default case) makes the loss visible to authors at
            // publish time, and serves as a pin for the nested-export
            // follow-up (todo pE-ctdl).
            warnings.push(
                `Node "${node.title}" composites pathway ${node.stage.policy.pathwayRef}; ` +
                    `nested pathway export is not yet supported, so the reference is dropped from the CTDL projection.`,
            );

            return 'ceterms:BasicComponent';

        case 'practice':
        case 'external':
        default:
            return 'ceterms:BasicComponent';
    }
};

// ---------------------------------------------------------------------------
// Tiny helpers
// ---------------------------------------------------------------------------

/**
 * Normalize a CTDL list field to an array we can freely spread/push.
 */
const toArray = <T>(value: T | T[] | undefined): T[] => {
    if (value === undefined) return [];

    return Array.isArray(value) ? value : [value];
};

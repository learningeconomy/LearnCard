/**
 * Dev seed — instantiate curated templates so local testing doesn't
 * require clicking through onboarding every time.
 *
 * Seeds two pathways:
 *   1. The first curated template (primary demo pathway).
 *   2. A small "parent" pathway that composites #1 as its destination,
 *      exercising the composite/nested-pathway primitive end-to-end
 *      (PathwaySwitcher, CompositeNodeBody, rollupCompositeProgress,
 *      Map composite badge).
 *
 * Callers guard with `import.meta.env.DEV`. This is not a product
 * behavior; it is scaffolding purely for the local dev loop.
 */

import { pathwayStore } from '../../../stores/pathways';
import { addNode, setPolicy, setTermination } from '../build/buildOps';
import type { Pathway } from '../types';

import { CURATED_TEMPLATES, instantiateTemplate } from '../onboard/templates';

/**
 * Build a small parent pathway that references `child` via a composite
 * (inline-expandable) node. Used to demo nested pathways in dev.
 * Pure — no store access, no I/O.
 */
const buildCompositeParent = (child: Pathway, ownerDid: string, now: string): Pathway => {
    // Seed the parent with a single placeholder node via `addNode` so
    // node id, pathway id, createdAt/updatedAt, and defaults all come
    // from the same helper used everywhere else in Build mode.
    const seed: Pathway = {
        id: crypto.randomUUID(),
        ownerDid,
        title: 'Demo: Nested pathway parent',
        goal: `Complete "${child.title}" and reflect on it`,
        nodes: [],
        edges: [],
        status: 'active',
        visibility: { self: true, mentors: false, guardians: false, publicProfile: false },
        source: 'authored',
        createdAt: now,
        updatedAt: now,
    };

    // Step 1: composite node referencing the child pathway. Using
    // setPolicy + setTermination atomically upholds the composite
    // invariant (policy.kind === 'composite' ⇔ termination.kind ===
    // 'pathway-completed' + matching refs).
    let next = addNode(seed, {
        title: `Finish ${child.title}`,
        description: `Complete the nested "${child.title}" pathway to unlock the reflection step.`,
    });

    const compositeNode = next.nodes[next.nodes.length - 1];

    next = setPolicy(next, compositeNode.id, {
        kind: 'composite',
        pathwayRef: child.id,
        renderStyle: 'inline-expandable',
    });

    next = setTermination(next, compositeNode.id, {
        kind: 'pathway-completed',
        pathwayRef: child.id,
    });

    // Step 2: a simple reflection node, gated behind the composite.
    next = addNode(next, {
        title: 'Write a one-paragraph reflection',
        description: 'What surprised you while completing the nested pathway?',
    });

    const reflectionNode = next.nodes[next.nodes.length - 1];

    // Prerequisite edge: reflection depends on composite completion.
    next = {
        ...next,
        edges: [
            ...next.edges,
            {
                id: crypto.randomUUID(),
                from: compositeNode.id,
                to: reflectionNode.id,
                type: 'prerequisite',
            },
        ],
        destinationNodeId: reflectionNode.id,
    };

    return next;
};

export const seedDemoPathwayIfEmpty = (learnerDid: string): void => {
    const hasAny = Object.keys(pathwayStore.get.pathways()).length > 0;

    if (hasAny) return;

    const template = CURATED_TEMPLATES[0];
    const now = new Date().toISOString();

    const pathway = instantiateTemplate(template, { ownerDid: learnerDid, now });

    // Upsert the child first so the parent's composite ref is
    // resolvable from the moment the parent lands in the store.
    pathwayStore.set.upsertPathway(pathway);

    const parent = buildCompositeParent(pathway, learnerDid, now);

    pathwayStore.set.upsertPathway(parent);

    // Keep the child pathway as the active one — learners land on
    // the "real" demo, while PathwaySwitcher exposes the composite
    // parent one dropdown click away.
    pathwayStore.set.setActivePathway(pathway.id);
};

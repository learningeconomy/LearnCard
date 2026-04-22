/**
 * Structural tests for the showcase bundle. The bundle itself is
 * hand-authored content, so we don't assert prose or specific
 * narrative choices here — we verify the **structural invariants**
 * that the rest of the system assumes:
 *
 *   1. Every composite policy resolves to a pathway that exists in
 *      the returned bundle (no dangling refs).
 *   2. Every `pathway-completed` termination lines up with its
 *      composite policy's ref (the pair is authored consistently).
 *   3. The validator passes on every pathway (no cycles, no duplicate
 *      ids, every edge endpoint exists).
 *   4. The collection detector picks up the two intended shared-prereq
 *      groups (portfolio → 4 algos, math-refresher → 5 badges).
 *   5. Route computation from the primary pathway's first step reaches
 *      its destination without error.
 *   6. Two calls with the same id factory produce deep-equal bundles
 *      (pure function, deterministic under id injection).
 */

import { describe, expect, it } from 'vitest';

import { PathwaySchema } from '../../types';
import { validatePathway } from '../../core/graphOps';
import { detectCollections } from '../../map/collectionDetection';
import { computeSuggestedRoute } from '../../map/route';

import {
    SHOWCASE_PREVIEW,
    SHOWCASE_TEMPLATE_REF,
    buildShowcase,
} from './buildShowcase';

const NOW = '2026-04-21T00:00:00.000Z';

/**
 * Deterministic id factory: `uuid-0`, `uuid-1`, … Each id is a valid
 * UUID v4 shape so the Zod schema accepts it.
 */
const makeDeterministicFactory = () => {
    let n = 0;
    return () => {
        const hex = (n++).toString(16).padStart(12, '0');
        // Fixed-shape UUID v4-looking string: xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx
        return `00000000-0000-4000-8000-${hex}`;
    };
};

describe('buildShowcase', () => {
    it('returns one primary + three supporting pathways', () => {
        const { primary, supporting } = buildShowcase({
            ownerDid: 'did:example:learner',
            now: NOW,
            generateId: makeDeterministicFactory(),
        });

        expect(primary).toBeDefined();
        expect(supporting).toHaveLength(3);

        // Primary is the "Senior Year" plan — the learner's landing
        // pathway.
        expect(primary.title).toBe(SHOWCASE_PREVIEW.title);
        expect(primary.templateRef).toBe(SHOWCASE_TEMPLATE_REF);
    });

    it('produces Zod-valid pathways across the whole bundle', () => {
        const { primary, supporting } = buildShowcase({
            ownerDid: 'did:example:learner',
            now: NOW,
            generateId: makeDeterministicFactory(),
        });

        for (const p of [primary, ...supporting]) {
            const result = PathwaySchema.safeParse(p);

            if (!result.success) {
                // Surface the Zod issues in-line so CI output is
                // immediately actionable.
                throw new Error(
                    `Pathway "${p.title}" failed schema:\n${JSON.stringify(result.error.issues, null, 2)}`,
                );
            }

            expect(result.success).toBe(true);
        }
    });

    it('passes structural validation (no cycles, no dangling edges)', () => {
        const { primary, supporting } = buildShowcase({
            ownerDid: 'did:example:learner',
            now: NOW,
            generateId: makeDeterministicFactory(),
        });

        for (const p of [primary, ...supporting]) {
            const issues = validatePathway(p);

            if (issues.length > 0) {
                throw new Error(
                    `Pathway "${p.title}" has validation issues: ${JSON.stringify(issues, null, 2)}`,
                );
            }

            expect(issues).toEqual([]);
        }
    });

    it('wires every composite policy + pathway-completed pair to a pathway in the bundle', () => {
        const { primary, supporting } = buildShowcase({
            ownerDid: 'did:example:learner',
            now: NOW,
            generateId: makeDeterministicFactory(),
        });

        const all = [primary, ...supporting];
        const pathwayIds = new Set(all.map(p => p.id));

        for (const p of all) {
            for (const node of p.nodes) {
                if (node.stage.policy.kind === 'composite') {
                    expect(pathwayIds.has(node.stage.policy.pathwayRef)).toBe(true);
                }

                if (node.stage.termination.kind === 'pathway-completed') {
                    expect(pathwayIds.has(node.stage.termination.pathwayRef)).toBe(true);
                }

                // Paired invariant: composite policy and
                // pathway-completed termination must point at the
                // same pathway — otherwise the node would be
                // satisfied by a different pathway than it claims to
                // embed, which is a bug.
                if (
                    node.stage.policy.kind === 'composite'
                    && node.stage.termination.kind === 'pathway-completed'
                ) {
                    expect(node.stage.policy.pathwayRef).toBe(
                        node.stage.termination.pathwayRef,
                    );
                }
            }
        }
    });

    it('detects the two intended shared-prereq collections', () => {
        const { supporting } = buildShowcase({
            ownerDid: 'did:example:learner',
            now: NOW,
            generateId: makeDeterministicFactory(),
        });

        // Future Ready (SD) — portfolio → 4 algo practices.
        const sd = supporting.find(p => p.title.includes('Future Ready'));
        if (!sd) throw new Error('Future Ready pathway missing from bundle');

        const sdGroups = detectCollections(sd);
        expect(sdGroups).toHaveLength(1);
        expect(sdGroups[0].memberIds).toHaveLength(4);
        expect(sdGroups[0].sharedPrereqIds).toHaveLength(1);

        // AI in Finance — math-refresher → 5 badges.
        const aif = supporting.find(p => p.title.includes('AI in Finance'));
        if (!aif) throw new Error('AI in Finance pathway missing from bundle');

        const aifGroups = detectCollections(aif);
        expect(aifGroups).toHaveLength(1);
        expect(aifGroups[0].memberIds).toHaveLength(5);
        expect(aifGroups[0].sharedPrereqIds).toHaveLength(1);
    });

    it('primary pathway sets a destination and can be routed', () => {
        const { primary } = buildShowcase({
            ownerDid: 'did:example:learner',
            now: NOW,
            generateId: makeDeterministicFactory(),
        });

        expect(primary.destinationNodeId).toBeDefined();

        // Route from the first node (should be the "Research" leaf)
        // to the destination. Should succeed and include every
        // uncompleted node on the path.
        const firstNodeId = primary.nodes[0]!.id;
        const route = computeSuggestedRoute(primary, firstNodeId);

        expect(route).not.toBeNull();
        expect(route!.destinationId).toBe(primary.destinationNodeId);
        // Route should include the focus + the destination at minimum.
        expect(route!.nodeIds.length).toBeGreaterThanOrEqual(2);
        expect(route!.nodeIds[0]).toBe(firstNodeId);
        expect(route!.nodeIds[route!.nodeIds.length - 1]).toBe(
            primary.destinationNodeId,
        );
    });

    it('is pure under a deterministic id factory (two calls are deep-equal)', () => {
        const a = buildShowcase({
            ownerDid: 'did:example:learner',
            now: NOW,
            generateId: makeDeterministicFactory(),
        });

        const b = buildShowcase({
            ownerDid: 'did:example:learner',
            now: NOW,
            generateId: makeDeterministicFactory(),
        });

        expect(a.primary).toEqual(b.primary);
        expect(a.supporting).toEqual(b.supporting);
    });

    it('uses fresh UUIDs on each call when no factory is injected', () => {
        // Production usage: two back-to-back imports should not
        // produce overlapping ids — otherwise upserting a second
        // bundle would silently overwrite the first.
        const a = buildShowcase({
            ownerDid: 'did:example:learner',
            now: NOW,
        });

        const b = buildShowcase({
            ownerDid: 'did:example:learner',
            now: NOW,
        });

        expect(a.primary.id).not.toBe(b.primary.id);
        expect(a.supporting[0].id).not.toBe(b.supporting[0].id);
    });

    it('SHOWCASE_PREVIEW totals match the realized bundle size', () => {
        const { primary, supporting } = buildShowcase({
            ownerDid: 'did:example:learner',
            now: NOW,
            generateId: makeDeterministicFactory(),
        });

        const realizedTotal =
            primary.nodes.length
            + supporting.reduce((sum, p) => sum + p.nodes.length, 0);

        expect(realizedTotal).toBe(SHOWCASE_PREVIEW.totalStepCount);
        expect(supporting.length).toBe(SHOWCASE_PREVIEW.subPathwayCount);
    });
});

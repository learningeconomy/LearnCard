/**
 * Structural tests for the Smart Start showcase bundle.
 *
 * Mirrors the invariants enforced on the Senior Year showcase (Zod
 * parity, graph validity, composite-ref integrity, pure under
 * deterministic id factory) plus a handful of Smart-Start-specific
 * assertions: the employer-alignment ref is attached to every
 * Coursera module badge, the partner-review node carries the
 * d.school/Cambridge/WestEd trusted-issuer list, and the primary
 * pathway terminates in a single node fed by both the college and
 * employer tracks.
 */

import { describe, expect, it } from 'vitest';

import { PathwaySchema } from '../../types';
import { validatePathway } from '../../core/graphOps';
import { detectCollections } from '../../map/collectionDetection';
import { computeSuggestedRoute } from '../../map/route';

import {
    SMART_START_PREVIEW,
    SMART_START_SHOWCASE,
    SMART_START_TEMPLATE_REF,
    buildSmartStartShowcase,
} from './smartStartShowcase';

const NOW = '2026-04-21T00:00:00.000Z';

const makeDeterministicFactory = () => {
    let n = 0;
    return () => {
        const hex = (n++).toString(16).padStart(12, '0');
        return `00000000-0000-4000-8000-${hex}`;
    };
};

describe('buildSmartStartShowcase', () => {
    it('returns one primary + three supporting pathways', () => {
        const { primary, supporting } = buildSmartStartShowcase({
            ownerDid: 'did:example:learner',
            now: NOW,
            generateId: makeDeterministicFactory(),
        });

        expect(primary).toBeDefined();
        expect(supporting).toHaveLength(3);

        expect(primary.title).toBe(SMART_START_PREVIEW.title);
        expect(primary.templateRef).toBe(SMART_START_TEMPLATE_REF);
    });

    it('produces Zod-valid pathways across the whole bundle', () => {
        const { primary, supporting } = buildSmartStartShowcase({
            ownerDid: 'did:example:learner',
            now: NOW,
            generateId: makeDeterministicFactory(),
        });

        for (const p of [primary, ...supporting]) {
            const result = PathwaySchema.safeParse(p);

            if (!result.success) {
                throw new Error(
                    `Pathway "${p.title}" failed schema:\n${JSON.stringify(result.error.issues, null, 2)}`,
                );
            }

            expect(result.success).toBe(true);
        }
    });

    it('passes structural validation (no cycles, no dangling edges)', () => {
        const { primary, supporting } = buildSmartStartShowcase({
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

    it('wires every composite / pathway-completed pair consistently', () => {
        const { primary, supporting } = buildSmartStartShowcase({
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

                // Composite + pathway-completed pair on the same node
                // must target the same sub-pathway — otherwise the
                // node would claim to embed X but be satisfied by Y.
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

    it('detects the WEF-module shared-prereq collection (4 badges)', () => {
        const { supporting } = buildSmartStartShowcase({
            ownerDid: 'did:example:learner',
            now: NOW,
            generateId: makeDeterministicFactory(),
        });

        const wef = supporting.find(p => p.title.startsWith('WEF Smart Start'));
        if (!wef) throw new Error('WEF modules pathway missing from bundle');

        const groups = detectCollections(wef);
        expect(groups).toHaveLength(1);
        expect(groups[0].memberIds).toHaveLength(4);
        // Orientation is the single upstream prereq gating all four.
        expect(groups[0].sharedPrereqIds).toHaveLength(1);
    });

    it('every Coursera module badge carries the WEF employer alignment', () => {
        const { supporting } = buildSmartStartShowcase({
            ownerDid: 'did:example:learner',
            now: NOW,
            generateId: makeDeterministicFactory(),
        });

        const wef = supporting.find(p => p.title.startsWith('WEF Smart Start'));
        if (!wef) throw new Error('WEF modules pathway missing from bundle');

        // Only nodes that represent earned badges (digital-badge
        // projection) must carry the alignment — the orientation
        // node and the certificate itself are intentionally exempt.
        const badgeNodes = wef.nodes.filter(
            n => n.credentialProjection?.achievementType === 'digital-badge',
        );

        // Four foundational badges.
        expect(badgeNodes).toHaveLength(4);

        for (const node of badgeNodes) {
            const alignment = node.credentialProjection?.alignment ?? [];
            expect(alignment.length).toBeGreaterThan(0);
            expect(alignment[0].targetFramework).toContain('Smart Start');
        }
    });

    it('partner-research review node lists d.school / Cambridge / WestEd as trusted issuers', () => {
        const { primary } = buildSmartStartShowcase({
            ownerDid: 'did:example:learner',
            now: NOW,
            generateId: makeDeterministicFactory(),
        });

        const review = primary.nodes.find(n => n.title.includes('research review'));
        if (!review) throw new Error('research-review node missing from primary');

        expect(review.stage.termination.kind).toBe('endorsement');

        if (review.stage.termination.kind !== 'endorsement') {
            throw new Error('narrowing unreachable');
        }

        const trusted = review.stage.termination.trustedIssuers ?? [];
        expect(trusted).toContain('did:example:dschool');
        expect(trusted).toContain('did:example:cambridge');
        expect(trusted).toContain('did:example:wested');
    });

    it('primary destination is fed by both the college AND employer tracks', () => {
        const { primary } = buildSmartStartShowcase({
            ownerDid: 'did:example:learner',
            now: NOW,
            generateId: makeDeterministicFactory(),
        });

        const destId = primary.destinationNodeId;
        expect(destId).toBeDefined();

        // Every edge that points at the destination — both college
        // and employer tracks should contribute one. That's the
        // "dual-track destinations that converge" shape we promise
        // on the showcase card.
        const incoming = primary.edges.filter(e => e.to === destId);
        expect(incoming.length).toBe(2);

        // Those two incoming sources should be the college-apps and
        // employer-apps composite nodes (identify via their
        // composite policy pointing at the supporting pathways).
        const sourceNodes = incoming
            .map(e => primary.nodes.find(n => n.id === e.from))
            .filter((n): n is NonNullable<typeof n> => !!n);

        expect(sourceNodes).toHaveLength(2);

        for (const n of sourceNodes) {
            expect(n.stage.policy.kind).toBe('composite');
        }
    });

    it('primary pathway routes from first step to destination', () => {
        const { primary } = buildSmartStartShowcase({
            ownerDid: 'did:example:learner',
            now: NOW,
            generateId: makeDeterministicFactory(),
        });

        const firstNodeId = primary.nodes[0]!.id;
        const route = computeSuggestedRoute(primary, firstNodeId);

        expect(route).not.toBeNull();
        expect(route!.destinationId).toBe(primary.destinationNodeId);
        expect(route!.nodeIds[0]).toBe(firstNodeId);
        expect(route!.nodeIds[route!.nodeIds.length - 1]).toBe(
            primary.destinationNodeId,
        );
    });

    it('is pure under a deterministic id factory (two calls are deep-equal)', () => {
        const a = buildSmartStartShowcase({
            ownerDid: 'did:example:learner',
            now: NOW,
            generateId: makeDeterministicFactory(),
        });

        const b = buildSmartStartShowcase({
            ownerDid: 'did:example:learner',
            now: NOW,
            generateId: makeDeterministicFactory(),
        });

        expect(a.primary).toEqual(b.primary);
        expect(a.supporting).toEqual(b.supporting);
    });

    it('uses fresh UUIDs on each call when no factory is injected', () => {
        const a = buildSmartStartShowcase({
            ownerDid: 'did:example:learner',
            now: NOW,
        });

        const b = buildSmartStartShowcase({
            ownerDid: 'did:example:learner',
            now: NOW,
        });

        expect(a.primary.id).not.toBe(b.primary.id);
        expect(a.supporting[0].id).not.toBe(b.supporting[0].id);
    });

    it('SMART_START_PREVIEW totals match the realized bundle', () => {
        const { primary, supporting } = buildSmartStartShowcase({
            ownerDid: 'did:example:learner',
            now: NOW,
            generateId: makeDeterministicFactory(),
        });

        const realizedTotal =
            primary.nodes.length
            + supporting.reduce((sum, p) => sum + p.nodes.length, 0);

        expect(realizedTotal).toBe(SMART_START_PREVIEW.totalStepCount);
        expect(supporting.length).toBe(SMART_START_PREVIEW.subPathwayCount);
    });

    it('SMART_START_SHOWCASE exports a definition wrapping build + preview', () => {
        expect(SMART_START_SHOWCASE.id).toBe(SMART_START_TEMPLATE_REF);
        expect(SMART_START_SHOWCASE.preview).toBe(SMART_START_PREVIEW);

        // The definition's build function is the same function,
        // so calling it via the definition must produce an
        // equivalent shape.
        const bundleViaDefinition = SMART_START_SHOWCASE.build({
            ownerDid: 'did:example:learner',
            now: NOW,
            generateId: makeDeterministicFactory(),
        });

        const bundleDirect = buildSmartStartShowcase({
            ownerDid: 'did:example:learner',
            now: NOW,
            generateId: makeDeterministicFactory(),
        });

        expect(bundleViaDefinition).toEqual(bundleDirect);
    });
});

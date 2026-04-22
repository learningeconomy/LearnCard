/**
 * Structural tests for the What-If showcase bundle.
 *
 * Covers the usual showcase invariants (Zod parity, graph validity,
 * composite-ref integrity, pure under a deterministic id factory,
 * preview totals match the realized bundle), plus the assertion
 * that makes this showcase worth shipping: every What-If scenario
 * generator fires against the realized primary pathway. If any
 * generator ever stops emitting for this bundle, that's a signal
 * to either revisit the showcase's shape or acknowledge that the
 * generator's preconditions have drifted.
 */

import { describe, expect, it } from 'vitest';

import { validatePathway } from '../../core/graphOps';
import { computeSuggestedRoute } from '../../map/route';
import { PathwaySchema } from '../../types';
import { generateScenarios } from '../../what-if/generators';

import {
    WHAT_IF_PREVIEW,
    WHAT_IF_SHOWCASE,
    buildWhatIfShowcase,
} from './whatIfShowcase';

const NOW = '2026-04-21T00:00:00.000Z';

const makeDeterministicFactory = () => {
    let n = 0;
    return () => {
        const hex = (n++).toString(16).padStart(12, '0');
        return `00000000-0000-4000-8000-${hex}`;
    };
};

describe('buildWhatIfShowcase', () => {
    it('returns one primary + one supporting pathway', () => {
        const { primary, supporting } = buildWhatIfShowcase({
            ownerDid: 'did:example:learner',
            now: NOW,
            generateId: makeDeterministicFactory(),
        });

        expect(primary).toBeDefined();
        expect(supporting).toHaveLength(1);

        expect(primary.title).toBe(WHAT_IF_PREVIEW.title);
        expect(primary.templateRef).toBe(WHAT_IF_SHOWCASE.id);
        expect(supporting[0]!.title).toBe('Statistics Foundations');
    });

    it('produces Zod-valid pathways across the whole bundle', () => {
        const { primary, supporting } = buildWhatIfShowcase({
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
        const { primary, supporting } = buildWhatIfShowcase({
            ownerDid: 'did:example:learner',
            now: NOW,
            generateId: makeDeterministicFactory(),
        });

        for (const p of [primary, ...supporting]) {
            const issues = validatePathway(p);

            expect(issues).toEqual([]);
        }
    });

    it('resolves every composite ref to a supporting pathway in the bundle', () => {
        const { primary, supporting } = buildWhatIfShowcase({
            ownerDid: 'did:example:learner',
            now: NOW,
            generateId: makeDeterministicFactory(),
        });

        const supportingIds = new Set(supporting.map(s => s.id));

        for (const node of primary.nodes) {
            if (node.stage.policy.kind === 'composite') {
                expect(supportingIds.has(node.stage.policy.pathwayRef)).toBe(true);
            }
            if (node.stage.termination.kind === 'pathway-completed') {
                expect(supportingIds.has(node.stage.termination.pathwayRef)).toBe(
                    true,
                );
            }
        }
    });

    it('sets a destination that every other primary node can reach', () => {
        const { primary } = buildWhatIfShowcase({
            ownerDid: 'did:example:learner',
            now: NOW,
            generateId: makeDeterministicFactory(),
        });

        expect(primary.destinationNodeId).toBeDefined();

        // Pick a non-destination focus; the route should be computable.
        const nonDest = primary.nodes.find(
            n => n.id !== primary.destinationNodeId,
        )!;

        const route = computeSuggestedRoute(primary, nonDest.id);

        expect(route).not.toBeNull();
        expect(route!.destinationId).toBe(primary.destinationNodeId);
    });

    it('fires every What-If generator against the primary pathway', () => {
        // The whole point of this showcase — scenarios should light up.
        const { primary } = buildWhatIfShowcase({
            ownerDid: 'did:example:learner',
            now: NOW,
            generateId: makeDeterministicFactory(),
        });

        const kinds = new Set(generateScenarios(primary).map(s => s.kind));

        expect(kinds.has('fast-track')).toBe(true);
        expect(kinds.has('deep-practice')).toBe(true);
        expect(kinds.has('external-light')).toBe(true);
        expect(kinds.has('composite-bypass')).toBe(true);
        expect(kinds.has('destination-only')).toBe(true);
    });

    it('preview totals match the realized bundle', () => {
        const { primary, supporting } = buildWhatIfShowcase({
            ownerDid: 'did:example:learner',
            now: NOW,
            generateId: makeDeterministicFactory(),
        });

        const realizedStepCount =
            primary.nodes.length +
            supporting.reduce((sum, s) => sum + s.nodes.length, 0);

        expect(WHAT_IF_PREVIEW.totalStepCount).toBe(realizedStepCount);
        expect(WHAT_IF_PREVIEW.subPathwayCount).toBe(supporting.length);
    });

    it('is pure under a deterministic id factory', () => {
        const a = buildWhatIfShowcase({
            ownerDid: 'did:example:learner',
            now: NOW,
            generateId: makeDeterministicFactory(),
        });
        const b = buildWhatIfShowcase({
            ownerDid: 'did:example:learner',
            now: NOW,
            generateId: makeDeterministicFactory(),
        });

        expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    });
});

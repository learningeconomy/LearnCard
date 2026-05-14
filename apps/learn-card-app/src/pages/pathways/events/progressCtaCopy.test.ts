/**
 * Unit coverage for `progressCtaCopy` — the pure helpers that
 * classify pathway-progress dispatches into tiers and resolve the
 * corresponding CTA copy.
 *
 * The component that calls these helpers is purely presentational;
 * if this file is green, the rendered CTA is right by construction.
 */

import { describe, expect, it } from 'vitest';

import type { Pathway, PathwayNode } from '../types';

import {
    computeProgressTier,
    humanizeNodeTitle,
    resolveCtaCopy,
} from './progressCtaCopy';
import type {
    AffectedNode,
    AffectedOutcome,
} from './usePathwayProgressForCredential';

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

/**
 * Build a minimal node fixture for tier-computation tests. Only the
 * `progress.status` field matters for `computeProgressTier`, so we
 * cast through `unknown` rather than spelling the full `PathwayNode`
 * shape — the function under test touches exactly what we populate.
 */
const makeNode = (
    id: string,
    status: PathwayNode['progress']['status'] = 'not-started',
): Pick<PathwayNode, 'id' | 'progress'> => {
    return {
        id,
        progress: {
            status,
            artifacts: [],
            reviewsDue: 0,
            streak: { current: 0, longest: 0 },
        },
    } as unknown as Pick<PathwayNode, 'id' | 'progress'>;
};

const makePathway = (
    id: string,
    nodes: Array<Pick<PathwayNode, 'id' | 'progress'>>,
): Pick<Pathway, 'id' | 'nodes'> => ({
    id,
    nodes: nodes as PathwayNode[],
});

const affectedNode = (
    overrides: Partial<AffectedNode> = {},
): AffectedNode => ({
    pathwayId: 'p1',
    pathwayTitle: 'AWS Cloud Practitioner',
    nodeId: 'n1',
    nodeTitle: 'Earn: AWS Cloud Practitioner credential',
    accepted: true,
    ...overrides,
});

const affectedOutcome = (
    overrides: Partial<AffectedOutcome> = {},
): AffectedOutcome => ({
    pathwayId: 'p1',
    pathwayTitle: 'AWS Cloud Practitioner',
    outcomeId: 'o1',
    outcomeLabel: 'Earned AWS Cloud Practitioner',
    accepted: true,
    ...overrides,
});

// ---------------------------------------------------------------------------
// humanizeNodeTitle
// ---------------------------------------------------------------------------

describe('humanizeNodeTitle', () => {
    it('strips short imperative-verb prefixes', () => {
        expect(humanizeNodeTitle('Earn: AWS Cloud Practitioner credential'))
            .toBe('AWS Cloud Practitioner credential');

        expect(humanizeNodeTitle('Watch: AWS Cloud Essentials'))
            .toBe('AWS Cloud Essentials');

        expect(humanizeNodeTitle('Upload: your completion certificate'))
            .toBe('your completion certificate');
    });

    it('strips multi-word prefixes', () => {
        expect(humanizeNodeTitle('AI Tutor: IAM deep dive'))
            .toBe('IAM deep dive');

        expect(humanizeNodeTitle('Deep dive: gap close'))
            .toBe('gap close');
    });

    it('preserves titles without a prefix', () => {
        expect(humanizeNodeTitle('Complete the full course'))
            .toBe('Complete the full course');

        expect(humanizeNodeTitle('IAM roles reflection'))
            .toBe('IAM roles reflection');
    });

    it('preserves titles where the colon is too deep to be a prefix', () => {
        // A colon after the 20-char threshold is likely part of
        // real sentence structure, not an author-label prefix.
        expect(humanizeNodeTitle('Reflect on what you learned: what was hardest?'))
            .toBe('Reflect on what you learned: what was hardest?');
    });

    it('preserves titles where the pre-colon segment is not alphabetical', () => {
        // URLs, timestamps, protocol-like strings — the segment
        // before the colon contains non-alpha chars, so we treat
        // the whole thing as real content.
        expect(humanizeNodeTitle('http://example.com reading'))
            .toBe('http://example.com reading');

        expect(humanizeNodeTitle('10:30 standup'))
            .toBe('10:30 standup');

        expect(humanizeNodeTitle('Q&A: weekly review'))
            .toBe('Q&A: weekly review');
    });

    it('is idempotent on already-humanised titles', () => {
        const humanised = humanizeNodeTitle('Earn: the cert');

        expect(humanizeNodeTitle(humanised)).toBe(humanised);
    });

    it('handles leading/trailing whitespace after strip', () => {
        // Some authored titles might have extra spaces after the colon.
        expect(humanizeNodeTitle('Watch:   AWS basics   '))
            .toBe('AWS basics');
    });
});

// ---------------------------------------------------------------------------
// computeProgressTier
// ---------------------------------------------------------------------------

describe('computeProgressTier', () => {
    it('returns `none` when nothing was affected', () => {
        expect(
            computeProgressTier({
                affectedNodes: [],
                affectedOutcomes: [],
                pathways: {},
            }),
        ).toBe('none');
    });

    it('returns `terminal` when the credential finished a whole pathway', () => {
        const pathway = makePathway('p1', [
            makeNode('n1', 'completed'),
            makeNode('n2', 'completed'),
            // This is the final node — now completed via the credential.
            makeNode('n3', 'completed'),
        ]);

        const tier = computeProgressTier({
            affectedNodes: [affectedNode({ pathwayId: 'p1', nodeId: 'n3' })],
            affectedOutcomes: [affectedOutcome()],
            pathways: { p1: pathway },
        });

        expect(tier).toBe('terminal');
    });

    it('terminal wins over cross-pathway when a multi-pathway event closed one out', () => {
        const finished = makePathway('p1', [
            makeNode('n1', 'completed'),
            makeNode('n2', 'completed'),
        ]);

        const ongoing = makePathway('p2', [
            makeNode('n1', 'completed'),
            makeNode('n2', 'not-started'),
        ]);

        const tier = computeProgressTier({
            affectedNodes: [
                affectedNode({ pathwayId: 'p1', nodeId: 'n2' }),
                affectedNode({
                    pathwayId: 'p2',
                    pathwayTitle: 'Security+',
                    nodeId: 'n1',
                }),
            ],
            affectedOutcomes: [],
            pathways: { p1: finished, p2: ongoing },
        });

        expect(tier).toBe('terminal');
    });

    it('returns `cross-pathway` when the event advanced nodes on 2+ pathways', () => {
        const p1 = makePathway('p1', [
            makeNode('n1', 'completed'),
            makeNode('n2', 'not-started'),
        ]);

        const p2 = makePathway('p2', [
            makeNode('n1', 'completed'),
            makeNode('n2', 'not-started'),
        ]);

        const tier = computeProgressTier({
            affectedNodes: [
                affectedNode({ pathwayId: 'p1', nodeId: 'n1' }),
                affectedNode({
                    pathwayId: 'p2',
                    pathwayTitle: 'Security+',
                    nodeId: 'n1',
                }),
            ],
            affectedOutcomes: [],
            pathways: { p1, p2 },
        });

        expect(tier).toBe('cross-pathway');
    });

    it('returns `major` on single-pathway single-node progress', () => {
        const pathway = makePathway('p1', [
            makeNode('n1', 'completed'),
            makeNode('n2', 'not-started'),
        ]);

        const tier = computeProgressTier({
            affectedNodes: [affectedNode({ pathwayId: 'p1', nodeId: 'n1' })],
            affectedOutcomes: [],
            pathways: { p1: pathway },
        });

        expect(tier).toBe('major');
    });

    it('returns `minor` when only outcomes bound with no node advance', () => {
        const tier = computeProgressTier({
            affectedNodes: [],
            affectedOutcomes: [affectedOutcome()],
            pathways: {},
        });

        expect(tier).toBe('minor');
    });

    it('skips pathways missing from the lookup (stale store state)', () => {
        // If a pathway was removed between dispatch and projection,
        // the terminal check silently skips it — we fall back to
        // major/cross-pathway based on what remains.
        const tier = computeProgressTier({
            affectedNodes: [affectedNode({ pathwayId: 'p-deleted' })],
            affectedOutcomes: [],
            pathways: {},
        });

        expect(tier).toBe('major');
    });

    it('treats empty-node pathways as non-terminal (defensive)', () => {
        const pathway = makePathway('p1', []);

        const tier = computeProgressTier({
            affectedNodes: [affectedNode({ pathwayId: 'p1' })],
            affectedOutcomes: [],
            pathways: { p1: pathway },
        });

        expect(tier).toBe('major');
    });
});

// ---------------------------------------------------------------------------
// resolveCtaCopy
// ---------------------------------------------------------------------------

describe('resolveCtaCopy', () => {
    it('terminal: celebrates the whole-pathway completion', () => {
        const copy = resolveCtaCopy({
            tier: 'terminal',
            affectedNodes: [
                affectedNode({ pathwayTitle: 'AWS Cloud Practitioner' }),
            ],
            affectedOutcomes: [affectedOutcome()],
        });

        expect(copy.headline).toBe('You did it.');
        expect(copy.subhead).toBe('You just finished AWS Cloud Practitioner.');
        expect(copy.ctaLabel).toBe('See what you completed');
    });

    it('terminal: falls back to outcome pathway title when no nodes were affected', () => {
        const copy = resolveCtaCopy({
            tier: 'terminal',
            affectedNodes: [],
            affectedOutcomes: [
                affectedOutcome({ pathwayTitle: 'Security+' }),
            ],
        });

        expect(copy.subhead).toBe('You just finished Security+.');
    });

    it('cross-pathway: pluralises and lists pathway titles', () => {
        const copy = resolveCtaCopy({
            tier: 'cross-pathway',
            affectedNodes: [
                affectedNode({ pathwayId: 'p1', pathwayTitle: 'AWS' }),
                affectedNode({
                    pathwayId: 'p2',
                    pathwayTitle: 'Security+',
                    nodeId: 'n2',
                }),
                affectedNode({
                    pathwayId: 'p3',
                    pathwayTitle: 'Azure Fundamentals',
                    nodeId: 'n3',
                }),
            ],
            affectedOutcomes: [],
        });

        expect(copy.headline).toBe('This credential advanced 3 steps.');
        expect(copy.subhead).toBe(
            'Across AWS, Security+, and Azure Fundamentals.',
        );
        expect(copy.ctaLabel).toBe('See progress');
    });

    it('cross-pathway: truncates 4+ pathways with "and N more"', () => {
        const copy = resolveCtaCopy({
            tier: 'cross-pathway',
            affectedNodes: [
                affectedNode({ pathwayId: 'p1', pathwayTitle: 'AWS' }),
                affectedNode({
                    pathwayId: 'p2',
                    pathwayTitle: 'Security+',
                    nodeId: 'n2',
                }),
                affectedNode({
                    pathwayId: 'p3',
                    pathwayTitle: 'Azure',
                    nodeId: 'n3',
                }),
                affectedNode({
                    pathwayId: 'p4',
                    pathwayTitle: 'GCP',
                    nodeId: 'n4',
                }),
            ],
            affectedOutcomes: [],
        });

        expect(copy.subhead).toBe('Across AWS, Security+, and 2 more.');
    });

    it('cross-pathway: uses singular "step" when there is exactly one affected node', () => {
        // Edge case — shouldn't occur (single node can't be cross-
        // pathway), but guarding against pluralisation bugs.
        const copy = resolveCtaCopy({
            tier: 'cross-pathway',
            affectedNodes: [affectedNode()],
            affectedOutcomes: [],
        });

        expect(copy.headline).toBe('This credential advanced 1 step.');
    });

    it('major: humanises the node title in the subhead', () => {
        const copy = resolveCtaCopy({
            tier: 'major',
            affectedNodes: [
                affectedNode({
                    nodeTitle: 'Earn: AWS Cloud Practitioner credential',
                    pathwayTitle: 'AWS Cloud Practitioner',
                }),
            ],
            affectedOutcomes: [],
        });

        expect(copy.headline).toBe('Nice — one step closer.');
        expect(copy.subhead).toBe(
            'That checks off AWS Cloud Practitioner credential on AWS Cloud Practitioner.',
        );
        // Confirm the "Bound" and "Advanced" language is gone.
        expect(copy.subhead).not.toContain('Bound');
        expect(copy.subhead).not.toContain('Advanced');
        // Confirm the author prefix is stripped.
        expect(copy.subhead).not.toContain('Earn:');
    });

    it('major: elides the subhead when no nodes are present', () => {
        // Shouldn't happen in practice (major requires a node),
        // but keep the copy-resolver total.
        const copy = resolveCtaCopy({
            tier: 'major',
            affectedNodes: [],
            affectedOutcomes: [],
        });

        expect(copy.subhead).toBe('');
    });

    it('minor: focuses on the outcome pathway', () => {
        const copy = resolveCtaCopy({
            tier: 'minor',
            affectedNodes: [],
            affectedOutcomes: [
                affectedOutcome({ pathwayTitle: 'AWS Cloud Practitioner' }),
            ],
        });

        expect(copy.headline).toBe('Added to your progress.');
        expect(copy.subhead).toBe(
            'This credential counts toward AWS Cloud Practitioner.',
        );
    });

    it('none: returns empty copy (component uses this as the early-return signal)', () => {
        const copy = resolveCtaCopy({
            tier: 'none',
            affectedNodes: [],
            affectedOutcomes: [],
        });

        expect(copy.headline).toBe('');
        expect(copy.subhead).toBe('');
        expect(copy.ctaLabel).toBe('');
    });
});

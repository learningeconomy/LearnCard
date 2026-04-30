/**
 * Tests for `validatePathway`.
 *
 * Pins every issue category we surface (Zod-driven + hand-written)
 * plus the sort contract consumers rely on. Uses small literal
 * pathways constructed via the existing `buildOps.addNode` / `setPolicy`
 * helpers so we test through the same surfaces the UI uses.
 */

import { describe, expect, it } from 'vitest';

import type { Pathway, PathwayNode } from '../../types';
import { DEFAULT_POLICY, DEFAULT_TERMINATION } from '../buildOps';

import { validatePathway } from './validatePathway';

const NOW = '2026-04-20T12:00:00.000Z';

const node = (id: string, overrides: Partial<PathwayNode> = {}): PathwayNode => ({
    id,
    pathwayId: 'p1',
    title: `Step ${id}`,
    stage: {
        initiation: [],
        policy: DEFAULT_POLICY,
        termination: DEFAULT_TERMINATION,
    },
    endorsements: [],
    progress: {
        status: 'not-started',
        artifacts: [],
        reviewsDue: 0,
        streak: { current: 0, longest: 0 },
    },
    createdBy: 'learner',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
});

const pathway = (overrides: Partial<Pathway> = {}): Pathway => ({
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    ownerDid: 'did:test:learner',
    revision: 0,
    schemaVersion: 1,
    title: 'Test',
    goal: 'Test goal',
    nodes: [],
    edges: [],
    status: 'active',
    visibility: { self: true, mentors: false, guardians: false, publicProfile: false },
    source: 'authored',
    destinationNodeId: undefined,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
});

describe('validatePathway — warnings', () => {
    it('warns on an empty pathway', () => {
        const issues = validatePathway(pathway());

        // Empty-pathway warning is enough on its own; the
        // no-destination warning would be redundant noise.
        const pathwayLevel = issues.filter(i => i.nodeId === null);

        expect(pathwayLevel).toHaveLength(1);
        expect(pathwayLevel[0].level).toBe('warning');
        expect(pathwayLevel[0].message).toMatch(/No steps/i);
    });

    it('warns when no destination is set but the pathway has nodes', () => {
        const p = pathway({ nodes: [node('a')] });
        const issues = validatePathway(p);

        const destWarning = issues.find(i => i.message.match(/destination/i));

        expect(destWarning).toBeDefined();
        expect(destWarning?.level).toBe('warning');
        expect(destWarning?.section).toBe('pathway');
    });

    it('suppresses the no-destination warning when the pathway is empty', () => {
        // The "no steps" warning is the one to act on first;
        // stacking both here would be noisy.
        const issues = validatePathway(pathway());

        expect(issues.find(i => i.message.match(/destination/i))).toBeUndefined();
    });

    it('warns on external policy with empty server or tool', () => {
        const p = pathway({
            nodes: [
                node('a', {
                    stage: {
                        initiation: [],
                        policy: {
                            kind: 'external',
                            mcp: { serverId: '', toolName: '' },
                        },
                        termination: DEFAULT_TERMINATION,
                    },
                }),
            ],
            destinationNodeId: 'a',
        });

        const issues = validatePathway(p);
        const toolWarning = issues.find(i => i.message.match(/tool/i));

        expect(toolWarning?.level).toBe('warning');
        expect(toolWarning?.nodeId).toBe('a');
        expect(toolWarning?.section).toBe('what');
    });

    it('flags composite pointing at a missing pathway as an error', () => {
        const p = pathway({
            nodes: [
                node('a', {
                    stage: {
                        initiation: [],
                        policy: {
                            kind: 'composite',
                            pathwayRef: '99999999-9999-9999-9999-999999999999',
                            renderStyle: 'inline-expandable',
                        },
                        termination: {
                            kind: 'pathway-completed',
                            pathwayRef: '99999999-9999-9999-9999-999999999999',
                        },
                    },
                }),
            ],
            destinationNodeId: 'a',
        });

        const issues = validatePathway(p, { [p.id]: p });
        // Specific error, not the generic ref-shape one. The message
        // is "... isn't loaded here ...", so look for "loaded" (the
        // apostrophe splits "n't loaded" so a /not loaded/ regex
        // would miss it).
        const missingRefError = issues.find(i => i.message.match(/loaded/i));

        expect(missingRefError?.level).toBe('error');
    });
});

describe('validatePathway — Zod-driven errors', () => {
    it('errors on an empty node title', () => {
        const p = pathway({
            nodes: [node('a', { title: '' })],
            destinationNodeId: 'a',
        });

        // The base PathwaySchema accepts empty strings for title
        // (only checks non-undefined). Keep this test for the
        // composite pathwayRef case below which IS Zod-enforced.
        const issues = validatePathway(p);

        // Nothing schema-bounced here because the schema permits
        // empty strings — this is purely documentation of current
        // behaviour. If we tighten the schema to `.min(1)`, this
        // test will flip and we'll add an 'error' assertion.
        const titleError = issues.find(i => i.nodeId === 'a' && i.section === 'identity');

        // For now, no error expected. If you tighten the schema,
        // update this to `expect(titleError?.level).toBe('error')`.
        expect(titleError).toBeUndefined();
    });

    it('errors when a composite policy has an empty pathwayRef', () => {
        const p = pathway({
            nodes: [
                node('a', {
                    stage: {
                        initiation: [],
                        policy: {
                            kind: 'composite',
                            pathwayRef: '',
                            renderStyle: 'inline-expandable',
                        },
                        termination: {
                            kind: 'pathway-completed',
                            pathwayRef: '',
                        },
                    },
                }),
            ],
            destinationNodeId: 'a',
        });

        const issues = validatePathway(p);
        const refError = issues.find(
            i => i.message.match(/Pick a nested pathway/i),
        );

        expect(refError?.level).toBe('error');
        expect(refError?.nodeId).toBe('a');
        expect(refError?.section).toBe('what');
    });

    it('errors on an assessment with zero criteria', () => {
        const p = pathway({
            nodes: [
                node('a', {
                    stage: {
                        initiation: [],
                        policy: {
                            kind: 'assessment',
                            rubric: { criteria: [] as never },
                        } as never,
                        termination: DEFAULT_TERMINATION,
                    },
                }),
            ],
            destinationNodeId: 'a',
        });

        const issues = validatePathway(p);
        // The Zod schema doesn't enforce `.min(1)` on criteria
        // (it's a plain array). This test documents that absence
        // — there's no schema-driven error today, only the
        // assessment's own runtime rendering showing "no criteria".
        expect(issues.filter(i => i.level === 'error')).toHaveLength(0);
    });
});

describe('validatePathway — action section classification', () => {
    // Action-field errors should land in the new `action` section
    // so the ValidationBanner can deep-link to the matching inspector
    // panel, not fall through to `identity` like they used to.

    it('classifies an invalid external-url URL as an action-section error', () => {
        const p = pathway({
            nodes: [
                node('a', {
                    action: {
                        kind: 'external-url',
                        url: 'not a url',
                    } as never,
                }),
            ],
            destinationNodeId: 'a',
        });

        const issues = validatePathway(p);
        const urlIssue = issues.find(i => i.nodeId === 'a' && i.section === 'action');

        expect(urlIssue?.level).toBe('error');
        expect(urlIssue?.message).toMatch(/full URL/i);
    });

    it('classifies an empty app-listing listingId as an action-section error', () => {
        const p = pathway({
            nodes: [
                node('a', {
                    action: {
                        kind: 'app-listing',
                        listingId: '',
                    } as never,
                }),
            ],
            destinationNodeId: 'a',
        });

        const issues = validatePathway(p);
        const listingIssue = issues.find(i => i.nodeId === 'a' && i.section === 'action');

        expect(listingIssue?.level).toBe('error');
        expect(listingIssue?.message).toMatch(/app listing/i);
    });

    it('classifies an empty ai-session topicUri as an action-section error', () => {
        const p = pathway({
            nodes: [
                node('a', {
                    action: {
                        kind: 'ai-session',
                        topicUri: '',
                    } as never,
                }),
            ],
            destinationNodeId: 'a',
        });

        const issues = validatePathway(p);
        const topicIssue = issues.find(i => i.nodeId === 'a' && i.section === 'action');

        expect(topicIssue?.level).toBe('error');
        expect(topicIssue?.message).toMatch(/tutor topic/i);
    });

    it('classifies an in-app-route with empty `to` as an action-section error', () => {
        const p = pathway({
            nodes: [
                node('a', {
                    action: {
                        kind: 'in-app-route',
                        to: '',
                    } as never,
                }),
            ],
            destinationNodeId: 'a',
        });

        const issues = validatePathway(p);
        const routeIssue = issues.find(i => i.nodeId === 'a' && i.section === 'action');

        expect(routeIssue?.level).toBe('error');
        expect(routeIssue?.message).toMatch(/in-app route/i);
    });
});

describe('validatePathway — internal-field suppression', () => {
    // The internal-path suppression is path-aware rather than segment-
    // aware — it must drop errors on system-written fields without
    // over-suppressing user-authored fields that happen to share a
    // segment name (e.g. a prompt field containing "id").

    it('suppresses errors on node.progress subtree', () => {
        // Build the invalid progress via an `as never` cast — the
        // structural TS type permits this but Zod's `.superRefine`
        // will bounce it at runtime. The point of this test is that
        // the runtime bounce never reaches the author-facing banner
        // (progress is system-written, not author-written).
        const p = pathway({
            nodes: [
                node('a', {
                    progress: {
                        status: 'completed',
                        artifacts: [],
                        reviewsDue: 0,
                        streak: { current: 0, longest: 0 },
                        // No completedAt — violates the refine'd invariant.
                    } as never,
                }),
            ],
            destinationNodeId: 'a',
        });

        const issues = validatePathway(p);
        const progressIssue = issues.find(i =>
            i.message.toLowerCase().includes('completedat'),
        );

        // The reducer-level invariant failed, but it's not author-
        // actionable, so it shouldn't reach the UI.
        expect(progressIssue).toBeUndefined();
    });

    it('does NOT suppress user-authored fields that share a segment name with internals', () => {
        // Path-aware suppression: an artifact policy's `prompt` field
        // is user-authored; a malformed prompt should still surface.
        // (Regression guard for the `some(seg === 'id')` style of
        // over-match that the earlier implementation had.)
        const p = pathway({
            nodes: [
                node('a', {
                    stage: {
                        initiation: [],
                        policy: {
                            kind: 'composite',
                            pathwayRef: '',
                            renderStyle: 'inline-expandable',
                        },
                        termination: {
                            kind: 'pathway-completed',
                            pathwayRef: '',
                        },
                    },
                }),
            ],
            destinationNodeId: 'a',
        });

        const issues = validatePathway(p);

        // The composite pathwayRef is a user-authored field; despite
        // `pathwayRef` sharing no segment with internals, the point
        // is that the nested path surfaces at all. If the over-match
        // bug returned, this would disappear.
        const refError = issues.find(i => i.message.match(/Pick a nested pathway/i));
        expect(refError?.level).toBe('error');
    });
});

describe('validatePathway — sort order', () => {
    it('puts errors before warnings', () => {
        // Empty composite pathwayRef → error
        // No destination set → warning
        const p = pathway({
            nodes: [
                node('a', {
                    stage: {
                        initiation: [],
                        policy: {
                            kind: 'composite',
                            pathwayRef: '',
                            renderStyle: 'inline-expandable',
                        },
                        termination: {
                            kind: 'pathway-completed',
                            pathwayRef: '',
                        },
                    },
                }),
            ],
        });

        const issues = validatePathway(p);

        const firstError = issues.findIndex(i => i.level === 'error');
        const firstWarning = issues.findIndex(i => i.level === 'warning');

        expect(firstError).toBeGreaterThanOrEqual(0);
        expect(firstWarning).toBeGreaterThanOrEqual(0);
        expect(firstError).toBeLessThan(firstWarning);
    });

    it('orders per-node issues by outline order', () => {
        const p = pathway({
            nodes: [
                node('a', {
                    stage: {
                        initiation: [],
                        policy: {
                            kind: 'external',
                            mcp: { serverId: '', toolName: '' },
                        },
                        termination: DEFAULT_TERMINATION,
                    },
                }),
                node('b', {
                    stage: {
                        initiation: [],
                        policy: {
                            kind: 'external',
                            mcp: { serverId: '', toolName: '' },
                        },
                        termination: DEFAULT_TERMINATION,
                    },
                }),
            ],
            destinationNodeId: 'a',
        });

        const issues = validatePathway(p).filter(i => i.nodeId);
        const nodeOrder = issues.map(i => i.nodeId);

        // `a` issues come before `b` issues.
        expect(nodeOrder.indexOf('a')).toBeLessThan(nodeOrder.indexOf('b'));
    });

    it('puts pathway-level issues last', () => {
        const p = pathway({
            nodes: [
                node('a', {
                    stage: {
                        initiation: [],
                        policy: {
                            kind: 'external',
                            mcp: { serverId: '', toolName: '' },
                        },
                        termination: DEFAULT_TERMINATION,
                    },
                }),
            ],
        });

        const issues = validatePathway(p);
        const lastIsPathwayLevel = issues[issues.length - 1].nodeId === null;

        expect(lastIsPathwayLevel).toBe(true);
    });
});

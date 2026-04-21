/**
 * Tests for `summarizePolicy`.
 *
 * Covers every Policy variant and the edge cases the inspector / outline
 * rely on (incomplete composite ref, empty MCP tool, varied cadence).
 *
 * Keeps copy assertions *exact* — the section headers and outline rows
 * are user-facing, so drift in phrasing must be a conscious choice,
 * not an accidental regression.
 */

import { describe, expect, it } from 'vitest';

import type { Policy } from '../../types';

import { summarizePolicy } from './summarizePolicy';

const UUID_A = '11111111-1111-1111-1111-111111111111';

describe('summarizePolicy', () => {
    describe('artifact', () => {
        it('uses the right article + singular noun per type', () => {
            expect(
                summarizePolicy({ kind: 'artifact', prompt: '', expectedArtifact: 'link' }),
            ).toBe('Submit a link');

            expect(
                summarizePolicy({ kind: 'artifact', prompt: '', expectedArtifact: 'image' }),
            ).toBe('Submit an image');

            expect(
                summarizePolicy({ kind: 'artifact', prompt: '', expectedArtifact: 'pdf' }),
            ).toBe('Submit a PDF');

            expect(
                summarizePolicy({ kind: 'artifact', prompt: '', expectedArtifact: 'text' }),
            ).toBe('Submit a note');

            expect(
                summarizePolicy({ kind: 'artifact', prompt: '', expectedArtifact: 'audio' }),
            ).toBe('Submit an audio clip');
        });
    });

    describe('practice', () => {
        it('collapses perPeriod=1 into the plain adverb', () => {
            const policy: Policy = {
                kind: 'practice',
                cadence: { frequency: 'daily', perPeriod: 1 },
                artifactTypes: ['text'],
            };

            expect(summarizePolicy(policy)).toBe('Practice daily');
        });

        it('renders perPeriod > 1 with the × glyph and unit noun', () => {
            const policy: Policy = {
                kind: 'practice',
                cadence: { frequency: 'weekly', perPeriod: 3 },
                artifactTypes: ['text'],
            };

            expect(summarizePolicy(policy)).toBe('Practice 3× per week');
        });

        it('uses the soft "occasionally" for ad-hoc cadence', () => {
            const policy: Policy = {
                kind: 'practice',
                cadence: { frequency: 'ad-hoc', perPeriod: 1 },
                artifactTypes: ['text'],
            };

            expect(summarizePolicy(policy)).toBe('Practice occasionally');
        });
    });

    describe('review', () => {
        it('hides FSRS internals and says "Review over time"', () => {
            // Scheduler internals (stability/difficulty/dueAt) are
            // intentionally absent from the summary — they're
            // meaningless to the author scanning a list.
            expect(
                summarizePolicy({
                    kind: 'review',
                    fsrs: { stability: 0.7, difficulty: 0.3, dueAt: '2025-01-01T00:00:00Z' },
                }),
            ).toBe('Review over time');
        });
    });

    describe('assessment', () => {
        it('counts criteria in the copy', () => {
            expect(
                summarizePolicy({
                    kind: 'assessment',
                    rubric: { criteria: [] },
                }),
            ).toBe('Pass a check');

            expect(
                summarizePolicy({
                    kind: 'assessment',
                    rubric: {
                        criteria: [{ id: 'c1', description: '', weight: 1 }],
                    },
                }),
            ).toBe('Pass a 1-criterion check');

            expect(
                summarizePolicy({
                    kind: 'assessment',
                    rubric: {
                        criteria: [
                            { id: 'c1', description: '', weight: 1 },
                            { id: 'c2', description: '', weight: 1 },
                            { id: 'c3', description: '', weight: 1 },
                        ],
                    },
                }),
            ).toBe('Pass a 3-criterion check');
        });
    });

    describe('external (MCP)', () => {
        it('renders both slots with an arrow when set', () => {
            expect(
                summarizePolicy({
                    kind: 'external',
                    mcp: { serverId: 'github', toolName: 'create_pull_request' },
                }),
            ).toBe('Use github → create_pull_request');
        });

        it('degrades gracefully when neither slot is set', () => {
            expect(
                summarizePolicy({
                    kind: 'external',
                    mcp: { serverId: '', toolName: '' },
                }),
            ).toBe('Use a tool (not set up)');
        });

        it('renders single-slot states without a dangling arrow', () => {
            expect(
                summarizePolicy({
                    kind: 'external',
                    mcp: { serverId: 'github', toolName: '' },
                }),
            ).toBe('Use github');

            expect(
                summarizePolicy({
                    kind: 'external',
                    mcp: { serverId: '', toolName: 'create_pull_request' },
                }),
            ).toBe('Use create_pull_request');
        });
    });

    describe('composite', () => {
        it('nudges the author when the ref is unset', () => {
            expect(
                summarizePolicy({
                    kind: 'composite',
                    pathwayRef: '',
                    renderStyle: 'inline-expandable',
                }),
            ).toBe('Complete a nested pathway (pick one)');
        });

        it('resolves ref → title when the map is provided', () => {
            expect(
                summarizePolicy(
                    {
                        kind: 'composite',
                        pathwayRef: UUID_A,
                        renderStyle: 'inline-expandable',
                    },
                    { pathwayTitleById: { [UUID_A]: 'AI in Finance' } },
                ),
            ).toBe('Complete AI in Finance');
        });

        it('falls back to a generic phrase when the ref does not resolve', () => {
            // E.g. when the referenced pathway was deleted, or when
            // the context map simply wasn't supplied. We never want
            // to leak a raw UUID into user copy.
            expect(
                summarizePolicy(
                    {
                        kind: 'composite',
                        pathwayRef: UUID_A,
                        renderStyle: 'inline-expandable',
                    },
                    { pathwayTitleById: {} },
                ),
            ).toBe('Complete a nested pathway');

            expect(
                summarizePolicy({
                    kind: 'composite',
                    pathwayRef: UUID_A,
                    renderStyle: 'inline-expandable',
                }),
            ).toBe('Complete a nested pathway');
        });
    });
});

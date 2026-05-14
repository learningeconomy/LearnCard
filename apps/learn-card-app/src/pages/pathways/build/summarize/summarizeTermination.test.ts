/**
 * Tests for `summarizeTermination`.
 *
 * Mirrors the shape of `summarizePolicy.test.ts`. Both functions feed
 * the same UI surfaces, so their coverage stays parallel: every
 * variant, plus the edge cases the UI depends on (empty trustedIssuers
 * list, unresolved pathway ref, composite require all/any, pluralisation).
 */

import { describe, expect, it } from 'vitest';

import type { Termination } from '../../types';

import { summarizeTermination } from './summarizeTermination';

const UUID_A = '11111111-1111-1111-1111-111111111111';

describe('summarizeTermination', () => {
    describe('artifact-count', () => {
        it('pluralises the noun by count', () => {
            expect(
                summarizeTermination({
                    kind: 'artifact-count',
                    count: 1,
                    artifactType: 'link',
                }),
            ).toBe('Attach 1 link');

            expect(
                summarizeTermination({
                    kind: 'artifact-count',
                    count: 3,
                    artifactType: 'link',
                }),
            ).toBe('Attach 3 links');
        });

        it('uses "notes" for text artifacts (not "texts")', () => {
            // The word "text" is an uncountable mass noun in
            // everyday use; "attach 2 texts" reads as messages, not
            // documents. We swap to "note(s)" in user copy.
            expect(
                summarizeTermination({
                    kind: 'artifact-count',
                    count: 2,
                    artifactType: 'text',
                }),
            ).toBe('Attach 2 notes');
        });
    });

    describe('endorsement', () => {
        it('omits the "trusted issuers" clause when the list is empty/absent', () => {
            expect(
                summarizeTermination({ kind: 'endorsement', minEndorsers: 1 }),
            ).toBe('Get 1 endorsement');

            expect(
                summarizeTermination({
                    kind: 'endorsement',
                    minEndorsers: 2,
                    trustedIssuers: [],
                }),
            ).toBe('Get 2 endorsements');
        });

        it('adds the "trusted issuers" clause only when the list is non-empty', () => {
            expect(
                summarizeTermination({
                    kind: 'endorsement',
                    minEndorsers: 2,
                    trustedIssuers: ['did:web:school.edu'],
                }),
            ).toBe('Get 2 endorsements from trusted issuers');
        });
    });

    describe('self-attest', () => {
        it('renders as the plain phrase', () => {
            // The prompt itself is shown in the expanded inspector;
            // keeping the summary short keeps collapsed rows tidy.
            expect(
                summarizeTermination({
                    kind: 'self-attest',
                    prompt: 'I practiced for 20 minutes',
                }),
            ).toBe('Self-attest');
        });
    });

    describe('assessment-score', () => {
        it('echoes the numeric minimum', () => {
            expect(
                summarizeTermination({ kind: 'assessment-score', min: 70 }),
            ).toBe('Score 70 or higher');
        });
    });

    describe('composite', () => {
        it('distinguishes "all" and "any" with human phrasing', () => {
            expect(
                summarizeTermination({
                    kind: 'composite',
                    require: 'all',
                    of: [
                        { kind: 'self-attest', prompt: 'x' },
                        { kind: 'self-attest', prompt: 'y' },
                    ],
                }),
            ).toBe('Hit all 2 sub-goals');

            expect(
                summarizeTermination({
                    kind: 'composite',
                    require: 'any',
                    of: [
                        { kind: 'self-attest', prompt: 'x' },
                        { kind: 'self-attest', prompt: 'y' },
                        { kind: 'self-attest', prompt: 'z' },
                    ],
                }),
            ).toBe('Hit any of 3 sub-goals');
        });

        it('pluralises correctly at n=1', () => {
            expect(
                summarizeTermination({
                    kind: 'composite',
                    require: 'all',
                    of: [{ kind: 'self-attest', prompt: 'x' }],
                }),
            ).toBe('Hit all 1 sub-goal');
        });
    });

    describe('pathway-completed', () => {
        it('falls back when no ref is set', () => {
            expect(
                summarizeTermination({
                    kind: 'pathway-completed',
                    pathwayRef: '' as string,
                } as Termination),
            ).toBe('Finish the nested pathway');
        });

        it('resolves ref → title when the map is provided', () => {
            expect(
                summarizeTermination(
                    { kind: 'pathway-completed', pathwayRef: UUID_A },
                    { pathwayTitleById: { [UUID_A]: 'AI in Finance' } },
                ),
            ).toBe('Finish AI in Finance');
        });

        it('falls back to a generic phrase when the ref does not resolve', () => {
            expect(
                summarizeTermination(
                    { kind: 'pathway-completed', pathwayRef: UUID_A },
                    { pathwayTitleById: {} },
                ),
            ).toBe('Finish the nested pathway');
        });
    });
});

/**
 * Registry-shape tests for termination kinds. Mirrors
 * `policy/registry.test.ts`; see that file for the rationale.
 *
 * Extra: pins the `selectable` flag story so
 * `pathway-completed` can never accidentally leak into the dropdown.
 */

import { describe, expect, it } from 'vitest';

import { TerminationSchema, type Termination } from '../../types';

import {
    SELECTABLE_TERMINATION_KIND_LIST,
    TERMINATION_KIND_LIST,
    TERMINATION_KINDS,
} from './registry';

describe('termination registry shape', () => {
    const ALL_KINDS: Termination['kind'][] = [
        'artifact-count',
        'endorsement',
        'self-attest',
        'assessment-score',
        'composite',
        'pathway-completed',
    ];

    it('contains an entry for every Termination kind', () => {
        for (const kind of ALL_KINDS) {
            expect(TERMINATION_KINDS[kind]).toBeDefined();
            expect(TERMINATION_KINDS[kind].kind).toBe(kind);
        }
    });

    it('full list and map agree on membership', () => {
        const listKinds = TERMINATION_KIND_LIST.map(s => s.kind).sort();
        const mapKinds = Object.keys(TERMINATION_KINDS).sort();

        expect(listKinds).toEqual(mapKinds);
    });

    it('selectable list excludes pathway-completed', () => {
        // Pathway-completed is managed by the composite invariant,
        // never picked directly. Surfacing it in the dropdown would
        // let authors create orphan terminations.
        const selectable = SELECTABLE_TERMINATION_KIND_LIST.map(s => s.kind);

        expect(selectable).not.toContain('pathway-completed');
    });

    it('selectable list matches the selectable flag on each spec', () => {
        // Belt-and-braces: if someone adds a new selectable=false kind
        // but forgets to remove it from the list, catch that here.
        for (const spec of TERMINATION_KIND_LIST) {
            const inList = SELECTABLE_TERMINATION_KIND_LIST.some(
                s => s.kind === spec.kind,
            );

            expect(inList).toBe(spec.selectable);
        }
    });

    it('every spec has a label, icon, blurb', () => {
        for (const spec of TERMINATION_KIND_LIST) {
            expect(spec.label).toBeTruthy();
            expect(spec.icon).toBeTruthy();
            expect(spec.blurb).toBeTruthy();
        }
    });

    it('every spec has a non-empty summarize', () => {
        for (const spec of TERMINATION_KIND_LIST) {
            const defaultValue = spec.default();
            const summary = (
                spec.summarize as (v: typeof defaultValue, ctx: object) => string
            )(defaultValue, {});

            expect(summary).toBeTruthy();
            expect(typeof summary).toBe('string');
        }
    });

    describe('default()', () => {
        it('artifact-count default is Zod-valid', () => {
            expect(() =>
                TerminationSchema.parse(TERMINATION_KINDS['artifact-count'].default()),
            ).not.toThrow();
        });

        it('endorsement default is Zod-valid', () => {
            expect(() =>
                TerminationSchema.parse(TERMINATION_KINDS.endorsement.default()),
            ).not.toThrow();
        });

        it('self-attest default is Zod-valid', () => {
            expect(() =>
                TerminationSchema.parse(TERMINATION_KINDS['self-attest'].default()),
            ).not.toThrow();
        });

        it('assessment-score default is Zod-valid', () => {
            expect(() =>
                TerminationSchema.parse(
                    TERMINATION_KINDS['assessment-score'].default(),
                ),
            ).not.toThrow();
        });

        it('composite default is Zod-valid', () => {
            expect(() =>
                TerminationSchema.parse(TERMINATION_KINDS.composite.default()),
            ).not.toThrow();
        });

        it('pathway-completed default is Zod-INVALID by design', () => {
            // Same rationale as composite policy: the default is an
            // in-flight placeholder the composite invariant fills in
            // as soon as the author picks a pathway.
            const result = TerminationSchema.safeParse(
                TERMINATION_KINDS['pathway-completed'].default(),
            );

            expect(result.success).toBe(false);
        });
    });
});

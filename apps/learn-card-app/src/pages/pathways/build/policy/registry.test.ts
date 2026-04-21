/**
 * Registry-shape tests for policy kinds.
 *
 * These aren't unit tests of per-kind logic — the summarizer tests
 * (`summarize/summarizePolicy.test.ts`) cover that transitively now
 * that the facades delegate. These tests enforce the *contract* of
 * the registry itself, so a new kind can't ship with a hole in its
 * spec (missing icon, non-Zod default, etc.) and slip through
 * review unnoticed.
 *
 * Also pins the registry's totality: there's exactly one spec per
 * `Policy['kind']` and the iterable list agrees with the keyed map.
 */

import { describe, expect, it } from 'vitest';

import { PolicySchema, type Policy } from '../../types';

import { POLICY_KINDS, POLICY_KIND_LIST } from './registry';

describe('policy registry shape', () => {
    const ALL_KINDS: Policy['kind'][] = [
        'artifact',
        'practice',
        'review',
        'assessment',
        'external',
        'composite',
    ];

    it('contains an entry for every Policy kind', () => {
        for (const kind of ALL_KINDS) {
            expect(POLICY_KINDS[kind]).toBeDefined();
            expect(POLICY_KINDS[kind].kind).toBe(kind);
        }
    });

    it('list and map agree on membership', () => {
        const listKinds = POLICY_KIND_LIST.map(s => s.kind).sort();
        const mapKinds = Object.keys(POLICY_KINDS).sort();

        expect(listKinds).toEqual(mapKinds);
    });

    it('every spec has a label, icon, blurb', () => {
        for (const spec of POLICY_KIND_LIST) {
            expect(spec.label).toBeTruthy();
            expect(spec.icon).toBeTruthy();
            expect(spec.blurb).toBeTruthy();
        }
    });

    it('every spec has a non-empty summarize', () => {
        for (const spec of POLICY_KIND_LIST) {
            // Call the spec's summarize with its own default. Every
            // summary must be a non-empty human phrase; an empty
            // string would break the collapsed-section summary.
            const defaultValue = spec.default();
            const summary = (
                spec.summarize as (v: typeof defaultValue, ctx: object) => string
            )(defaultValue, {});

            expect(summary).toBeTruthy();
            expect(typeof summary).toBe('string');
        }
    });

    describe('default()', () => {
        it('artifact default is Zod-valid', () => {
            expect(() => PolicySchema.parse(POLICY_KINDS.artifact.default())).not.toThrow();
        });

        it('practice default is Zod-valid', () => {
            expect(() => PolicySchema.parse(POLICY_KINDS.practice.default())).not.toThrow();
        });

        it('review default is Zod-valid', () => {
            expect(() => PolicySchema.parse(POLICY_KINDS.review.default())).not.toThrow();
        });

        it('assessment default is Zod-valid', () => {
            expect(() =>
                PolicySchema.parse(POLICY_KINDS.assessment.default()),
            ).not.toThrow();
        });

        it('external default is Zod-valid', () => {
            // External with empty serverId/toolName: the Zod schema
            // accepts empty strings — the UI nudges the author with
            // "(not set up)" copy instead.
            expect(() =>
                PolicySchema.parse(POLICY_KINDS.external.default()),
            ).not.toThrow();
        });

        it('composite default is Zod-INVALID by design', () => {
            // Composite's default has an empty `pathwayRef` — intentionally
            // in-flight so the card picker can commit "choosing composite"
            // before the author picks a target. Publish-time validation
            // catches it separately. This test pins that invariant.
            const result = PolicySchema.safeParse(POLICY_KINDS.composite.default());

            expect(result.success).toBe(false);
        });
    });
});

/**
 * summarizePolicy — facade that delegates to the policy registry.
 *
 * The per-kind summarize logic lives on each spec in
 * `build/policy/*Spec.tsx`; this function is the single dispatch
 * point consumers call (outline rows, collapsed section summaries,
 * preview pane copy).
 *
 * Kept as a standalone function (rather than calling
 * `POLICY_KINDS[kind].summarize` inline everywhere) because:
 *
 *   1. Central place for the type-narrowing cast — distributive
 *      unions and the Editor's contravariance make inline dispatch
 *      noisy.
 *
 *   2. Stable public surface. The existing
 *      `summarizePolicy.test.ts` suite exercises exactly these
 *      inputs/outputs; delegating preserves all assertions without
 *      rewriting any test.
 *
 *   3. Lets us swap the registry out or layer in pre/post processing
 *      (e.g. localization) without touching call sites.
 */

import { POLICY_KINDS } from '../policy/registry';
import type { Policy } from '../../types';

export interface SummarizeContext {
    /**
     * Optional map from pathway id → title, used to resolve composite
     * policies' `pathwayRef` into a human name. When absent (or when
     * the ref doesn't resolve), the spec's summarize falls back to a
     * generic phrase rather than leaking a UUID into user copy.
     */
    pathwayTitleById?: Record<string, string>;
}

export const summarizePolicy = (
    policy: Policy,
    ctx: SummarizeContext = {},
): string => {
    const spec = POLICY_KINDS[policy.kind];

    // TS can't distribute the union across the mapped type + the
    // contravariant Editor prop in one breath. The `satisfies` clause
    // on `POLICY_KINDS` gives us the runtime guarantee; the cast
    // just unblocks the type-checker.
    const summarize = spec.summarize as (value: typeof policy, ctx: SummarizeContext) => string;

    return summarize(policy, ctx);
};

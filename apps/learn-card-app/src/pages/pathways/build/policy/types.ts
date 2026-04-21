/**
 * Types for the policy registry.
 *
 * A registry-driven PolicyEditor lets new kinds land without touching
 * a central switch statement: drop a `FooSpec.tsx` in this folder,
 * register it in `registry.ts`, done.
 *
 * The spec carries everything we need to render a kind end-to-end:
 *
 *   label / icon / blurb   → card picker + collapsed section summary
 *   default()              → sensible starting value when the kind is
 *                            first picked (used by TemplatePicker and
 *                            tests)
 *   Editor                 → variant-specific fields
 *   summarize()            → jargon-free one-liner for outline rows
 *
 * Each spec is typed to its exact policy variant via the
 * `PolicyKindSpec<K>` generic, so the Editor receives a narrowed value
 * with no runtime casts.
 */

import type React from 'react';

import type { PathwayMap } from '../../core/composition';
import type { Policy } from '../../types';
import type { SummarizeContext } from '../summarize/summarizePolicy';

/**
 * Context the policy editor might need to render. Only the `composite`
 * variant actually uses these (to enumerate other pathways for the
 * nested-pathway picker), but we thread them through every editor so
 * the registry surface is uniform and new kinds that need cross-
 * pathway data can use them without changing the plumbing.
 *
 * `onCreateNestedPathway` is the M5 affordance: the CompositeSpec's
 * picker modal lets authors create a brand-new empty nested pathway
 * in place, so the dead-end "import one or author another and come
 * back" copy from M3 never appears. The host (BuildMode) binds the
 * callback to the currently-selected node so the title parameter is
 * the only thing a kind-specific UI supplies.
 */
export interface PolicyEditorContext {
    parentPathwayId?: string;
    allPathways?: PathwayMap;
    onCreateNestedPathway?: (title: string) => void;
}

export interface PolicyEditorProps<K extends Policy['kind']> {
    value: Extract<Policy, { kind: K }>;
    onChange: (next: Policy) => void;
    context: PolicyEditorContext;
}

export interface PolicyKindSpec<K extends Policy['kind']> {
    /** The discriminated-union key this spec handles. */
    kind: K;

    /** Short, jargon-free label used in the card picker and anywhere the kind needs a name. */
    label: string;

    /** Ionicon name (string) shown next to the label. */
    icon: string;

    /** One-sentence description for the card picker. */
    blurb: string;

    /**
     * Starting value for a freshly-picked kind. Pure — safe to call
     * from tests and from TemplatePicker without side effects.
     *
     * For `composite`, this returns a Zod-invalid placeholder
     * (empty `pathwayRef`); the picker surfaces the "pick a pathway"
     * nudge until the author resolves it.
     */
    default: () => Extract<Policy, { kind: K }>;

    /** Variant-specific fields. Takes narrowed value, emits full Policy. */
    Editor: React.FC<PolicyEditorProps<K>>;

    /**
     * One-line human summary. Pure, identical contract to the standalone
     * `summarizePolicy` — which now delegates here so the registry is
     * the single source of truth.
     */
    summarize: (
        value: Extract<Policy, { kind: K }>,
        ctx: SummarizeContext,
    ) => string;
}

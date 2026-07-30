/**
 * Types for the termination registry.
 *
 * Mirrors `policy/types.ts` so both registries read identically at
 * call sites. Differences:
 *
 *   - `selectable` flag: true for kinds the author can pick from
 *     the dropdown in `DoneSection`, false for the
 *     composite-invariant `pathway-completed` kind that's managed
 *     automatically.
 *
 *   - `context.nested`: true when the editor is rendering inside a
 *     parent `composite` termination's sub-goal slot. Nested editors
 *     omit the outer "Done when" label and filter out the
 *     `composite` kind itself from the dropdown (keeps depth finite
 *     and the UI readable).
 */

import type React from 'react';

import type { Termination } from '../../types';
import type { SummarizeContext } from '../summarize/summarizePolicy';

export interface TerminationEditorContext {
    /**
     * True when this editor is a sub-goal inside a composite parent.
     * Editors that care about nesting (composite itself) filter
     * themselves out of the dropdown; others ignore the flag.
     */
    nested?: boolean;
}

export interface TerminationEditorProps<K extends Termination['kind']> {
    value: Extract<Termination, { kind: K }>;
    onChange: (next: Termination) => void;
    context: TerminationEditorContext;
}

export interface TerminationKindSpec<K extends Termination['kind']> {
    /** Discriminated-union key. */
    kind: K;

    /** Short, jargon-free label used in the dropdown + summary. */
    label: string;

    /** Ionicon name (string). */
    icon: string;

    /** One-sentence description for card picker / future tooltip. */
    blurb: string;

    /**
     * Can the author pick this kind directly from the kind dropdown?
     *
     * False for `pathway-completed`: that kind is paired 1:1 with
     * a `composite` policy and flipped atomically by the composite
     * invariant in `WhatSection`. Letting authors set it manually
     * would only create orphan terminations.
     */
    selectable: boolean;

    /** Starting value for a freshly-picked kind. */
    default: () => Extract<Termination, { kind: K }>;

    /** Variant-specific fields. */
    Editor: React.FC<TerminationEditorProps<K>>;

    /** One-line human summary. */
    summarize: (
        value: Extract<Termination, { kind: K }>,
        ctx: SummarizeContext,
    ) => string;
}

/**
 * PolicyEditor — thin registry-driven shell.
 *
 * Dispatches on `value.kind` to render the variant Editor from
 * `POLICY_KINDS`. Kind selection itself is owned by the
 * `TemplatePicker` in `WhatSection`, so this component intentionally
 * does NOT render a kind dropdown — that would give authors two
 * different entry points for the same decision.
 *
 * Kept as a named component (vs. inlining the dispatch in
 * WhatSection) because:
 *   1. Mirrors the shape of `TerminationEditor` so both sections
 *      read the same way.
 *   2. Centralises the type-narrowing cast so each call site stays
 *      tidy.
 *   3. Provides a single seam to add shared pre/post-render concerns
 *      later (validation banner, focus ring, keyboard shortcuts).
 */

import React from 'react';

import { POLICY_KINDS } from './policy/registry';
import type { PolicyEditorContext } from './policy/types';
import type { Policy } from '../types';

interface PolicyEditorProps {
    value: Policy;
    onChange: (next: Policy) => void;

    /**
     * Context needed only by the `composite` variant (cross-pathway
     * picker + cycle detection). Other editors ignore it.
     */
    parentPathwayId?: string;
    allPathways?: PolicyEditorContext['allPathways'];

    /**
     * "Create a new nested pathway in place" — M5. Only wired by the
     * CompositeSpec's picker modal today; other editors ignore it.
     * Host binds the handler to the currently-selected node so the
     * kind-specific UI just supplies a title.
     */
    onCreateNestedPathway?: PolicyEditorContext['onCreateNestedPathway'];
}

const PolicyEditor: React.FC<PolicyEditorProps> = ({
    value,
    onChange,
    parentPathwayId,
    allPathways,
    onCreateNestedPathway,
}) => {
    const spec = POLICY_KINDS[value.kind];

    // TS can't see that `spec.Editor` is compatible with the narrowed
    // value from a widened key. The registry's `satisfies` clause
    // gives us the guarantee; the cast just gets TypeScript to agree.
    const Editor = spec.Editor as React.FC<{
        value: typeof value;
        onChange: (next: Policy) => void;
        context: PolicyEditorContext;
    }>;

    return (
        <Editor
            value={value}
            onChange={onChange}
            context={{ parentPathwayId, allPathways, onCreateNestedPathway }}
        />
    );
};

export default PolicyEditor;

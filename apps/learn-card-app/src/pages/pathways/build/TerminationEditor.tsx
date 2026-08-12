/**
 * TerminationEditor — registry-driven shell.
 *
 * Renders:
 *   1. A kind dropdown (author-selectable kinds only).
 *   2. The variant-specific Editor from `TERMINATION_KINDS[kind]`.
 *
 * Unlike `PolicyEditor` (which drops its kind dropdown in favour of
 * the TemplatePicker), this one KEEPS its dropdown because:
 *
 *   a) `DoneSection` lets the author tweak termination independently
 *      of policy — someone might want to switch from "self-attest"
 *      to "endorsement" without re-picking a whole template.
 *
 *   b) `composite` sub-goals need an inline kind picker per-row —
 *      each sub-goal can be any kind except composite-inside-composite.
 *
 * Nested composite sub-goals pass `nested` so the editor hides the
 * outer "Done when" label and filters out the composite kind from
 * the dropdown (keeps depth bounded + reading order simple).
 */

import React from 'react';

import type { Termination } from '../types';

import { INPUT, LABEL } from './shared/inputs';
import { SELECTABLE_TERMINATION_KIND_LIST, TERMINATION_KINDS } from './termination/registry';
import type { TerminationEditorContext } from './termination/types';

interface TerminationEditorProps {
    value: Termination;
    onChange: (next: Termination) => void;
    /** True when rendered as a sub-goal inside a composite parent. */
    nested?: boolean;
}

const TerminationEditor: React.FC<TerminationEditorProps> = ({
    value,
    onChange,
    nested = false,
}) => {
    const handleKindChange = (nextKind: Termination['kind']) => {
        if (nextKind === value.kind) return;
        onChange(TERMINATION_KINDS[nextKind].default());
    };

    // Composite sub-goals can't themselves be composite (keeps depth
    // finite + the UI readable). Filter the composite kind out of the
    // dropdown when nested.
    const kinds = SELECTABLE_TERMINATION_KIND_LIST.filter(
        spec => !(nested && spec.kind === 'composite'),
    );

    const spec = TERMINATION_KINDS[value.kind];

    // Narrowing cast — the registry's `satisfies` clause guarantees
    // the Editor accepts `value` with the current kind, but TS's
    // distributive inference can't prove that from the widened union.
    const Editor = spec.Editor as React.FC<{
        value: typeof value;
        onChange: (next: Termination) => void;
        context: TerminationEditorContext;
    }>;

    return (
        <div className="space-y-3">
            <div className="space-y-1.5">
                {!nested && (
                    <label className={LABEL} htmlFor="term-kind">
                        Finish this step when…
                    </label>
                )}

                <select
                    id={nested ? undefined : 'term-kind'}
                    className={INPUT}
                    value={value.kind}
                    onChange={e => handleKindChange(e.target.value as Termination['kind'])}
                >
                    {kinds.map(k => (
                        <option key={k.kind} value={k.kind}>
                            {k.label}
                        </option>
                    ))}
                </select>
            </div>

            <Editor
                value={value}
                onChange={onChange}
                context={{ nested }}
            />
        </div>
    );
};

export default TerminationEditor;

/**
 * Composite termination — "all / any of sub-goals".
 *
 * Recursive: each sub-goal is itself a `Termination` rendered by a
 * nested `TerminationEditor`. The nested flag in the editor context
 * prevents composite-inside-composite from the dropdown so depth
 * stays bounded and the UI readable.
 *
 * Note the circular module reference: this spec → TerminationEditor
 * → registry → this spec. ES modules resolve this fine because
 * `TerminationEditor` is looked up at render time, not module-load
 * time — we never call it from a top-level side-effect.
 */

import React from 'react';

import { gitMergeOutline } from 'ionicons/icons';

import type { Termination } from '../../types';
import TerminationEditor from '../TerminationEditor';
import { INPUT, LABEL } from '../shared/inputs';

import type { TerminationKindSpec } from './types';

const CompositeEditor: React.FC<{
    value: Extract<Termination, { kind: 'composite' }>;
    onChange: (next: Termination) => void;
}> = ({ value, onChange }) => {
    const updateSub = (i: number, next: Termination) =>
        onChange({
            ...value,
            of: value.of.map((t, idx) => (idx === i ? next : t)),
        });

    const removeSub = (i: number) => {
        // At least one sub-goal must exist — Zod rejects an empty
        // composite. The UI disables the remove button at length=1
        // as belt-and-braces.
        if (value.of.length === 1) return;

        onChange({ ...value, of: value.of.filter((_, idx) => idx !== i) });
    };

    const addSub = () =>
        onChange({
            ...value,
            of: [
                ...value.of,
                { kind: 'self-attest', prompt: `Sub-goal ${value.of.length + 1}` },
            ],
        });

    return (
        <div className="space-y-3">
            <div className="space-y-1.5">
                <label className={LABEL} htmlFor="term-require">
                    Require
                </label>

                <select
                    id="term-require"
                    className={INPUT}
                    value={value.require}
                    onChange={e =>
                        onChange({ ...value, require: e.target.value as 'all' | 'any' })
                    }
                >
                    <option value="all">All of the sub-goals</option>
                    <option value="any">Any one of the sub-goals</option>
                </select>
            </div>

            <div className="space-y-2">
                <p className={LABEL}>Sub-goals</p>

                <ul className="space-y-3 pl-3 border-l-2 border-grayscale-200">
                    {value.of.map((sub, i) => (
                        <li key={i} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-grayscale-500">
                                    Sub-goal {i + 1}
                                </span>

                                <button
                                    type="button"
                                    onClick={() => removeSub(i)}
                                    disabled={value.of.length === 1}
                                    className="text-xs text-grayscale-500 hover:text-red-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    Remove
                                </button>
                            </div>

                            <TerminationEditor
                                value={sub}
                                onChange={next => updateSub(i, next)}
                                nested
                            />
                        </li>
                    ))}
                </ul>

                <button
                    type="button"
                    onClick={addSub}
                    className="text-xs font-medium text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                    + Add sub-goal
                </button>
            </div>
        </div>
    );
};

const compositeSpec: TerminationKindSpec<'composite'> = {
    kind: 'composite',
    label: 'Hit all/any of sub-goals',
    icon: gitMergeOutline,
    blurb: 'Combine several sub-goals with "all" or "any".',
    selectable: true,

    default: () => ({
        kind: 'composite',
        require: 'all',
        of: [{ kind: 'self-attest', prompt: 'Sub-goal 1' }],
    }),

    Editor: ({ value, onChange }) => (
        <CompositeEditor value={value} onChange={onChange} />
    ),

    summarize: value => {
        const n = value.of.length;
        const verb = value.require === 'all' ? 'Hit all' : 'Hit any of';
        const noun = n === 1 ? 'sub-goal' : 'sub-goals';

        return `${verb} ${n} ${noun}`;
    },
};

export default compositeSpec;

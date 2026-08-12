/**
 * Assessment policy — rubric-based check.
 *
 * Paired most naturally with an `assessment-score` termination
 * ("reach a score"). The rubric criteria + weights are authored
 * inline; weights are not auto-normalised so they can mean "out of
 * 100" or "each worth 1" as the author prefers.
 */

import React from 'react';

import { ribbonOutline } from 'ionicons/icons';

import type { Policy, Rubric } from '../../types';
import { INPUT, LABEL } from '../shared/inputs';

import type { PolicyKindSpec } from './types';

const AssessmentEditor: React.FC<{
    value: Extract<Policy, { kind: 'assessment' }>;
    onChange: (next: Policy) => void;
}> = ({ value, onChange }) => {
    const updateCriterion = (i: number, patch: Partial<Rubric['criteria'][number]>) =>
        onChange({
            ...value,
            rubric: {
                criteria: value.rubric.criteria.map((c, idx) =>
                    idx === i ? { ...c, ...patch } : c,
                ),
            },
        });

    const addCriterion = () =>
        onChange({
            ...value,
            rubric: {
                criteria: [
                    ...value.rubric.criteria,
                    {
                        id: `c${value.rubric.criteria.length + 1}`,
                        description: '',
                        weight: 1,
                    },
                ],
            },
        });

    const removeCriterion = (i: number) => {
        // At least one criterion must exist — an empty rubric isn't
        // a meaningful assessment. UI disables the remove button at
        // length === 1 as belt-and-braces.
        if (value.rubric.criteria.length === 1) return;

        onChange({
            ...value,
            rubric: { criteria: value.rubric.criteria.filter((_, idx) => idx !== i) },
        });
    };

    return (
        <div className="space-y-3">
            <p className={LABEL}>Criteria</p>

            <ul className="space-y-2">
                {value.rubric.criteria.map((c, i) => (
                    <li key={c.id} className="flex gap-2 items-start">
                        <input
                            type="text"
                            className={INPUT}
                            placeholder="What's being assessed?"
                            value={c.description}
                            onChange={e =>
                                updateCriterion(i, { description: e.target.value })
                            }
                        />

                        <input
                            type="number"
                            min={0}
                            step="0.5"
                            className={`${INPUT} w-20`}
                            value={c.weight}
                            onChange={e =>
                                updateCriterion(i, {
                                    weight: Math.max(0, Number(e.target.value) || 0),
                                })
                            }
                            aria-label="Weight"
                        />

                        <button
                            type="button"
                            onClick={() => removeCriterion(i)}
                            disabled={value.rubric.criteria.length === 1}
                            className="shrink-0 text-xs text-grayscale-500 hover:text-red-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed py-2.5 px-2"
                        >
                            Remove
                        </button>
                    </li>
                ))}
            </ul>

            <button
                type="button"
                onClick={addCriterion}
                className="text-xs font-medium text-emerald-700 hover:text-emerald-800 transition-colors"
            >
                + Add criterion
            </button>
        </div>
    );
};

const assessmentSpec: PolicyKindSpec<'assessment'> = {
    kind: 'assessment',
    label: 'Pass a check',
    icon: ribbonOutline,
    blurb: 'Score against a rubric of one or more criteria.',

    default: () => ({
        kind: 'assessment',
        rubric: { criteria: [{ id: 'c1', description: '', weight: 1 }] },
    }),

    Editor: ({ value, onChange }) => <AssessmentEditor value={value} onChange={onChange} />,

    summarize: value => {
        const n = value.rubric.criteria.length;

        if (n === 0) return 'Pass a check';
        if (n === 1) return 'Pass a 1-criterion check';
        return `Pass a ${n}-criterion check`;
    },
};

export default assessmentSpec;

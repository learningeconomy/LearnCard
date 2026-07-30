/**
 * Review policy — spaced-repetition review on an FSRS schedule.
 *
 * The scheduler internals (`stability`, `difficulty`, `dueAt`) are
 * not meaningful to most authors. We surface only the two that are
 * plausibly useful and label them in human terms; authors who want
 * finer control can still construct a value programmatically.
 */

import React from 'react';

import { refreshOutline } from 'ionicons/icons';

import type { Policy } from '../../types';
import { INPUT, LABEL } from '../shared/inputs';

import type { PolicyKindSpec } from './types';

const ReviewEditor: React.FC<{
    value: Extract<Policy, { kind: 'review' }>;
    onChange: (next: Policy) => void;
}> = ({ value, onChange }) => (
    <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
                <label className={LABEL} htmlFor="policy-review-due">
                    First review
                </label>

                <input
                    id="policy-review-due"
                    type="datetime-local"
                    className={INPUT}
                    value={value.fsrs.dueAt ? value.fsrs.dueAt.slice(0, 16) : ''}
                    onChange={e =>
                        onChange({
                            ...value,
                            fsrs: {
                                ...value.fsrs,
                                dueAt: e.target.value
                                    ? new Date(e.target.value).toISOString()
                                    : undefined,
                            },
                        })
                    }
                />
            </div>

            <div className="space-y-1.5">
                <label className={LABEL} htmlFor="policy-review-stability">
                    Starting strength
                </label>

                <input
                    id="policy-review-stability"
                    type="number"
                    min={0}
                    step="0.1"
                    className={INPUT}
                    value={value.fsrs.stability}
                    onChange={e =>
                        onChange({
                            ...value,
                            fsrs: {
                                ...value.fsrs,
                                stability: Math.max(0, Number(e.target.value) || 0),
                            },
                        })
                    }
                />
            </div>
        </div>

        <p className="text-xs text-grayscale-500 leading-relaxed">
            Reviews schedule themselves as the learner recalls. Higher starting
            strength means the first gap is longer.
        </p>
    </div>
);

const reviewSpec: PolicyKindSpec<'review'> = {
    kind: 'review',
    label: 'Review over time',
    icon: refreshOutline,
    blurb: 'Spaced-repetition reviews. Great for recall and skill upkeep.',

    default: () => ({
        kind: 'review',
        fsrs: { stability: 0, difficulty: 0 },
    }),

    Editor: ({ value, onChange }) => <ReviewEditor value={value} onChange={onChange} />,

    // Scheduler internals are intentionally absent from the summary —
    // they're meaningless to an author scanning a list.
    summarize: () => 'Review over time',
};

export default reviewSpec;

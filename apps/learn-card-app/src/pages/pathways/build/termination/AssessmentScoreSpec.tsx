/**
 * Assessment-score termination — "Reach a minimum score".
 *
 * Paired most naturally with an `assessment` policy (rubric-based
 * grading) but works standalone too — a learner could self-report a
 * score, or an MCP tool could emit one.
 */

import React from 'react';

import { speedometerOutline } from 'ionicons/icons';

import type { Termination } from '../../types';
import { INPUT, LABEL } from '../shared/inputs';

import type { TerminationKindSpec } from './types';

const AssessmentScoreEditor: React.FC<{
    value: Extract<Termination, { kind: 'assessment-score' }>;
    onChange: (next: Termination) => void;
}> = ({ value, onChange }) => (
    <div className="space-y-1.5">
        <label className={LABEL} htmlFor="term-min-score">
            Minimum score
        </label>

        <input
            id="term-min-score"
            type="number"
            className={INPUT}
            value={value.min}
            onChange={e => onChange({ ...value, min: Number(e.target.value) || 0 })}
        />

        <p className="text-xs text-grayscale-500 leading-relaxed">
            Whatever scale your rubric uses — percent, 5-point, etc.
        </p>
    </div>
);

const assessmentScoreSpec: TerminationKindSpec<'assessment-score'> = {
    kind: 'assessment-score',
    label: 'Reach a score',
    icon: speedometerOutline,
    blurb: 'Done when the learner hits a minimum score.',
    selectable: true,

    default: () => ({ kind: 'assessment-score', min: 70 }),

    Editor: ({ value, onChange }) => (
        <AssessmentScoreEditor value={value} onChange={onChange} />
    ),

    summarize: value => `Score ${value.min} or higher`,
};

export default assessmentScoreSpec;

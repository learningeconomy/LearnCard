/**
 * Self-attest termination — learner ticks a box swearing they did
 * the work. No external evidence needed.
 *
 * Simplest of the variants; a single prompt string.
 */

import React from 'react';

import { handRightOutline } from 'ionicons/icons';

import type { Termination } from '../../types';
import { INPUT, LABEL } from '../shared/inputs';

import type { TerminationKindSpec } from './types';

const SelfAttestEditor: React.FC<{
    value: Extract<Termination, { kind: 'self-attest' }>;
    onChange: (next: Termination) => void;
}> = ({ value, onChange }) => (
    <div className="space-y-1.5">
        <label className={LABEL} htmlFor="term-prompt">
            What they attest to
        </label>

        <textarea
            id="term-prompt"
            rows={2}
            className={`${INPUT} resize-none`}
            placeholder="e.g. 'I practiced for 20 minutes today.'"
            value={value.prompt}
            onChange={e => onChange({ ...value, prompt: e.target.value })}
        />
    </div>
);

const selfAttestSpec: TerminationKindSpec<'self-attest'> = {
    kind: 'self-attest',
    label: 'I did the work',
    icon: handRightOutline,
    blurb: 'Learner ticks a box confirming they did it.',
    selectable: true,

    default: () => ({ kind: 'self-attest', prompt: 'I did the work.' }),

    Editor: ({ value, onChange }) => (
        <SelfAttestEditor value={value} onChange={onChange} />
    ),

    // The prompt is shown in the expanded inspector; the summary
    // stays terse so collapsed rows don't get bloated.
    summarize: () => 'Self-attest',
};

export default selfAttestSpec;

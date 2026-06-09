/**
 * Practice policy — recurring work on a cadence.
 *
 * "Practice daily", "Practice 3× per week", "Practice occasionally".
 * Paired most naturally with an `artifact-count` termination.
 */

import React from 'react';

import { repeatOutline } from 'ionicons/icons';

import type { ArtifactType, Policy } from '../../types';
import { CHIP_ACTIVE, CHIP_BASE, CHIP_INACTIVE, INPUT, LABEL } from '../shared/inputs';

import type { PolicyKindSpec } from './types';

const ARTIFACT_OPTIONS: readonly ArtifactType[] = [
    'text',
    'image',
    'audio',
    'video',
    'pdf',
    'link',
    'code',
    'other',
];

const ARTIFACT_LABEL: Record<ArtifactType, string> = {
    text: 'Note',
    image: 'Image',
    audio: 'Audio',
    video: 'Video',
    pdf: 'PDF',
    link: 'Link',
    code: 'Code',
    other: 'File',
};

/**
 * Cadence → human phrase. Keeps the summary identical to what
 * `summarizePolicy.ts` used to emit so the existing summary tests
 * keep passing unchanged.
 */
const describeCadence = (
    frequency: 'daily' | 'weekly' | 'monthly' | 'ad-hoc',
    perPeriod: number,
): string => {
    if (frequency === 'ad-hoc') return 'occasionally';

    if (perPeriod <= 1) {
        switch (frequency) {
            case 'daily':
                return 'daily';
            case 'weekly':
                return 'weekly';
            case 'monthly':
                return 'monthly';
        }
    }

    const unit = frequency === 'daily' ? 'day' : frequency === 'weekly' ? 'week' : 'month';
    return `${perPeriod}× per ${unit}`;
};

const PracticeEditor: React.FC<{
    value: Extract<Policy, { kind: 'practice' }>;
    onChange: (next: Policy) => void;
}> = ({ value, onChange }) => {
    const toggleArtifact = (t: ArtifactType) => {
        const has = value.artifactTypes.includes(t);
        const next = has
            ? value.artifactTypes.filter(x => x !== t)
            : [...value.artifactTypes, t];

        // Must have at least one accepted artifact — otherwise the
        // learner has no way to record practice. We reject the empty
        // state rather than letting the user commit it.
        if (next.length === 0) return;

        onChange({ ...value, artifactTypes: next });
    };

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <label className={LABEL} htmlFor="policy-practice-frequency">
                        How often
                    </label>

                    <select
                        id="policy-practice-frequency"
                        className={INPUT}
                        value={value.cadence.frequency}
                        onChange={e =>
                            onChange({
                                ...value,
                                cadence: {
                                    ...value.cadence,
                                    frequency: e.target
                                        .value as typeof value.cadence.frequency,
                                },
                            })
                        }
                    >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="ad-hoc">Whenever</option>
                    </select>
                </div>

                <div className="space-y-1.5">
                    <label className={LABEL} htmlFor="policy-practice-per">
                        Per period
                    </label>

                    <input
                        id="policy-practice-per"
                        type="number"
                        min={1}
                        className={INPUT}
                        value={value.cadence.perPeriod}
                        onChange={e =>
                            onChange({
                                ...value,
                                cadence: {
                                    ...value.cadence,
                                    perPeriod: Math.max(1, Number(e.target.value) || 1),
                                },
                            })
                        }
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <p className={LABEL}>What they can submit</p>

                <div className="flex flex-wrap gap-2">
                    {ARTIFACT_OPTIONS.map(t => {
                        const selected = value.artifactTypes.includes(t);

                        return (
                            <button
                                key={t}
                                type="button"
                                onClick={() => toggleArtifact(t)}
                                className={`${CHIP_BASE} ${selected ? CHIP_ACTIVE : CHIP_INACTIVE}`}
                            >
                                {ARTIFACT_LABEL[t]}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const practiceSpec: PolicyKindSpec<'practice'> = {
    kind: 'practice',
    label: 'Practice regularly',
    icon: repeatOutline,
    blurb: 'Repeat work on a daily, weekly, or occasional rhythm.',

    default: () => ({
        kind: 'practice',
        cadence: { frequency: 'daily', perPeriod: 1 },
        artifactTypes: ['text'],
    }),

    Editor: ({ value, onChange }) => <PracticeEditor value={value} onChange={onChange} />,

    summarize: value =>
        `Practice ${describeCadence(value.cadence.frequency, value.cadence.perPeriod)}`,
};

export default practiceSpec;

/**
 * TerminationEditor — discriminated-union editor for the 5 Termination
 * variants (including recursive `composite`).
 *
 * Controlled component: never mutates state; only calls `onChange` with
 * the full new Termination value.
 */

import React from 'react';

import type { ArtifactType, Termination } from '../types';

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

const TERMINATION_KIND_LABELS: Record<Termination['kind'], string> = {
    'artifact-count': 'Attach N artifacts',
    endorsement: 'Get endorsements',
    'self-attest': 'Self-attest',
    'assessment-score': 'Reach a score',
    composite: 'All / any of sub-goals',
};

const defaultForKind = (kind: Termination['kind']): Termination => {
    switch (kind) {
        case 'artifact-count':
            return { kind: 'artifact-count', count: 1, artifactType: 'text' };
        case 'endorsement':
            return { kind: 'endorsement', minEndorsers: 1 };
        case 'self-attest':
            return { kind: 'self-attest', prompt: 'I did the work.' };
        case 'assessment-score':
            return { kind: 'assessment-score', min: 70 };
        case 'composite':
            return {
                kind: 'composite',
                require: 'all',
                of: [{ kind: 'self-attest', prompt: 'Sub-goal 1' }],
            };
    }
};

const label = 'text-xs font-medium text-grayscale-700';
const input =
    'w-full py-2.5 px-3 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-poppins';

// -----------------------------------------------------------------
// Variant fields
// -----------------------------------------------------------------

const ArtifactCountFields: React.FC<{
    value: Extract<Termination, { kind: 'artifact-count' }>;
    onChange: (next: Termination) => void;
}> = ({ value, onChange }) => (
    <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
            <label className={label} htmlFor="term-count">
                Count
            </label>

            <input
                id="term-count"
                type="number"
                min={1}
                className={input}
                value={value.count}
                onChange={e =>
                    onChange({ ...value, count: Math.max(1, Number(e.target.value) || 1) })
                }
            />
        </div>

        <div className="space-y-1.5">
            <label className={label} htmlFor="term-type">
                Artifact type
            </label>

            <select
                id="term-type"
                className={input}
                value={value.artifactType}
                onChange={e =>
                    onChange({ ...value, artifactType: e.target.value as ArtifactType })
                }
            >
                {ARTIFACT_OPTIONS.map(t => (
                    <option key={t} value={t}>
                        {t}
                    </option>
                ))}
            </select>
        </div>
    </div>
);

const EndorsementFields: React.FC<{
    value: Extract<Termination, { kind: 'endorsement' }>;
    onChange: (next: Termination) => void;
}> = ({ value, onChange }) => (
    <div className="space-y-3">
        <div className="space-y-1.5">
            <label className={label} htmlFor="term-min-endorsers">
                Minimum endorsers
            </label>

            <input
                id="term-min-endorsers"
                type="number"
                min={1}
                className={input}
                value={value.minEndorsers}
                onChange={e =>
                    onChange({
                        ...value,
                        minEndorsers: Math.max(1, Number(e.target.value) || 1),
                    })
                }
            />
        </div>

        <div className="space-y-1.5">
            <label className={label} htmlFor="term-trusted-issuers">
                Trusted issuer DIDs (optional, comma-separated)
            </label>

            <input
                id="term-trusted-issuers"
                type="text"
                className={input}
                placeholder="did:web:school.edu, did:key:…"
                value={value.trustedIssuers?.join(', ') ?? ''}
                onChange={e => {
                    const list = e.target.value
                        .split(',')
                        .map(s => s.trim())
                        .filter(Boolean);

                    onChange({
                        ...value,
                        trustedIssuers: list.length > 0 ? list : undefined,
                    });
                }}
            />
        </div>
    </div>
);

const SelfAttestFields: React.FC<{
    value: Extract<Termination, { kind: 'self-attest' }>;
    onChange: (next: Termination) => void;
}> = ({ value, onChange }) => (
    <div className="space-y-1.5">
        <label className={label} htmlFor="term-prompt">
            Prompt
        </label>

        <textarea
            id="term-prompt"
            rows={2}
            className={`${input} resize-none`}
            placeholder="What is the learner attesting to?"
            value={value.prompt}
            onChange={e => onChange({ ...value, prompt: e.target.value })}
        />
    </div>
);

const AssessmentScoreFields: React.FC<{
    value: Extract<Termination, { kind: 'assessment-score' }>;
    onChange: (next: Termination) => void;
}> = ({ value, onChange }) => (
    <div className="space-y-1.5">
        <label className={label} htmlFor="term-min-score">
            Minimum score
        </label>

        <input
            id="term-min-score"
            type="number"
            className={input}
            value={value.min}
            onChange={e => onChange({ ...value, min: Number(e.target.value) || 0 })}
        />
    </div>
);

const CompositeFields: React.FC<{
    value: Extract<Termination, { kind: 'composite' }>;
    onChange: (next: Termination) => void;
}> = ({ value, onChange }) => {
    const updateSub = (i: number, next: Termination) => {
        onChange({
            ...value,
            of: value.of.map((t, idx) => (idx === i ? next : t)),
        });
    };

    const removeSub = (i: number) => {
        if (value.of.length === 1) return;
        onChange({ ...value, of: value.of.filter((_, idx) => idx !== i) });
    };

    const addSub = () =>
        onChange({
            ...value,
            of: [...value.of, { kind: 'self-attest', prompt: `Sub-goal ${value.of.length + 1}` }],
        });

    return (
        <div className="space-y-3">
            <div className="space-y-1.5">
                <label className={label} htmlFor="term-require">
                    Require
                </label>

                <select
                    id="term-require"
                    className={input}
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
                <p className={label}>Sub-goals</p>

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

// -----------------------------------------------------------------
// Editor
// -----------------------------------------------------------------

interface TerminationEditorProps {
    value: Termination;
    onChange: (next: Termination) => void;
    /** When true, hides the outer "Termination" label so composite nesting reads cleanly. */
    nested?: boolean;
}

const TerminationEditor: React.FC<TerminationEditorProps> = ({ value, onChange, nested }) => {
    const handleKindChange = (nextKind: Termination['kind']) => {
        if (nextKind === value.kind) return;
        onChange(defaultForKind(nextKind));
    };

    // Composite sub-goals can't themselves be composite (keep depth finite
    // and the UI readable). Filter it out of the options when nested.
    const kinds = (Object.keys(TERMINATION_KIND_LABELS) as Termination['kind'][]).filter(
        k => !(nested && k === 'composite'),
    );

    return (
        <div className="space-y-3">
            <div className="space-y-1.5">
                {!nested && (
                    <label className={label} htmlFor="term-kind">
                        Termination
                    </label>
                )}

                <select
                    id={nested ? undefined : 'term-kind'}
                    className={input}
                    value={value.kind}
                    onChange={e => handleKindChange(e.target.value as Termination['kind'])}
                >
                    {kinds.map(k => (
                        <option key={k} value={k}>
                            {TERMINATION_KIND_LABELS[k]}
                        </option>
                    ))}
                </select>
            </div>

            {value.kind === 'artifact-count' && (
                <ArtifactCountFields value={value} onChange={onChange} />
            )}

            {value.kind === 'endorsement' && (
                <EndorsementFields value={value} onChange={onChange} />
            )}

            {value.kind === 'self-attest' && (
                <SelfAttestFields value={value} onChange={onChange} />
            )}

            {value.kind === 'assessment-score' && (
                <AssessmentScoreFields value={value} onChange={onChange} />
            )}

            {value.kind === 'composite' && (
                <CompositeFields value={value} onChange={onChange} />
            )}
        </div>
    );
};

export default TerminationEditor;

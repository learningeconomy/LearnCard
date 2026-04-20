/**
 * PolicyEditor — discriminated-union editor for the 5 Policy variants.
 *
 * Switching `kind` resets the form to sensible defaults for that
 * variant. The component is controlled: it never mutates pathway state
 * directly, only calls `onChange` with the full new Policy value.
 */

import React from 'react';

import type { ArtifactType, Policy, Rubric } from '../types';

// -----------------------------------------------------------------
// Defaults per variant — used when switching `kind`
// -----------------------------------------------------------------

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

const POLICY_KIND_LABELS: Record<Policy['kind'], string> = {
    practice: 'Practice (recurring)',
    review: 'Review (FSRS)',
    assessment: 'Assessment (rubric)',
    artifact: 'Artifact (one-shot)',
    external: 'External tool (MCP)',
};

const defaultForKind = (kind: Policy['kind']): Policy => {
    switch (kind) {
        case 'practice':
            return {
                kind: 'practice',
                cadence: { frequency: 'daily', perPeriod: 1 },
                artifactTypes: ['text'],
            };
        case 'review':
            return {
                kind: 'review',
                fsrs: { stability: 0, difficulty: 0 },
            };
        case 'assessment':
            return {
                kind: 'assessment',
                rubric: { criteria: [{ id: 'c1', description: '', weight: 1 }] },
            };
        case 'artifact':
            return { kind: 'artifact', prompt: '', expectedArtifact: 'text' };
        case 'external':
            return {
                kind: 'external',
                mcp: { serverId: '', toolName: '' },
            };
    }
};

// -----------------------------------------------------------------
// Field primitives — small styled inputs scoped to this editor
// -----------------------------------------------------------------

const label = 'text-xs font-medium text-grayscale-700';
const input =
    'w-full py-2.5 px-3 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-poppins';

// -----------------------------------------------------------------
// Variant sub-forms
// -----------------------------------------------------------------

const PracticeFields: React.FC<{
    value: Extract<Policy, { kind: 'practice' }>;
    onChange: (next: Policy) => void;
}> = ({ value, onChange }) => {
    const toggleArtifact = (t: ArtifactType) => {
        const has = value.artifactTypes.includes(t);
        const next = has
            ? value.artifactTypes.filter(x => x !== t)
            : [...value.artifactTypes, t];

        if (next.length === 0) return; // must have at least one

        onChange({ ...value, artifactTypes: next });
    };

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <label className={label} htmlFor="policy-practice-frequency">
                        Frequency
                    </label>

                    <select
                        id="policy-practice-frequency"
                        className={input}
                        value={value.cadence.frequency}
                        onChange={e =>
                            onChange({
                                ...value,
                                cadence: {
                                    ...value.cadence,
                                    frequency: e.target.value as typeof value.cadence.frequency,
                                },
                            })
                        }
                    >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="ad-hoc">Ad-hoc</option>
                    </select>
                </div>

                <div className="space-y-1.5">
                    <label className={label} htmlFor="policy-practice-per">
                        Per period
                    </label>

                    <input
                        id="policy-practice-per"
                        type="number"
                        min={1}
                        className={input}
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
                <p className={label}>Expected artifact types</p>

                <div className="flex flex-wrap gap-2">
                    {ARTIFACT_OPTIONS.map(t => {
                        const selected = value.artifactTypes.includes(t);

                        return (
                            <button
                                key={t}
                                type="button"
                                onClick={() => toggleArtifact(t)}
                                className={`py-1.5 px-3 rounded-full text-xs font-medium transition-colors border ${
                                    selected
                                        ? 'bg-grayscale-900 border-grayscale-900 text-white'
                                        : 'bg-white border-grayscale-300 text-grayscale-700 hover:bg-grayscale-10'
                                }`}
                            >
                                {t}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const ReviewFields: React.FC<{
    value: Extract<Policy, { kind: 'review' }>;
    onChange: (next: Policy) => void;
}> = ({ value, onChange }) => (
    <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
            <label className={label} htmlFor="policy-review-due">
                Next review
            </label>

            <input
                id="policy-review-due"
                type="datetime-local"
                className={input}
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
            <label className={label} htmlFor="policy-review-stability">
                Stability
            </label>

            <input
                id="policy-review-stability"
                type="number"
                min={0}
                step="0.1"
                className={input}
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
);

const ArtifactFields: React.FC<{
    value: Extract<Policy, { kind: 'artifact' }>;
    onChange: (next: Policy) => void;
}> = ({ value, onChange }) => (
    <div className="space-y-3">
        <div className="space-y-1.5">
            <label className={label} htmlFor="policy-artifact-prompt">
                Prompt
            </label>

            <textarea
                id="policy-artifact-prompt"
                rows={2}
                className={`${input} resize-none`}
                placeholder="What are you asking the learner to produce?"
                value={value.prompt}
                onChange={e => onChange({ ...value, prompt: e.target.value })}
            />
        </div>

        <div className="space-y-1.5">
            <label className={label} htmlFor="policy-artifact-type">
                Expected type
            </label>

            <select
                id="policy-artifact-type"
                className={input}
                value={value.expectedArtifact}
                onChange={e =>
                    onChange({
                        ...value,
                        expectedArtifact: e.target.value as ArtifactType,
                    })
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

const AssessmentFields: React.FC<{
    value: Extract<Policy, { kind: 'assessment' }>;
    onChange: (next: Policy) => void;
}> = ({ value, onChange }) => {
    const updateCriterion = (i: number, patch: Partial<Rubric['criteria'][number]>) => {
        onChange({
            ...value,
            rubric: {
                criteria: value.rubric.criteria.map((c, idx) =>
                    idx === i ? { ...c, ...patch } : c,
                ),
            },
        });
    };

    const addCriterion = () =>
        onChange({
            ...value,
            rubric: {
                criteria: [
                    ...value.rubric.criteria,
                    { id: `c${value.rubric.criteria.length + 1}`, description: '', weight: 1 },
                ],
            },
        });

    const removeCriterion = (i: number) => {
        if (value.rubric.criteria.length === 1) return;
        onChange({
            ...value,
            rubric: { criteria: value.rubric.criteria.filter((_, idx) => idx !== i) },
        });
    };

    return (
        <div className="space-y-3">
            <p className={label}>Rubric criteria</p>

            <ul className="space-y-2">
                {value.rubric.criteria.map((c, i) => (
                    <li key={c.id} className="flex gap-2 items-start">
                        <input
                            type="text"
                            className={input}
                            placeholder="What's being assessed?"
                            value={c.description}
                            onChange={e => updateCriterion(i, { description: e.target.value })}
                        />

                        <input
                            type="number"
                            min={0}
                            step="0.5"
                            className={`${input} w-20`}
                            value={c.weight}
                            onChange={e =>
                                updateCriterion(i, {
                                    weight: Math.max(0, Number(e.target.value) || 0),
                                })
                            }
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

const ExternalFields: React.FC<{
    value: Extract<Policy, { kind: 'external' }>;
    onChange: (next: Policy) => void;
}> = ({ value, onChange }) => (
    <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
            <label className={label} htmlFor="policy-external-server">
                MCP server
            </label>

            <input
                id="policy-external-server"
                type="text"
                className={input}
                placeholder="e.g. github"
                value={value.mcp.serverId}
                onChange={e =>
                    onChange({ ...value, mcp: { ...value.mcp, serverId: e.target.value } })
                }
            />
        </div>

        <div className="space-y-1.5">
            <label className={label} htmlFor="policy-external-tool">
                Tool name
            </label>

            <input
                id="policy-external-tool"
                type="text"
                className={input}
                placeholder="e.g. create_pull_request"
                value={value.mcp.toolName}
                onChange={e =>
                    onChange({ ...value, mcp: { ...value.mcp, toolName: e.target.value } })
                }
            />
        </div>
    </div>
);

// -----------------------------------------------------------------
// Editor
// -----------------------------------------------------------------

interface PolicyEditorProps {
    value: Policy;
    onChange: (next: Policy) => void;
}

const PolicyEditor: React.FC<PolicyEditorProps> = ({ value, onChange }) => {
    const handleKindChange = (nextKind: Policy['kind']) => {
        if (nextKind === value.kind) return;
        onChange(defaultForKind(nextKind));
    };

    return (
        <div className="space-y-4">
            <div className="space-y-1.5">
                <label className={label} htmlFor="policy-kind">
                    Policy
                </label>

                <select
                    id="policy-kind"
                    className={input}
                    value={value.kind}
                    onChange={e => handleKindChange(e.target.value as Policy['kind'])}
                >
                    {(Object.keys(POLICY_KIND_LABELS) as Policy['kind'][]).map(k => (
                        <option key={k} value={k}>
                            {POLICY_KIND_LABELS[k]}
                        </option>
                    ))}
                </select>
            </div>

            {value.kind === 'practice' && (
                <PracticeFields value={value} onChange={onChange} />
            )}

            {value.kind === 'review' && <ReviewFields value={value} onChange={onChange} />}

            {value.kind === 'artifact' && (
                <ArtifactFields value={value} onChange={onChange} />
            )}

            {value.kind === 'assessment' && (
                <AssessmentFields value={value} onChange={onChange} />
            )}

            {value.kind === 'external' && (
                <ExternalFields value={value} onChange={onChange} />
            )}
        </div>
    );
};

export default PolicyEditor;

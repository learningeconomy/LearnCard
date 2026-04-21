/**
 * PolicyEditor — discriminated-union editor for the 5 Policy variants.
 *
 * Switching `kind` resets the form to sensible defaults for that
 * variant. The component is controlled: it never mutates pathway state
 * directly, only calls `onChange` with the full new Policy value.
 */

import React from 'react';

import {
    wouldCreateCycle,
    type PathwayMap,
} from '../core/composition';
import type {
    ArtifactType,
    CompositeRenderStyle,
    Policy,
    Rubric,
} from '../types';

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
    composite: 'Nested pathway (composite)',
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
        case 'composite':
            // Intentionally invalid-by-Zod: `pathwayRef` must be a uuid,
            // and '' isn't. NodeEditor holds this incomplete state until
            // the author picks a target pathway — only THEN is it
            // committed upstream. Keeping the placeholder here means the
            // kind-switch feels instantaneous and the picker renders
            // immediately next to the dropdown.
            return {
                kind: 'composite',
                pathwayRef: '',
                renderStyle: 'inline-expandable',
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
// Composite — points a node at another pathway (nesting/composition)
// -----------------------------------------------------------------

const RENDER_STYLE_LABELS: Record<CompositeRenderStyle, { title: string; blurb: string }> = {
    'inline-expandable': {
        title: 'Inline (nesting)',
        blurb:
            "Show the referenced pathway's steps inside this node. Best when it feels like a chunk of this pathway.",
    },
    'link-out': {
        title: 'Link out (composition)',
        blurb:
            "Show a 'Complete X to unlock' card that jumps to the other pathway. Best when it has its own identity.",
    },
};

const CompositeFields: React.FC<{
    value: Extract<Policy, { kind: 'composite' }>;
    onChange: (next: Policy) => void;
    allPathways: PathwayMap;
    parentPathwayId: string;
}> = ({ value, onChange, allPathways, parentPathwayId }) => {
    // Pathways the learner can embed: every subscribed pathway except
    // the one being edited AND any that would close a composite cycle.
    // We compute it once per render; the set is small.
    const candidates = Object.values(allPathways).filter(p => {
        if (p.id === parentPathwayId) return false;
        if (wouldCreateCycle(allPathways, parentPathwayId, p.id)) return false;

        return true;
    });

    const selected = value.pathwayRef ? allPathways[value.pathwayRef] ?? null : null;

    // Render-aware warning: if the user has a selected ref and it IS
    // the parent or WOULD cycle, flag it rather than silently allowing
    // an invalid state. Defensive — the picker already filters them,
    // but imports/proposals can sneak composite policies in.
    const invalidSelected =
        value.pathwayRef &&
        (value.pathwayRef === parentPathwayId ||
            wouldCreateCycle(allPathways, parentPathwayId, value.pathwayRef));

    return (
        <div className="space-y-4">
            {/* Pathway picker */}
            <div className="space-y-1.5">
                <label className={label} htmlFor="policy-composite-ref">
                    Referenced pathway
                </label>

                {candidates.length === 0 ? (
                    <p className="text-xs text-grayscale-500 leading-relaxed">
                        No other pathways available. Import one from the Credential
                        Engine Registry or add another pathway first.
                    </p>
                ) : (
                    <select
                        id="policy-composite-ref"
                        className={input}
                        value={value.pathwayRef}
                        onChange={e =>
                            onChange({ ...value, pathwayRef: e.target.value })
                        }
                    >
                        <option value="">Pick a pathway…</option>

                        {candidates.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.title}
                            </option>
                        ))}
                    </select>
                )}

                {selected && (
                    <p className="text-xs text-grayscale-500">
                        {selected.nodes.length}{' '}
                        {selected.nodes.length === 1 ? 'step' : 'steps'}
                        {selected.destinationNodeId
                            ? ` · ends with ${
                                  selected.nodes.find(
                                      n => n.id === selected.destinationNodeId,
                                  )?.title ?? 'destination'
                              }`
                            : ''}
                    </p>
                )}

                {invalidSelected && (
                    <p className="text-xs text-red-700 leading-relaxed">
                        This would create a cycle between pathways. Pick a different one.
                    </p>
                )}
            </div>

            {/* Render style radio */}
            <div className="space-y-2">
                <p className={label}>How should this node show up?</p>

                <div className="space-y-2">
                    {(Object.keys(RENDER_STYLE_LABELS) as CompositeRenderStyle[]).map(
                        style => {
                            const meta = RENDER_STYLE_LABELS[style];
                            const isActive = value.renderStyle === style;

                            return (
                                <label
                                    key={style}
                                    className={`block cursor-pointer rounded-xl border p-3 transition-colors ${
                                        isActive
                                            ? 'border-emerald-500 bg-emerald-50'
                                            : 'border-grayscale-300 bg-white hover:border-grayscale-400'
                                    }`}
                                >
                                    <div className="flex items-start gap-2.5">
                                        <input
                                            type="radio"
                                            name="policy-composite-render-style"
                                            value={style}
                                            checked={isActive}
                                            onChange={() =>
                                                onChange({
                                                    ...value,
                                                    renderStyle: style,
                                                })
                                            }
                                            className="mt-0.5 accent-emerald-600"
                                        />

                                        <span className="min-w-0 flex-1">
                                            <span className="block text-sm font-medium text-grayscale-900">
                                                {meta.title}
                                            </span>

                                            <span className="block text-xs text-grayscale-600 leading-relaxed mt-0.5">
                                                {meta.blurb}
                                            </span>
                                        </span>
                                    </div>
                                </label>
                            );
                        },
                    )}
                </div>
            </div>
        </div>
    );
};

// -----------------------------------------------------------------
// Editor
// -----------------------------------------------------------------

interface PolicyEditorProps {
    value: Policy;
    onChange: (next: Policy) => void;

    /**
     * Context needed only for the `composite` variant — the pathway
     * ref picker filters out cycle-creating candidates and the
     * current pathway itself. Safely optional: when not provided,
     * composite editing is hidden behind a "not available here"
     * message rather than crashing.
     */
    parentPathwayId?: string;
    allPathways?: PathwayMap;
}

const PolicyEditor: React.FC<PolicyEditorProps> = ({
    value,
    onChange,
    parentPathwayId,
    allPathways,
}) => {
    const handleKindChange = (nextKind: Policy['kind']) => {
        if (nextKind === value.kind) return;
        onChange(defaultForKind(nextKind));
    };

    const canEditComposite = !!(parentPathwayId && allPathways);

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

            {value.kind === 'composite' && (
                canEditComposite ? (
                    <CompositeFields
                        value={value}
                        onChange={onChange}
                        parentPathwayId={parentPathwayId!}
                        allPathways={allPathways!}
                    />
                ) : (
                    <p className="text-xs text-grayscale-500 leading-relaxed">
                        Composite editing isn't available in this context.
                    </p>
                )
            )}
        </div>
    );
};

export default PolicyEditor;

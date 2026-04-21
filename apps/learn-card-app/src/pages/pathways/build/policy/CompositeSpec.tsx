/**
 * Composite policy — nest another pathway inside this node.
 *
 * This is the load-bearing primitive for BOTH nesting ("substeps
 * inside this node") and composition ("complete pathway X first").
 * The render-style radio picks which experience the learner sees;
 * the underlying data is identical.
 *
 * The current `<select>` pathway picker is a placeholder — M3
 * replaces it with a searchable, image-rich picker reusing the
 * catalog modal's patterns. The cycle-detection filter applied here
 * is identical to what the existing NodeEditor used.
 */

import React from 'react';

import { gitBranchOutline } from 'ionicons/icons';

import { wouldCreateCycle } from '../../core/composition';
import type { CompositeRenderStyle, Policy } from '../../types';
import { INPUT, LABEL } from '../shared/inputs';

import type { PolicyEditorProps, PolicyKindSpec } from './types';

const RENDER_STYLE_LABELS: Record<
    CompositeRenderStyle,
    { title: string; blurb: string }
> = {
    'inline-expandable': {
        title: 'Show inline',
        blurb:
            "Render the nested pathway's steps right here. Best when it feels like a chunk of this pathway.",
    },
    'link-out': {
        title: 'Link to it',
        blurb:
            "Show a card that jumps to the other pathway. Best when the nested pathway has its own identity.",
    },
};

const CompositeEditor: React.FC<PolicyEditorProps<'composite'>> = ({
    value,
    onChange,
    context,
}) => {
    const { parentPathwayId, allPathways } = context;

    // Without the cross-pathway context we can't safely edit
    // composite refs (no way to filter out cycles). Render a gentle
    // explainer instead of a broken picker.
    if (!parentPathwayId || !allPathways) {
        return (
            <p className="text-xs text-grayscale-500 leading-relaxed">
                Nested-pathway editing isn't available in this view.
            </p>
        );
    }

    const candidates = Object.values(allPathways).filter(p => {
        if (p.id === parentPathwayId) return false;
        if (wouldCreateCycle(allPathways, parentPathwayId, p.id)) return false;

        return true;
    });

    const selected = value.pathwayRef ? (allPathways[value.pathwayRef] ?? null) : null;

    // Defensive: the picker filters out cycle-creators, but
    // imports/proposals could produce an invalid composite after
    // the fact. Flagging the state is better than silently rendering it.
    const invalidSelected =
        value.pathwayRef &&
        (value.pathwayRef === parentPathwayId ||
            wouldCreateCycle(allPathways, parentPathwayId, value.pathwayRef));

    return (
        <div className="space-y-4">
            <div className="space-y-1.5">
                <label className={LABEL} htmlFor="policy-composite-ref">
                    Nested pathway
                </label>

                {candidates.length === 0 ? (
                    <p className="text-xs text-grayscale-500 leading-relaxed">
                        No other pathways available yet. Import one from the
                        Credential Engine Registry or create another pathway first.
                    </p>
                ) : (
                    <select
                        id="policy-composite-ref"
                        className={INPUT}
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
                        This would create a loop between pathways. Pick a different one.
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <p className={LABEL}>How it shows up</p>

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
                                                onChange({ ...value, renderStyle: style })
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

const compositeSpec: PolicyKindSpec<'composite'> = {
    kind: 'composite',
    label: 'Complete a nested pathway',
    icon: gitBranchOutline,
    blurb: "Finishes when the learner completes another pathway's destination.",

    // Intentionally Zod-invalid: `pathwayRef` must be a uuid, and '' isn't.
    // The UI holds this incomplete state until the author picks a target;
    // publish-time validation catches it if they skip that step.
    default: () => ({
        kind: 'composite',
        pathwayRef: '' as unknown as Extract<Policy, { kind: 'composite' }>['pathwayRef'],
        renderStyle: 'inline-expandable',
    }),

    Editor: ({ value, onChange, context }) => (
        <CompositeEditor value={value} onChange={onChange} context={context} />
    ),

    summarize: (value, ctx) => {
        if (!value.pathwayRef) return 'Complete a nested pathway (pick one)';

        const title = ctx.pathwayTitleById?.[value.pathwayRef];
        return title ? `Complete ${title}` : 'Complete a nested pathway';
    },
};

export default compositeSpec;

/**
 * Composite policy — nest another pathway inside this node.
 *
 * This is the load-bearing primitive for BOTH nesting ("substeps
 * inside this node") and composition ("complete pathway X first").
 * The render-style radio picks which experience the learner sees;
 * the underlying data is identical.
 *
 * M3 replaces the old bare `<select>` of UUIDs with
 * `PathwayPickerModal` — a searchable picker showing title, step
 * count, destination, and provenance. Cycle detection still
 * applies (candidates that would create a loop are omitted).
 */

import React, { useState } from 'react';

import { IonIcon } from '@ionic/react';
import {
    gitBranchOutline,
    searchOutline,
    swapHorizontalOutline,
} from 'ionicons/icons';

import { wouldCreateCycle } from '../../core/composition';
import type { CompositeRenderStyle, Pathway, Policy } from '../../types';
import { LABEL } from '../shared/inputs';

import PathwayPickerModal from './PathwayPickerModal';
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
    const { parentPathwayId, allPathways, onCreateNestedPathway } = context;
    const [pickerOpen, setPickerOpen] = useState(false);

    // Without the cross-pathway context we can't safely edit
    // composite refs (no way to filter cycles). Render an
    // explainer instead of a half-working picker.
    if (!parentPathwayId || !allPathways) {
        return (
            <p className="text-xs text-grayscale-500 leading-relaxed">
                Nested-pathway editing isn't available in this view.
            </p>
        );
    }

    const selected: Pathway | null = value.pathwayRef
        ? (allPathways[value.pathwayRef] ?? null)
        : null;

    // Defensive: the picker filters out cycle-creators, but imports
    // or proposals could produce an invalid composite after the fact.
    // Surface the state honestly rather than silently render it.
    const invalidSelected =
        !!value.pathwayRef &&
        (value.pathwayRef === parentPathwayId ||
            wouldCreateCycle(allPathways, parentPathwayId, value.pathwayRef));

    const handlePick = (pathway: Pathway) => {
        onChange({ ...value, pathwayRef: pathway.id });
        setPickerOpen(false);
    };

    return (
        <div className="space-y-4">
            <div className="space-y-1.5">
                <p className={LABEL}>Nested pathway</p>

                {selected ? (
                    <SelectedCard
                        pathway={selected}
                        invalid={invalidSelected}
                        onChange={() => setPickerOpen(true)}
                    />
                ) : (
                    <button
                        type="button"
                        onClick={() => setPickerOpen(true)}
                        className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-dashed border-grayscale-300 text-sm font-medium text-grayscale-700 hover:bg-grayscale-10 transition-colors"
                    >
                        <IonIcon
                            icon={searchOutline}
                            aria-hidden
                            className="text-base"
                        />
                        Pick a pathway…
                    </button>
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

            {pickerOpen && (
                <PathwayPickerModal
                    parentPathwayId={parentPathwayId}
                    allPathways={allPathways}
                    currentRef={value.pathwayRef || undefined}
                    onPick={handlePick}
                    onCreateNew={
                        onCreateNestedPathway
                            ? () => {
                                  // Default title mirrors the OutlinePane's
                                  // "Nest a pathway" affordance for
                                  // consistency. The author can rename
                                  // from the nested pathway's Identity
                                  // section after drill-in.
                                  onCreateNestedPathway('New nested pathway');
                                  setPickerOpen(false);
                              }
                            : undefined
                    }
                    onClose={() => setPickerOpen(false)}
                />
            )}
        </div>
    );
};

// ---------------------------------------------------------------------------
// SelectedCard — compact summary of the current reference with a
// "change" button. Keeps the picker modal out of the way 99% of the
// time; most authors pick once and tweak other fields afterwards.
// ---------------------------------------------------------------------------

const SelectedCard: React.FC<{
    pathway: Pathway;
    invalid: boolean;
    onChange: () => void;
}> = ({ pathway, invalid, onChange }) => {
    const destination = pathway.destinationNodeId
        ? pathway.nodes.find(n => n.id === pathway.destinationNodeId)
        : null;

    return (
        <div
            className={`
                flex items-start gap-3 p-3 rounded-xl border
                ${invalid ? 'border-red-200 bg-red-50' : 'border-grayscale-300 bg-white'}
            `}
        >
            <IonIcon
                icon={gitBranchOutline}
                aria-hidden
                className={`
                    text-base mt-0.5 shrink-0
                    ${invalid ? 'text-red-600' : 'text-emerald-600'}
                `}
            />

            <div className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-grayscale-900 truncate">
                    {pathway.title}
                </span>

                <span className="block text-xs text-grayscale-500 mt-0.5">
                    {pathway.nodes.length}{' '}
                    {pathway.nodes.length === 1 ? 'step' : 'steps'}
                    {destination ? ` · ends with ${destination.title}` : ''}
                </span>

                {invalid && (
                    <span className="block text-xs text-red-700 mt-1 leading-relaxed">
                        This creates a loop between pathways. Pick a different one.
                    </span>
                )}
            </div>

            <button
                type="button"
                onClick={onChange}
                className="shrink-0 inline-flex items-center gap-1 py-1.5 px-3 rounded-full border border-grayscale-300 text-xs font-medium text-grayscale-700 hover:bg-grayscale-10 transition-colors"
            >
                <IonIcon
                    icon={swapHorizontalOutline}
                    aria-hidden
                    className="text-xs"
                />
                Change
            </button>
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

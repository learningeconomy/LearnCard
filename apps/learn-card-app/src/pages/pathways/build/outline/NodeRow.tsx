/**
 * NodeRow — a single row in the Builder's outline pane.
 *
 * Three visual dials:
 *
 *   1. **Selected** — solid grayscale-900 fill, white text. One and
 *      only one row is selected at a time; the inspector edits it.
 *
 *   2. **Destination** — a flag glyph floats in the top-right when
 *      this node is `pathway.destinationNodeId`. Exactly one row per
 *      pathway can bear this. A destination node is "where the
 *      pathway ends up" — it's the most semantically important
 *      marker on the outline.
 *
 *   3. **Nested** — rows that represent a node from a *different*
 *      pathway (inline-expanded composite children). Smaller, muted,
 *      and never "selected" in the inspector sense. Clicking drills
 *      into the nested pathway instead.
 *
 * The subtitle under the title replaces the old "ARTIFACT ·
 * ENDORSEMENT" jargon with a real human sentence from
 * `summarizePolicy` + `summarizeTermination`. Simpler nodes read:
 *
 *     Fundamentals of AI Pathway
 *     Submit a link · Get 1 endorsement
 */

import React from 'react';

import { IonIcon } from '@ionic/react';
import { flagOutline, flashOutline, gitBranchOutline } from 'ionicons/icons';

import type { PathwayNode } from '../../types';
import { summarizePolicy, type SummarizeContext } from '../summarize/summarizePolicy';
import { summarizeTermination } from '../summarize/summarizeTermination';

interface NodeRowProps {
    node: PathwayNode;
    isSelected: boolean;
    isDestination: boolean;
    onSelect: () => void;

    /**
     * Optional: render as a nested-pathway child row. Smaller type
     * and muted colors; `isSelected` is ignored (nested rows can't
     * be "selected" in the inspector). Click still fires `onSelect`
     * — BuildMode uses that to drill into the nested pathway.
     */
    nested?: boolean;

    /**
     * Pathway-id → title map threaded through so summarizers can
     * resolve composite refs into real titles.
     */
    summarizeContext?: SummarizeContext;
}

const NodeRow: React.FC<NodeRowProps> = ({
    node,
    isSelected,
    isDestination,
    onSelect,
    nested = false,
    summarizeContext,
}) => {
    const isComposite = node.stage.policy.kind === 'composite';

    // Two phrases, one subtitle. Joined with a mid-dot so the author
    // sees both "what happens" and "done when" at a glance.
    const policyPhrase = summarizePolicy(node.stage.policy, summarizeContext);
    const terminationPhrase = summarizeTermination(node.stage.termination, summarizeContext);
    const subtitle = `${policyPhrase} · ${terminationPhrase}`;

    if (nested) {
        // Nested rows are deliberately quieter — they're scaffolding
        // that tells the author "here's what's inside", not a primary
        // target. Never rendered as selected; the drill-in is the
        // only affordance.
        return (
            <button
                type="button"
                onClick={onSelect}
                className="w-full text-left py-1.5 pl-3 pr-2 rounded-lg hover:bg-grayscale-10 transition-colors group"
            >
                <div className="flex items-start gap-2">
                    <IonIcon
                        icon={isComposite ? gitBranchOutline : flashOutline}
                        aria-hidden
                        className={`
                            shrink-0 text-sm mt-0.5
                            ${isComposite ? 'text-emerald-500' : 'text-grayscale-400'}
                        `}
                    />

                    <div className="min-w-0 flex-1">
                        <span className="block text-xs font-medium text-grayscale-700 group-hover:text-grayscale-900 truncate">
                            {node.title || 'Untitled'}
                        </span>

                        <span className="block text-[10px] text-grayscale-400 mt-0.5 leading-snug truncate">
                            {subtitle}
                        </span>
                    </div>

                    {isDestination && (
                        <IonIcon
                            icon={flagOutline}
                            aria-hidden
                            title="Destination"
                            className="shrink-0 text-emerald-600 text-xs mt-0.5"
                        />
                    )}
                </div>
            </button>
        );
    }

    return (
        <button
            type="button"
            onClick={onSelect}
            aria-current={isSelected ? 'true' : undefined}
            className={`
                relative w-full text-left py-2.5 pl-3 pr-8 rounded-xl
                border transition-colors
                ${
                    isSelected
                        ? 'bg-grayscale-900 border-grayscale-900 text-white'
                        : 'bg-white border-grayscale-200 text-grayscale-900 hover:bg-grayscale-10'
                }
            `}
        >
            <div className="flex items-start gap-2">
                <IonIcon
                    icon={isComposite ? gitBranchOutline : flashOutline}
                    aria-hidden
                    className={`
                        shrink-0 text-base mt-0.5
                        ${
                            isSelected
                                ? 'text-white/70'
                                : isComposite
                                  ? 'text-emerald-600'
                                  : 'text-grayscale-500'
                        }
                    `}
                />

                <div className="min-w-0 flex-1">
                    <span className="block text-sm font-medium truncate">
                        {node.title || 'Untitled'}
                    </span>

                    <span
                        className={`
                            block text-[11px] mt-0.5 leading-snug truncate
                            ${isSelected ? 'text-white/60' : 'text-grayscale-500'}
                        `}
                    >
                        {subtitle}
                    </span>
                </div>
            </div>

            {isDestination && (
                <span
                    aria-label="Destination"
                    title="Destination"
                    className={`
                        absolute top-2 right-2 inline-flex items-center justify-center
                        w-5 h-5 rounded-full
                        ${isSelected ? 'bg-white/15 text-white' : 'bg-emerald-50 text-emerald-700'}
                    `}
                >
                    <IonIcon icon={flagOutline} aria-hidden className="text-[12px]" />
                </span>
            )}
        </button>
    );
};

export default NodeRow;

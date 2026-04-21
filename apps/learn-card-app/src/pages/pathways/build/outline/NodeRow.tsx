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
 *   3. **Nested pathway** — rows whose policy is `composite` get a
 *      git-branch icon instead of the default flash icon, so the
 *      author can scan nested-pathway rows at a glance.
 *
 * The row label under the title replaces the old "ARTIFACT ·
 * ENDORSEMENT" jargon with a real human sentence from
 * `summarizePolicy` + `summarizeTermination`. Simpler nodes read:
 *
 *     Fundamentals of AI Pathway
 *     Submit a link · Get 1 endorsement
 *
 * …which is what the author actually needs to know when scanning.
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
     * Pathway-id → title map, threaded through so the summarizers can
     * resolve composite refs into real titles ("Complete AI in
     * Finance") rather than the fallback phrase.
     */
    summarizeContext?: SummarizeContext;
}

const NodeRow: React.FC<NodeRowProps> = ({
    node,
    isSelected,
    isDestination,
    onSelect,
    summarizeContext,
}) => {
    const isComposite = node.stage.policy.kind === 'composite';

    // Two phrases, one subtitle. We join with a mid-dot so the author
    // sees both "what happens" and "done when" in a single glance.
    // If the phrases are long they'll truncate — the inspector has
    // the full story.
    const policyPhrase = summarizePolicy(node.stage.policy, summarizeContext);
    const terminationPhrase = summarizeTermination(node.stage.termination, summarizeContext);

    const subtitle = `${policyPhrase} · ${terminationPhrase}`;

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

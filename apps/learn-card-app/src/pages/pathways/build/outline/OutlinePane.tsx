/**
 * OutlinePane — left side of the Builder.
 *
 * M1: flat list of `NodeRow`s plus three action buttons. Tree
 * rendering for nested (composite) pathways lands in M3 along with
 * drag-reorder and the searchable nested-pathway picker.
 *
 * Why the three action buttons stay as a flat stack:
 *
 *   - **Add step**        — the primary, neutral action.
 *   - **Nest a pathway** — peer-level, iconned differently so it
 *     reads as a distinct operation. This shortcut is preserved from
 *     the previous Builder so muscle memory still works.
 *   - **Import from CE** — subdued text link; it's a less-frequent
 *     op and doesn't belong competing with the two add actions.
 *
 * The visual hierarchy (filled → outlined → text) encodes frequency.
 */

import React from 'react';

import { IonIcon } from '@ionic/react';
import {
    addOutline,
    cloudDownloadOutline,
    gitBranchOutline,
} from 'ionicons/icons';

import type { Pathway } from '../../types';
import type { SummarizeContext } from '../summarize/summarizePolicy';
import NodeRow from './NodeRow';

interface OutlinePaneProps {
    pathway: Pathway;
    selectedId: string | null;
    onSelect: (nodeId: string) => void;
    onAddNode: () => void;
    onAddNestedPathway: () => void;
    onOpenImport: () => void;
    summarizeContext?: SummarizeContext;
}

const OutlinePane: React.FC<OutlinePaneProps> = ({
    pathway,
    selectedId,
    onSelect,
    onAddNode,
    onAddNestedPathway,
    onOpenImport,
    summarizeContext,
}) => {
    const destinationId = pathway.destinationNodeId ?? null;

    return (
        <aside className="space-y-3 font-poppins" aria-label="Pathway outline">
            <header className="flex items-center justify-between px-1">
                <h2 className="text-xs font-semibold text-grayscale-500 uppercase tracking-wide">
                    Steps
                </h2>

                <span className="text-xs text-grayscale-500 tabular-nums">
                    {pathway.nodes.length}
                </span>
            </header>

            {pathway.nodes.length === 0 ? (
                <div className="p-4 rounded-[20px] border border-dashed border-grayscale-300 bg-grayscale-10 text-center">
                    <p className="text-xs text-grayscale-600 leading-relaxed">
                        No steps yet. Add one below or import a pathway.
                    </p>
                </div>
            ) : (
                <ul className="space-y-1.5">
                    {pathway.nodes.map(n => (
                        <li key={n.id}>
                            <NodeRow
                                node={n}
                                isSelected={n.id === selectedId}
                                isDestination={n.id === destinationId}
                                onSelect={() => onSelect(n.id)}
                                summarizeContext={summarizeContext}
                            />
                        </li>
                    ))}
                </ul>
            )}

            <div className="space-y-1.5 pt-1">
                <button
                    type="button"
                    onClick={onAddNode}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-[20px] bg-grayscale-900 text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                    <IonIcon icon={addOutline} aria-hidden className="text-base" />
                    Add step
                </button>

                <button
                    type="button"
                    onClick={onAddNestedPathway}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-[20px] border border-grayscale-300 text-sm font-medium text-grayscale-700 hover:bg-grayscale-10 transition-colors"
                >
                    <IonIcon icon={gitBranchOutline} aria-hidden className="text-base" />
                    Nest a pathway
                </button>

                <button
                    type="button"
                    onClick={onOpenImport}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-[20px] text-sm font-medium text-grayscale-600 hover:text-grayscale-900 hover:bg-grayscale-10 transition-colors"
                >
                    <IonIcon
                        icon={cloudDownloadOutline}
                        aria-hidden
                        className="text-base"
                    />
                    Import from Credential Engine
                </button>
            </div>
        </aside>
    );
};

export default OutlinePane;

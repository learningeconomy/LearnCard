/**
 * IdentitySection — node title, description, and destination flag.
 *
 * Short and always-on: we pass `defaultOpen` and disable `sticky`
 * because the content fits on-screen comfortably. The summary shows
 * the node title in quotes (or "Untitled step") plus a destination
 * marker so the author always sees what they're editing *and*
 * whether it's the pathway's end.
 *
 * The destination toggle lives here rather than in its own section
 * because "is this step the pathway's end?" reads as part of the
 * step's identity within the pathway. The uniqueness constraint
 * (one destination per pathway) is enforced structurally by
 * `setDestinationNode` writing to a single pathway-level field.
 */

import React from 'react';

import { IonIcon } from '@ionic/react';
import { createOutline, flagOutline } from 'ionicons/icons';

import type { Pathway, PathwayNode } from '../../../types';
import { setDestinationNode, updateNode } from '../../buildOps';
import Section from '../Section';

interface IdentitySectionProps {
    pathway: Pathway;
    node: PathwayNode;
    onChangePathway: (next: Pathway) => void;
}

// Kept identical to the inputs used elsewhere in Build so the whole
// inspector feels like one form, not a patchwork.
const INPUT =
    'w-full py-2.5 px-3 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-poppins';

const LABEL = 'text-xs font-medium text-grayscale-700';

const IdentitySection: React.FC<IdentitySectionProps> = ({
    pathway,
    node,
    onChangePathway,
}) => {
    const isDestination = pathway.destinationNodeId === node.id;

    const handleTitle = (title: string) =>
        onChangePathway(updateNode(pathway, node.id, { title }));

    const handleDescription = (description: string) =>
        onChangePathway(updateNode(pathway, node.id, { description }));

    /**
     * Toggle this node as the destination. Setting implicitly clears
     * whichever node previously held the flag — the schema stores the
     * id in a single pathway-level field, so the atomic flip is a
     * one-line write.
     */
    const handleToggleDestination = () => {
        onChangePathway(setDestinationNode(pathway, isDestination ? null : node.id));
    };

    // Short, honest summary. When this step is the destination we
    // surface a small flag glyph so collapsed rows in the inspector
    // reflect the pathway's shape.
    const summaryText = node.title.trim() ? `"${node.title}"` : 'Untitled step';
    const summary = isDestination ? `${summaryText} · destination` : summaryText;

    return (
        <Section
            icon={createOutline}
            title="Identity"
            summary={summary}
            defaultOpen
            sticky={false}
        >
            <div className="space-y-3">
                <div className="space-y-1.5">
                    <label className={LABEL} htmlFor="node-title">
                        Title
                    </label>

                    <input
                        id="node-title"
                        type="text"
                        className={INPUT}
                        value={node.title}
                        onChange={e => handleTitle(e.target.value)}
                        placeholder="What's this step called?"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className={LABEL} htmlFor="node-description">
                        Description
                    </label>

                    <textarea
                        id="node-description"
                        rows={2}
                        className={`${INPUT} resize-none`}
                        placeholder="One line the learner will see under the title."
                        value={node.description ?? ''}
                        onChange={e => handleDescription(e.target.value)}
                    />
                </div>

                {/*
                    Destination toggle. Implemented as a styled
                    aria-pressed button — cleaner than a native
                    checkbox here because we want the whole row to
                    feel tappable and the emerald state needs to
                    read as "this is the end-goal".
                */}
                <div className="pt-1">
                    <button
                        type="button"
                        onClick={handleToggleDestination}
                        aria-pressed={isDestination}
                        className={`
                            group w-full flex items-start gap-3 p-3 rounded-xl border
                            transition-colors text-left
                            ${
                                isDestination
                                    ? 'border-emerald-500 bg-emerald-50'
                                    : 'border-grayscale-200 bg-white hover:bg-grayscale-10'
                            }
                        `}
                    >
                        <span
                            className={`
                                shrink-0 inline-flex items-center justify-center
                                w-8 h-8 rounded-lg
                                ${
                                    isDestination
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-grayscale-100 text-grayscale-500 group-hover:bg-grayscale-200'
                                }
                            `}
                        >
                            <IonIcon icon={flagOutline} aria-hidden className="text-base" />
                        </span>

                        <span className="min-w-0 flex-1">
                            <span
                                className={`block text-sm font-semibold ${
                                    isDestination ? 'text-emerald-800' : 'text-grayscale-900'
                                }`}
                            >
                                {isDestination ? 'This is the destination' : 'Mark as destination'}
                            </span>

                            <span
                                className={`block text-xs leading-relaxed mt-0.5 ${
                                    isDestination ? 'text-emerald-700' : 'text-grayscale-500'
                                }`}
                            >
                                The step the learner is ultimately earning. Only one
                                step per pathway.
                            </span>
                        </span>
                    </button>
                </div>
            </div>
        </Section>
    );
};

export default IdentitySection;

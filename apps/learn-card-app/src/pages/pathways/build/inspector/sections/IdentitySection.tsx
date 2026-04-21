/**
 * IdentitySection — node title + description.
 *
 * Short and always-on: we pass `defaultOpen` and disable `sticky`
 * because the content is two fields tall and pinning a header over
 * two inputs reads as busywork. The summary is the node title itself
 * so the author always sees what they're editing at a glance.
 */

import React from 'react';

import { createOutline } from 'ionicons/icons';

import type { Pathway, PathwayNode } from '../../../types';
import { updateNode } from '../../buildOps';
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
    const handleTitle = (title: string) =>
        onChangePathway(updateNode(pathway, node.id, { title }));

    const handleDescription = (description: string) =>
        onChangePathway(updateNode(pathway, node.id, { description }));

    // Short, honest summary. If the node has no title yet, nudge the
    // author rather than showing an empty quote.
    const summary = node.title.trim() ? `"${node.title}"` : 'Untitled step';

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
            </div>
        </Section>
    );
};

export default IdentitySection;

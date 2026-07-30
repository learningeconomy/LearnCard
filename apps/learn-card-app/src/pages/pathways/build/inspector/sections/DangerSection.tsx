/**
 * DangerSection — node deletion.
 *
 * Intentionally terse: one destructive action, a short warning, and
 * a confirm dialog. Lives in its own section (vs. a footer button)
 * so destructive and constructive actions never share hit space.
 *
 * The red border + red-tinted Section card read as "this is a
 * different class of action" without shouting.
 */

import React from 'react';

import { trashOutline } from 'ionicons/icons';

import type { Pathway, PathwayNode } from '../../../types';
import { removeNode as removeNodeOp } from '../../buildOps';
import Section from '../Section';

interface DangerSectionProps {
    pathway: Pathway;
    node: PathwayNode;
    onChangePathway: (next: Pathway) => void;
    onDeleted?: () => void;
}

const DangerSection: React.FC<DangerSectionProps> = ({
    pathway,
    node,
    onChangePathway,
    onDeleted,
}) => {
    const handleDelete = () => {
        const ok =
            typeof window !== 'undefined'
                ? window.confirm(`Delete "${node.title || 'this step'}"? This cannot be undone.`)
                : true;

        if (!ok) return;

        onChangePathway(removeNodeOp(pathway, node.id));
        onDeleted?.();
    };

    return (
        <Section
            icon={trashOutline}
            title="Danger zone"
            summary="Delete this step"
            iconTone="red"
            defaultOpen={false}
            sticky={false}
            danger
        >
            <div className="space-y-3">
                <p className="text-xs text-grayscale-600 leading-relaxed">
                    Deleting a step also removes any prerequisites pointing to
                    or from it. This cannot be undone.
                </p>

                <button
                    type="button"
                    onClick={handleDelete}
                    className="py-2.5 px-4 rounded-[20px] border border-red-200 text-red-700 font-medium text-xs hover:bg-red-50 transition-colors"
                >
                    Delete this step
                </button>
            </div>
        </Section>
    );
};

export default DangerSection;

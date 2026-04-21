/**
 * ConnectionsSection — prerequisite edges for this node.
 *
 * M1: wraps the existing prereq list + add-picker logic. The summary
 * reflects the current count in plain English. Future milestones may
 * extend this section to cover downstream dependents (what *this*
 * node unlocks) and stage-level `initiation` refs, which aren't
 * surfaced anywhere today.
 */

import React from 'react';

import { linkOutline } from 'ionicons/icons';

import type { Pathway, PathwayNode } from '../../../types';
import { addEdge as addEdgeOp, removeEdge as removeEdgeOp } from '../../buildOps';
import Section from '../Section';

interface ConnectionsSectionProps {
    pathway: Pathway;
    node: PathwayNode;
    onChangePathway: (next: Pathway) => void;
}

const LABEL = 'text-xs font-medium text-grayscale-700';
const INPUT =
    'w-full py-2.5 px-3 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-poppins';

const ConnectionsSection: React.FC<ConnectionsSectionProps> = ({
    pathway,
    node,
    onChangePathway,
}) => {
    const prereqEdges = pathway.edges.filter(
        e => e.to === node.id && e.type === 'prerequisite',
    );

    const candidatePrereqs = pathway.nodes.filter(
        n => n.id !== node.id && !prereqEdges.some(e => e.from === n.id),
    );

    const handleAddPrereq = (fromId: string) => {
        if (!fromId) return;
        onChangePathway(addEdgeOp(pathway, fromId, node.id, 'prerequisite'));
    };

    const handleRemovePrereq = (edgeId: string) =>
        onChangePathway(removeEdgeOp(pathway, edgeId));

    const summary =
        prereqEdges.length === 0
            ? 'No prerequisites'
            : prereqEdges.length === 1
              ? '1 prerequisite'
              : `${prereqEdges.length} prerequisites`;

    return (
        <Section icon={linkOutline} title="Connections" summary={summary} defaultOpen={false}>
            <div className="space-y-3">
                {prereqEdges.length === 0 ? (
                    <p className="text-xs text-grayscale-500 leading-relaxed">
                        This step can be started anytime. Add a prerequisite to
                        gate it behind another step.
                    </p>
                ) : (
                    <ul className="space-y-1.5">
                        {prereqEdges.map(edge => {
                            const from = pathway.nodes.find(n => n.id === edge.from);

                            return (
                                <li
                                    key={edge.id}
                                    className="flex items-center justify-between gap-2 py-2 px-3 rounded-xl border border-grayscale-200 bg-white"
                                >
                                    <span className="text-sm text-grayscale-800 truncate">
                                        {from?.title ?? edge.from}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() => handleRemovePrereq(edge.id)}
                                        className="shrink-0 text-xs text-grayscale-500 hover:text-red-700 transition-colors"
                                    >
                                        Remove
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}

                {candidatePrereqs.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                        <label className={LABEL} htmlFor="node-add-prereq">
                            Add a prerequisite step
                        </label>

                        <select
                            id="node-add-prereq"
                            className={INPUT}
                            value=""
                            onChange={e => {
                                handleAddPrereq(e.target.value);
                                e.target.value = '';
                            }}
                        >
                            <option value="">Pick a step…</option>

                            {candidatePrereqs.map(n => (
                                <option key={n.id} value={n.id}>
                                    {n.title || 'Untitled'}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
        </Section>
    );
};

export default ConnectionsSection;

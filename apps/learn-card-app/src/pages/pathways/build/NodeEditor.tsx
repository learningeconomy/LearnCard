/**
 * NodeEditor — edit a single node's title, description, stage, and
 * prerequisite edges. Composes PolicyEditor + TerminationEditor.
 *
 * Controlled via `onChangePathway` — the caller threads the result
 * back through `pathwayStore.upsertPathway`. Keeping the mutation
 * boundary at the caller means Build can preview edits without
 * committing them.
 */

import React from 'react';

import { pathwayStore } from '../../../stores/pathways';
import type { Pathway, PathwayNode } from '../types';
import {
    DEFAULT_TERMINATION,
    addEdge as addEdgeOp,
    removeEdge as removeEdgeOp,
    removeNode as removeNodeOp,
    setPolicy,
    setTermination,
    updateNode,
} from './buildOps';

import PolicyEditor from './PolicyEditor';
import TerminationEditor from './TerminationEditor';

interface NodeEditorProps {
    pathway: Pathway;
    node: PathwayNode;
    onChangePathway: (next: Pathway) => void;
    onDeleted?: () => void;
}

const label = 'text-xs font-medium text-grayscale-700';
const input =
    'w-full py-2.5 px-3 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-poppins';

const NodeEditor: React.FC<NodeEditorProps> = ({
    pathway,
    node,
    onChangePathway,
    onDeleted,
}) => {
    const prereqEdges = pathway.edges.filter(e => e.to === node.id && e.type === 'prerequisite');
    const candidatePrereqs = pathway.nodes.filter(
        n => n.id !== node.id && !prereqEdges.some(e => e.from === n.id),
    );

    const handleTitle = (title: string) =>
        onChangePathway(updateNode(pathway, node.id, { title }));

    const handleDescription = (description: string) =>
        onChangePathway(updateNode(pathway, node.id, { description }));

    // PolicyEditor needs the full pathway store (for the composite
    // ref picker) and the parent pathway id (for cycle detection).
    // We subscribe to it here rather than passing through props so
    // NodeEditor's existing props stay focused.
    const allPathways = pathwayStore.use.pathways();

    const handlePolicyChange = (policy: PathwayNode['stage']['policy']) => {
        // Composite invariant: policy.kind === 'composite' must be
        // paired with `termination.kind === 'pathway-completed'` and
        // both must point at the same pathwayRef. NodeEditor enforces
        // this so PolicyEditor + TerminationEditor stay decoupled.
        let next = setPolicy(pathway, node.id, policy);

        const wasComposite = node.stage.policy.kind === 'composite';
        const isComposite = policy.kind === 'composite';

        if (isComposite && policy.pathwayRef) {
            // Auto-pair the termination so the learner experiences
            // the node correctly the moment a ref is selected.
            next = setTermination(next, node.id, {
                kind: 'pathway-completed',
                pathwayRef: policy.pathwayRef,
            });
        } else if (wasComposite && !isComposite) {
            // Switching away from composite: drop the now-orphaned
            // pathway-completed termination back to a sane default.
            next = setTermination(next, node.id, DEFAULT_TERMINATION);
        }

        onChangePathway(next);
    };

    const handleTerminationChange = (termination: PathwayNode['stage']['termination']) =>
        onChangePathway(setTermination(pathway, node.id, termination));

    // Composite nodes own their termination via the policy invariant
    // above — exposing the manual termination editor would let the
    // learner break that invariant. Hide it for composite nodes; the
    // pathway-completed termination is implicit and well-explained.
    const isComposite = node.stage.policy.kind === 'composite';

    const handleAddPrereq = (fromId: string) => {
        if (!fromId) return;
        onChangePathway(addEdgeOp(pathway, fromId, node.id, 'prerequisite'));
    };

    const handleRemovePrereq = (edgeId: string) =>
        onChangePathway(removeEdgeOp(pathway, edgeId));

    const handleDelete = () => {
        const ok = typeof window !== 'undefined'
            ? window.confirm(`Delete "${node.title}"? This cannot be undone.`)
            : true;

        if (!ok) return;

        onChangePathway(removeNodeOp(pathway, node.id));
        onDeleted?.();
    };

    return (
        <section className="space-y-6">
            <header className="space-y-1">
                <h3 className="text-sm font-semibold text-grayscale-900 uppercase tracking-wide">
                    Edit node
                </h3>

                <p className="text-xs text-grayscale-500">
                    Changes save as you type.
                </p>
            </header>

            <div className="space-y-3">
                <div className="space-y-1.5">
                    <label className={label} htmlFor="node-title">
                        Title
                    </label>

                    <input
                        id="node-title"
                        type="text"
                        className={input}
                        value={node.title}
                        onChange={e => handleTitle(e.target.value)}
                    />
                </div>

                <div className="space-y-1.5">
                    <label className={label} htmlFor="node-description">
                        Description
                    </label>

                    <textarea
                        id="node-description"
                        rows={2}
                        className={`${input} resize-none`}
                        placeholder="One line the learner will see under the title."
                        value={node.description ?? ''}
                        onChange={e => handleDescription(e.target.value)}
                    />
                </div>
            </div>

            <div className="pt-4 border-t border-grayscale-200">
                <PolicyEditor
                    value={node.stage.policy}
                    onChange={handlePolicyChange}
                    parentPathwayId={pathway.id}
                    allPathways={allPathways}
                />
            </div>

            {/*
                Composite nodes own their termination via the policy ⇔
                termination invariant in `handlePolicyChange`. Hiding
                the manual editor prevents the learner from breaking
                that invariant by hand. We surface a small explainer so
                the absence is intentional rather than confusing.
            */}
            {isComposite ? (
                <div className="pt-4 border-t border-grayscale-200 space-y-1">
                    <p className={label}>Termination</p>

                    <p className="text-xs text-grayscale-500 leading-relaxed">
                        This node finishes automatically when the referenced
                        pathway's destination is completed. No manual rule needed.
                    </p>
                </div>
            ) : (
                <div className="pt-4 border-t border-grayscale-200">
                    <TerminationEditor
                        value={node.stage.termination}
                        onChange={handleTerminationChange}
                    />
                </div>
            )}

            <div className="pt-4 border-t border-grayscale-200 space-y-2">
                <p className={label}>Prerequisites</p>

                {prereqEdges.length === 0 ? (
                    <p className="text-xs text-grayscale-500">No prerequisites.</p>
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
                    <div className="pt-2">
                        <label className={label} htmlFor="node-add-prereq">
                            Add prerequisite
                        </label>

                        <select
                            id="node-add-prereq"
                            className={`${input} mt-1.5`}
                            value=""
                            onChange={e => {
                                handleAddPrereq(e.target.value);
                                e.target.value = '';
                            }}
                        >
                            <option value="">Pick a node…</option>
                            {candidatePrereqs.map(n => (
                                <option key={n.id} value={n.id}>
                                    {n.title}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div className="pt-4 border-t border-grayscale-200">
                <button
                    type="button"
                    onClick={handleDelete}
                    className="py-2.5 px-4 rounded-[20px] border border-red-200 text-red-700 font-medium text-xs hover:bg-red-50 transition-colors"
                >
                    Delete node
                </button>
            </div>
        </section>
    );
};

export default NodeEditor;

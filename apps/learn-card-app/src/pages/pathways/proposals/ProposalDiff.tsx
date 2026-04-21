/**
 * ProposalDiff — read-only rendering of a `PathwayDiff`.
 *
 * Plain, scannable: addition / update / removal sections, one line per
 * change, node titles resolved against the current pathway when
 * available. No color-per-line traffic-light palette — two muted
 * accents (emerald for adds, grayscale for removes) and the rest gets
 * out of the way.
 */

import React from 'react';

import type { Pathway, PathwayDiff, Policy, Termination } from '../types';

interface ProposalDiffProps {
    diff: PathwayDiff;
    /** Current pathway — used to resolve node ids to titles. Optional. */
    pathway?: Pathway | null;
}

const policySummary = (policy: Policy): string => {
    switch (policy.kind) {
        case 'practice':
            return `practice · ${policy.cadence.frequency}`;
        case 'review':
            return 'review';
        case 'assessment':
            return `assessment · ${policy.rubric.criteria.length} criteria`;
        case 'artifact':
            return `artifact · ${policy.expectedArtifact}`;
        case 'external':
            return `external · ${policy.mcp.serverId}`;
        case 'composite':
            // Show the render style so authors reading a diff can
            // distinguish nesting (inline) from composition (link-out)
            // without opening each node.
            return `nested pathway · ${policy.renderStyle}`;
    }
};

const terminationSummary = (termination: Termination): string => {
    switch (termination.kind) {
        case 'artifact-count':
            return `${termination.count} × ${termination.artifactType}`;
        case 'endorsement':
            return `${termination.minEndorsers} endorsement${termination.minEndorsers === 1 ? '' : 's'}`;
        case 'self-attest':
            return 'self-attest';
        case 'assessment-score':
            return `score ≥ ${termination.min}`;
        case 'composite':
            return `${termination.require} of ${termination.of.length} sub-goals`;
        case 'pathway-completed':
            // Paired with a composite policy; the pair is always set
            // together, so showing the same term here keeps the diff
            // from looking like a double-change.
            return 'completion of nested pathway';
    }
};

const ProposalDiff: React.FC<ProposalDiffProps> = ({ diff, pathway }) => {
    const titleFor = (nodeId: string): string =>
        pathway?.nodes.find(n => n.id === nodeId)?.title ?? nodeId;

    const nothingToShow =
        diff.addNodes.length === 0 &&
        diff.updateNodes.length === 0 &&
        diff.removeNodeIds.length === 0 &&
        diff.addEdges.length === 0 &&
        diff.removeEdgeIds.length === 0 &&
        !diff.newPathway;

    if (nothingToShow) {
        return (
            <p className="text-xs text-grayscale-500 italic">
                This proposal contains no changes.
            </p>
        );
    }

    return (
        <div className="space-y-3 text-sm">
            {diff.newPathway && (
                <section className="space-y-1">
                    <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide">
                        New pathway
                    </p>

                    <p className="text-sm text-grayscale-800 leading-relaxed">
                        <span className="font-semibold">{diff.newPathway.title}</span>
                    </p>

                    <p className="text-xs text-grayscale-600 leading-relaxed">
                        Goal: {diff.newPathway.goal}
                    </p>
                </section>
            )}

            {diff.addNodes.length > 0 && (
                <section className="space-y-1.5">
                    <p className="text-xs font-medium text-emerald-700 uppercase tracking-wide">
                        Add {diff.addNodes.length} node{diff.addNodes.length === 1 ? '' : 's'}
                    </p>

                    <ul className="space-y-1.5">
                        {diff.addNodes.map(n => (
                            <li
                                key={n.id}
                                className="p-2.5 rounded-xl border border-emerald-100 bg-emerald-50/60"
                            >
                                <p className="text-sm text-grayscale-900 font-medium leading-snug">
                                    {n.title}
                                </p>

                                <p className="text-[11px] text-grayscale-600 mt-0.5">
                                    {policySummary(n.stage.policy)} ·{' '}
                                    {terminationSummary(n.stage.termination)}
                                </p>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {diff.updateNodes.length > 0 && (
                <section className="space-y-1.5">
                    <p className="text-xs font-medium text-grayscale-700 uppercase tracking-wide">
                        Update {diff.updateNodes.length} node
                        {diff.updateNodes.length === 1 ? '' : 's'}
                    </p>

                    <ul className="space-y-1.5">
                        {diff.updateNodes.map(p => {
                            const fields = [
                                p.title !== undefined && 'title',
                                p.description !== undefined && 'description',
                                p.stage !== undefined && 'stage',
                                p.credentialProjection !== undefined && 'projection',
                            ].filter(Boolean) as string[];

                            return (
                                <li
                                    key={p.id}
                                    className="p-2.5 rounded-xl border border-grayscale-200 bg-white"
                                >
                                    <p className="text-sm text-grayscale-900 font-medium leading-snug">
                                        {titleFor(p.id)}
                                    </p>

                                    <p className="text-[11px] text-grayscale-600 mt-0.5">
                                        Changes: {fields.length > 0 ? fields.join(', ') : 'none'}
                                    </p>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            )}

            {diff.removeNodeIds.length > 0 && (
                <section className="space-y-1.5">
                    <p className="text-xs font-medium text-grayscale-700 uppercase tracking-wide">
                        Remove {diff.removeNodeIds.length} node
                        {diff.removeNodeIds.length === 1 ? '' : 's'}
                    </p>

                    <ul className="space-y-1.5">
                        {diff.removeNodeIds.map(id => (
                            <li
                                key={id}
                                className="p-2.5 rounded-xl border border-grayscale-200 bg-grayscale-10 line-through text-grayscale-500"
                            >
                                <p className="text-sm leading-snug">{titleFor(id)}</p>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {(diff.addEdges.length > 0 || diff.removeEdgeIds.length > 0) && (
                <section className="space-y-1.5">
                    <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide">
                        Connections
                    </p>

                    <ul className="space-y-1">
                        {diff.addEdges.map(e => (
                            <li key={e.id} className="text-xs text-grayscale-600">
                                <span className="text-emerald-700 font-medium mr-1">+</span>
                                {titleFor(e.from)} → {titleFor(e.to)} ({e.type})
                            </li>
                        ))}

                        {diff.removeEdgeIds.map(id => (
                            <li key={id} className="text-xs text-grayscale-500 line-through">
                                <span className="mr-1">−</span>
                                {id}
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
};

export default ProposalDiff;

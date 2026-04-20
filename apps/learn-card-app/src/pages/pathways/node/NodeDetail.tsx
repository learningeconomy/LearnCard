/**
 * NodeDetail — single-node view with policy prompt, attached evidence,
 * and termination affordance. Phase 1 minimal (docs § 5).
 *
 * The full "overlay with evidence + endorsement panels" UX lands in
 * Phase 2. For now this is a plain route so completeTermination can be
 * exercised end-to-end.
 */

import React, { useState } from 'react';

import { useHistory, useParams } from 'react-router-dom';

import { AnalyticsEvents, useAnalytics } from '../../../analytics';
import { offlineQueueStore, pathwayStore } from '../../../stores/pathways';
import type { Evidence, Termination } from '../types';

import EvidenceUploader from './EvidenceUploader';

const terminationLabel = (t: Termination): string => {
    switch (t.kind) {
        case 'artifact-count':
            return `Attach ${t.count} ${t.artifactType} artifact${t.count === 1 ? '' : 's'}`;
        case 'endorsement':
            return `Collect ${t.minEndorsers} endorsement${t.minEndorsers === 1 ? '' : 's'}`;
        case 'self-attest':
            return t.prompt;
        case 'assessment-score':
            return `Score at least ${t.min}`;
        case 'composite':
            return `${t.require === 'all' ? 'All' : 'Any'} of ${t.of.length} sub-goals`;
    }
};

const terminationMet = (t: Termination, evidenceCount: number): boolean => {
    switch (t.kind) {
        case 'artifact-count':
            return evidenceCount >= t.count;
        case 'self-attest':
            return true; // always available to self-attest
        case 'endorsement':
        case 'assessment-score':
        case 'composite':
            return false; // Phase 1 can't satisfy these automatically
    }
};

const NodeDetail: React.FC = () => {
    const params = useParams<{ pathwayId: string; nodeId: string }>();
    const history = useHistory();
    const analytics = useAnalytics();

    const pathway = pathwayStore.use.pathways()[params.pathwayId] ?? null;
    const isOnline = offlineQueueStore.use.isOnline();

    const [completing, setCompleting] = useState(false);

    if (!pathway) {
        return (
            <div className="max-w-md mx-auto px-4 py-10 font-poppins text-center">
                <h2 className="text-lg font-semibold text-grayscale-900 mb-2">
                    That pathway isn't loaded
                </h2>

                <button
                    type="button"
                    onClick={() => history.replace('/pathways/today')}
                    className="text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors"
                >
                    Back to Today
                </button>
            </div>
        );
    }

    const node = pathway.nodes.find(n => n.id === params.nodeId);

    if (!node) {
        return (
            <div className="max-w-md mx-auto px-4 py-10 font-poppins text-center">
                <h2 className="text-lg font-semibold text-grayscale-900 mb-2">
                    We couldn't find that node
                </h2>

                <button
                    type="button"
                    onClick={() => history.replace('/pathways/today')}
                    className="text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors"
                >
                    Back to Today
                </button>
            </div>
        );
    }

    const handleAttach = (evidence: Evidence) => {
        // Cloud-first with offline-aware enqueue (docs § 11).
        if (!isOnline) {
            offlineQueueStore.set.enqueue({
                kind: 'evidence-upload',
                pathwayId: pathway.id,
                nodeId: node.id,
                evidence,
                conflictStrategy: 'client-wins',
                enqueuedAt: new Date().toISOString(),
            });
        }

        // Either way, optimistic local write so the UI reflects the work.
        pathwayStore.set.editNode(pathway.id, node.id, {
            progress: {
                ...node.progress,
                status: node.progress.status === 'not-started' ? 'in-progress' : node.progress.status,
                artifacts: [...node.progress.artifacts, evidence],
                streak: {
                    ...node.progress.streak,
                    current: node.progress.streak.current + 1,
                    longest: Math.max(node.progress.streak.longest, node.progress.streak.current + 1),
                    lastActiveAt: evidence.submittedAt,
                },
            },
        });
    };

    const handleComplete = () => {
        if (completing) return;
        setCompleting(true);

        const evidence = node.progress.artifacts;
        const wasQueuedOffline = !isOnline;

        if (wasQueuedOffline) {
            offlineQueueStore.set.enqueue({
                kind: 'complete-termination',
                pathwayId: pathway.id,
                nodeId: node.id,
                evidence,
                conflictStrategy: 'client-wins-with-reconcile',
                enqueuedAt: new Date().toISOString(),
            });
        }

        pathwayStore.set.completeTermination(pathway.id, node.id, []);

        analytics.track(AnalyticsEvents.PATHWAYS_NODE_TERMINATION_COMPLETED, {
            nodeId: node.id,
            terminationKind: node.stage.termination.kind,
            evidenceCount: evidence.length,
            offlineQueued: wasQueuedOffline,
        });

        history.replace('/pathways/today');
    };

    const evidenceCount = node.progress.artifacts.length;
    const canComplete = terminationMet(node.stage.termination, evidenceCount);

    return (
        <div className="max-w-md mx-auto px-4 py-8 font-poppins space-y-5">
            <button
                type="button"
                onClick={() => history.replace('/pathways/today')}
                className="text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors"
            >
                ← Back to Today
            </button>

            <header className="space-y-1.5">
                <h2 className="text-xl font-semibold text-grayscale-900">{node.title}</h2>

                {node.description && (
                    <p className="text-sm text-grayscale-600 leading-relaxed">
                        {node.description}
                    </p>
                )}
            </header>

            {node.stage.policy.kind === 'artifact' && (
                <section className="p-4 rounded-2xl bg-grayscale-100 border border-grayscale-200">
                    <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide mb-1">
                        Prompt
                    </p>

                    <p className="text-sm text-grayscale-800 leading-relaxed">
                        {node.stage.policy.prompt}
                    </p>
                </section>
            )}

            <section className="space-y-2">
                <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide">
                    How this completes
                </p>

                <p className="text-sm text-grayscale-700 leading-relaxed">
                    {terminationLabel(node.stage.termination)}
                </p>

                <p className="text-xs text-grayscale-500">
                    {evidenceCount} attached so far
                </p>
            </section>

            {node.progress.status !== 'completed' && (
                <EvidenceUploader onSubmit={handleAttach} />
            )}

            {node.progress.artifacts.length > 0 && (
                <section className="space-y-2">
                    <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide">
                        Attached
                    </p>

                    <ul className="space-y-2">
                        {node.progress.artifacts.map(artifact => (
                            <li
                                key={artifact.id}
                                className="p-3 rounded-xl border border-grayscale-200 bg-white"
                            >
                                <p className="text-xs text-grayscale-500 mb-1">
                                    {artifact.artifactType} ·{' '}
                                    {new Date(artifact.submittedAt).toLocaleString()}
                                </p>

                                {artifact.note && (
                                    <p className="text-sm text-grayscale-800 leading-relaxed">
                                        {artifact.note}
                                    </p>
                                )}
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {node.progress.status === 'completed' ? (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-700">
                    Completed. Nice work.
                </div>
            ) : (
                <button
                    type="button"
                    onClick={handleComplete}
                    disabled={!canComplete || completing}
                    className="w-full py-3 px-4 rounded-[20px] bg-emerald-600 text-white font-medium text-sm
                               hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {completing ? 'Marking complete…' : 'Mark this step complete'}
                </button>
            )}
        </div>
    );
};

export default NodeDetail;

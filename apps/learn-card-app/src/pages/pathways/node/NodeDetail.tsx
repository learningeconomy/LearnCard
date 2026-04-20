/**
 * NodeDetail — single-node overlay with policy prompt, evidence panel,
 * endorsement panel, and termination affordance (docs § 5).
 *
 * Renders as a full-screen overlay with a close affordance and backdrop.
 * The underlying route `/pathways/node/:pathwayId/:nodeId` preserves
 * deep-linking; visually it still reads as an overlay on top of the
 * current pathway.
 */

import React, { useState } from 'react';

import { IonIcon } from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { useHistory, useParams } from 'react-router-dom';

import { AnalyticsEvents, useAnalytics } from '../../../analytics';
import { offlineQueueStore, pathwayStore } from '../../../stores/pathways';
import type { EndorsementRef, Evidence, Termination } from '../types';

import EndorsementPanel from './EndorsementPanel';
import EvidencePanel from './EvidencePanel';
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

const terminationMet = (
    t: Termination,
    evidenceCount: number,
    endorsementCount: number,
): boolean => {
    switch (t.kind) {
        case 'artifact-count':
            return evidenceCount >= t.count;
        case 'self-attest':
            return true; // always available to self-attest
        case 'endorsement':
            return endorsementCount >= t.minEndorsers;
        case 'assessment-score':
        case 'composite':
            return false; // Phase 2 can't satisfy these automatically
    }
};

/**
 * The overlay frame — tinted backdrop + centered white card + close X.
 * Kept local to NodeDetail for now; if another route wants the same
 * chrome we'll promote it to a shared component.
 */
const OverlayFrame: React.FC<{ children: React.ReactNode; onClose: () => void }> = ({
    children,
    onClose,
}) => (
    <div className="fixed inset-0 z-40 bg-grayscale-900/40 backdrop-blur-sm flex items-start sm:items-center justify-center p-0 sm:p-6 overflow-y-auto font-poppins">
        <div className="relative w-full max-w-xl min-h-screen sm:min-h-0 bg-white sm:rounded-[24px] shadow-2xl">
            <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/80 hover:bg-grayscale-10 border border-grayscale-200 flex items-center justify-center transition-colors z-10"
            >
                <IonIcon icon={closeOutline} className="text-grayscale-700 text-xl" />
            </button>
            {children}
        </div>
    </div>
);

const NodeDetail: React.FC = () => {
    const params = useParams<{ pathwayId: string; nodeId: string }>();
    const history = useHistory();
    const analytics = useAnalytics();

    const pathway = pathwayStore.use.pathways()[params.pathwayId] ?? null;
    const isOnline = offlineQueueStore.use.isOnline();

    const [completing, setCompleting] = useState(false);

    const close = () => history.replace('/pathways/today');

    if (!pathway) {
        return (
            <OverlayFrame onClose={close}>
                <div className="px-6 py-10 text-center">
                    <h2 className="text-lg font-semibold text-grayscale-900 mb-2">
                        That pathway isn't loaded
                    </h2>

                    <button
                        type="button"
                        onClick={close}
                        className="text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors"
                    >
                        Back to Today
                    </button>
                </div>
            </OverlayFrame>
        );
    }

    const node = pathway.nodes.find(n => n.id === params.nodeId);

    if (!node) {
        return (
            <OverlayFrame onClose={close}>
                <div className="px-6 py-10 text-center">
                    <h2 className="text-lg font-semibold text-grayscale-900 mb-2">
                        We couldn't find that node
                    </h2>

                    <button
                        type="button"
                        onClick={close}
                        className="text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors"
                    >
                        Back to Today
                    </button>
                </div>
            </OverlayFrame>
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

    const handleEndorsementRequested = (pending: EndorsementRef) => {
        pathwayStore.set.editNode(pathway.id, node.id, {
            endorsements: [...node.endorsements, pending],
        });
    };

    const evidenceCount = node.progress.artifacts.length;
    const endorsementCount = node.endorsements.filter(
        e => !e.endorsementId.startsWith('pending-'),
    ).length;
    const canComplete = terminationMet(node.stage.termination, evidenceCount, endorsementCount);

    return (
        <OverlayFrame onClose={close}>
            <div className="px-6 pt-10 pb-8 space-y-6">
                <header className="space-y-1.5 pr-8">
                    <h2 className="text-xl font-semibold text-grayscale-900 leading-snug">
                        {node.title}
                    </h2>

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

                <section className="space-y-1">
                    <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide">
                        How this completes
                    </p>

                    <p className="text-sm text-grayscale-700 leading-relaxed">
                        {terminationLabel(node.stage.termination)}
                    </p>

                    <p className="text-xs text-grayscale-500">
                        {evidenceCount} attached
                        {node.stage.termination.kind === 'endorsement'
                            ? ` · ${endorsementCount} endorsement${
                                  endorsementCount === 1 ? '' : 's'
                              }`
                            : ''}
                    </p>
                </section>

                {node.progress.status !== 'completed' && (
                    <EvidenceUploader onSubmit={handleAttach} />
                )}

                <EvidencePanel evidence={node.progress.artifacts} />

                <EndorsementPanel
                    nodeId={node.id}
                    endorsements={node.endorsements}
                    onRequested={handleEndorsementRequested}
                />

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
        </OverlayFrame>
    );
};

export default NodeDetail;

/**
 * NodeDetail — single-node overlay for proof-of-effort (docs § 5).
 *
 * The overlay is the place where "I did the thing" becomes "it's
 * attached and marked done". Phase 2 design principles:
 *
 *   - One visual spine: title + progress ring on top, evidence in the
 *     middle, the commit action right beneath the work. No hunting
 *     for a button at the bottom of a scroll.
 *   - Progress replaces labels. The ring + a single requirement line
 *     say everything the old "HOW THIS COMPLETES" / "X attached"
 *     headings said, with a fraction of the chrome.
 *   - Endorsements demoted to a footer. Most nodes don't need a vouch
 *     to ship; keep that option close but quiet.
 *   - Motion: spring-up entrance, staggered sections, drawn-in
 *     checkmark on completion.
 *
 * Route `/pathways/node/:pathwayId/:nodeId` still backs deep-linking;
 * visually it reads as an overlay on top of the current pathway.
 */

import React, { useState } from 'react';

import { IonIcon } from '@ionic/react';
import { closeOutline, mapOutline } from 'ionicons/icons';
import { AnimatePresence, motion } from 'motion/react';
import { useHistory, useParams } from 'react-router-dom';

import { AnalyticsEvents, useAnalytics } from '../../../analytics';
import { offlineQueueStore, pathwayStore } from '../../../stores/pathways';
import type { ArtifactType, EndorsementRef, Evidence, Policy } from '../types';

import { canProject } from '../projection/toAchievementCredential';

import CompositeNodeBody from './CompositeNodeBody';
import CredentialPreview from './CredentialPreview';
import EndorsementPanel from './EndorsementPanel';
import EvidencePanel from './EvidencePanel';
import EvidenceUploader from './EvidenceUploader';
import ReviewsPanel from './ReviewsPanel';
import TerminationProgress from './TerminationProgress';
import { computeTerminationView, terminationDone } from './termination';

/**
 * Pick an `ArtifactType` to pre-bias the uploader toward, matching
 * what the node's termination is actually asking for. Falls back to
 * the policy's expected artifact (for `artifact` policies) and then
 * to `text`.
 */
const pickExpectedArtifactType = (policy: Policy, node: { stage: { termination: unknown } }): ArtifactType => {
    const termination = node.stage.termination as { kind: string; artifactType?: ArtifactType };

    if (termination.kind === 'artifact-count' && termination.artifactType) {
        return termination.artifactType;
    }

    if (policy.kind === 'artifact') return policy.expectedArtifact;

    return 'text';
};

/**
 * Overlay frame — tinted blurred backdrop, spring-up frosted card,
 * large rounded corners, soft dismiss affordance. Kept local to
 * NodeDetail until another surface wants the same chrome.
 */
const OverlayFrame: React.FC<{ children: React.ReactNode; onClose: () => void }> = ({
    children,
    onClose,
}) => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed inset-0 z-40 bg-grayscale-900/50 backdrop-blur-md
                   flex items-start sm:items-center justify-center
                   p-0 sm:p-6 overflow-y-auto font-poppins"
        onClick={onClose}
    >
        <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 220, damping: 26, mass: 0.9 }}
            onClick={e => e.stopPropagation()}
            className="relative w-full max-w-xl min-h-screen sm:min-h-0
                       bg-white/95 backdrop-blur-xl
                       sm:rounded-[28px] shadow-2xl shadow-grayscale-900/20
                       border border-white/60"
        >
            <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute top-3 right-3 w-10 h-10 rounded-full
                           bg-white/80 hover:bg-white hover:shadow-md
                           border border-grayscale-200
                           flex items-center justify-center
                           transition-all duration-200 z-10"
            >
                <IonIcon icon={closeOutline} className="text-grayscale-700 text-xl" />
            </button>

            {children}
        </motion.div>
    </motion.div>
);

// Motion preset shared by every section inside the card so the
// staggered entrance feels unified rather than choreographed per
// element. Sections pass their own `delay` via `transition`.
const SECTION_MOTION = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: 'easeOut' as const },
};

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

    const handleComplete = async () => {
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

        // Fire a light haptic tap before committing the state change so
        // the feedback lines up with the learner's finger still on the
        // button. Safe no-op on web; wrapped in try/catch because the
        // native plugin can reject if the device has haptics disabled.
        try {
            const { Haptics, ImpactStyle } = await import('@capacitor/haptics');

            await Haptics.impact({ style: ImpactStyle.Light });
        } catch {
            // No haptics available — keep going silently.
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

    // Termination context — needed so `pathway-completed` terminations
    // on composite nodes can resolve against the live pathway store
    // and produce a meaningful progress ring instead of "unsupported".
    const allPathways = pathwayStore.use.pathways();

    const view = computeTerminationView(node.stage.termination, node, {
        pathways: allPathways,
    });
    const isCompleted = node.progress.status === 'completed';
    const canComplete = terminationDone(view) && !completing;
    const expectedArtifactType = pickExpectedArtifactType(node.stage.policy, node);

    // Composite nodes ("completion of another pathway") get a
    // dedicated body that replaces the evidence uploader / reviews
    // panel. The author's render-style flag decides whether it looks
    // like nesting or a separate-pathway link.
    const isComposite = node.stage.policy.kind === 'composite';

    // For `artifact` policies the prompt lives next to the title as an
    // italic opening line — it's context, not a separate section. Only
    // show it when there's no description (avoid three variations of
    // the same sentence).
    const inlinePrompt =
        node.stage.policy.kind === 'artifact' && !node.description
            ? node.stage.policy.prompt
            : null;

    // Pretty requirement line shown beneath the header. For `ready`
    // terminations (self-attest) we omit it — the ring-check plus the
    // big "Mark as done" already say everything.
    const requirementText =
        view.kind === 'ready' ? null : view.requirement;

    return (
        <OverlayFrame onClose={close}>
            <div className="px-6 pt-10 pb-8 space-y-5">
                {/* -------------------------------------------------- */}
                {/* Header: title, short context, progress ring         */}
                {/* -------------------------------------------------- */}
                <motion.header
                    {...SECTION_MOTION}
                    transition={{ ...SECTION_MOTION.transition, delay: 0.05 }}
                    className="flex items-start gap-4 pr-10"
                >
                    <div className="flex-1 min-w-0 space-y-1.5">
                        <h2 className="text-[22px] font-semibold text-grayscale-900 leading-[1.2]">
                            {node.title}
                        </h2>

                        {node.description && (
                            <p className="text-sm text-grayscale-600 leading-relaxed">
                                {node.description}
                            </p>
                        )}

                        {inlinePrompt && (
                            <p className="text-sm text-grayscale-600 leading-relaxed italic">
                                {inlinePrompt}
                            </p>
                        )}

                        {requirementText && (
                            <p className="text-[11px] font-medium text-grayscale-500 uppercase tracking-[0.08em] pt-1">
                                Needs {requirementText}
                            </p>
                        )}
                    </div>

                    <TerminationProgress view={view} />
                </motion.header>

                {/* -------------------------------------------------- */}
                {/* Working state: composite body OR evidence/review    */}
                {/* -------------------------------------------------- */}
                {!isCompleted && (
                    <motion.div
                        {...SECTION_MOTION}
                        transition={{ ...SECTION_MOTION.transition, delay: 0.12 }}
                        className="space-y-3"
                    >
                        {isComposite ? (
                            // Composite node: delegate the body to
                            // CompositeNodeBody, which picks between
                            // inline-expandable (nesting) and link-out
                            // (composition) based on renderStyle.
                            <CompositeNodeBody
                                parentPathway={pathway}
                                parentNode={
                                    node as typeof node & {
                                        stage: typeof node.stage & {
                                            policy: Extract<
                                                typeof node.stage.policy,
                                                { kind: 'composite' }
                                            >;
                                        };
                                    }
                                }
                            />
                        ) : (
                            <>
                                <EvidencePanel evidence={node.progress.artifacts} />

                                {/*
                                    For `review` policies, show FSRS grading rather
                                    than an evidence uploader — the node asks you to
                                    recall, not to attach. Every other non-composite
                                    policy kind flows through the same uploader.
                                */}
                                {node.stage.policy.kind === 'review' ? (
                                    <ReviewsPanel
                                        pathwayId={pathway.id}
                                        node={
                                            node as typeof node & {
                                                stage: {
                                                    policy: {
                                                        kind: 'review';
                                                        fsrs: typeof node.stage.policy.fsrs;
                                                    };
                                                };
                                            }
                                        }
                                    />
                                ) : (
                                    <EvidenceUploader
                                        onSubmit={handleAttach}
                                        expectedType={expectedArtifactType}
                                    />
                                )}
                            </>
                        )}
                    </motion.div>
                )}

                {/* -------------------------------------------------- */}
                {/* Commit: big "Mark as done" + unmet hint             */}
                {/* -------------------------------------------------- */}
                <AnimatePresence mode="wait" initial={false}>
                    {isCompleted ? (
                        <motion.div
                            key="done"
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{
                                type: 'spring',
                                stiffness: 260,
                                damping: 24,
                                mass: 0.7,
                            }}
                            className="p-5 rounded-[24px]
                                       bg-emerald-50/80 backdrop-blur-xl
                                       border border-emerald-100
                                       shadow-lg shadow-emerald-900/5
                                       space-y-3"
                        >
                            <div className="flex items-center gap-3">
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 500,
                                        damping: 18,
                                        delay: 0.1,
                                    }}
                                    className="shrink-0 w-9 h-9 rounded-full bg-emerald-600
                                               flex items-center justify-center
                                               shadow-sm shadow-emerald-600/30"
                                    aria-hidden
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                        <motion.path
                                            d="M5 12.5l4.5 4.5L19 7"
                                            stroke="white"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            initial={{ pathLength: 0 }}
                                            animate={{ pathLength: 1 }}
                                            transition={{
                                                duration: 0.35,
                                                ease: 'easeOut',
                                                delay: 0.25,
                                            }}
                                        />
                                    </svg>
                                </motion.span>

                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-emerald-800">
                                        You did it.
                                    </p>
                                    <p className="text-xs text-emerald-700/90">
                                        Proof is saved. Your next step is waiting on Today.
                                    </p>
                                </div>
                            </div>

                            {/*
                                If this node projects to a credential, render the
                                drafted claim inline. Honors §3.6 ("we project,
                                we don't store a signed VC") and makes the
                                Phase 1 contract ("every node is a potential
                                OB 3.0 claim") tangible the moment it matters.
                            */}
                            {canProject(node) && (
                                <CredentialPreview node={node} ownerDid={pathway.ownerDid} />
                            )}

                            <div className="flex gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={close}
                                    className="flex-1 py-3 px-4 rounded-[20px]
                                               bg-grayscale-900 text-white font-medium text-sm
                                               hover:bg-grayscale-800 transition-colors"
                                >
                                    Back to Today
                                </button>

                                <button
                                    type="button"
                                    onClick={() => history.push('/pathways/map')}
                                    className="py-3 px-4 rounded-[20px] border border-grayscale-300
                                               text-grayscale-700 font-medium text-sm
                                               hover:bg-grayscale-10 transition-colors
                                               flex items-center gap-1.5"
                                >
                                    <IonIcon icon={mapOutline} className="text-base" aria-hidden />
                                    <span>Map</span>
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="commit"
                            {...SECTION_MOTION}
                            transition={{ ...SECTION_MOTION.transition, delay: 0.18 }}
                            className="space-y-2"
                        >
                            <motion.button
                                type="button"
                                onClick={handleComplete}
                                disabled={!canComplete}
                                whileTap={canComplete ? { scale: 0.97 } : undefined}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                className={`w-full py-3.5 px-5 rounded-[20px] font-medium text-sm
                                           transition-all duration-300 flex items-center justify-center gap-2
                                           ${
                                               canComplete
                                                   ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/25'
                                                   : 'bg-grayscale-200 text-grayscale-400 cursor-not-allowed'
                                           }`}
                            >
                                {completing ? 'Marking done…' : 'Mark as done'}
                            </motion.button>

                            {!canComplete && 'unmetHint' in view && view.unmetHint && (
                                <p className="text-xs text-grayscale-500 text-center">
                                    {view.unmetHint}
                                </p>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* -------------------------------------------------- */}
                {/* Endorsement footer — demoted, still accessible      */}
                {/* -------------------------------------------------- */}
                <motion.div
                    {...SECTION_MOTION}
                    transition={{ ...SECTION_MOTION.transition, delay: 0.22 }}
                    className="pt-4 mt-2 border-t border-grayscale-200"
                >
                    <EndorsementPanel
                        nodeId={node.id}
                        endorsements={node.endorsements}
                        onRequested={handleEndorsementRequested}
                    />
                </motion.div>
            </div>
        </OverlayFrame>
    );
};

export default NodeDetail;

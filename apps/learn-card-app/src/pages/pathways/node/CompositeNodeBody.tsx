/**
 * CompositeNodeBody — how a composite node renders inside NodeDetail.
 *
 * One primitive (a node that represents "completion of another
 * pathway") supports two distinct UXs via a render-style flag:
 *
 *   - **inline-expandable** — nesting. Render a mini pathway-preview
 *     inline: title, progress, the first few step titles with
 *     completion dots, and a "Continue" CTA that switches the active
 *     pathway and jumps to Today. The learner experiences this as
 *     "opening up a chunk" of the parent pathway.
 *
 *   - **link-out** — composition. Render a "Complete X to unlock"
 *     card with a single CTA that switches active pathway. The
 *     learner experiences this as "go do that other thing first".
 *
 * Both styles share:
 *
 *   - The same **data source** (`pathwayStore.pathways[pathwayRef]`)
 *   - The same **completion semantics** (nested destination complete
 *     ⇒ parent composite unlocks; driven by `termination.ts`).
 *   - The same **telemetry event** (`PATHWAYS_COMPOSITE_OPENED`) so
 *     we can A/B them downstream without reworking the instrumentation.
 *
 * A missing-pathway state is deliberately first-class: if a learner
 * imported a parent but hasn't subscribed to the child yet, we show a
 * clear "not loaded" state with a CTA that takes them to Build's
 * import flow rather than silently pretending everything is fine.
 */

import React from 'react';

import { IonIcon } from '@ionic/react';
import { motion } from 'framer-motion';
import {
    arrowForwardOutline,
    cloudDownloadOutline,
    layersOutline,
    lockClosedOutline,
    openOutline,
    trailSignOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';

import { AnalyticsEvents, useAnalytics } from '../../../analytics';
import { pathwayStore } from '../../../stores/pathways';
import { computePathwayProgress } from '../core/composition';
import type { Pathway, PathwayNode } from '../types';

// ---------------------------------------------------------------------------
// Public props
// ---------------------------------------------------------------------------

interface CompositeNodeBodyProps {
    parentPathway: Pathway;
    parentNode: PathwayNode & {
        stage: PathwayNode['stage'] & {
            policy: Extract<PathwayNode['stage']['policy'], { kind: 'composite' }>;
        };
    };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const CompositeNodeBody: React.FC<CompositeNodeBodyProps> = ({
    parentPathway,
    parentNode,
}) => {
    const history = useHistory();
    const analytics = useAnalytics();

    const pathways = pathwayStore.use.pathways();

    const ref = parentNode.stage.policy.pathwayRef;
    const style = parentNode.stage.policy.renderStyle;

    const nested = pathways[ref] ?? null;

    const handleEnter = () => {
        if (!nested) return;

        pathwayStore.set.setActivePathway(nested.id);

        analytics.track(AnalyticsEvents.PATHWAYS_COMPOSITE_OPENED, {
            parentPathwayId: parentPathway.id,
            parentNodeId: parentNode.id,
            nestedPathwayId: nested.id,
            renderStyle: style,
        });

        // Drop the learner on the Map of the newly-activated sub-
        // pathway. "Start X" is a *traversal* action — the learner
        // wants to see the sub-pathway's terrain, not a daily action
        // feed for it. Previously we replaced to Today, which felt
        // like a context collapse; the sub-pathway would show up
        // there too, but out of spatial context.
        history.replace('/pathways/map');
    };

    const handleImport = () => {
        // The referenced pathway isn't loaded. The author wants the
        // learner to add it — Build is where CTDL import lives.
        history.push('/pathways/build');
    };

    // -----------------------------------------------------------------
    // Missing-pathway state (applies to both render styles)
    // -----------------------------------------------------------------
    if (!nested) {
        return (
            <MissingPathwayCard
                parentNodeTitle={parentNode.title}
                onImport={handleImport}
            />
        );
    }

    // -----------------------------------------------------------------
    // Style-specific bodies
    // -----------------------------------------------------------------
    if (style === 'link-out') {
        return (
            <LinkOutCard
                nested={nested}
                parentNodeTitle={parentNode.title}
                onEnter={handleEnter}
            />
        );
    }

    return (
        <InlineExpandableCard
            nested={nested}
            parentNodeTitle={parentNode.title}
            onEnter={handleEnter}
        />
    );
};

// ---------------------------------------------------------------------------
// inline-expandable — nesting UX
// ---------------------------------------------------------------------------

const InlineExpandableCard: React.FC<{
    nested: Pathway;
    parentNodeTitle: string;
    onEnter: () => void;
}> = ({ nested, parentNodeTitle, onEnter }) => {
    const progress = computePathwayProgress(nested);

    // Show up to 5 sub-step titles as a peek. Parallels the
    // ImportCtdlModal preview shape so learners who imported via that
    // modal see the same mental-model rendered here.
    const previewNodes = nested.nodes.slice(0, 5);

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="rounded-[20px] border border-grayscale-200 bg-white overflow-hidden"
        >
            <header className="px-4 pt-3 pb-2 flex items-start gap-2.5 border-b border-grayscale-100">
                <span
                    className="shrink-0 mt-0.5 w-7 h-7 rounded-full bg-emerald-50
                               border border-emerald-100 flex items-center justify-center"
                    aria-hidden
                >
                    <IonIcon icon={layersOutline} className="text-emerald-700 text-sm" />
                </span>

                <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-semibold text-grayscale-500 uppercase tracking-[0.08em]">
                        Nested pathway
                    </div>

                    <div className="text-sm font-semibold text-grayscale-900 truncate">
                        {nested.title}
                    </div>
                </div>
            </header>

            <div className="px-4 py-3 space-y-3">
                {/* Progress bar + count */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                        <span className="text-grayscale-500">
                            {progress.total === 0
                                ? 'No steps yet'
                                : `${progress.completed} of ${progress.total} complete`}
                        </span>

                        {progress.destinationCompleted && (
                            <span className="text-emerald-700 font-medium">
                                Destination earned
                            </span>
                        )}
                    </div>

                    <div className="h-1.5 w-full rounded-full bg-grayscale-100 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{
                                width: `${Math.round(progress.fraction * 100)}%`,
                            }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className="h-full bg-emerald-500"
                        />
                    </div>
                </div>

                {/* Step peek */}
                {previewNodes.length > 0 && (
                    <ul className="space-y-1">
                        {previewNodes.map(n => {
                            const isDestination = n.id === nested.destinationNodeId;
                            const done = n.progress.status === 'completed';

                            return (
                                <li
                                    key={n.id}
                                    className="text-xs flex items-center gap-2"
                                >
                                    <span
                                        className={`shrink-0 w-1.5 h-1.5 rounded-full ${
                                            done
                                                ? 'bg-emerald-500'
                                                : isDestination
                                                    ? 'bg-grayscale-900'
                                                    : 'bg-grayscale-300'
                                        }`}
                                        aria-hidden
                                    />

                                    <span
                                        className={`truncate ${
                                            done
                                                ? 'text-grayscale-500 line-through'
                                                : 'text-grayscale-700'
                                        }`}
                                    >
                                        {n.title}
                                    </span>

                                    {isDestination && (
                                        <span className="ml-auto text-[9px] font-semibold text-grayscale-400 uppercase tracking-wide shrink-0">
                                            Destination
                                        </span>
                                    )}
                                </li>
                            );
                        })}

                        {nested.nodes.length > previewNodes.length && (
                            <li className="text-[11px] text-grayscale-500 pl-3.5">
                                + {nested.nodes.length - previewNodes.length} more
                            </li>
                        )}
                    </ul>
                )}

                <button
                    type="button"
                    onClick={onEnter}
                    className="w-full py-2.5 px-4 rounded-[18px] bg-grayscale-900 text-white
                               text-sm font-medium hover:opacity-90 transition-opacity
                               flex items-center justify-center gap-1.5"
                >
                    <IonIcon icon={trailSignOutline} className="text-base" aria-hidden />

                    {progress.completed > 0 ? 'Continue' : 'Start'} {nested.title}
                </button>

                <p className="text-[11px] text-grayscale-500 leading-relaxed">
                    "{parentNodeTitle}" unlocks when you complete this pathway's
                    destination.
                </p>
            </div>
        </motion.div>
    );
};

// ---------------------------------------------------------------------------
// link-out — composition UX
// ---------------------------------------------------------------------------

const LinkOutCard: React.FC<{
    nested: Pathway;
    parentNodeTitle: string;
    onEnter: () => void;
}> = ({ nested, parentNodeTitle, onEnter }) => {
    const progress = computePathwayProgress(nested);
    const locked = !progress.destinationCompleted;

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="rounded-[20px] border border-grayscale-200 bg-grayscale-10 p-4
                       flex items-start gap-3"
        >
            <span
                className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    locked
                        ? 'bg-grayscale-100 border border-grayscale-200'
                        : 'bg-emerald-50 border border-emerald-100'
                }`}
                aria-hidden
            >
                <IonIcon
                    icon={locked ? lockClosedOutline : openOutline}
                    className={`text-base ${
                        locked ? 'text-grayscale-500' : 'text-emerald-700'
                    }`}
                />
            </span>

            <div className="min-w-0 flex-1 space-y-2">
                <div>
                    <div className="text-[10px] font-semibold text-grayscale-500 uppercase tracking-[0.08em]">
                        Separate pathway
                    </div>

                    <div className="text-sm font-semibold text-grayscale-900">
                        {nested.title}
                    </div>
                </div>

                <p className="text-xs text-grayscale-600 leading-relaxed">
                    {locked
                        ? `Complete this pathway first to unlock "${parentNodeTitle}".`
                        : `You've already finished this — "${parentNodeTitle}" is ready to go.`}
                </p>

                {progress.total > 0 && (
                    <div className="text-[11px] text-grayscale-500">
                        {progress.completed} of {progress.total} complete
                    </div>
                )}

                <button
                    type="button"
                    onClick={onEnter}
                    className="inline-flex items-center gap-1.5 py-2 px-3 rounded-full
                               border border-grayscale-300 bg-white text-grayscale-800
                               text-xs font-medium hover:bg-white hover:border-grayscale-400
                               transition-colors"
                >
                    Open {nested.title}

                    <IonIcon icon={arrowForwardOutline} className="text-xs" aria-hidden />
                </button>
            </div>
        </motion.div>
    );
};

// ---------------------------------------------------------------------------
// Missing-pathway fallback
// ---------------------------------------------------------------------------

const MissingPathwayCard: React.FC<{
    parentNodeTitle: string;
    onImport: () => void;
}> = ({ parentNodeTitle, onImport }) => (
    <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="rounded-[20px] border border-amber-100 bg-amber-50 p-4 flex items-start gap-3"
    >
        <span
            className="shrink-0 w-10 h-10 rounded-full bg-white border border-amber-100
                       flex items-center justify-center"
            aria-hidden
        >
            <IonIcon icon={cloudDownloadOutline} className="text-amber-700 text-base" />
        </span>

        <div className="min-w-0 flex-1 space-y-2">
            <div>
                <div className="text-[10px] font-semibold text-amber-700 uppercase tracking-[0.08em]">
                    Referenced pathway not loaded
                </div>

                <div className="text-sm font-semibold text-grayscale-900">
                    "{parentNodeTitle}" points at a pathway you haven't added yet.
                </div>
            </div>

            <p className="text-xs text-grayscale-700 leading-relaxed">
                Open Build to import it or pick a different pathway.
            </p>

            <button
                type="button"
                onClick={onImport}
                className="inline-flex items-center gap-1.5 py-2 px-3 rounded-full
                           bg-grayscale-900 text-white text-xs font-medium
                           hover:opacity-90 transition-opacity"
            >
                Go to Build
                <IonIcon icon={arrowForwardOutline} className="text-xs" aria-hidden />
            </button>
        </div>
    </motion.div>
);

export default CompositeNodeBody;

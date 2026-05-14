/**
 * PreviewPane — learner's-eye view of the currently-selected node.
 *
 * A compact mock of what the learner will see in Today / NodeDetail
 * when this step comes up. Non-interactive — CTAs are styled as
 * buttons but don't fire. The goal is visual feedback for the author
 * ("when they see this step, it'll read like so") without coupling
 * the Builder's layout to the real runtime renderer.
 *
 * Renders only on wide viewports; `BuildMode` conditionally shows
 * the third column when there's horizontal room. On narrower screens
 * the preview is hidden to avoid crowding the inspector.
 *
 * Copy is driven by the same summarizer registry the outline uses,
 * so what appears here stays consistent with every other surface
 * that talks about this node.
 */

import React, { useMemo } from 'react';

import { IonIcon } from '@ionic/react';
import { flagOutline, phonePortraitOutline } from 'ionicons/icons';

import type { Pathway, PathwayNode, Policy } from '../../types';
import { summarizePolicy } from '../summarize/summarizePolicy';
import { summarizeTermination } from '../summarize/summarizeTermination';

interface PreviewPaneProps {
    pathway: Pathway;
    node: PathwayNode | null;
    pathwayTitleById: Record<string, string>;
}

/**
 * Pick a learner-facing CTA label from the policy kind. These are
 * intentionally different from the summarizer phrases — summaries
 * describe what *happens*; the CTA is the *verb* the learner taps.
 */
const ctaForPolicy = (policy: Policy): string => {
    switch (policy.kind) {
        case 'artifact':
            return 'Submit';
        case 'practice':
            return 'Log today';
        case 'review':
            return 'Start review';
        case 'assessment':
            return 'Take assessment';
        case 'external':
            return 'Open tool';
        case 'composite':
            return 'Continue';
    }
};

const PreviewPane: React.FC<PreviewPaneProps> = ({ pathway, node, pathwayTitleById }) => {
    const summaryCtx = useMemo(() => ({ pathwayTitleById }), [pathwayTitleById]);

    if (!node) {
        return (
            <aside
                className="space-y-3 font-poppins"
                aria-label="Learner preview"
            >
                <PreviewHeader />

                <div className="p-6 rounded-[20px] bg-grayscale-10 border border-grayscale-200 text-center">
                    <p className="text-xs text-grayscale-500 leading-relaxed">
                        Pick a step on the left to see what the learner sees.
                    </p>
                </div>
            </aside>
        );
    }

    const isDestination = pathway.destinationNodeId === node.id;
    const policyPhrase = summarizePolicy(node.stage.policy, summaryCtx);
    const terminationPhrase = summarizeTermination(node.stage.termination, summaryCtx);
    const cta = ctaForPolicy(node.stage.policy);

    return (
        <aside className="space-y-3 font-poppins" aria-label="Learner preview">
            <PreviewHeader />

            {/*
                Card chrome — a rounded "card" so the preview reads
                as a distinct surface from the inspector. Soft shadow
                + hairline border mimic the in-app NextActionCard
                treatment without coupling to its internals.
            */}
            <article className="rounded-[24px] border border-grayscale-200 bg-white shadow-sm overflow-hidden">
                {/* Hero band — destination steps get an emerald tint
                    mirroring the learner-facing badge for their
                    end-goal step. Non-destination steps use a
                    neutral band so the page still feels finished. */}
                <div
                    className={`h-2 ${
                        isDestination ? 'bg-emerald-500' : 'bg-grayscale-200'
                    }`}
                    aria-hidden
                />

                <div className="p-5 space-y-4">
                    <div className="space-y-1">
                        {isDestination && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                <IonIcon
                                    icon={flagOutline}
                                    aria-hidden
                                    className="text-[11px]"
                                />
                                Destination
                            </span>
                        )}

                        <h3 className="text-lg font-semibold text-grayscale-900">
                            {node.title || 'Untitled step'}
                        </h3>

                        {node.description && (
                            <p className="text-sm text-grayscale-600 leading-relaxed">
                                {node.description}
                            </p>
                        )}
                    </div>

                    {/* Two lines: what to do + how you know you're done.
                        Identical phrasing to the outline subtitle, so
                        the author's mental model stays consistent
                        across surfaces. */}
                    <dl className="space-y-2 text-sm">
                        <div className="flex items-baseline gap-2">
                            <dt className="text-[11px] font-semibold uppercase tracking-wide text-grayscale-400 w-16 shrink-0">
                                Do
                            </dt>
                            <dd className="text-grayscale-800">{policyPhrase}</dd>
                        </div>

                        <div className="flex items-baseline gap-2">
                            <dt className="text-[11px] font-semibold uppercase tracking-wide text-grayscale-400 w-16 shrink-0">
                                Done
                            </dt>
                            <dd className="text-grayscale-800">{terminationPhrase}</dd>
                        </div>
                    </dl>

                    {/*
                        Mock CTA. Non-interactive on purpose — this
                        is a preview, not a simulator. We style it
                        exactly like a live CTA so the author can
                        feel the weight of the learner's action.
                    */}
                    <button
                        type="button"
                        disabled
                        aria-hidden
                        tabIndex={-1}
                        className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white text-sm font-medium opacity-90 cursor-default"
                    >
                        {cta}
                    </button>
                </div>
            </article>
        </aside>
    );
};

const PreviewHeader: React.FC = () => (
    <header className="flex items-center gap-2 px-1">
        <IonIcon
            icon={phonePortraitOutline}
            aria-hidden
            className="text-grayscale-500 text-sm"
        />

        <h2 className="text-xs font-semibold text-grayscale-500 uppercase tracking-wide">
            Learner preview
        </h2>
    </header>
);

export default PreviewPane;

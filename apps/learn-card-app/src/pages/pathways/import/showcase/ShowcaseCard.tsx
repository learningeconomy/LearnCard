/**
 * ShowcaseCard \u2014 visual entry point for a hand-authored multi-pathway
 * demo bundle (Senior Year, Smart Start, Portfolio Sprint, etc.).
 *
 * Co-located with the showcase registry so every consumer that wants
 * to surface "try a curated journey" affordances renders the same
 * card shape. Right now there are two consumers:
 *
 *   1. `ImportCtdlModal` \u2014 the Build > Import flow, where the cards
 *      sit above the Credential Engine catalog as a "see everything
 *      working in one click" jump-start.
 *
 *   2. `DiscoverStart` \u2014 the cold-start landing on `/pathways/onboard`,
 *      where the cards are the *primary* affordance: a first-class
 *      alternative to the open-ended "what's on your mind?" textarea
 *      below them.
 *
 * Visual style is intentionally distinct from real Credential Engine
 * catalog cards (emerald gradient, "Demo · Try everything" eyebrow,
 * feature-tag pills) so reviewers never confuse a hand-authored
 * showcase for a registry record. Loading state on the icon mirrors
 * the rest of the app's button spinner pattern \u2014 the cold-start
 * surface picks up the showcase by hand and we owe the user feedback
 * while supporting pathways are upserted.
 */

import React from 'react';

import { IonIcon } from '@ionic/react';
import {
    analyticsOutline,
    briefcaseOutline,
    layersOutline,
    schoolOutline,
    timeOutline,
} from 'ionicons/icons';

import type { ShowcasePreview } from './types';

/**
 * Whitelist of Ionicons exposed to showcase authors via
 * `ShowcasePreview.icon`. Kept narrow on purpose — it's not a general
 * icon picker, just the handful needed to visually distinguish
 * showcases at a glance. Fall back to `layersOutline` (the legacy
 * "stack of pathways" tile) when a showcase doesn't specify one or
 * names an icon outside the whitelist.
 */
const ICON_REGISTRY: Record<string, string> = {
    schoolOutline,
    briefcaseOutline,
    analyticsOutline,
    layersOutline,
};

interface ShowcaseCardProps {
    preview: ShowcasePreview;
    onPick: () => void;

    /**
     * When true, the card paints a spinner in place of the layers
     * icon and ignores further clicks. Used by callers that
     * single-flight the underlying pick (e.g. `DiscoverStart`
     * during instantiation).
     */
    loading?: boolean;

    /**
     * Disabled is the *visual* peer-disable signal: while one card
     * is loading, the others should look (and act) inert. Distinct
     * from `loading` because the active card stays visually live
     * via the spinner; only the rest dim.
     */
    disabled?: boolean;
}

export const ShowcaseCard: React.FC<ShowcaseCardProps> = ({
    preview,
    onPick,
    loading = false,
    disabled = false,
}) => {
    const iconSrc = (preview.icon && ICON_REGISTRY[preview.icon]) || layersOutline;

    return (
        <button
            type="button"
            onClick={onPick}
            disabled={loading || disabled}
            className="w-full text-left p-4 rounded-2xl
                       bg-gradient-to-br from-emerald-50 via-white to-emerald-50
                       border border-emerald-200 hover:border-emerald-400
                       hover:shadow-md transition-all duration-150
                       flex gap-3 items-center group
                       disabled:cursor-not-allowed disabled:opacity-60
                       disabled:hover:border-emerald-200 disabled:hover:shadow-none"
        >
            {/*
                Leading tile — swapped per showcase via the
                `preview.icon` whitelist so the three cards feel
                visually distinct at a glance. Spinner overlays the
                icon when this card is the one being instantiated.
            */}
            <div
                aria-hidden
                className="shrink-0 w-12 h-12 rounded-xl
                           bg-gradient-to-br from-emerald-500 to-emerald-700
                           text-white flex items-center justify-center
                           shadow-sm shadow-emerald-700/20
                           group-hover:shadow-md group-hover:shadow-emerald-700/30
                           transition-shadow"
            >
                {loading ? (
                    <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                    <IonIcon icon={iconSrc} className="text-2xl" />
                )}
            </div>

            <div className="flex-1 min-w-0 space-y-1">
                {/*
                    Audience-only eyebrow. The legacy
                    "Demo · Try everything" label was internal
                    vocabulary (a test-matrix hint) and read as
                    "this isn't real" to learners — intentionally
                    dropped from the front-door card.
                */}
                {preview.audience && (
                    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-700">
                        {preview.audience}
                    </div>
                )}

                <div className="text-sm font-semibold text-grayscale-900 leading-tight">
                    {preview.title}
                </div>

                {/*
                    One-line description + commitment signal. The
                    old "feature tags" pill row (Composite pathways,
                    Nested sub-pathway, Shared-prereq collection,
                    Credential Engine refs, …) was implementation
                    jargon for authors, not learners, so it's not
                    rendered here. Authors can still read those tags
                    via `preview.featureTags` in author-facing
                    surfaces (Build > Import) if needed.
                */}
                <div className="text-xs text-grayscale-600 leading-snug line-clamp-2">
                    {preview.description}
                </div>

                <div className="flex items-center gap-3 text-[11px] text-grayscale-500 pt-0.5">
                    <span className="inline-flex items-center gap-1">
                        <IonIcon icon={layersOutline} className="text-[12px]" aria-hidden />
                        {preview.totalStepCount} steps
                    </span>

                    {preview.estimatedDuration && (
                        <span className="inline-flex items-center gap-1">
                            <IonIcon icon={timeOutline} className="text-[12px]" aria-hidden />
                            {preview.estimatedDuration}
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
};

export default ShowcaseCard;

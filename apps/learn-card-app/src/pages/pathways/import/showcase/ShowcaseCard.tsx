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
import { layersOutline } from 'ionicons/icons';

import type { ShowcasePreview } from './types';

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
}) => (
    <button
        type="button"
        onClick={onPick}
        disabled={loading || disabled}
        className="w-full text-left p-4 rounded-2xl
                   bg-gradient-to-br from-emerald-50 via-white to-emerald-50
                   border border-emerald-200 hover:border-emerald-400
                   hover:shadow-md transition-all duration-150
                   flex gap-3 items-start group
                   disabled:cursor-not-allowed disabled:opacity-60
                   disabled:hover:border-emerald-200 disabled:hover:shadow-none"
    >
        <div
            aria-hidden
            className="shrink-0 w-14 h-14 rounded-xl
                       bg-gradient-to-br from-emerald-500 to-emerald-700
                       text-white flex items-center justify-center
                       shadow-sm shadow-emerald-700/20
                       group-hover:shadow-md group-hover:shadow-emerald-700/30
                       transition-shadow"
        >
            {loading ? (
                <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
                <IonIcon icon={layersOutline} className="text-2xl" />
            )}
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-700">
                    Demo · Try everything
                </span>

                {preview.audience && (
                    <span className="text-[10px] font-medium text-emerald-900/70">
                        · {preview.audience}
                    </span>
                )}
            </div>

            <div className="text-sm font-semibold text-grayscale-900 leading-tight">
                {preview.title}
            </div>

            <div className="text-xs text-grayscale-500">
                <span className="inline-flex items-center gap-0.5">
                    <IonIcon icon={layersOutline} className="text-[11px]" />
                    {preview.totalStepCount} steps · {preview.subPathwayCount} sub-pathways
                </span>
            </div>

            <div className="text-xs text-grayscale-600 leading-relaxed">
                {preview.description}
            </div>

            <div className="flex flex-wrap gap-1 pt-0.5">
                {preview.featureTags.map(tag => (
                    <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800
                                   text-[10px] font-medium"
                    >
                        {tag}
                    </span>
                ))}
            </div>
        </div>
    </button>
);

export default ShowcaseCard;

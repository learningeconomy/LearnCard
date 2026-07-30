/**
 * JourneysSubHeader — brand subheader for the Journeys cold-start
 * surface (`/pathways/onboard`).
 *
 * Visually mirrors the `MainSubHeader` shape used by sibling
 * top-level features (AI Pathways, AI Insights, AI Sessions): a row
 * of `[icon][title beta][helper text]` directly under the LearnCard
 * wordmark. Used as the brand anchor on the cold-start screen so
 * Journeys reads as a peer feature to AI Pathways rather than a
 * deep-linked utility.
 *
 * ## Why a bespoke component instead of `MainSubHeader`
 *
 * `MainSubHeader` is category-driven — it pulls its icon, title,
 * helper-text styling, and colors from `CredentialCategoryEnum` +
 * the active theme. Pathways v2 doesn't (yet) have a
 * `CredentialCategoryEnum.pathways` member or a matching theme
 * entry, and adding one purely to render a subheader is way out of
 * scope. So we take the visual idea (icon + title + beta + helper
 * line) but materialize it locally with fixed Journeys copy and
 * the already-registered `Compass` icon.
 *
 * ## Why this component is local to /onboard, not shell-wide
 *
 * Once an active pathway is loaded, `PathwaysHeader` already
 * surfaces the contextual title (the pathway switcher) and mode
 * tabs. Stacking this brand subheader on top of that would create
 * three-deep chrome (wordmark + Journeys/beta + pathway switcher +
 * tabs), which is more orientation than information. So the
 * subheader is a feature of the cold-start *page*, not the *shell*.
 */

import React from 'react';

import { Compass } from 'learn-card-base';

const JourneysSubHeader: React.FC = () => (
    <section
        aria-label="Journeys"
        className="max-w-[700px] mx-auto px-4 pt-2 pb-3 flex items-center gap-3"
    >
        {/*
            Compass mark. Same icon registered for the side menu
            entry, so the brand reads consistently across nav and
            page chrome. Sized to match the 60px slot used by
            `MainSubHeader` for AI Pathways / AI Insights / etc.
            so the visual rhythm of "icon-on-the-left feature
            page" stays consistent.
        */}
        <Compass className="h-[56px] w-[56px] shrink-0" />

        <div className="flex flex-col gap-[2px]">
            <span className="font-poppins flex items-center text-grayscale-900 leading-[100%]">
                <span className="text-[22px] font-semibold">Journeys</span>

                {/*
                    `beta` mirrors the treatment used by the AI
                    sibling features. Journeys is still
                    LD-flag-gated and tenant-config-gated, so the
                    label is honest until we widen rollout.
                */}
                <span className="ml-[6px] text-[15px] font-normal text-grayscale-400">
                    beta
                </span>
            </span>

            <span className="font-poppins text-[12px] text-grayscale-600">
                Try a curated start or describe your goal
            </span>
        </div>
    </section>
);

export default JourneysSubHeader;

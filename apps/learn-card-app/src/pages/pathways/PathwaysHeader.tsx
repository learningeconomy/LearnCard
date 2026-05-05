/**
 * PathwaysHeader — persistent header for the four modes.
 *
 * Docs § 10: "Four modes, one shell. Switching modes is a viewport change,
 * never a data fetch." The header is the continuity signal.
 *
 * ## Information architecture
 *
 * Three jobs collapsed into a **single row of chrome** (the previous
 * stacked layout — title row + tabs row — was eating ~110 px of vertical
 * space before any mode body was visible):
 *
 *   1. **Identity + switch** — the pathway title reads as an h1 and
 *      *is* the switcher trigger. Smart-truncated at the colon (so
 *      "Senior Year: AI / Finance College Track" reads as
 *      "Senior Year" instead of "…College Tra…"); the full title
 *      lives in the dropdown rows.
 *   2. **Mode nav (consumption)** — `Today / Map / What-if`
 *      rendered as a single **segmented control**, not four
 *      detached pills. Reads as "pick one of three views" at a
 *      glance and tightens the inter-pill gaps.
 *   3. **Mode nav (authoring) + Alerts** — `Build` is demoted from
 *      a flat tab into a small icon button to the right of the
 *      segmented control. Build is an authoring surface targeted
 *      at a different audience than Today/Map/What-if; flattening
 *      it next to the consumption tabs implied co-equal frequency
 *      it doesn't have. The Proposals pill (alert surface) shares
 *      the same right-side slot when active.
 *
 * The sticky backdrop-blur ("liquid glass") treatment persists across
 * breakpoints so the shell reads as one continuous chrome rather than
 * two different components.
 *
 * The legacy `title` / `subtitle` props are kept on the component
 * signature for backward compat with `PathwaysShell.tsx`'s call-site
 * (the `title` is already surfaced by `PathwaySwitcher` reading the
 * active pathway from the store, and the `subtitle` is restated by
 * each mode's own body copy — "YOU ARE BECOMING" on Today, etc.).
 * Callers can omit them.
 */

import React from 'react';

import { IonIcon } from '@ionic/react';
import { constructOutline } from 'ionicons/icons';
import { NavLink, useRouteMatch } from 'react-router-dom';

import { proposalStore } from '../../stores/pathways';

import PathwaySwitcher from './PathwaySwitcher';

type ModeDef = {
    to: string;
    label: string;
};

/**
 * Consumption modes — flat segmented control. These are the views a
 * learner cycles between daily.
 *
 * `Build` was previously a fourth peer here; demoted to a separate
 * icon affordance on the right because it's an authoring mode (lower
 * frequency, different audience) and reading it as a peer of Today
 * over-promoted it.
 */
const MODES: ModeDef[] = [
    { to: '/pathways/today', label: 'Today' },
    { to: '/pathways/map', label: 'Map' },
    { to: '/pathways/what-if', label: 'What-if' },
];

const BUILD_PATH = '/pathways/build';

interface PathwaysHeaderProps {
    /**
     * @deprecated The title is now surfaced by `PathwaySwitcher`
     * reading the active pathway directly from `pathwayStore`.
     * Preserved for call-site compatibility; ignored.
     */
    title?: string;
    /**
     * @deprecated The pathway goal is restated in each mode's body
     * (e.g. Today's "YOU ARE BECOMING" line), which carries the
     * framing better than a truncated persistent subtitle.
     * Preserved for call-site compatibility; ignored.
     */
    subtitle?: string;
}

const PathwaysHeader: React.FC<PathwaysHeaderProps> = () => {
    const openProposalCount = proposalStore.use.openProposalCount();
    const isOnProposals = !!useRouteMatch('/pathways/proposals');
    const isOnBuild = !!useRouteMatch(BUILD_PATH);

    // Proposals alert visibility — render when there's something to
    // alert about *or* when the learner is already on the Proposals
    // route (so the "escape hatch" back to the pathway is always
    // reachable). At zero-count on any other route the pill is
    // hidden entirely; the tabs claim the freed horizontal space.
    const showProposals = openProposalCount > 0 || isOnProposals;

    return (
        <header
            className="sticky top-0 z-20 w-full font-poppins
                       bg-white/80 backdrop-blur-xl
                       border-b border-grayscale-200/70
                       px-4 pt-2 pb-1.5"
        >
            {/*
                Single-row layout: title on the left, mode controls
                on the right. Wraps to two rows on viewports too
                narrow for both (the mode segmented control needs
                ~220 px to read comfortably).
            */}
            <div
                className="max-w-4xl mx-auto flex items-center
                           justify-between flex-wrap gap-x-3 gap-y-1.5"
            >
                {/*
                    Title-as-switcher. `title` variant renders the
                    active pathway as a small h1 with a chevron;
                    smart-truncated at the colon so the verbose
                    sub-title doesn't push the mode controls off
                    the row.
                */}
                <PathwaySwitcher variant="title" />

                <div className="flex items-center gap-1.5 shrink-0">
                    {/*
                        Consumption modes — segmented control. One
                        rounded container, internal active-state
                        chip with a soft white shadow. Reads as
                        a single "pick one of three" instead of
                        three detached buttons. Padding is tighter
                        than the old detached pills so the row
                        sits at ~36 px instead of ~48 px.
                    */}
                    <nav
                        aria-label="Mode"
                        className="inline-flex p-0.5 rounded-full bg-grayscale-100"
                    >
                        {MODES.map(mode => (
                            <NavLink
                                key={mode.to}
                                to={mode.to}
                                className="py-1.5 px-3 rounded-full
                                           text-xs sm:text-sm font-medium
                                           text-grayscale-700
                                           transition-colors"
                                activeClassName="!bg-white !text-grayscale-900 shadow-sm"
                            >
                                {mode.label}
                            </NavLink>
                        ))}
                    </nav>

                    {/*
                        Build — authoring mode. Demoted from the flat
                        tab row into an icon button so it visually
                        reads as a separate-class affordance (the
                        wrench/construct glyph carries the "this is
                        for editing" meaning). Active styling mirrors
                        the segmented control's active chip.
                    */}
                    <NavLink
                        to={BUILD_PATH}
                        aria-label="Build mode"
                        title="Build"
                        className={`shrink-0 inline-flex items-center justify-center
                                    h-8 w-8 rounded-full
                                    transition-colors ${
                                        isOnBuild
                                            ? 'bg-grayscale-900 text-white'
                                            : 'text-grayscale-700 hover:bg-grayscale-100'
                                    }`}
                    >
                        <IonIcon icon={constructOutline} className="text-base" aria-hidden />
                    </NavLink>

                    {/*
                        Alerts slot — Proposals. Only occupies
                        horizontal space when there's a reason to.
                        Compact pill matched to the segmented
                        control's height so the row reads evenly.
                    */}
                    {showProposals && (
                        <NavLink
                            to="/pathways/proposals"
                            className={`shrink-0 inline-flex items-center
                                        py-1.5 px-3 rounded-full text-xs sm:text-sm font-medium
                                        transition-colors ${
                                            isOnProposals
                                                ? 'bg-grayscale-900 text-white'
                                                : 'bg-grayscale-100 text-grayscale-700 hover:bg-grayscale-200'
                                        }`}
                        >
                            Proposals
                            {openProposalCount > 0 && (
                                <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-600 text-white text-[10px]">
                                    {openProposalCount}
                                </span>
                            )}
                        </NavLink>
                    )}
                </div>
            </div>
        </header>
    );
};

export default PathwaysHeader;

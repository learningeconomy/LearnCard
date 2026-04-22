/**
 * PathwaysHeader — persistent header for the four modes.
 *
 * Docs § 10: "Four modes, one shell. Switching modes is a viewport change,
 * never a data fetch." The header is the continuity signal.
 *
 * ## Information architecture
 *
 * Three jobs, one row of supporting chrome + one row of mode tabs:
 *
 *   1. **Identity + switch** — the pathway title reads as an h1 and
 *      *is* the switcher trigger. Click the title to open the
 *      dropdown of subscribed pathways. Single source of truth for
 *      "which pathway am I in"; zero duplication with a separate
 *      chip.
 *   2. **Alerts** — the `Proposals` pill is an alert surface. It
 *      renders only when there's at least one open proposal *or*
 *      when the learner is already on the Proposals route (so they
 *      can back out). Nothing to alert about → no pixels spent.
 *   3. **Mode nav** — Today / Map / What-if / Build pill tabs.
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

import { NavLink, useRouteMatch } from 'react-router-dom';

import { proposalStore } from '../../stores/pathways';

import PathwaySwitcher from './PathwaySwitcher';

type ModeDef = {
    to: string;
    label: string;
};

const MODES: ModeDef[] = [
    { to: '/pathways/today', label: 'Today' },
    { to: '/pathways/map', label: 'Map' },
    { to: '/pathways/what-if', label: 'What-if' },
    { to: '/pathways/build', label: 'Build' },
];

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
                       px-4 pt-3 pb-2 sm:pt-4"
        >
            <div className="max-w-4xl mx-auto flex flex-col gap-2.5 sm:gap-3">
                <div className="flex items-center justify-between gap-3">
                    {/*
                        Title-as-switcher. PathwaySwitcher in the
                        `title` variant renders as a tappable h1 with
                        a subtle chevron suffix. On mobile it shrinks
                        to `text-lg`; on sm+ to `text-xl`.
                    */}
                    <PathwaySwitcher variant="title" />

                    {/*
                        Alerts slot. Only occupies horizontal space
                        when there's a reason to. When hidden the
                        title gets the full header width (minus edge
                        padding).
                    */}
                    {showProposals && (
                        <NavLink
                            to="/pathways/proposals"
                            className={`shrink-0 py-2 px-3 rounded-full text-sm font-medium transition-colors ${
                                isOnProposals
                                    ? 'bg-grayscale-900 text-white'
                                    : 'bg-grayscale-100 text-grayscale-700 hover:bg-grayscale-200'
                            }`}
                        >
                            Proposals
                            {openProposalCount > 0 && (
                                <span className="ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-emerald-600 text-white text-xs">
                                    {openProposalCount}
                                </span>
                            )}
                        </NavLink>
                    )}
                </div>

                <nav className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
                    {MODES.map(mode => (
                        <NavLink
                            key={mode.to}
                            to={mode.to}
                            className="shrink-0 py-2 sm:py-2.5 px-3 rounded-full text-sm font-medium transition-colors bg-grayscale-100 text-grayscale-700 hover:bg-grayscale-200"
                            activeClassName="!bg-grayscale-900 !text-white"
                        >
                            {mode.label}
                        </NavLink>
                    ))}
                </nav>
            </div>
        </header>
    );
};

export default PathwaysHeader;

/**
 * PathwaysHeader — persistent header for the four modes.
 *
 * Docs § 10: "Four modes, one shell. Switching modes is a viewport change,
 * never a data fetch." The header is the continuity signal.
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
    title?: string;
    subtitle?: string;
}

const PathwaysHeader: React.FC<PathwaysHeaderProps> = ({ title, subtitle }) => {
    const openProposalCount = proposalStore.use.openProposalCount();
    const isOnProposals = !!useRouteMatch('/pathways/proposals');

    return (
        /*
            Responsive strategy — the header is the *continuity signal*
            across the four modes, but on a 375-wide iPhone SE the
            vertical budget is brutal. The title + subtitle is the
            first thing to go on narrow screens because:
              1. `PathwaySwitcher` already surfaces the active
                 pathway's title (truncated but tappable, and tapping
                 opens the full name + a switcher for multi-pathway
                 learners), so the h1 is literal duplication.
              2. The subtitle ("Earn an industry-recognized …") is
                 restated in-page on Today as the "YOU ARE BECOMING"
                 line, and the Map / What-if / Build surfaces each
                 carry their own scene-setting copy.
            On >=sm viewports we keep the h1 + subtitle because
            horizontal real-estate is cheap and a dedicated title
            anchors the shell visually. The sticky-top backdrop-blur
            treatment ("liquid glass") carries across both breakpoints
            so the header doesn't feel like two different components.
        */
        <header
            className="sticky top-0 z-20 w-full font-poppins
                       bg-white/80 backdrop-blur-xl
                       border-b border-grayscale-200/70
                       px-4 pt-3 pb-2 sm:pt-4"
        >
            <div className="max-w-4xl mx-auto flex flex-col gap-2.5 sm:gap-3">
                <div className="flex items-start justify-between gap-3">
                    {title || subtitle ? (
                        <div className="min-w-0 hidden sm:block">
                            <h1 className="text-xl font-semibold text-grayscale-900 truncate">
                                {title ?? 'Pathways'}
                            </h1>

                            {subtitle && (
                                <p className="text-sm text-grayscale-600 leading-relaxed mt-0.5 truncate">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    ) : null}

                    <div className="min-w-0 flex-1 sm:flex-none sm:shrink-0 flex items-center gap-2 sm:justify-end">
                        {/*
                            PathwaySwitcher — compact chip that surfaces
                            multi-pathway navigation without taking over
                            the header. On mobile it *is* the title
                            (the dedicated h1 is hidden); on desktop it
                            sits next to Proposals as a supporting
                            affordance while the h1 anchors identity.
                        */}
                        <div className="min-w-0 flex-1 sm:flex-none">
                            <PathwaySwitcher />
                        </div>

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
                    </div>
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

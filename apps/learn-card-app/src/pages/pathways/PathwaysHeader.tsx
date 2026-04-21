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
        <header className="w-full px-4 pt-4 pb-2 font-poppins bg-white border-b border-grayscale-200">
            <div className="max-w-4xl mx-auto flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h1 className="text-xl font-semibold text-grayscale-900 truncate">
                            {title ?? 'Pathways'}
                        </h1>

                        {subtitle && (
                            <p className="text-sm text-grayscale-600 leading-relaxed mt-0.5 truncate">
                                {subtitle}
                            </p>
                        )}
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                        {/*
                            PathwaySwitcher — compact chip that surfaces
                            multi-pathway navigation without taking over
                            the header. Keeps the h1 authoritative
                            while giving learners a way to jump between
                            goals they've subscribed to.
                        */}
                        <PathwaySwitcher />

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

                <nav className="flex gap-2 overflow-x-auto no-scrollbar">
                    {MODES.map(mode => (
                        <NavLink
                            key={mode.to}
                            to={mode.to}
                            className="shrink-0 py-2.5 px-3 rounded-full text-sm font-medium transition-colors bg-grayscale-100 text-grayscale-700 hover:bg-grayscale-200"
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

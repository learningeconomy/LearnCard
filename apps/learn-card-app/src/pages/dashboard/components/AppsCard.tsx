import React, { useMemo } from 'react';
import { useHistory } from 'react-router-dom';

import type { AppStoreListing, InstalledApp } from '@learncard/types';

import AppTile from './AppTile';

type AppsCardProps = {
    installedApps: InstalledApp[];
    suggestedApps: AppStoreListing[];
    unreadByListing: Map<string, number>;
    onInstallSuccess?: () => void;
};

const MAX_TILES = 5;
const RESPONSIVE_HIDE_AT: Array<'sm' | 'md' | undefined> = [
    undefined,
    undefined,
    undefined,
    'sm',
    'md',
];

type ResolvedTile = {
    listing: AppStoreListing | InstalledApp;
    isInstalled: boolean;
    suggested: boolean;
};

const AppsCard: React.FC<AppsCardProps> = ({
    installedApps,
    suggestedApps,
    unreadByListing,
    onInstallSuccess,
}) => {
    const history = useHistory();

    const tiles = useMemo<ResolvedTile[]>(() => {
        const installedTiles: ResolvedTile[] = installedApps
            .slice(0, MAX_TILES)
            .map(listing => ({ listing, isInstalled: true, suggested: false }));

        if (installedTiles.length >= MAX_TILES) return installedTiles;

        const remaining = MAX_TILES - installedTiles.length;
        const installedIds = new Set(installedTiles.map(t => t.listing.listing_id));
        const suggestedTiles: ResolvedTile[] = suggestedApps
            .filter(s => !installedIds.has(s.listing_id))
            .slice(0, remaining)
            .map(listing => ({ listing, isInstalled: false, suggested: true }));

        return [...installedTiles, ...suggestedTiles];
    }, [installedApps, suggestedApps]);

    if (tiles.length === 0) return null;

    const allSuggested = tiles.every(t => t.suggested);
    const headerLabel = allSuggested ? 'Suggested for you' : 'Your apps';

    return (
        <section className="bg-white rounded-[20px] p-4 shadow-soft-bottom border border-grayscale-200 animate-fade-in-up">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-medium tracking-wider text-grayscale-500 uppercase">
                    {headerLabel}
                </h2>
                <button
                    type="button"
                    onClick={() => history.push('/launchpad')}
                    className="text-xs font-medium text-grayscale-600 hover:text-grayscale-900 transition-colors"
                >
                    View all →
                </button>
            </div>

            <div className="flex justify-center gap-7 py-1">
                {tiles.map((tile, i) => (
                    <AppTile
                        key={tile.listing.listing_id}
                        listing={tile.listing}
                        isInstalled={tile.isInstalled}
                        suggested={tile.suggested}
                        unreadCount={unreadByListing.get(tile.listing.listing_id) ?? 0}
                        onInstallSuccess={onInstallSuccess}
                        animationDelayMs={i * 60}
                        responsiveHide={RESPONSIVE_HIDE_AT[i]}
                    />
                ))}
            </div>
        </section>
    );
};

export default AppsCard;

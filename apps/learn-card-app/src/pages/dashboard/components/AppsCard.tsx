import React, { useMemo } from 'react';
import { useHistory } from 'react-router-dom';

import type { AppStoreListing, InstalledApp } from '@learncard/types';

import AppTile from './AppTile';
import FeaturedAppTile from './FeaturedAppTile';

type AppsCardProps = {
    installedApps: InstalledApp[];
    suggestedApps: AppStoreListing[];
    unreadByListing: Map<string, number>;
    onInstallSuccess?: () => void;
    variant?: 'compact' | 'featured';
};

const COMPACT_MAX_TILES = 5;
const FEATURED_MAX_TILES = 8;

const COMPACT_RESPONSIVE_HIDE: Array<'sm' | 'md' | undefined> = [
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
    variant = 'compact',
}) => {
    const history = useHistory();
    const maxTiles = variant === 'featured' ? FEATURED_MAX_TILES : COMPACT_MAX_TILES;

    const tiles = useMemo<ResolvedTile[]>(() => {
        const installedTiles: ResolvedTile[] = installedApps
            .slice(0, maxTiles)
            .map(listing => ({ listing, isInstalled: true, suggested: false }));

        if (installedTiles.length >= maxTiles) return installedTiles;

        const remaining = maxTiles - installedTiles.length;
        const installedIds = new Set(installedTiles.map(t => t.listing.listing_id));
        const suggestedTiles: ResolvedTile[] = suggestedApps
            .filter(s => !installedIds.has(s.listing_id))
            .slice(0, remaining)
            .map(listing => ({ listing, isInstalled: false, suggested: true }));

        return [...installedTiles, ...suggestedTiles];
    }, [installedApps, suggestedApps, maxTiles]);

    if (tiles.length === 0) return null;

    const allSuggested = tiles.every(t => t.suggested);
    const headerLabel = allSuggested ? 'Suggested for you' : 'Your apps';

    if (variant === 'featured') {
        return (
            <section className="bg-white rounded-[20px] p-5 desktop:p-6 shadow-soft-bottom border border-grayscale-200 animate-fade-in-up">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-[11px] font-medium tracking-[0.14em] text-grayscale-500 uppercase">
                            {headerLabel}
                        </h2>
                        <p className="mt-0.5 text-base desktop:text-lg font-semibold text-grayscale-900 leading-tight">
                            {allSuggested ? 'Apps to explore' : 'Jump back in'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => history.push('/launchpad')}
                        className="text-xs font-medium text-grayscale-600 hover:text-grayscale-900 transition-colors"
                    >
                        Browse all →
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 desktop:grid-cols-3 gap-3">
                    {tiles.map((tile, i) => (
                        <FeaturedAppTile
                            key={tile.listing.listing_id}
                            listing={tile.listing}
                            isInstalled={tile.isInstalled}
                            suggested={tile.suggested}
                            unreadCount={unreadByListing.get(tile.listing.listing_id) ?? 0}
                            onInstallSuccess={onInstallSuccess}
                            animationDelayMs={i * 50}
                        />
                    ))}
                </div>
            </section>
        );
    }

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
                        responsiveHide={COMPACT_RESPONSIVE_HIDE[i]}
                    />
                ))}
            </div>
        </section>
    );
};

export default AppsCard;

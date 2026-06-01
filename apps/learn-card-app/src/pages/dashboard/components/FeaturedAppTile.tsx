import React from 'react';

import type { AppStoreListing, InstalledApp } from '@learncard/types';

import { useAppLaunch } from '../hooks/useAppLaunch';

const FALLBACK_ICON = 'https://cdn.filestackcontent.com/Ja9TRvGVRsuncjqpxedb';

type FeaturedAppTileProps = {
    listing: AppStoreListing | InstalledApp;
    isInstalled: boolean;
    unreadCount?: number;
    suggested?: boolean;
    onInstallSuccess?: () => void;
    animationDelayMs?: number;
};

const formatBadgeCount = (count: number): string => {
    if (count >= 100) return '99+';
    return String(count);
};

const FeaturedAppTile: React.FC<FeaturedAppTileProps> = ({
    listing,
    isInstalled,
    unreadCount = 0,
    suggested = false,
    onInstallSuccess,
    animationDelayMs = 0,
}) => {
    const { launch } = useAppLaunch({ listing, isInstalled, onInstallSuccess });
    const tagline = (listing as AppStoreListing).tagline?.trim();

    return (
        <button
            type="button"
            onClick={() => launch()}
            className="group flex items-center gap-3 p-3 rounded-2xl border border-grayscale-200 hover:border-grayscale-300 hover:bg-grayscale-10 transition-all text-left min-w-0 active:scale-[0.99] animate-fade-in-up"
            style={{ animationDelay: `${animationDelayMs}ms` }}
            aria-label={
                suggested
                    ? `Open ${listing.display_name} — suggested app`
                    : `Open ${listing.display_name}${
                          unreadCount > 0
                              ? `, ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
                              : ''
                      }`
            }
        >
            <span className="relative shrink-0">
                <img
                    src={listing.icon_url || FALLBACK_ICON}
                    alt=""
                    className="w-14 h-14 rounded-[14px] object-cover bg-grayscale-100 border border-grayscale-200 group-hover:shadow-md transition-shadow"
                    onError={e => {
                        (e.currentTarget as HTMLImageElement).src = FALLBACK_ICON;
                    }}
                />
                {unreadCount > 0 && (
                    <span
                        className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center border-2 border-white shadow-soft-bottom"
                        aria-hidden
                    >
                        {formatBadgeCount(unreadCount)}
                    </span>
                )}
            </span>
            <span className="flex flex-col min-w-0 flex-1">
                <span className="flex items-center gap-1.5 min-w-0">
                    <span className="text-sm font-semibold text-grayscale-900 truncate">
                        {listing.display_name}
                    </span>
                    {suggested && (
                        <span className="shrink-0 px-1.5 py-px rounded-full bg-indigo-50 text-indigo-700 text-[9px] font-semibold tracking-wide uppercase">
                            New
                        </span>
                    )}
                </span>
                {tagline && (
                    <span className="text-xs text-grayscale-500 leading-snug line-clamp-2 mt-0.5">
                        {tagline}
                    </span>
                )}
            </span>
        </button>
    );
};

export default FeaturedAppTile;

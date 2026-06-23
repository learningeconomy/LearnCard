import React from 'react';

import type { AppStoreListing, InstalledApp } from '@learncard/types';

import * as m from '../../../paraglide/messages.js';

import { useAppLaunch } from '../hooks/useAppLaunch';

const FALLBACK_ICON = 'https://cdn.filestackcontent.com/Ja9TRvGVRsuncjqpxedb';

type AppTileProps = {
    listing: AppStoreListing | InstalledApp;
    isInstalled: boolean;
    unreadCount?: number;
    suggested?: boolean;
    onInstallSuccess?: () => void;
    animationDelayMs?: number;
    responsiveHide?: 'sm' | 'md';
};

const formatBadgeCount = (count: number): string => {
    if (count >= 100) return '99+';
    return String(count);
};

const RESPONSIVE_HIDE_CLASS: Record<NonNullable<AppTileProps['responsiveHide']>, string> = {
    sm: 'hidden sm:flex',
    md: 'hidden md:flex',
};

const AppTile: React.FC<AppTileProps> = ({
    listing,
    isInstalled,
    unreadCount = 0,
    suggested = false,
    onInstallSuccess,
    animationDelayMs = 0,
    responsiveHide,
}) => {
    const { launch } = useAppLaunch({ listing, isInstalled, onInstallSuccess });
    const visibilityClass = responsiveHide ? RESPONSIVE_HIDE_CLASS[responsiveHide] : 'flex';

    return (
        <button
            type="button"
            onClick={() => launch()}
            className={`group ${visibilityClass} flex-col items-center gap-1.5 text-center w-[80px] active:scale-[0.95] transition-transform animate-fade-in-up`}
            style={{ animationDelay: `${animationDelayMs}ms` }}
            aria-label={
                suggested
                    ? m['dashboard.appTile.openSuggested']({ name: listing.display_name })
                    : unreadCount > 0
                    ? unreadCount === 1
                        ? m['dashboard.appTile.openUnreadOne']({
                              name: listing.display_name,
                              count: unreadCount,
                          })
                        : m['dashboard.appTile.openUnreadMany']({
                              name: listing.display_name,
                              count: unreadCount,
                          })
                    : m['dashboard.appTile.open']({ name: listing.display_name })
            }
        >
            <span className="relative block">
                <img
                    src={listing.icon_url || FALLBACK_ICON}
                    alt=""
                    className="w-[72px] h-[72px] rounded-[18px] object-cover bg-grayscale-100 border border-grayscale-200 shadow-sm group-hover:shadow-md group-hover:-translate-y-[1px] transition-all"
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
                {suggested && unreadCount === 0 && (
                    <span
                        className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-grayscale-900 text-white text-[9px] font-semibold tracking-wide uppercase border-2 border-white shadow-soft-bottom"
                        aria-hidden
                    >
                        {m['dashboard.appTile.new']()}
                    </span>
                )}
            </span>
            <span className="block text-[11px] font-medium text-grayscale-900 truncate max-w-full leading-snug">
                {listing.display_name}
            </span>
        </button>
    );
};

export default AppTile;

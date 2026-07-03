import React, { useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { IonPage, IonContent } from '@ionic/react';
import { useModal, ModalTypes, useDeviceTypeByWidth } from 'learn-card-base';

import Search from 'learn-card-base/svgs/Search';

import MainHeader from '../../components/main-header/MainHeader';
import AppStoreDetailModal from '../launchPad/AppStoreDetailModal';
import AppGrid from './AppGrid';
import AppGridTile from './AppGridTile';
import { LEARNCARD_APP_SHORTCUTS, LearnCardAppShortcut } from './learnCardAppShortcuts';
import useOpenBoostTemplateSelector from './useOpenBoostTemplateSelector';
import useMoreApps from './useMoreApps';

const DEEP_LINK_PARAMS = ['connectTo', 'uri', 'embedUrl'];

// Mobile: the header is a frosted-glass bar (white gradient + backdrop blur),
// matching the bottom nav. Desktop: the header bar is transparent so it doesn't
// chop the tops of tiles that scroll under it — the gray content shows through,
// and the profile island floats as its own white pill (see header.scss).
const MOBILE_HEADER_STYLE: React.CSSProperties = {
    background: 'linear-gradient(to bottom, rgba(255,255,255,1), rgba(255,255,255,0.8))',
    backdropFilter: 'blur(5px)',
    WebkitBackdropFilter: 'blur(5px)',
    borderBottom: '1px solid white',
};

// `--background` targets the Ionic toolbar (MainHeader forwards it) so the whole
// desktop header bar is transparent, not just the inner grid.
const DESKTOP_HEADER_STYLE = { '--background': 'transparent' } as React.CSSProperties;

const MyAppsLanding: React.FC = () => {
    const history = useHistory();
    const { search } = useLocation();
    // Initialize with a modal type so newModal renders (mirrors AppStoreListItem).
    const { newModal } = useModal({ desktop: ModalTypes.Right, mobile: ModalTypes.Right });
    const { isMobile } = useDeviceTypeByWidth();
    const openBoost = useOpenBoostTemplateSelector();
    const { apps: moreApps, isSuggested, isLoading: isLoadingMore } = useMoreApps();
    const [searchInput, setSearchInput] = useState('');

    // Existing /launchpad deep-link flows (partner connect, consent, embed) are
    // handled by the browse view — hand them off, preserving the query string.
    const hasDeepLink = useMemo(
        () => DEEP_LINK_PARAMS.some(p => new URLSearchParams(search).has(p)),
        [search]
    );

    useEffect(() => {
        if (hasDeepLink) history.replace(`/launchpad/browse${search}`);
    }, [hasDeepLink, search, history]);

    const helpers = useMemo(
        () => ({ push: (path: string) => history.push(path), openBoost }),
        [history, openBoost]
    );

    const query = searchInput.trim().toLowerCase();
    const isSearching = query.length > 0;

    // Search only covers the More Apps section. The LearnCard shortcut tiles are
    // always on screen above the search, and their larger gradient tiles look out
    // of place mixed into the results grid.
    const matchedApps = useMemo(
        () =>
            query
                ? moreApps.filter(
                      a =>
                          a.display_name?.toLowerCase().includes(query) ||
                          a.tagline?.toLowerCase().includes(query)
                  )
                : [],
        [query, moreApps]
    );

    const resultsCount = matchedApps.length;

    const renderShortcutTile = (shortcut: LearnCardAppShortcut) => (
        <AppGridTile
            key={shortcut.key}
            title={shortcut.title}
            icon={<shortcut.Icon className="h-full w-full" />}
            gradientFrom={shortcut.gradientFrom}
            gradientTo={shortcut.gradientTo}
            onClick={shortcut.getAction(helpers)}
        />
    );

    const renderAppTile = (app: (typeof moreApps)[number]) => (
        <AppGridTile
            key={app.listing_id}
            title={app.display_name}
            icon={app.icon_url}
            onClick={() =>
                newModal(<AppStoreDetailModal listing={app} isInstalled={!isSuggested} />)
            }
        />
    );

    const renderSkeletonTile = (key: string) => (
        <div
            key={key}
            className="aspect-square w-full max-w-[100px] animate-pulse rounded-[22%] bg-grayscale-200"
        />
    );

    const moreAppsTiles =
        isLoadingMore && moreApps.length === 0
            ? Array.from({ length: 8 }).map((_, i) => renderSkeletonTile(`more-skeleton-${i}`))
            : moreApps.map(renderAppTile);

    // Don't paint the landing for a frame before the deep-link redirect lands.
    if (hasDeepLink) return null;

    return (
        <IonPage className="bg-grayscale-100">
            {/* Gray header so it blends with the grayscale-100 content (no white bar). */}
            <MainHeader
                customClassName=""
                style={isMobile ? MOBILE_HEADER_STYLE : DESKTOP_HEADER_STYLE}
            />
            <IonContent fullscreen color="grayscale-100">
                <div className="flex w-full flex-col items-center gap-8 px-4 pb-10 pt-4 md:gap-12">
                    <div className="flex w-full max-w-[820px] flex-col gap-3 md:flex-row md:items-center md:gap-4">
                        <div className="flex items-center justify-between gap-3 md:contents">
                            <h1 className="font-poppins text-[30px] font-normal text-[#18224E] md:order-1">
                                My Apps
                            </h1>
                            <button
                                type="button"
                                onClick={() => history.push('/launchpad/browse?tab=All')}
                                className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[10px] border border-[#E2E3E9] bg-[#FBFBFC] px-4 py-2.5 font-poppins text-[15px] font-medium text-[#6366F1] md:order-3 md:text-[17px]"
                            >
                                Browse More <span className="text-[18px] leading-none">+</span>
                            </button>
                        </div>
                        <div className="relative w-full md:order-2 md:max-w-[320px] md:flex-1">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-[20px] w-[20px] -translate-y-1/2 text-[#6F7590]" />
                            <input
                                value={searchInput}
                                onChange={e => setSearchInput(e.target.value)}
                                placeholder="Search..."
                                aria-label="Search apps"
                                className="w-full rounded-[10px] bg-[#E2E3E9] py-2.5 pl-11 pr-4 font-notoSans text-[16px] text-[#18224E] placeholder:text-[#6F7590] focus:outline-none"
                            />
                        </div>
                    </div>

                    {isSearching ? (
                        <div className="w-full max-w-[820px]">
                            <p className="mb-4 font-poppins text-[15px] text-[#6F7590] md:mb-6">
                                {resultsCount === 0
                                    ? `No results for "${searchInput.trim()}"`
                                    : `${resultsCount} result${
                                          resultsCount === 1 ? '' : 's'
                                      } for "${searchInput.trim()}"`}
                            </p>
                            {resultsCount > 0 && (
                                <AppGrid>{matchedApps.map(renderAppTile)}</AppGrid>
                            )}
                        </div>
                    ) : (
                        <>
                            <AppGrid heading="LearnCard Apps">
                                {LEARNCARD_APP_SHORTCUTS.map(renderShortcutTile)}
                            </AppGrid>

                            <AppGrid heading="More Apps">{moreAppsTiles}</AppGrid>
                        </>
                    )}
                </div>
            </IonContent>
        </IonPage>
    );
};

export default MyAppsLanding;

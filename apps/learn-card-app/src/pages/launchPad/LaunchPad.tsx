import React, { useEffect, useMemo, useState } from 'react';
import queryString from 'query-string';
import { useHistory, useLocation } from 'react-router-dom';

import {
    LaunchPadAppListItem as LaunchPadAppListItemType,
    LaunchPadAppType,
    useAiFeatureGate,
} from 'learn-card-base';
import { useFlags } from 'launchdarkly-react-client-sdk';
import useAppConnectModal from '../../hooks/useConnectAppModal';
import { useConsentFlowByUri } from '../consentFlow/useConsentFlow';

import { IonPage, IonContent, IonList } from '@ionic/react';
import LaunchPadHeader from './LaunchPadHeader/LaunchPadHeader';
import LaunchPadBecomeAnApp from './LaunchPadBecomeAnApp';
import LaunchPadAppListItem from './LaunchPadAppListItem';
import LaunchPadContractListItem from './LaunchPadContractListItem';
import MainHeader from '../../components/main-header/MainHeader';
import LaunchPadSearch from './LaunchPadSearch/LaunchPadSearch';
import LaunchPadAppTabs, { LaunchPadTabEnum } from './LaunchPadHeader/LaunchPadAppTabs';
import GenericErrorBoundary from '../../components/generic/GenericErrorBoundary';
import { RecoveryBanner } from '../../components/recovery/RecoveryBanner';
import { useAppAuth } from '../../providers/AuthCoordinatorProvider';

import {
    LaunchPadFilterOptionsEnum,
    LaunchPadSortOptionsEnum,
} from './LaunchPadSearch/launchpad-search.helpers';

import useAppStore, { mapTabToCategory } from './useAppStore';
import headerScrollStore from '../../stores/headerScrollStore';
import AppStoreListItem from './AppStoreListItem';
import { AppStoreListSkeleton } from './AppStoreListItemSkeleton';
import FeaturedCarousel from './FeaturedCarousel';
import { NavBarLaunchPadIcon } from '../../components/svgs/NavBarLaunchPadIcon';

const LaunchPad: React.FC = () => {
    const flags = useFlags();
    const { recoveryMethodCount, openRecoverySetup, capabilities } = useAppAuth();
    const { isAiEnabled, reason } = useAiFeatureGate();
    const history = useHistory();
    const { search } = useLocation();
    const {
        connectTo,
        challenge,
        uri,
        suppressContractModal,
        embedUrl,
        appName,
        appImage,
        tab: tabParam,
    } = queryString.parse(search);
    const contractUri = Array.isArray(uri) ? uri[0] ?? '' : uri ?? '';
    const embedUrlParam = Array.isArray(embedUrl) ? embedUrl[0] ?? '' : embedUrl ?? '';
    const appNameParam = Array.isArray(appName) ? appName[0] ?? '' : appName ?? '';
    const appImageParam = Array.isArray(appImage) ? appImage[0] ?? '' : appImage ?? '';

    const initialTab = (() => {
        const raw = Array.isArray(tabParam) ? tabParam[0] : tabParam;
        const match = Object.values(LaunchPadTabEnum).find(option => option === raw);
        return match ?? LaunchPadTabEnum.myApps;
    })();

    const [tab, setTab] = useState(initialTab);
    const [filterBy, setFilterBy] = useState<LaunchPadFilterOptionsEnum>(
        LaunchPadFilterOptionsEnum.allApps
    );
    const [sortBy, setSortBy] = useState<LaunchPadSortOptionsEnum>(
        LaunchPadSortOptionsEnum.featuredBy
    );
    const [searchInput, setSearchInput] = useState<string>('');
    const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);

    // App Store hooks
    const { useBrowseAppStore, useFeaturedCarouselApps, useCuratedListApps, useInstalledApps } =
        useAppStore();

    // Tab-mode flags for section gating
    const isMyApps = tab === LaunchPadTabEnum.myApps;
    const isAll = tab === LaunchPadTabEnum.all;
    const isCategory = !isMyApps && !isAll;

    // Get category filter based on current tab
    const appStoreCategory = useMemo(() => mapTabToCategory(tab), [tab]);

    // Fetch installed apps
    const {
        data: installedAppsData,
        isLoading: isLoadingInstalledApps,
        refetch: refetchInstalledApps,
    } = useInstalledApps({ limit: 50 });

    // Fetch browsable apps (for search/discovery)
    const { data: browseAppsData, isLoading: isLoadingBrowseApps } = useBrowseAppStore({
        category: appStoreCategory,
        limit: 50,
    });

    // Fetch featured carousel apps. On My Apps / All, appStoreCategory is undefined → cross-category.
    // On category tabs, the carousel is scoped to that category.
    const { data: featuredCarouselApps } = useFeaturedCarouselApps(appStoreCategory);

    // Fetch curated list apps
    const { data: curatedListApps, isLoading: isLoadingCuratedApps } = useCuratedListApps();

    const installedApps = installedAppsData?.records ?? [];
    const browseApps = browseAppsData?.records ?? [];

    // Filter browse apps that aren't already installed (only on My Apps tab, and only when not searching)
    const installedListingIds = new Set(installedApps.map(app => app.listing_id));

    const isSearching = searchInput.trim().length > 0;

    const availableApps = useMemo(
        () =>
            isMyApps && !isSearching
                ? browseApps.filter(app => !installedListingIds.has(app.listing_id))
                : browseApps,
        [browseApps, installedListingIds, isMyApps, isSearching]
    );

    // Curated apps: never filter installed out — Suggested shows them with "Open" CTA on every tab.
    const curatedApps = useMemo(() => curatedListApps ?? [], [curatedListApps]);

    const connectToProfileId = (!Array.isArray(connectTo) ? connectTo : undefined) || '';
    const connectChallenge = (!Array.isArray(challenge) ? challenge : undefined) || '';

    const { presentConnectAppModal, loading: modalLoading } = useAppConnectModal(
        connectToProfileId,
        connectChallenge
    );

    if (connectToProfileId && connectChallenge && !modalLoading) {
        presentConnectAppModal({
            cssClass: 'center-modal network-accept-modal',
            showBackdrop: false,
            onDidDismiss: dismissInfo => {
                if (dismissInfo.detail.role === 'backdrop') {
                    history.push('/launchpad');
                }
            },
        });
    }

    const {
        contract: contractDetails,
        openConsentFlowModal,
        consentedContractLoading,
        hasConsented,
    } = useConsentFlowByUri(contractUri);

    useEffect(() => {
        if (contractDetails && !suppressContractModal && !consentedContractLoading) {
            const searchParams = new URLSearchParams(window.location.search);
            searchParams.set('suppressContractModal', 'true');
            history.push({
                search: searchParams.toString(),
            });
            openConsentFlowModal();
        }
    }, [contractDetails, suppressContractModal, consentedContractLoading]);

    useEffect(() => () => headerScrollStore.set.scrolled(false), []);

    // Filter app store apps based on search and category
    const filteredInstalledApps = useMemo(() => {
        const lowerSearch = searchInput?.toLowerCase() || '';

        return installedApps.filter(app => {
            // Filter by category/tab
            if (
                appStoreCategory &&
                app.category?.toLowerCase() !== appStoreCategory.toLowerCase()
            ) {
                return false;
            }

            // Filter by search
            if (lowerSearch) {
                const nameMatch = app.display_name?.toLowerCase().includes(lowerSearch);
                const taglineMatch = app.tagline?.toLowerCase().includes(lowerSearch);

                return nameMatch || taglineMatch;
            }

            return true;
        });
    }, [installedApps, searchInput, appStoreCategory]);

    // Set of curated (Suggested Apps) IDs — used to avoid duplicating curated picks
    // in the "All {Category}"/"All Apps" list (they already have their own section).
    // Featured carousel apps intentionally still appear in the list so users can find
    // them by browsing as well as in the carousel.
    const curatedIds = useMemo(() => {
        const ids = new Set<string>();
        (curatedListApps ?? []).forEach(app => ids.add(app.listing_id));
        return ids;
    }, [curatedListApps]);

    const filteredAvailableApps = useMemo(() => {
        const lowerSearch = searchInput?.toLowerCase() || '';

        return availableApps.filter(app => {
            // Filter by search
            if (lowerSearch) {
                const nameMatch = app.display_name?.toLowerCase().includes(lowerSearch);
                const taglineMatch = app.tagline?.toLowerCase().includes(lowerSearch);

                return nameMatch || taglineMatch;
            }

            return true;
        });
    }, [availableApps, searchInput]);

    // Filtered curated apps (for Suggested Apps section)
    const filteredCuratedApps = useMemo(() => {
        const lowerSearch = searchInput?.toLowerCase() || '';

        return curatedApps.filter(app => {
            // Filter by category if one is selected
            if (
                appStoreCategory &&
                app.category?.toLowerCase() !== appStoreCategory.toLowerCase()
            ) {
                return false;
            }

            if (lowerSearch) {
                const nameMatch = app.display_name?.toLowerCase().includes(lowerSearch);
                const taglineMatch = app.tagline?.toLowerCase().includes(lowerSearch);
                return nameMatch || taglineMatch;
            }

            return true;
        });
    }, [curatedApps, searchInput, appStoreCategory]);

    // Non-promoted available apps (for Discover More section)
    const nonPromotedAvailableApps = useMemo(() => {
        return filteredAvailableApps.filter(app => !curatedIds.has(app.listing_id));
    }, [filteredAvailableApps, curatedIds]);

    // Create custom app from query params if provided
    const customAppFromQueryParams: LaunchPadAppListItemType | null = useMemo(() => {
        if (embedUrlParam) {
            return {
                id: 'preview',
                name: appNameParam || 'Partner App',
                description: 'Custom embedded application',
                img: appImageParam || 'https://cdn.filestackcontent.com/Ja9TRvGVRsuncjqpxedb',
                isConnected: true,
                displayInLaunchPad: true,
                handleConnect: () => {},
                handleView: () => {},
                embedUrl: embedUrlParam,
                launchPadTab: [LaunchPadTabEnum.all],
                appType: [LaunchPadAppType.INTEGRATION],
            };
        }
        return null;
    }, [embedUrlParam, appNameParam, appImageParam]);

    return (
        <IonPage className="bg-white">
            <MainHeader customClassName="bg-gradient-to-b from-white to-white/70 border-b border-white backdrop-blur-[5px] md:bg-white md:border-none md:bg-none md:backdrop-blur-none" />
            <GenericErrorBoundary>
                <IonContent
                    fullscreen
                    scrollY={true}
                    color="grayscale-100"
                    scrollEvents
                    onIonScroll={e => {
                        const next = e.detail.scrollTop > 24;
                        if (headerScrollStore.get.scrolled() !== next) {
                            headerScrollStore.set.scrolled(next);
                        }
                    }}
                >
                    <div className="flex flex-col items-center w-full">
                        <LaunchPadHeader>
                            <div className="flex flex-col gap-3 w-full max-w-[600px] pl-3">
                                <LaunchPadAppTabs tab={tab} setTab={setTab} />
                                {/* Featured Carousel - shows apps with FEATURED_CAROUSEL promotion level on every tab */}
                                {featuredCarouselApps && featuredCarouselApps.length > 0 && (
                                    <FeaturedCarousel
                                        apps={featuredCarouselApps}
                                        installedAppIds={installedListingIds}
                                        onInstallSuccess={refetchInstalledApps}
                                        hideScrollDots={true}
                                    />
                                )}
                                <LaunchPadSearch
                                    searchInput={searchInput}
                                    setSearchInput={setSearchInput}
                                    filterBy={filterBy}
                                    setFilterBy={setFilterBy}
                                    sortBy={sortBy}
                                    setSortBy={setSortBy}
                                    onFocus={() => setIsSearchFocused(true)}
                                    onBlur={() => setIsSearchFocused(false)}
                                />
                            </div>
                        </LaunchPadHeader>
                        <div className="flex-grow flex flex-col items-center justify-start w-full pb-8 px-4 bg-grayscale-100">
                            {capabilities.recovery && (
                                <RecoveryBanner
                                    recoveryMethodCount={recoveryMethodCount}
                                    onSetup={openRecoverySetup}
                                />
                            )}

                            {tab === LaunchPadTabEnum.ai && !isAiEnabled ? (
                                <div className="w-full max-w-[600px] flex flex-col items-center justify-center text-center px-6 py-12">
                                    <div className="bg-amber-50 border border-amber-200 rounded-[16px] p-6 max-w-[450px]">
                                        <p className="text-[15px] font-semibold text-amber-900 mb-2">
                                            AI Apps Unavailable
                                        </p>
                                        <p className="text-sm text-amber-800">
                                            {reason === 'disabled_minor'
                                                ? 'AI features are disabled for users under 18.'
                                                : 'AI features are currently disabled. Adults can enable AI features in Privacy & Data settings.'}
                                        </p>
                                    </div>
                                </div>
                            ) : searchInput.length > 0 ? (
                                <>
                                    <IonList
                                        lines="none"
                                        className="w-full max-w-[600px] bg-grayscale-100"
                                    >
                                        {customAppFromQueryParams && (
                                            <LaunchPadAppListItem
                                                key="custom-app-preview"
                                                app={customAppFromQueryParams}
                                                filterBy={filterBy}
                                            />
                                        )}

                                        {/* Search results header + list */}
                                        {filteredAvailableApps.length > 0 && (
                                            <>
                                                <div className="px-2 pt-6 pb-2">
                                                    <p className="text-sm font-semibold text-grayscale-600 uppercase tracking-wide">
                                                        {tab === LaunchPadTabEnum.plugins ||
                                                        filteredAvailableApps.every(
                                                            app => app.category === 'plugin'
                                                        )
                                                            ? `${filteredAvailableApps.length} ${
                                                                  filteredAvailableApps.length === 1
                                                                      ? 'Plugin'
                                                                      : 'Plugins'
                                                              }`
                                                            : `${
                                                                  filteredAvailableApps.length
                                                              } Search ${
                                                                  filteredAvailableApps.length === 1
                                                                      ? 'Result'
                                                                      : 'Results'
                                                              }`}
                                                    </p>
                                                </div>
                                                {filteredAvailableApps.map(app => (
                                                    <AppStoreListItem
                                                        key={`available-${app.listing_id}`}
                                                        listing={app}
                                                        isInstalled={installedListingIds.has(
                                                            app.listing_id
                                                        )}
                                                        onInstallSuccess={refetchInstalledApps}
                                                    />
                                                ))}
                                            </>
                                        )}
                                    </IonList>

                                    {/*
                                     * Show "no results" when nothing actually renders in this branch.
                                     * Installed apps are not rendered as a separate section in search
                                     * mode (any installed matches surface via browseApps in
                                     * filteredAvailableApps), so don't gate the message on
                                     * filteredInstalledApps — otherwise a search for an installed-but-
                                     * delisted app (in installedApps but not in browseApps) would
                                     * suppress the message while rendering nothing.
                                     */}
                                    {filteredAvailableApps.length === 0 &&
                                        !customAppFromQueryParams && (
                                            <div className="w-full flex items-center justify-center z-10">
                                                <div className="w-full max-w-[550px] flex items-center justify-start px-2 border-t-[1px] border-solid border-grayscale-200 pt-2">
                                                    <p className="text-grayscale-800 text-base font-normal font-notoSans">
                                                        No results found for{' '}
                                                        <span className="text-black italic">
                                                            {searchInput}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                </>
                            ) : (
                                <IonList
                                    lines="none"
                                    className="w-full max-w-[600px] bg-grayscale-100"
                                >
                                    {/* My Apps tab: Installed Apps loading skeletons (cold load, no data yet) */}
                                    {isMyApps &&
                                        isLoadingInstalledApps &&
                                        filteredInstalledApps.length === 0 && (
                                            <>
                                                <div className="px-2 pt-4 pb-2">
                                                    <p className="text-sm font-semibold text-grayscale-600 uppercase tracking-wide">
                                                        Installed Apps
                                                    </p>
                                                </div>
                                                <AppStoreListSkeleton idPrefix="installed-skeleton" />
                                            </>
                                        )}

                                    {/* My Apps tab: Installed Apps (hidden if none) */}
                                    {isMyApps && filteredInstalledApps.length > 0 && (
                                        <>
                                            <div className="px-2 pt-4 pb-2">
                                                <p className="text-sm font-semibold text-grayscale-600 uppercase tracking-wide">
                                                    Installed Apps
                                                </p>
                                            </div>
                                            {filteredInstalledApps.map(app => (
                                                <AppStoreListItem
                                                    key={`installed-${app.listing_id}`}
                                                    listing={app}
                                                    isInstalled={true}
                                                    onInstallSuccess={refetchInstalledApps}
                                                />
                                            ))}
                                        </>
                                    )}

                                    {/* Suggested Apps loading skeletons (cold load, no data yet) */}
                                    {isLoadingCuratedApps && filteredCuratedApps.length === 0 && (
                                        <>
                                            <div className="px-2 pt-4 pb-2">
                                                <p className="text-sm font-semibold text-grayscale-600 uppercase tracking-wide">
                                                    Suggested Apps
                                                </p>
                                            </div>
                                            <AppStoreListSkeleton idPrefix="suggested-skeleton" />
                                        </>
                                    )}

                                    {/* Suggested Apps (CURATED_LIST) — all tabs */}
                                    {filteredCuratedApps.length > 0 && (
                                        <>
                                            <div className="px-2 pt-4 pb-2">
                                                <p className="text-sm font-semibold text-grayscale-600 uppercase tracking-wide">
                                                    Suggested Apps
                                                </p>
                                            </div>
                                            {filteredCuratedApps.map(app => (
                                                <AppStoreListItem
                                                    key={`curated-${app.listing_id}`}
                                                    listing={app}
                                                    isInstalled={installedListingIds.has(
                                                        app.listing_id
                                                    )}
                                                    onInstallSuccess={refetchInstalledApps}
                                                />
                                            ))}
                                        </>
                                    )}

                                    {/* Category/All tabs: browse list loading skeletons (cold load, no data yet) */}
                                    {(isCategory || isAll) &&
                                        isLoadingBrowseApps &&
                                        nonPromotedAvailableApps.length === 0 && (
                                            <>
                                                <div className="px-2 pt-4 pb-2">
                                                    <p className="text-sm font-semibold text-grayscale-600 uppercase tracking-wide">
                                                        {isAll ? 'All Apps' : `All ${tab}`}
                                                    </p>
                                                </div>
                                                <AppStoreListSkeleton idPrefix="browse-skeleton" />
                                            </>
                                        )}

                                    {/* Category/All tabs: browse list (include installed apps with Open CTA) */}
                                    {(isCategory || isAll) &&
                                        nonPromotedAvailableApps.length > 0 && (
                                            <>
                                                <div className="px-2 pt-4 pb-2">
                                                    <p className="text-sm font-semibold text-grayscale-600 uppercase tracking-wide">
                                                        {isAll ? 'All Apps' : `All ${tab}`}
                                                    </p>
                                                </div>
                                                {nonPromotedAvailableApps.map(app => (
                                                    <AppStoreListItem
                                                        key={`available-${app.listing_id}`}
                                                        listing={app}
                                                        isInstalled={installedListingIds.has(
                                                            app.listing_id
                                                        )}
                                                        onInstallSuccess={refetchInstalledApps}
                                                    />
                                                ))}
                                            </>
                                        )}

                                    {/* Consent Flow Contract (if applicable) */}
                                    {contractDetails &&
                                        !hasConsented &&
                                        tab === LaunchPadTabEnum.all && (
                                            <LaunchPadContractListItem contract={contractDetails} />
                                        )}

                                    {customAppFromQueryParams && (
                                        <LaunchPadAppListItem
                                            key="custom-app-preview"
                                            app={customAppFromQueryParams}
                                            filterBy={filterBy}
                                        />
                                    )}

                                    {/* Empty state — no apps in any section on this tab */}
                                    {(() => {
                                        const hasCarousel = (featuredCarouselApps?.length ?? 0) > 0;
                                        const hasInstalled =
                                            isMyApps && filteredInstalledApps.length > 0;
                                        const hasSuggested = filteredCuratedApps.length > 0;
                                        const hasBrowse =
                                            (isCategory || isAll) &&
                                            nonPromotedAvailableApps.length > 0;
                                        const hasContract =
                                            !!contractDetails &&
                                            !hasConsented &&
                                            tab === LaunchPadTabEnum.all;
                                        const hasCustomApp = !!customAppFromQueryParams;

                                        const isEmpty =
                                            !hasCarousel &&
                                            !hasInstalled &&
                                            !hasSuggested &&
                                            !hasBrowse &&
                                            !hasContract &&
                                            !hasCustomApp &&
                                            !isLoadingBrowseApps &&
                                            !isLoadingInstalledApps &&
                                            !isLoadingCuratedApps;

                                        if (!isEmpty) return null;

                                        const title = isMyApps
                                            ? 'Your apps will live here'
                                            : isAll
                                            ? 'No apps available right now'
                                            : `Nothing in ${tab} yet`;

                                        const subtitle = isMyApps
                                            ? 'Install something from the App Store to get started.'
                                            : isAll
                                            ? 'Check back later — new apps are added all the time.'
                                            : 'Check back soon, or browse all apps.';

                                        const showCta = !isAll;

                                        return (
                                            <div className="w-full flex flex-col items-center justify-center py-16 px-6 text-center">
                                                <NavBarLaunchPadIcon
                                                    version="2"
                                                    className="w-20 h-20 mb-4"
                                                />
                                                <p className="text-base font-semibold text-grayscale-900 mb-1 font-poppins">
                                                    {title}
                                                </p>
                                                <p className="text-sm text-grayscale-600 max-w-[280px] font-notoSans">
                                                    {subtitle}
                                                </p>
                                                {showCta && (
                                                    <button
                                                        onClick={() => setTab(LaunchPadTabEnum.all)}
                                                        className="mt-5 px-5 py-2 rounded-full bg-grayscale-900 text-white text-sm font-semibold font-poppins"
                                                    >
                                                        Browse all apps
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })()}

                                    {filterBy === LaunchPadFilterOptionsEnum.allApps &&
                                        (isMyApps || isAll) && <LaunchPadBecomeAnApp />}
                                </IonList>
                            )}
                        </div>
                    </div>
                </IonContent>
            </GenericErrorBoundary>
        </IonPage>
    );
};

export default LaunchPad;

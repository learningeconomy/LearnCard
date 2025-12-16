import React, { useEffect, useMemo, useState } from 'react';
import queryString from 'query-string';
import { useHistory, useLocation } from 'react-router-dom';

import useLaunchPadApps from './useLaunchPadApps';
import {
    LaunchPadAppListItem as LaunchPadAppListItemType,
    LaunchPadAppType,
} from 'learn-card-base';
import { useFlags } from 'launchdarkly-react-client-sdk';
import useAppConnectModal from '../../hooks/useConnectAppModal';
import { useLaunchPadContracts } from './useLaunchPadContracts';
import { useConsentFlowByUri } from '../consentFlow/useConsentFlow';

import { IonPage, IonContent, IonList } from '@ionic/react';
import LaunchPadHeader from './LaunchPadHeader/LaunchPadHeader';
import LaunchPadActionModal from './LaunchPadHeader/LaunchPadActionModal';
import LaunchPadBecomeAnApp from './LaunchPadBecomeAnApp';
import LaunchPadAppListItem from './LaunchPadAppListItem';
import LaunchPadContractListItem from './LaunchPadContractListItem';
import MainHeader from '../../components/main-header/MainHeader';
import LaunchPadSearch from './LaunchPadSearch/LaunchPadSearch';
import LaunchPadAppTabs, { LaunchPadTabEnum } from './LaunchPadHeader/LaunchPadAppTabs';
import GenericErrorBoundary from '../../components/generic/GenericErrorBoundary';

import { aiPassportApps } from '../../components/ai-passport-apps/aiPassport-apps.helpers';
import { useModal, ModalTypes, useIsCurrentUserLCNUser } from 'learn-card-base';
import {
    LaunchPadFilterOptionsEnum,
    LaunchPadSortOptionsEnum,
} from './LaunchPadSearch/launchpad-search.helpers';

import useAppStore, { mapTabToCategory } from './useAppStore';
import AppStoreListItem from './AppStoreListItem';
import FeaturedCarousel from './FeaturedCarousel';

const LaunchPad: React.FC = () => {
    const flags = useFlags();
    const history = useHistory();
    const { search } = useLocation();
    const {
        connectTo,
        challenge,
        uri,
        returnTo,
        suppressContractModal,
        skipLPAction,
        boostUri,
        vc_request_url,
        claim,
        embedUrl,
        appName,
        appImage,
    } = queryString.parse(search);
    const contractUri = Array.isArray(uri) ? uri[0] ?? '' : uri ?? '';
    const embedUrlParam = Array.isArray(embedUrl) ? embedUrl[0] ?? '' : embedUrl ?? '';
    const appNameParam = Array.isArray(appName) ? appName[0] ?? '' : appName ?? '';
    const appImageParam = Array.isArray(appImage) ? appImage[0] ?? '' : appImage ?? '';

    const [tab, setTab] = useState(LaunchPadTabEnum.all);
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

    // Fetch featured carousel apps
    const { data: featuredCarouselApps } = useFeaturedCarouselApps();

    // Fetch curated list apps
    const { data: curatedListApps } = useCuratedListApps();

    const installedApps = installedAppsData?.records ?? [];
    const browseApps = browseAppsData?.records ?? [];

    // Filter browse apps that aren't already installed
    const installedListingIds = new Set(installedApps.map(app => app.listing_id));

    const availableApps = browseApps.filter(app => !installedListingIds.has(app.listing_id));

    // Curated apps that aren't installed (for "Featured Apps" section)
    const curatedAppsNotInstalled = useMemo(
        () => (curatedListApps ?? []).filter(app => !installedListingIds.has(app.listing_id)),
        [curatedListApps, installedListingIds]
    );

    const { newModal } = useModal({ desktop: ModalTypes.Freeform, mobile: ModalTypes.Freeform });
    const { data: isNetworkUser, isLoading: isNetworkUserLoading } = useIsCurrentUserLCNUser();

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

    useEffect(() => {
        if (isNetworkUserLoading) return;
        if (!isNetworkUser) return;
        if (consentedContractLoading) return;

        const skipParam = Array.isArray(skipLPAction) ? skipLPAction[0] : skipLPAction;
        const shouldSkip =
            skipParam === '1' ||
            (typeof skipParam === 'string' && skipParam.toLowerCase() === 'true');
        if (shouldSkip) return;

        if (connectToProfileId && connectChallenge) return;

        if (contractDetails && !hasConsented && !suppressContractModal) return;

        const claimParam = Array.isArray(claim) ? claim[0] : claim;
        const isClaiming =
            claimParam === '1' ||
            (typeof claimParam === 'string' && claimParam.toLowerCase() === 'true');
        if (isClaiming) return;

        const boostParam = Array.isArray(boostUri) ? boostUri[0] : boostUri;
        if (boostParam) return;

        const vcReqParam = Array.isArray(vc_request_url) ? vc_request_url[0] : vc_request_url;
        if (vcReqParam) return;

        const SHOWN_KEY = 'lp_action_shown_after_login';
        if (sessionStorage.getItem(SHOWN_KEY)) return;

        const id = window.requestAnimationFrame(() => {
            newModal(<LaunchPadActionModal showFooterNav={true} />, {
                className:
                    'w-full flex items-center justify-center bg-white/70 backdrop-blur-[5px]',
                sectionClassName: '!max-w-[380px] disable-scrollbars',
            });
            sessionStorage.setItem(SHOWN_KEY, '1');
        });

        return () => cancelAnimationFrame(id);
    }, [
        isNetworkUser,
        isNetworkUserLoading,
        consentedContractLoading,
        connectToProfileId,
        connectChallenge,
        contractDetails,
        hasConsented,
        suppressContractModal,
        skipLPAction,
        boostUri,
        vc_request_url,
    ]);

    let aiApps = flags?.enableLaunchPadUpdates ? aiPassportApps : [];
    let apps = useLaunchPadApps();
    let contracts = useLaunchPadContracts();

    aiApps = aiApps.map(app => ({ ...app, launchPadTab: [LaunchPadTabEnum.ai] }));
    apps = apps.map(app => ({ ...app, launchPadTab: [LaunchPadTabEnum.tools] }));
    contracts = contracts.map(contract => ({
        ...contract,
        launchPadTab: contract.data?.needsGuardianConsent
            ? [LaunchPadTabEnum.games]
            : [LaunchPadTabEnum.tools],
    }));

    const aiAppContracts = aiApps.map(app => app.contractUri);

    // Separate legacy apps from coming soon apps
    const legacyAppsAndContracts = useMemo(() => {
        return [
            ...aiApps,
            ...apps,
            ...contracts?.filter(contract => !aiAppContracts.includes(contract?.data?.uri)),
        ];
    }, [apps, contracts]);

    // Coming soon apps from LaunchDarkly flag
    const comingSoonApps = useMemo<LaunchPadAppListItemType[]>(() => {
        return flags.comingSoonApps || [];
    }, [flags.comingSoonApps]);

    // Combined for backwards compatibility with existing filtering
    const appsAndContracts = useMemo(() => {
        return [...legacyAppsAndContracts, ...comingSoonApps];
    }, [legacyAppsAndContracts, comingSoonApps]);

    const filteredAppsAndContracts = useMemo(() => {
        const lowerSearch = searchInput?.toLowerCase() || '';

        return appsAndContracts.filter(item => {
            const contractName = item?.data?.name?.toLowerCase() || '';
            const appName = item?.name?.toLowerCase() || '';

            if (
                tab === LaunchPadTabEnum.ai &&
                !item?.launchPadTab?.includes(LaunchPadTabEnum.ai) &&
                !item?.appType?.includes(LaunchPadAppType.AI)
            ) {
                return false;
            }
            if (
                tab === LaunchPadTabEnum.learning &&
                !item?.launchPadTab?.includes(LaunchPadTabEnum.learning) &&
                !item?.appType?.includes(LaunchPadAppType.LEARNING)
            ) {
                return false;
            }
            if (
                tab === LaunchPadTabEnum.games &&
                !item?.launchPadTab?.includes(LaunchPadTabEnum.games) &&
                !item?.appType?.includes(LaunchPadAppType.GAME)
            ) {
                return false;
            }
            if (
                tab === LaunchPadTabEnum.tools &&
                !item?.launchPadTab?.includes(LaunchPadTabEnum.tools) &&
                !item?.appType?.includes(LaunchPadAppType.INTEGRATION)
            ) {
                return false;
            }

            if (item?.displayInLaunchPad === false) return false; // for apps

            return contractName?.includes(lowerSearch) || appName?.includes(lowerSearch);
        });
    }, [appsAndContracts, searchInput]);

    const sortedAppsAndContracts = useMemo(() => {
        const withDemoFirst = filteredAppsAndContracts.slice().sort((a, b) => {
            const nameA = (a?.name || a?.data?.name || '')?.toLowerCase();
            const nameB = (b?.name || b?.data?.name || '')?.toLowerCase();

            if (nameA === 'demo school') return -1;
            if (nameB === 'demo school') return 1;

            if (sortBy === LaunchPadSortOptionsEnum.alphabetical) {
                return nameA.localeCompare(nameB);
            }

            return 0; // default: no sort for other modes
        });

        return withDemoFirst;
    }, [filteredAppsAndContracts, sortBy]);

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

    // Set of featured carousel and curated app IDs (to avoid duplicates in regular browse)
    const featuredAndCuratedIds = useMemo(() => {
        const ids = new Set<string>();
        (featuredCarouselApps ?? []).forEach(app => ids.add(app.listing_id));
        (curatedListApps ?? []).forEach(app => ids.add(app.listing_id));
        return ids;
    }, [featuredCarouselApps, curatedListApps]);

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

    // Filtered curated apps (for Featured Apps section)
    const filteredCuratedApps = useMemo(() => {
        const lowerSearch = searchInput?.toLowerCase() || '';

        return curatedAppsNotInstalled.filter(app => {
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
    }, [curatedAppsNotInstalled, searchInput, appStoreCategory]);

    // Non-promoted available apps (for Discover More section)
    const nonPromotedAvailableApps = useMemo(() => {
        return filteredAvailableApps.filter(app => !featuredAndCuratedIds.has(app.listing_id));
    }, [filteredAvailableApps, featuredAndCuratedIds]);

    // Filter legacy apps (non-coming-soon) for display
    const filteredLegacyApps = useMemo(() => {
        const lowerSearch = searchInput?.toLowerCase() || '';

        return legacyAppsAndContracts.filter(item => {
            const contractName = item?.data?.name?.toLowerCase() || '';
            const appName = item?.name?.toLowerCase() || '';

            // Tab filtering
            if (
                tab === LaunchPadTabEnum.ai &&
                !item?.launchPadTab?.includes(LaunchPadTabEnum.ai) &&
                !item?.appType?.includes(LaunchPadAppType.AI)
            ) {
                return false;
            }

            if (
                tab === LaunchPadTabEnum.learning &&
                !item?.launchPadTab?.includes(LaunchPadTabEnum.learning) &&
                !item?.appType?.includes(LaunchPadAppType.LEARNING)
            ) {
                return false;
            }

            if (
                tab === LaunchPadTabEnum.games &&
                !item?.launchPadTab?.includes(LaunchPadTabEnum.games) &&
                !item?.appType?.includes(LaunchPadAppType.GAME)
            ) {
                return false;
            }

            if (
                tab === LaunchPadTabEnum.tools &&
                !item?.launchPadTab?.includes(LaunchPadTabEnum.tools) &&
                !item?.appType?.includes(LaunchPadAppType.INTEGRATION)
            ) {
                return false;
            }

            if (item?.displayInLaunchPad === false) return false;

            return contractName?.includes(lowerSearch) || appName?.includes(lowerSearch);
        });
    }, [legacyAppsAndContracts, searchInput, tab]);

    // Filter coming soon apps for display
    const filteredComingSoonApps = useMemo(() => {
        const lowerSearch = searchInput?.toLowerCase() || '';

        return comingSoonApps.filter(item => {
            const appName = item?.name?.toLowerCase() || '';

            // Tab filtering
            if (
                tab === LaunchPadTabEnum.ai &&
                !item?.launchPadTab?.includes(LaunchPadTabEnum.ai) &&
                !item?.appType?.includes(LaunchPadAppType.AI)
            ) {
                return false;
            }

            if (
                tab === LaunchPadTabEnum.learning &&
                !item?.launchPadTab?.includes(LaunchPadTabEnum.learning) &&
                !item?.appType?.includes(LaunchPadAppType.LEARNING)
            ) {
                return false;
            }

            if (
                tab === LaunchPadTabEnum.games &&
                !item?.launchPadTab?.includes(LaunchPadTabEnum.games) &&
                !item?.appType?.includes(LaunchPadAppType.GAME)
            ) {
                return false;
            }

            if (
                tab === LaunchPadTabEnum.tools &&
                !item?.launchPadTab?.includes(LaunchPadTabEnum.tools) &&
                !item?.appType?.includes(LaunchPadAppType.INTEGRATION)
            ) {
                return false;
            }

            return appName?.includes(lowerSearch);
        });
    }, [comingSoonApps, searchInput, tab]);

    // Create custom app from query params if provided
    const customAppFromQueryParams: LaunchPadAppListItemType | null = useMemo(() => {
        if (embedUrlParam) {
            return {
                id: 'preview',
                name: appNameParam || 'Partner App',
                description: 'Custom embedded application',
                img: appImageParam || 'https://cdn.filestackcontent.com/Ja9TRvGVRsuncjqpxedb',
                embedUrl: embedUrlParam,
                launchPadTab: [LaunchPadTabEnum.all],
                appType: [LaunchPadAppType.INTEGRATION],
            };
        }
        return null;
    }, [embedUrlParam, appNameParam, appImageParam]);

    return (
        <IonPage className="bg-white">
            <MainHeader customClassName="bg-white" />
            <GenericErrorBoundary>
                <IonContent fullscreen scrollY={true} color="grayscale-100">
                    <div className="flex flex-col items-center w-full">
                        <LaunchPadHeader>
                            <div className="flex flex-col gap-3 w-full max-w-[600px] px-3">
                                {/* Section Header */}
                                <h2 className="text-grayscale-900 font-bold text-xl relative z-10 mt-[-30px] sm:mt-[-50px]">
                                    App Store
                                </h2>

                                {/* Featured Carousel - shows apps with FEATURED_CAROUSEL promotion level */}
                                {featuredCarouselApps && featuredCarouselApps.length > 0 && (
                                    <FeaturedCarousel
                                        apps={featuredCarouselApps}
                                        installedAppIds={installedListingIds}
                                        onInstallSuccess={refetchInstalledApps}
                                        hideScrollDots={true}
                                    />
                                )}
                                <LaunchPadAppTabs tab={tab} setTab={setTab} />
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
                            {searchInput.length > 0 ? (
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

                                        {/* Installed App Store Apps (shown first) */}
                                        {filteredInstalledApps.length > 0 && (
                                            <>
                                                <div className="px-2 pt-4 pb-2">
                                                    <p className="text-sm font-semibold text-grayscale-600 uppercase tracking-wide">
                                                        Your Apps
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

                                        {/* Legacy Apps and Contracts */}
                                        {sortedAppsAndContracts?.map((item, index) => {
                                            if (item?.data) {
                                                const data = item?.data;
                                                const isPending = item?.pending;

                                                return (
                                                    <LaunchPadContractListItem
                                                        key={`contract-${index}`}
                                                        contract={data}
                                                        isPending={isPending}
                                                        filterBy={filterBy}
                                                    />
                                                );
                                            }

                                            const app = item as LaunchPadAppListItemType;

                                            return (
                                                <LaunchPadAppListItem
                                                    key={`app-${index}`}
                                                    app={app}
                                                    filterBy={filterBy}
                                                />
                                            );
                                        })}

                                        {/* Available App Store Apps (discovery) */}
                                        {filteredAvailableApps.length > 0 && (
                                            <>
                                                <div className="px-2 pt-6 pb-2">
                                                    <p className="text-sm font-semibold text-grayscale-600 uppercase tracking-wide">
                                                        Discover More Apps
                                                    </p>
                                                </div>
                                                {filteredAvailableApps.map(app => (
                                                    <AppStoreListItem
                                                        key={`available-${app.listing_id}`}
                                                        listing={app}
                                                        isInstalled={false}
                                                        onInstallSuccess={refetchInstalledApps}
                                                    />
                                                ))}
                                            </>
                                        )}
                                    </IonList>

                                    {filteredAppsAndContracts.length === 0 &&
                                        filteredInstalledApps.length === 0 &&
                                        filteredAvailableApps.length === 0 &&
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
                                    {/* Installed App Store Apps (shown at top) */}
                                    {filteredInstalledApps.length > 0 && (
                                        <>
                                            <div className="px-2 pt-4 pb-2">
                                                <p className="text-sm font-semibold text-grayscale-600 uppercase tracking-wide">
                                                    Your Installed Apps
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

                                    {/* Featured Apps (Curated List apps) */}
                                    {filteredCuratedApps.length > 0 && (
                                        <>
                                            <div className="px-2 pt-4 pb-2">
                                                <p className="text-sm font-semibold text-grayscale-600 uppercase tracking-wide">
                                                    Featured Apps
                                                </p>
                                            </div>
                                            {filteredCuratedApps.map(app => (
                                                <AppStoreListItem
                                                    key={`curated-${app.listing_id}`}
                                                    listing={app}
                                                    isInstalled={false}
                                                    onInstallSuccess={refetchInstalledApps}
                                                />
                                            ))}
                                        </>
                                    )}

                                    {/* Discover More (Standard apps - only show when searching) */}
                                    {searchInput.length > 0 &&
                                        nonPromotedAvailableApps.length > 0 && (
                                            <>
                                                <div className="px-2 pt-4 pb-2">
                                                    <p className="text-sm font-semibold text-grayscale-600 uppercase tracking-wide">
                                                        Search Results
                                                    </p>
                                                </div>
                                                {nonPromotedAvailableApps.map(app => (
                                                    <AppStoreListItem
                                                        key={`available-${app.listing_id}`}
                                                        listing={app}
                                                        isInstalled={false}
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

                                    {/* Legacy Apps and Contracts (non-coming-soon) */}
                                    {filteredLegacyApps.length > 0 && (
                                        <>
                                            <div className="px-2 pt-4 pb-2">
                                                <p className="text-sm font-semibold text-grayscale-600 uppercase tracking-wide">
                                                    {filteredInstalledApps.length > 0 ||
                                                    filteredAvailableApps.length > 0
                                                        ? 'More Apps'
                                                        : 'Apps'}
                                                </p>
                                            </div>
                                            {filteredLegacyApps.map((item, index) => {
                                                if (
                                                    item?.data &&
                                                    (tab === LaunchPadTabEnum.all ||
                                                        tab === LaunchPadTabEnum.tools ||
                                                        tab === LaunchPadTabEnum.games)
                                                ) {
                                                    const data = item?.data;
                                                    const isPending = item?.pending;

                                                    if (
                                                        tab === LaunchPadTabEnum.games &&
                                                        !data.needsGuardianConsent
                                                    )
                                                        return undefined;

                                                    if (
                                                        tab === LaunchPadTabEnum.tools &&
                                                        data.needsGuardianConsent
                                                    )
                                                        return undefined;

                                                    return (
                                                        <LaunchPadContractListItem
                                                            key={`contract-${index}`}
                                                            contract={data}
                                                            isPending={isPending}
                                                            filterBy={filterBy}
                                                        />
                                                    );
                                                }

                                                const app = item as LaunchPadAppListItemType;

                                                return (
                                                    <LaunchPadAppListItem
                                                        key={`app-${index}`}
                                                        app={app}
                                                        filterBy={filterBy}
                                                    />
                                                );
                                            })}
                                        </>
                                    )}

                                    {/* Coming Soon Apps (shown last) */}
                                    {filteredComingSoonApps.length > 0 && (
                                        <>
                                            <div className="px-2 pt-4 pb-2">
                                                <p className="text-sm font-semibold text-grayscale-600 uppercase tracking-wide">
                                                    Coming Soon
                                                </p>
                                            </div>
                                            {filteredComingSoonApps.map((app, index) => (
                                                <LaunchPadAppListItem
                                                    key={`coming-soon-${index}`}
                                                    app={app as LaunchPadAppListItemType}
                                                    filterBy={filterBy}
                                                />
                                            ))}
                                        </>
                                    )}

                                    {filterBy === LaunchPadFilterOptionsEnum.allApps &&
                                        tab === LaunchPadTabEnum.all && <LaunchPadBecomeAnApp />}
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

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
import {
    comingSoonAiApps,
    comingSoonGameApps,
    comingSoonIntegrations,
} from './launchpad-comingSoon';

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

    // Auto-open action modal on first LaunchPad load after login for LCN users
    useEffect(() => {
        if (isNetworkUserLoading) return;
        if (!isNetworkUser) return;

        const SHOWN_KEY = 'lp_action_shown_after_login';
        if (sessionStorage.getItem(SHOWN_KEY)) return;

        // Defer to end of frame to reduce jank with initial render
        const id = window.requestAnimationFrame(() => {
            newModal(<LaunchPadActionModal />, {
                className:
                    'w-full flex items-center justify-center bg-white/70 backdrop-blur-[5px]',
                sectionClassName: '!max-w-[380px] disable-scrollbars',
            });
            sessionStorage.setItem(SHOWN_KEY, '1');
        });

        return () => cancelAnimationFrame(id);
    }, [isNetworkUser, isNetworkUserLoading]);

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

    let aiApps = flags?.enableLaunchPadUpdates ? aiPassportApps : [];
    let apps = useLaunchPadApps();
    let contracts = useLaunchPadContracts();

    aiApps = aiApps.map(app => ({ ...app, launchPadTab: [LaunchPadTabEnum.aiLearning] }));
    apps = apps.map(app => ({ ...app, launchPadTab: [LaunchPadTabEnum.integrations] }));
    contracts = contracts.map(contract => ({
        ...contract,
        launchPadTab: contract.data?.needsGuardianConsent
            ? [LaunchPadTabEnum.games]
            : [LaunchPadTabEnum.integrations],
    }));

    const aiAppContracts = aiApps.map(app => app.contractUri);
    const appsAndContracts = useMemo(() => {
        return [
            ...aiApps,
            ...apps,
            ...contracts?.filter(contract => !aiAppContracts.includes(contract?.data?.uri)),

            // comming soon apps
            ...comingSoonAiApps,
            ...comingSoonGameApps,
            ...comingSoonIntegrations,
        ];
    }, [apps, contracts]);

    const filteredAppsAndContracts = useMemo(() => {
        const lowerSearch = searchInput?.toLowerCase() || '';

        return appsAndContracts.filter(item => {
            const contractName = item?.data?.name?.toLowerCase() || '';
            const appName = item?.name?.toLowerCase() || '';

            if (
                tab === LaunchPadTabEnum.aiLearning &&
                !item?.launchPadTab?.includes(LaunchPadTabEnum.aiLearning) &&
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
                tab === LaunchPadTabEnum.integrations &&
                !item?.launchPadTab?.includes(LaunchPadTabEnum.integrations) &&
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
                            <div className="flex flex-col just gap-[10px] w-full max-w-[600px] px-3">
                                <LaunchPadAppTabs tab={tab} setTab={setTab} />
                                <LaunchPadSearch
                                    searchInput={searchInput}
                                    setSearchInput={setSearchInput}
                                    filterBy={filterBy}
                                    setFilterBy={setFilterBy}
                                    sortBy={sortBy}
                                    setSortBy={setSortBy}
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
                                    </IonList>
                                    {filteredAppsAndContracts.length === 0 &&
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
                                    <IonList
                                        lines="none"
                                        className="w-full max-w-[600px] bg-grayscale-100"
                                    >
                                        {contractDetails &&
                                            !hasConsented &&
                                            tab === LaunchPadTabEnum.all && (
                                                <LaunchPadContractListItem
                                                    contract={contractDetails}
                                                />
                                            )}
                                        {customAppFromQueryParams && (
                                            <LaunchPadAppListItem
                                                key="custom-app-preview"
                                                app={customAppFromQueryParams}
                                                filterBy={filterBy}
                                            />
                                        )}
                                        {sortedAppsAndContracts?.map((item, index) => {
                                            if (
                                                item?.data &&
                                                (tab === LaunchPadTabEnum.all ||
                                                    tab === LaunchPadTabEnum.integrations ||
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
                                                    tab === LaunchPadTabEnum.integrations &&
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
                                    </IonList>
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

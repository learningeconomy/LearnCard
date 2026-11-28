import React, { useState, useEffect } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { Capacitor } from '@capacitor/core';
import * as Sentry from '@sentry/browser';
import NewBoostSelectMenu from '../boost/boost-select-menu/NewBoostSelectMenu';
import ScoutPassLogoAndText from 'learn-card-base/svgs/ScoutLogoAndText';
import BoostOutline2 from 'learn-card-base/svgs/BoostOutline2';
import SideMenuSecondaryLinks from './SideMenuSecondaryLinks';
import SideMenuRootLinks from './SideMenuRootLinks';

import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';
import * as m from '../../paraglide/messages.js';
import { sideMenuScoutPassStyles } from 'learn-card-base/components/sidemenu/sidemenuHelpers';
import firstStartupStore from 'learn-card-base/stores/firstStartupStore';
import { BoostCategoryOptionsEnum } from 'learn-card-base';
import { useIsLoggedIn } from 'learn-card-base/stores/currentUserStore';
import { ModalTypes, useIsCurrentUserLCNUser, useModal, useScreenWidth } from 'learn-card-base';
import useJoinLCNetworkModal from '../network-prompts/hooks/useJoinLCNetworkModal';
import useFirebaseAnalytics from '../../hooks/useFirebaseAnalytics';
import { getLogger } from 'learn-card-base';
import { AppMenu } from 'learn-card-base/ui/app-shell/AppMenu';
import {
    AppContent,
    AppFooter,
    AppHeader,
    AppMenuToggle,
    AppToolbar,
} from 'learn-card-base/ui/chrome';
const log = getLogger('side-menu');

const SideMenu: React.FC<{ branding: BrandingEnum }> = ({ branding = BrandingEnum.scoutPass }) => {
    const { newModal, closeModal } = useModal({
        mobile: ModalTypes.FullScreen,
        desktop: ModalTypes.FullScreen,
    });
    const history = useHistory();
    const location = useLocation();
    const isLoggedIn = useIsLoggedIn();
    const { setCurrentScreen } = useFirebaseAnalytics();

    const {
        data: currentLCNUser,
        isLoading: currentLCNUserLoading,
        refetch,
    } = useIsCurrentUserLCNUser();
    const { handlePresentJoinNetworkModal } = useJoinLCNetworkModal();

    const [activeTab, setActiveTab] = useState<string>(location.pathname);

    const storeVersion = firstStartupStore.useTracked.version();
    const version = storeVersion?.trim?.() !== '' ? storeVersion : __PACKAGE_VERSION__;

    useEffect(() => {
        // get & set the current capGo bundle version
        const getVersion = async () => {
            if (Capacitor.isNativePlatform()) {
                // Only try to get bundle version on native platforms
                try {
                    const currentBundle = (await CapacitorUpdater.current()).bundle;
                    if (
                        currentBundle.version !== 'builtin' &&
                        currentBundle.version?.trim?.() !== ''
                    ) {
                        firstStartupStore.set.version(`${currentBundle.version}`);
                        Sentry.setTag('packageVersion', currentBundle.version);
                    }
                } catch (error) {
                    log.error('Error getting bundle version:', error);
                    // Fallback to package version
                    firstStartupStore.set.version(__PACKAGE_VERSION__ || '');
                    Sentry.setTag('packageVersion', __PACKAGE_VERSION__ || '');
                }
            } else {
                // On web, just use the package version
                firstStartupStore.set.version(__PACKAGE_VERSION__ || '');
                Sentry.setTag('packageVersion', __PACKAGE_VERSION__ || '');
            }
        };

        getVersion();
    }, []);

    useEffect(() => {
        setActiveTab(location.pathname);
        setCurrentScreen(location.pathname);
    }, [location.pathname]);

    if (!isLoggedIn) return <AppMenu contentId="main" />;

    const handleBoost = async () => {
        const isCurrentLCNUser =
            currentLCNUserLoading || typeof currentLCNUser === 'undefined'
                ? (await refetch()).data
                : currentLCNUser;

        if (!isCurrentLCNUser) {
            void handlePresentJoinNetworkModal({ forceOpen: true });
            return;
        }

        // if (location.pathname.includes('/boost')) return;

        newModal(
            <NewBoostSelectMenu
                category={BoostCategoryOptionsEnum.socialBadge}
                showHardcodedBoostPacks
                handleCloseModal={() => closeModal()}
            />,

            {
                className: 'p-0!',
                sectionClassName: 'p-0!',
            }
        );
    };

    const sideMenuBrandingStyles = sideMenuScoutPassStyles;

    return (
        <AppMenu contentId="main" swipeGesture menuId="appSideMenu">
            <AppContent className="scout-pass-side-menu-content">
                <AppHeader className="learn-card-header ion-no-border ion-no-padding">
                    <AppToolbar
                        className="ion-no-border ion-no-padding"
                        color={`${sideMenuBrandingStyles.mainBg}`}
                    >
                        <div className="mt-4 flex w-full flex-col items-center justify-center">
                            <button
                                onClick={() => history.push('/campfire')}
                                className="w-full flex items-center justify-center"
                            >
                                <div className="max-w-[90%] flex items-center justify-center ml-[25px]">
                                    <ScoutPassLogoAndText className="text-sp-purple-base w-[85%] max-w-[250px] min-w-[120px] mt-[20px] ml-[-25px]" />
                                </div>
                            </button>
                            <button className="flex flex-col justify-center items-center w-full gap-[10px] mt-4 mb-2">
                                <AppMenuToggle
                                    role="button"
                                    autoHide={false}
                                    onClick={handleBoost}
                                    className={`learn-card-boost-button bg-sp-blue-ocean py-[2px] rounded-full w-full max-w-[90%]`}
                                >
                                    {m['launchPad.boost']()}{' '}
                                    <BoostOutline2
                                        className="ml-[5px]"
                                        outsideStar="#FFFFFF"
                                        insideStar="#03748D"
                                        outlineStar="#FFFFFF"
                                        inlineStar="#03748D"
                                    />
                                </AppMenuToggle>
                            </button>
                        </div>

                        <SideMenuRootLinks
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            branding={BrandingEnum.scoutPass}
                        />
                    </AppToolbar>
                </AppHeader>
                <SideMenuSecondaryLinks
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    branding={BrandingEnum.scoutPass}
                />
            </AppContent>
            <AppFooter className="ion-no-border ion-no-padding">
                <AppToolbar
                    color="grayscale-100"
                    className="ion-no-border ion-no-padding px-4"
                    style={{ '--border-width': '0', '--border-color': 'transparent' }}
                >
                    <p className="text-grayscale-900 opacity-50 text-xs">
                        {m['sidemenu.version']({ version })}
                    </p>
                </AppToolbar>
            </AppFooter>
        </AppMenu>
    );
};

export default SideMenu;

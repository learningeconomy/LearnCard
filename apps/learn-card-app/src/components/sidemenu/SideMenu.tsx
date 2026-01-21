import React, { useState, useEffect } from 'react';
import * as Sentry from '@sentry/browser';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

import { useFlags } from 'launchdarkly-react-client-sdk';
import { useLocation, useHistory } from 'react-router-dom';
import { useIsLoggedIn } from 'learn-card-base/stores/currentUserStore';
import { useModal, ModalTypes } from 'learn-card-base';
import { useDeviceTypeByWidth } from 'learn-card-base/hooks/useDeviceTypeByWidth';
import useAiSession from '../../hooks/useAiSession';
import { useAnalytics } from '@analytics';

import SideMenuFooter from './SideMenuFooter';
import SideMenuRootLinks from './SideMenuRootLinks';
import BurgerIcon from '../../components/svgs/Burger';
import LearnCardTextLogo from '../svgs/LearnCardTextLogo';
import SideMenuSecondaryLinks from './SideMenuSecondaryLinks';
import { IonMenu, IonContent, IonMenuToggle } from '@ionic/react';
import GearPlusIcon from 'learn-card-base/svgs/GearPlusIcon';
import ThemeSelector from '../../theme/components/ThemeSelector';
import AddToLearnCardMenu from '../add-to-learncard-menu/AddToLearnCardMenu';
import NewAiSessionButton, {
    NewAiSessionButtonEnum,
} from '../new-ai-session/NewAiSessionButton/NewAiSessionButton';
import GenericErrorBoundary from '../generic/GenericErrorBoundary';

import firstStartupStore from 'learn-card-base/stores/firstStartupStore';
import sideMenuStore from 'learn-card-base/stores/sideMenuStore';

import {
    sideMenuLearnCardBrandingStyles,
    sideMenuMetaversityBrandingStyles,
} from 'learn-card-base/components/sidemenu/sidemenuHelpers';
import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';
import { aiRoutes } from '../../AppRouter';

import useTheme from '../../theme/hooks/useTheme';
import { ColorSetEnum } from '../../theme/colors';
import useLCNGatedAction from '../network-prompts/hooks/useLCNGatedAction';

const SideMenu: React.FC<{ branding: BrandingEnum.learncard }> = ({
    branding = BrandingEnum.learncard,
}) => {
    const { getColorSet } = useTheme();
    const colors = getColorSet(ColorSetEnum.sideMenu);
    const { isMobile } = useDeviceTypeByWidth();
    const flags = useFlags();
    const history = useHistory();
    const location = useLocation();
    const isLoggedIn = useIsLoggedIn();
    const { page: setCurrentScreen } = useAnalytics();
    const { gate } = useLCNGatedAction();
    const { openNewAiSessionModal } = useAiSession();

    const [activeTab, setActiveTab] = useState<string>(location.pathname);

    const storeVersion = firstStartupStore.useTracked.version();
    const version = storeVersion?.trim?.() !== '' ? storeVersion : __PACKAGE_VERSION__;

    useEffect(() => {
        // get & set the current capGo bundle version
        const getVersion = async () => {
            const currentBundle = (await CapacitorUpdater.current()).bundle;

            if (currentBundle.version !== 'builtin' && currentBundle?.version?.trim?.() !== '') {
                firstStartupStore.set.version(`${currentBundle.version}`);
                Sentry.setTag('packageVersion', currentBundle.version);
            }
        };

        getVersion();
    }, []);

    useEffect(() => {
        setActiveTab(location.pathname);
        setCurrentScreen(location.pathname);
    }, [location.pathname]);

    useEffect(() => {
        if (!aiRoutes.includes(location.pathname)) {
            sideMenuStore.set.isCollapsed(false);
        }
    }, [location.pathname]);

    const { newModal } = useModal({ desktop: ModalTypes.Cancel });

    if (!isLoggedIn) return <IonMenu contentId="main" />;

    const handleBoost = async () => {
        if (location.pathname.includes('/boost')) return;

        const { prompted } = await gate();
        if (prompted) return;

        newModal(
            <AddToLearnCardMenu />,
            {
                sectionClassName: '!max-w-[500px]',
            },
            {
                desktop: ModalTypes.Cancel,
                mobile: ModalTypes.Cancel,
            }
        );
    };

    const sideMenuBrandingStyles =
        branding === BrandingEnum.learncard
            ? sideMenuLearnCardBrandingStyles
            : sideMenuMetaversityBrandingStyles;

    return (
        <IonMenu contentId="main" swipeGesture menuId="appSideMenu" disabled={false}>
            <IonContent color={`${sideMenuBrandingStyles.mainBg}`} className="flex flex-col">
                <GenericErrorBoundary>
                    <div className="flex-shrink-0">
                        <div className="flex w-full flex-col items-center justify-center">
                            <button className="side-menu-logo w-full flex items-center justify-start mt-8 mb-6 px-6 cursor-pointer">
                                <IonMenuToggle autoHide={false}>
                                    <div className="max-w-[90%] flex items-center justify-center">
                                        {isMobile && (
                                            <BurgerIcon className="text-grayscale-800 h-[25px] w-[25px] mr-4" />
                                        )}

                                        <LearnCardTextLogo className="text-grayscale-900 w-[85%] max-w-[150px]" />
                                    </div>
                                </IonMenuToggle>
                            </button>

                            <div className="flex flex-col justify-center items-center w-full gap-[10px] mt-4 mb-2">
                                {flags?.enableLaunchPadUpdates && (
                                    <NewAiSessionButton type={NewAiSessionButtonEnum.sideMenu} />
                                )}

                                <IonMenuToggle
                                    role="button"
                                    autoHide={false}
                                    onClick={handleBoost}
                                    className={`text-[17px] flex items-center justify-center font-semibold py-[5px] rounded-full w-full max-w-[90%] border-solid border-[2px] h-[45px] max-h-[45px] shadow-soft-bottom ${colors.secondaryButtonColor}`}
                                >
                                    Add to LearnCard
                                    <GearPlusIcon className="ml-1 text-grayscale-800" />
                                </IonMenuToggle>
                            </div>
                        </div>
                    </div>

                    <div className="flex-grow overflow-y-auto">
                        <GenericErrorBoundary>
                            <SideMenuRootLinks
                                branding={BrandingEnum.learncard}
                                activeTab={activeTab}
                                setActiveTab={setActiveTab}
                            />
                        </GenericErrorBoundary>
                        <GenericErrorBoundary>
                            <SideMenuSecondaryLinks
                                branding={BrandingEnum.learncard}
                                activeTab={activeTab}
                                setActiveTab={setActiveTab}
                            />
                        </GenericErrorBoundary>

                        <ThemeSelector />

                        <GenericErrorBoundary>
                            <SideMenuFooter version={version} />
                        </GenericErrorBoundary>
                    </div>
                </GenericErrorBoundary>
            </IonContent>
        </IonMenu>
    );
};

export default SideMenu;

import React, { useState, useEffect } from 'react';
import * as Sentry from '@sentry/browser';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { Capacitor } from '@capacitor/core';

import { useFlags } from 'launchdarkly-react-client-sdk';
import { useLocation, useHistory } from 'react-router-dom';
import { useIsLoggedIn } from 'learn-card-base/stores/currentUserStore';
import { useModal, ModalTypes } from 'learn-card-base';
import { useDeviceTypeByWidth } from 'learn-card-base/hooks/useDeviceTypeByWidth';
import useAiSession from '../../hooks/useAiSession';
import { useAnalytics } from '@analytics';

import SideMenuFooter from './SideMenuFooter';
import SideMenuRootLinks from './SideMenuRootLinks';
import LeftArrow from 'learn-card-base/svgs/LeftArrow';
import LearnCardTextLogo from '../svgs/LearnCardTextLogo';
import { useTenantBrandingAssets } from '../../config/brandingAssets';
import SideMenuSecondaryLinks from './SideMenuSecondaryLinks';
import { IonMenu, IonContent, IonMenuToggle } from '@ionic/react';
import GearPlusIcon from 'learn-card-base/svgs/GearPlusIcon';
import Settings from '../svgs/Settings';
import ThemeSelector, { themeSelectorViewMode } from '../../theme/components/ThemeSelector';
import CheckListButton from '../learncard/checklist/CheckListButton';
import useOpenMyLearnCard from '../learncard/useOpenMyLearnCard';
import AddToLearnCardMenu from '../add-to-learncard-menu/AddToLearnCardMenu';
import LaunchPadActionModal from '../../pages/launchPad/LaunchPadHeader/LaunchPadActionModal';
import NewAiSessionButton, {
    NewAiSessionButtonEnum,
} from '../new-ai-session/NewAiSessionButton/NewAiSessionButton';
import GenericErrorBoundary from '../generic/GenericErrorBoundary';

import firstStartupStore from 'learn-card-base/stores/firstStartupStore';
import sideMenuStore from 'learn-card-base/stores/sideMenuStore';

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
    const resolvedAssets = useTenantBrandingAssets();
    const { isMobile } = useDeviceTypeByWidth();
    const flags = useFlags();
    const history = useHistory();
    const location = useLocation();
    const isLoggedIn = useIsLoggedIn();
    const { page: setCurrentScreen } = useAnalytics();
    const { gate } = useLCNGatedAction();
    const { openNewAiSessionModal } = useAiSession();
    const openMyLearnCard = useOpenMyLearnCard();

    const [activeTab, setActiveTab] = useState<string>(location.pathname);

    const storeVersion = firstStartupStore.useTracked.version();
    const version = storeVersion?.trim?.() !== '' ? storeVersion : __PACKAGE_VERSION__;

    useEffect(() => {
        // get & set the current capGo bundle version
        const getVersion = async () => {
            if (!Capacitor.isNativePlatform()) {
                return;
            }

            try {
                const currentBundle = (await CapacitorUpdater.current()).bundle;

                if (
                    currentBundle.version !== 'builtin' &&
                    currentBundle?.version?.trim?.() !== ''
                ) {
                    firstStartupStore.set.version(`${currentBundle.version}`);
                    Sentry.setTag('packageVersion', currentBundle.version);
                }
            } catch {
                return;
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

        if (isMobile) {
            // Mobile: existing "Add to LearnCard" menu in a Cancel modal.
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
            return;
        }

        // Desktop: open the launchpad action modal instead — same Freeform modal
        // configuration used by the launchpad greeting card's quick-action button.
        newModal(
            <LaunchPadActionModal />,
            {
                className:
                    'w-full flex items-center justify-center bg-white/70 backdrop-blur-[5px]',
                sectionClassName: '!max-w-[500px] disable-scrollbars',
            },
            {
                desktop: ModalTypes.Freeform,
                mobile: ModalTypes.Freeform,
            }
        );
    };

    return (
        <IonMenu contentId="main" swipeGesture menuId="appSideMenu" disabled={false}>
            <IonContent
                style={{ ['--background' as any]: '#ffffff' }}
                className="lc-side-menu-content"
            >
                <GenericErrorBoundary>
                    <div className="flex min-h-full flex-col">
                        <div className="flex-shrink-0">
                            <div className="flex w-full flex-col items-center justify-center">
                                <div className="side-menu-logo w-full flex items-center justify-between mt-8 mb-4 px-6">
                                    <IonMenuToggle autoHide={false} className="cursor-pointer">
                                        <div className="max-w-[90%] flex items-center justify-center">
                                            {resolvedAssets.textLogoDark ? (
                                                <img
                                                    src={resolvedAssets.textLogoDark}
                                                    alt="Logo"
                                                    className="w-[180px] max-w-full object-contain"
                                                />
                                            ) : (
                                                <LearnCardTextLogo
                                                    className={`${
                                                        colors.logoColor ?? 'text-grayscale-900'
                                                    } w-[180px] max-w-full`}
                                                />
                                            )}
                                        </div>
                                    </IonMenuToggle>

                                    {/* Mobile-only close affordance (LC-1921): tap or swipe to
                                        dismiss the drawer. Hidden on desktop where the menu is
                                        a persistent split-pane. */}
                                    {isMobile && (
                                        <IonMenuToggle
                                            autoHide={false}
                                            aria-label="Close menu"
                                            className="cursor-pointer flex items-center justify-center p-2 -mr-2"
                                        >
                                            <LeftArrow
                                                className="text-grayscale-400 h-[22px] w-auto"
                                                opacity="1"
                                            />
                                        </IonMenuToggle>
                                    )}
                                </div>

                                {/* Light divider under the logo (LC-1921 Figma). */}
                                <div className="self-stretch mx-6 border-t border-solid border-grayscale-200" />

                                <div className="flex flex-col justify-center items-center w-full gap-[10px] mt-4 mb-2">
                                    {/* Disable New AI Session Button for now on Side Menu
                                    {flags?.enableLaunchPadUpdates && (
                                        <NewAiSessionButton type={NewAiSessionButtonEnum.sideMenu} />
                                    )} */}

                                    <IonMenuToggle
                                        role="button"
                                        autoHide={false}
                                        onClick={handleBoost}
                                        className={`text-[17px] flex items-center justify-center gap-[10px] font-semibold py-[5px] rounded-full w-full max-w-[90%] h-[45px] max-h-[45px] shadow-soft-bottom ${colors.secondaryButtonColor}`}
                                    >
                                        Issue Credentials
                                        <GearPlusIcon className="w-[30px] h-[30px] text-grayscale-800" />
                                    </IonMenuToggle>
                                </div>
                            </div>
                        </div>

                        <GenericErrorBoundary>
                            <SideMenuRootLinks
                                branding={branding}
                                activeTab={activeTab}
                                setActiveTab={setActiveTab}
                            />
                        </GenericErrorBoundary>
                        <GenericErrorBoundary>
                            <SideMenuSecondaryLinks
                                activeTab={activeTab}
                                setActiveTab={setActiveTab}
                            />
                        </GenericErrorBoundary>

                        {/* Bottom system section (LC-1921): Settings, theme toggle,
                            Build My LearnCard, then footer — pinned to the bottom via
                            mt-auto inside the min-h-full column. */}
                        <div className="mt-auto flex flex-col gap-[5px] pt-2 pb-4">
                            <div className="mx-4 mb-1 border-t border-solid border-grayscale-200" />

                            <IonMenuToggle autoHide={false} className="w-full px-4">
                                <button
                                    type="button"
                                    onClick={openMyLearnCard}
                                    className="w-full flex items-center gap-[10px] px-[10px] py-[5px] rounded-[10px] text-grayscale-900 font-poppins text-[17px]"
                                >
                                    <Settings className="h-[35px] w-[35px] text-grayscale-400" />
                                    Settings
                                </button>
                            </IonMenuToggle>

                            <ThemeSelector viewMode={themeSelectorViewMode.Compact} />

                            <GenericErrorBoundary>
                                <CheckListButton mode="sidemenu" className="mx-4 my-1" />
                            </GenericErrorBoundary>

                            <GenericErrorBoundary>
                                <SideMenuFooter version={version} />
                            </GenericErrorBoundary>
                        </div>
                    </div>
                </GenericErrorBoundary>
            </IonContent>
        </IonMenu>
    );
};

export default SideMenu;

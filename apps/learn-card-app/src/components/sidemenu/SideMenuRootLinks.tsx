import React from 'react';
import numeral from 'numeral';
import PreloadingLink from '../generic/PreloadingLink';

import * as m from '../../paraglide/messages.js';

import { useFlags } from 'launchdarkly-react-client-sdk';
import {
    currentUserStore,
    useGetUnreadUserNotifications,
    walletStore,
    WalletSyncState,
} from 'learn-card-base';
import {
    SideMenuLinksEnum,
    getSideMenuLinkLabel,
} from 'learn-card-base/components/sidemenu/sidemenuHelpers';
import CustomSpinner from '../svgs/CustomSpinner';

import { IonMenuToggle, IonList } from '@ionic/react';
import AiPassportPersonalizationContainer from '../ai-passport/AiPassportPersonalizationContainer';

import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';
import { useModal, ModalTypes } from 'learn-card-base';
import { useDeviceTypeByWidth } from 'learn-card-base/hooks/useDeviceTypeByWidth';

import { useTheme } from '../../theme/hooks/useTheme';
import { IconSetEnum } from '../../theme/icons/index';
import { ColorSetEnum } from '../../theme/colors/index';
import { useDashboardAsHome } from '../../pages/dashboard/hooks/useDashboardAsHome';

type SideMenuRootLinksProps = {
    activeTab: string;
    setActiveTab: React.Dispatch<React.SetStateAction<string>>;
    branding: BrandingEnum;
};

const SideMenuRootLinks: React.FC<SideMenuRootLinksProps> = ({ activeTab, setActiveTab }) => {
    const { theme, getIconSet, getColorSet } = useTheme();
    const iconSet = getIconSet(IconSetEnum.sideMenu);
    const colors = getColorSet(ColorSetEnum.sideMenu);

    const isWalletSyncing = walletStore.useTracked.syncState();
    const isSyncing = isWalletSyncing.status === WalletSyncState.Syncing;
    const isCompleted = isWalletSyncing.status === WalletSyncState.Completed;

    let walletText = 'Passport';
    if (isSyncing || isCompleted) walletText = isWalletSyncing?.text ?? 'Passport';

    let walletTextStyles = '';
    if (isSyncing) walletTextStyles = `${colors.syncingColor}`;
    if (isCompleted) walletTextStyles = `${colors.completedColor}`;

    const flags = useFlags();
    const { isMobile } = useDeviceTypeByWidth();
    const parentLDFlags = currentUserStore.use.parentLDFlags();
    const hasAdminAccess = flags.enableAdminTools || parentLDFlags?.enableAdminTools;
    // Same two-layer gate as the `/` landing redirect in Routes.tsx, so the
    // Dashboard nav entry and the home route can never drift.
    const dashboardAsHome = useDashboardAsHome();

    const { newModal } = useModal();

    const handlePersonalizeMyAi = () => {
        newModal(
            <AiPassportPersonalizationContainer />,
            { className: '!bg-transparent' },
            { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
        );
    };

    const activeTextStyles = colors.linkActiveColor; // text colors
    const inactiveTextStyles = colors.linkInactiveColor;

    const activeIconStyles = colors.linkActiveColor; // icon colors
    const inactiveIconStyles = colors.linkInactiveColor;

    const activeLinkBackgroundStyles = colors.linkActiveBackgroundColor; // link background colors
    const inactiveLinkBackgroundStyles = colors.linkInactiveBackgroundColor;

    const shadeColor = '#E2E3E9'; // default shade color

    const isPathActive = (tab: string) => {
        const isAdminToolsActive = tab === '/admin-tools' && activeTab.startsWith(tab);

        if (tab === activeTab || isAdminToolsActive) return true;
        return false;
    };

    const getTextStyles = (path: string) => {
        if (isPathActive(path)) {
            return activeTextStyles;
        }
        return inactiveTextStyles;
    };

    const getIconStyles = (path: string) => {
        if (isPathActive(path)) {
            return activeIconStyles;
        }
        return inactiveIconStyles;
    };

    const getLinkBackgroundStyles = (path: string) => {
        if (isPathActive(path)) {
            return activeLinkBackgroundStyles;
        }
        return inactiveLinkBackgroundStyles;
    };

    const { data } = useGetUnreadUserNotifications();
    const notificationsUnreadCount = data?.notifications?.length ?? 0;

    const walletLink = theme?.sideMenuRootLinks;
    const unreadCount =
        Number(notificationsUnreadCount) >= 1000
            ? numeral(Number(notificationsUnreadCount)).format('0.0a')
            : notificationsUnreadCount;
    let rootLinks: any = null;

    rootLinks = walletLink?.map(link => {
        if (link.id === SideMenuLinksEnum.adminTools && !hasAdminAccess) return null;
        if (link.path === '/dashboard' && !dashboardAsHome) return null;
        // Alerts lives in the header island on desktop; only show it in the
        // side menu on mobile (LC-1921).
        if (link.path === '/notifications' && !isMobile) return null;

        const IconComponent = iconSet[link.id as keyof typeof iconSet];
        const linkPath = link.path;

        const iconStyles = getIconStyles(linkPath);
        const textStyles = getTextStyles(linkPath);
        const linkBackgroundStyles = getLinkBackgroundStyles(linkPath);

        let linkEl = (
            <PreloadingLink
                to={linkPath}
                className={`learn-card-side-menu-secondary-list-item-link ${linkBackgroundStyles} ${textStyles}`}
            >
                <IconComponent className={`${iconStyles}`} shadeColor={shadeColor} />
                {getSideMenuLinkLabel(m, link)}
            </PreloadingLink>
        );

        if (link.id === SideMenuLinksEnum.personalize) {
            linkEl = (
                <button
                    type="button"
                    onClick={() => handlePersonalizeMyAi()}
                    className={`cursor-pointer learn-card-side-menu-secondary-list-item-link ${linkBackgroundStyles} ${textStyles}`}
                >
                    <IconComponent className={`${iconStyles}`} shadeColor={shadeColor} />
                    {getSideMenuLinkLabel(m, link)}
                </button>
            );
        }

        if (linkPath === '/notifications') {
            linkEl = (
                <PreloadingLink
                    to={linkPath}
                    className={`learn-card-side-menu-secondary-list-item-link ${linkBackgroundStyles} ${textStyles}`}
                >
                    <div className={`flex relative mr-[10px] text-[14px] ${textStyles}`}>
                        <IconComponent
                            className={`h-[30px] w-[30px] ${iconStyles}`}
                            shadeColor={shadeColor}
                        />
                        {Number(unreadCount) >= 1 && (
                            <div
                                className={`absolute !right-[-5px] !top-[-8px] text-xs font-bold ${colors.indicatorColor}`}
                            >
                                {unreadCount}
                            </div>
                        )}
                    </div>

                    {getSideMenuLinkLabel(m, link)}
                </PreloadingLink>
            );
        }

        if (linkPath === '/passport') {
            linkEl = (
                <PreloadingLink
                    to={linkPath}
                    className={`learn-card-side-menu-secondary-list-item-link ${linkBackgroundStyles} ${textStyles} ${walletTextStyles}`}
                >
                    {(isSyncing || isCompleted) && (
                        <div className="flex items-center justify-center absolute top-[12px] z-50 h-[28px] w-[28px] rounded-[10px]">
                            {isSyncing && (
                                <CustomSpinner
                                    className={`${colors?.syncingColor} h-[18px] w-[18px]`}
                                />
                            )}
                        </div>
                    )}
                    <IconComponent
                        className={`${iconStyles}`}
                        shadeColor={shadeColor}
                        isCompleted={isCompleted}
                        isSyncing={isSyncing}
                    />
                    {walletText}
                </PreloadingLink>
            );
        }

        return (
            <IonMenuToggle key={link.id} autoHide={false} className="w-full">
                <div
                    onClick={() => setActiveTab(linkPath)}
                    className="flex items-center justify-center px-0 py-[3px]"
                >
                    {linkEl}
                </div>
            </IonMenuToggle>
        );
    });

    return <IonList className="m-4 rounded-2xl py-3">{rootLinks}</IonList>;
};

export default SideMenuRootLinks;

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
import useOpenNotifications from '../notifications/useOpenNotifications';

import { useTheme } from '../../theme/hooks/useTheme';
import { IconSetEnum } from '../../theme/icons/index';
import { ColorSetEnum } from '../../theme/colors/index';
import { useDashboardAsHome } from '../../pages/dashboard/hooks/useDashboardAsHome';

type SideMenuRootLinksProps = {
    activeTab: string;
    setActiveTab: React.Dispatch<React.SetStateAction<string>>;
    branding: BrandingEnum;
};

type SideMenuIconProps = {
    className?: string;
    shadeColor?: string;
    isCompleted?: boolean;
    isSyncing?: boolean;
};

const SideMenuRootLinks: React.FC<SideMenuRootLinksProps> = ({ activeTab, setActiveTab }) => {
    const { theme, getIconSet, getColorSet } = useTheme();
    const iconSet = getIconSet(IconSetEnum.sideMenu) as Record<string, React.FC<any>>;
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
    const openNotifications = useOpenNotifications();

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
        const isPassportActive =
            tab === '/passport' &&
            ['/passport', '/wallet', '/home'].some(
                prefix => activeTab === prefix || activeTab.startsWith(prefix + '/')
            );

        if (tab === activeTab || isAdminToolsActive || isPassportActive) return true;
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

        const IconComponent = iconSet[link.id as keyof typeof iconSet] as React.FC<any>;
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
            // Alerts uses the shared open handler (same as the header button):
            // right-side modal on web, and a route to the /notifications page on
            // native — see useOpenNotifications.
            linkEl = (
                <button
                    type="button"
                    onClick={() => openNotifications()}
                    className={`cursor-pointer learn-card-side-menu-secondary-list-item-link ${linkBackgroundStyles} ${textStyles}`}
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
                </button>
            );
        }

        if (linkPath === '/passport') {
            linkEl = (
                <PreloadingLink
                    to={linkPath}
                    className={`learn-card-side-menu-secondary-list-item-link ${linkBackgroundStyles} ${textStyles} ${walletTextStyles}`}
                >
                    <div className="relative mr-[10px] h-[35px] w-[35px] shrink-0">
                        {(isSyncing || isCompleted) && (
                            <div className="absolute inset-0 z-50 flex items-center justify-center rounded-[10px]">
                                {isSyncing && (
                                    <CustomSpinner
                                        className={`${colors?.syncingColor} h-[18px] w-[18px]`}
                                    />
                                )}
                            </div>
                        )}
                        <IconComponent
                            className={`${iconStyles} h-[35px] w-[35px]`}
                            shadeColor={shadeColor}
                            isCompleted={isCompleted}
                            isSyncing={isSyncing}
                        />
                    </div>
                    {walletText}
                </PreloadingLink>
            );
        }

        // Alerts opens a modal (web) or routes to /notifications (native); in
        // neither case should it be marked as the active tab here — on web the
        // visible page is unchanged, and on native the IonMenuToggle closes the
        // menu on tap anyway.
        const handleTabClick =
            linkPath === '/notifications' ? undefined : () => setActiveTab(linkPath);

        return (
            <IonMenuToggle key={link.id} autoHide={false} className="w-full">
                <div
                    onClick={handleTabClick}
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

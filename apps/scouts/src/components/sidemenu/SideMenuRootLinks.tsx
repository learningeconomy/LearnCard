import React from 'react';
import { Link } from 'react-router-dom';

import { IonMenu, IonList, IonItem, IonMenuToggle } from '@ionic/react';
import LearnCardIcon from 'learn-card-base/svgs/LearnCardIcon';

import {
    sideMenuRootLinks,
    sideMenuScoutPassStyles,
} from 'learn-card-base/components/sidemenu/sidemenuHelpers';

import { useFlags } from 'launchdarkly-react-client-sdk';
import currentUserStore, { useIsLoggedIn } from 'learn-card-base/stores/currentUserStore';
import { useGetUnreadUserNotifications } from 'learn-card-base';

import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';

type SideMenuRootLinksProps = {
    activeTab: string;
    setActiveTab: React.Dispatch<React.SetStateAction<string>>;
    branding: BrandingEnum;
};

const SideMenuRootLinks: React.FC<SideMenuRootLinksProps> = ({
    activeTab,
    setActiveTab,
    branding = BrandingEnum.scoutPass,
}) => {
    const flags = useFlags();
    const parentLDFlags = currentUserStore.use.parentLDFlags();
    const hasAdminAccess = flags.enableAdminTools || parentLDFlags?.enableAdminTools;

    const isLoggedIn = useIsLoggedIn();

    const { data } = useGetUnreadUserNotifications();

    if (!isLoggedIn) return <IonMenu contentId="main" />;

    let sideMenuBrandingStyles = sideMenuScoutPassStyles;

    const isPathActive = (tab: string) => {
        const isAdminToolsActive = tab === '/admin-tools' && activeTab.startsWith(tab);

        if (tab === activeTab || isAdminToolsActive)
            return sideMenuBrandingStyles?.activeLinkStyles;
        return '';
    };

    const walletLink = sideMenuRootLinks?.[branding];
    const unreadCount = data?.notifications?.length;

    let rootLinks = null;

    if (Array.isArray(walletLink)) {
        rootLinks = walletLink?.map(link => {
            if (link.name === 'Admin Tools' && !hasAdminAccess) {
                return undefined;
            }

            const IconComponent = link.IconComponent;

            let linkEl = (
                <Link
                    to={link?.path}
                    className={`${sideMenuBrandingStyles.defaultLinkStyles} ${isPathActive(
                        link.path
                    )}`}
                >
                    <IconComponent /> {link.name}
                </Link>
            );

            if (link.path === '/notifications') {
                linkEl = (
                    <Link
                        to={link.path}
                        className={`${sideMenuBrandingStyles.secondaryLinkStyles} ${isPathActive(
                            link.path
                        )}`}
                    >
                        <div
                            className={`flex relative mr-[10px] text-[14px] ${isPathActive(
                                link.path
                            )}`}
                        >
                            <IconComponent className="h-[30px] w-[30px]" />
                            {(unreadCount ?? 0) >= 1 && (
                                <div className="alert-indicator-dot absolute !right-[0px] !top-[-2px]">
                                    {unreadCount}
                                </div>
                            )}
                        </div>

                        {link.name}
                    </Link>
                );
            }

            return (
                <IonMenuToggle key={link.path} autoHide={false} className="w-full">
                    <li
                        color={sideMenuBrandingStyles?.mainBg}
                        onClick={() => setActiveTab(link?.path)}
                        className="flex items-center mb-2"
                    >
                        {linkEl}
                    </li>
                </IonMenuToggle>
            );
        });
    } else {
        rootLinks = (
            <IonMenuToggle autoHide={false} className="w-full">
                <IonItem
                    color={sideMenuBrandingStyles?.mainBg}
                    onClick={() => setActiveTab(walletLink?.path)}
                    lines="none"
                >
                    <Link
                        to={walletLink?.path}
                        className={`w-full ${sideMenuBrandingStyles?.defaultLinkStyles
                            } ${isPathActive(walletLink?.path)} `}
                    >
                        <LearnCardIcon /> {walletLink?.name}
                    </Link>
                </IonItem>
            </IonMenuToggle>
        );
    }

    return <IonList className="m-3 rounded-[24px] p-[10px]">{rootLinks}</IonList>;
};

export default SideMenuRootLinks;

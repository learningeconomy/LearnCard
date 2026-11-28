import React from 'react';
import { Link } from 'react-router-dom';

import LearnCardIcon from 'learn-card-base/svgs/LearnCardIcon';

import {
    sideMenuRootLinks,
    sideMenuScoutPassStyles,
} from 'learn-card-base/components/sidemenu/sidemenuHelpers';

import { useFlags } from 'launchdarkly-react-client-sdk';
import currentUserStore, { useIsLoggedIn } from 'learn-card-base/stores/currentUserStore';
import { useGetUnreadUserNotifications } from 'learn-card-base';

import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';
import * as m from '../../paraglide/messages.js';
import { getScoutPassSideMenuLinkLabel } from './scoutPassSideMenuLabels';
import { AppMenu } from 'learn-card-base/ui/app-shell/AppMenu';
import { AppMenuToggle } from 'learn-card-base/ui/chrome';
import { AppItem, AppList } from 'learn-card-base/ui/list';

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

    if (!isLoggedIn) return <AppMenu contentId="main" />;

    const sideMenuBrandingStyles = sideMenuScoutPassStyles;

    const isPathActive = (tab: string) => {
        const isAdminToolsActive = tab === '/admin-tools' && activeTab.startsWith(tab);

        if (tab === activeTab || isAdminToolsActive)
            return sideMenuBrandingStyles?.activeLinkStyles;
        return '';
    };

    const walletLink = sideMenuRootLinks?.[branding];
    const unreadCount = data?.notifications?.length;

    // eslint-disable-next-line no-useless-assignment -- existing dead initial value; removing it touches control flow, out of scope here
    let rootLinks = null;

    if (Array.isArray(walletLink)) {
        rootLinks = walletLink?.map(link => {
            if (link.path === '/admin-tools' && !hasAdminAccess) {
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
                    <IconComponent /> {getScoutPassSideMenuLinkLabel(m, link)}
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
                                <div className="alert-indicator-dot absolute right-0! top-[-2px]!">
                                    {unreadCount}
                                </div>
                            )}
                        </div>

                        {getScoutPassSideMenuLinkLabel(m, link)}
                    </Link>
                );
            }

            return (
                <AppMenuToggle key={link.path} autoHide={false} className="w-full">
                    <li
                        color={sideMenuBrandingStyles?.mainBg}
                        onClick={() => setActiveTab(link?.path)}
                        className="flex items-center mb-2"
                    >
                        {linkEl}
                    </li>
                </AppMenuToggle>
            );
        });
    } else {
        rootLinks = (
            <AppMenuToggle autoHide={false} className="w-full">
                <AppItem
                    color={sideMenuBrandingStyles?.mainBg}
                    onClick={() => setActiveTab(walletLink?.path)}
                    lines="none"
                >
                    <Link
                        to={walletLink?.path}
                        className={`w-full ${
                            sideMenuBrandingStyles?.defaultLinkStyles
                        } ${isPathActive(walletLink?.path)} `}
                    >
                        <LearnCardIcon /> {walletLink?.name}
                    </Link>
                </AppItem>
            </AppMenuToggle>
        );
    }

    return <AppList className="m-3 rounded-[24px] p-[10px]">{rootLinks}</AppList>;
};

export default SideMenuRootLinks;

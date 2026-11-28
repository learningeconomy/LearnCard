import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

import HeaderBranding from 'learn-card-base/components/headerBranding/HeaderBranding';

import LearnCardIcon from 'learn-card-base/svgs/LearnCardIcon';

import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';

import {
    sideMenuRootLinks,
    sidemenuLinks,
    sideMenuLearnCardBrandingStyles,
    sideMenuMetaversityBrandingStyles,
} from './sidemenuHelpers';
import { useIsLoggedIn } from 'learn-card-base/stores/currentUserStore';
import { AppMenu } from 'learn-card-base/ui/app-shell/AppMenu';
import { AppContent, AppHeader, AppToolbar } from 'learn-card-base/ui/chrome';
import { AppCol, AppGrid, AppRow } from 'learn-card-base/ui/layout';
import { AppItem, AppList } from 'learn-card-base/ui/list';

const SideMenu: React.FC<{ branding: BrandingEnum.learncard }> = ({
    branding = BrandingEnum.learncard,
}) => {
    const location = useLocation();
    const [activeTab, setActiveTab] = useState<string>(location.pathname);
    const isLoggedIn = useIsLoggedIn();

    useEffect(() => {
        setActiveTab(location.pathname);
    }, [location.pathname]);

    if (!isLoggedIn) return <AppMenu contentId="main" />;

    const sideMenuBrandingStyles =
        branding === BrandingEnum.learncard
            ? sideMenuLearnCardBrandingStyles
            : sideMenuMetaversityBrandingStyles;

    const isPathActive = (tab: string) => {
        if (tab === activeTab) return sideMenuBrandingStyles.activeLinkStyles;
        return '';
    };

    const walletLink = sideMenuRootLinks[branding];
    let rootLinks = null;

    if (Array.isArray(walletLink)) {
        rootLinks = walletLink?.map(link => {
            const IconComponent = link.IconComponent;
            return (
                <AppItem
                    key={link.id}
                    lines="none"
                    color={`${sideMenuBrandingStyles.mainBg}`}
                    onClick={() => setActiveTab(link.path)}
                >
                    <Link
                        to={link.path}
                        className={`${sideMenuBrandingStyles.defaultLinkStyles} ${isPathActive(
                            link.path
                        )}`}
                    >
                        <IconComponent /> {link.name}
                    </Link>
                </AppItem>
            );
        });
    } else {
        rootLinks = (
            <AppItem
                color={`${sideMenuBrandingStyles.mainBg}`}
                onClick={() => setActiveTab(walletLink.path)}
                lines="none"
            >
                <Link
                    to={walletLink.path}
                    className={`${sideMenuBrandingStyles.defaultLinkStyles} ${isPathActive(
                        walletLink.path
                    )} w-full`}
                >
                    <LearnCardIcon /> {walletLink.name}
                </Link>
            </AppItem>
        );
    }

    const links = sidemenuLinks[branding];

    return (
        <AppMenu contentId="main">
            <AppHeader className="learn-card-header">
                <AppToolbar className="ion-no-border" color={`${sideMenuBrandingStyles.mainBg}`}>
                    <AppGrid>
                        <AppRow className="min-h-[74px] px-[10px]">
                            <AppCol size="2" className="flex justify-start items-center">
                                <HeaderBranding
                                    branding={branding}
                                    textColor={sideMenuBrandingStyles.brandingTextColor}
                                    spanColor={sideMenuBrandingStyles?.bradingSpanColor}
                                />
                            </AppCol>
                        </AppRow>
                    </AppGrid>
                    <AppList
                        color={`${sideMenuBrandingStyles.mainBg}`}
                        className={`${sideMenuBrandingStyles.defaultListStyles}`}
                    >
                        {/* <AppItem
                            color={`${sideMenuBrandingStyles.mainBg}`}
                            onClick={() => setActiveTab(walletLink.path)}
                            lines="none"
                        >
                            <Link
                                to={walletLink.path}
                                className={`${
                                    sideMenuBrandingStyles.defaultLinkStyles
                                } ${isPathActive(walletLink.path)} w-full`}
                            >
                                <LearnCardIcon /> {walletLink.name}
                            </Link>
                        </AppItem> */}
                        {rootLinks}
                    </AppList>
                    <div className="flex items-center justify-center w-full mt-4 mb-6">
                        <div
                            className={`h-[2px] w-[90%] ${sideMenuBrandingStyles.defaultDividerStyles} `}
                        />
                    </div>
                </AppToolbar>
            </AppHeader>
            <AppContent color={`${sideMenuBrandingStyles.mainBg}`}>
                <AppList
                    color={`${sideMenuBrandingStyles.mainBg}`}
                    className={`${sideMenuBrandingStyles.defaultListStyles}`}
                >
                    {links?.map(link => {
                        const IconComponent = link.IconComponent;
                        return (
                            <AppItem
                                key={link.id}
                                lines="none"
                                color={`${sideMenuBrandingStyles.mainBg}`}
                                onClick={() => setActiveTab(link.path)}
                            >
                                <Link
                                    to={link.path}
                                    className={`${
                                        sideMenuBrandingStyles.defaultLinkStyles
                                    } ${isPathActive(link.path)}`}
                                >
                                    <IconComponent /> {link.name}
                                </Link>
                            </AppItem>
                        );
                    })}
                </AppList>
            </AppContent>
        </AppMenu>
    );
};

export default SideMenu;

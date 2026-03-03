import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

import {
    IonMenu,
    IonToolbar,
    IonHeader,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonList,
    IonItem,
} from '@ionic/react';
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

const SideMenu: React.FC<{ branding: BrandingEnum.learncard }> = ({
    branding = BrandingEnum.learncard,
}) => {
    const location = useLocation();
    const [activeTab, setActiveTab] = useState<string>(location.pathname);
    const isLoggedIn = useIsLoggedIn();

    useEffect(() => {
        setActiveTab(location.pathname);
    }, [location.pathname]);

    if (!isLoggedIn) return <IonMenu contentId="main" />;

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
                <IonItem
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
                </IonItem>
            );
        });
    } else {
        rootLinks = (
            <IonItem
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
            </IonItem>
        );
    }

    const links = sidemenuLinks[branding];

    return (
        <IonMenu contentId="main">
            <IonHeader className="learn-card-header">
                <IonToolbar className="ion-no-border" color={`${sideMenuBrandingStyles.mainBg}`}>
                    <IonGrid>
                        <IonRow className="min-h-[74px] px-[10px]">
                            <IonCol size="2" className="flex justify-start items-center">
                                <HeaderBranding
                                    branding={branding}
                                    textColor={sideMenuBrandingStyles.brandingTextColor}
                                    spanColor={sideMenuBrandingStyles?.bradingSpanColor}
                                />
                            </IonCol>
                        </IonRow>
                    </IonGrid>
                    <IonList
                        color={`${sideMenuBrandingStyles.mainBg}`}
                        className={`${sideMenuBrandingStyles.defaultListStyles}`}
                    >
                        {/* <IonItem
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
                        </IonItem> */}
                        {rootLinks}
                    </IonList>
                    <div className="flex items-center justify-center w-full mt-4 mb-6">
                        <div
                            className={`h-[2px] w-[90%] ${sideMenuBrandingStyles.defaultDividerStyles} `}
                        />
                    </div>
                </IonToolbar>
            </IonHeader>
            <IonContent color={`${sideMenuBrandingStyles.mainBg}`}>
                <IonList
                    color={`${sideMenuBrandingStyles.mainBg}`}
                    className={`${sideMenuBrandingStyles.defaultListStyles}`}
                >
                    {links?.map(link => {
                        const IconComponent = link.IconComponent;
                        return (
                            <IonItem
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
                            </IonItem>
                        );
                    })}
                </IonList>
            </IonContent>
        </IonMenu>
    );
};

export default SideMenu;

import React from 'react';
import { Link } from 'react-router-dom';

import { IonMenu, IonMenuToggle } from '@ionic/react';

import {
    sidemenuLinks,
    sideMenuScoutPassStyles,
} from 'learn-card-base/components/sidemenu/sidemenuHelpers';
import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';

import { useIsLoggedIn } from 'learn-card-base/stores/currentUserStore';
import { useGetCurrentUserTroopIdsResolved } from 'learn-card-base';

const SideMenuSecondaryLinks: React.FC<{
    activeTab: string;
    setActiveTab: React.Dispatch<React.SetStateAction<string>>;
    branding: BrandingEnum;
}> = ({ activeTab, setActiveTab, branding = BrandingEnum.scoutPass }) => {
    const isLoggedIn = useIsLoggedIn();
    const { data: myTroopIdData, isLoading: troopIdDataLoading } =
        useGetCurrentUserTroopIdsResolved();
    const isAdmin = myTroopIdData?.isNationalAdmin || myTroopIdData?.isScoutGlobalAdmin;

    if (!isLoggedIn) return <IonMenu contentId="main" />;

    const sideMenuBrandingStyles = sideMenuScoutPassStyles;

    const isSecondaryPathActive = (tab: string) => {
        if (tab === activeTab) return sideMenuBrandingStyles.secondaryActiveLinkStyles;
        return '';
    };

    const sideMenuLinks = sidemenuLinks?.[branding];

    const secondaryLinks = sideMenuLinks?.map(link => {
        if (link.name === 'Skills' && !isAdmin) {
            // Only show skills if the user is an admin
            return null;
        }

        const IconComponent = link.IconComponent;

        const isWalletPath = link.path === '/wallet';

        let linkEl = (
            <Link
                to={link.path}
                className={`${sideMenuBrandingStyles.secondaryLinkStyles} ${isSecondaryPathActive(
                    link.path
                )}`}
            >
                <IconComponent /> {link.name}
            </Link>
        );

        return (
            <IonMenuToggle key={link.path} autoHide={false} className="w-full">
                <li color={sideMenuBrandingStyles?.mainBg} onClick={() => setActiveTab(link?.path)}>
                    {linkEl}
                </li>
                {isWalletPath && (
                    <div className="relative w-full flex items-center justify-center pb-2">
                        <div className="bottom-0 h-[1px] bg-gray-200 w-[90%]" />
                    </div>
                )}
            </IonMenuToggle>
        );
    });

    return (
        <div className="bg-grayscale-100 w-full px-[10px] h-full">
            <ul
                className={`p-[10px] bg-white rounded-[20px] ${sideMenuBrandingStyles?.secondaryListStyles}`}
            >
                {secondaryLinks}
            </ul>
        </div>
    );
};

export default SideMenuSecondaryLinks;

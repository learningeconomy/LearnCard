import React from 'react';
import { useLocation, useHistory } from 'react-router-dom';

import {
    IonCol,
    IonGrid,
    IonHeader,
    IonMenuToggle,
    IonProgressBar,
    IonRow,
    IonToolbar,
} from '@ionic/react';
import HeaderBranding from '../headerBranding/HeaderBranding';

import Burger from '../svgs/Burger';
import LeftArrow from 'learn-card-base/svgs/LeftArrow';
import QRCodeScannerButton from '../qrcode-scanner-button/QRCodeScannerButton';
import NotificationButton from 'learn-card-base/components/notification-button/NotificationButton';
import MainSubHeader from '../main-subheader/MainSubHeader';

import { SubheaderTypeEnum } from '../main-subheader/MainSubHeader.types';
import {
    BrandingEnum,
    getHeaderBrandingColor,
} from 'learn-card-base/components/headerBranding/headerBrandingHelpers';

import { getStatusBarColor } from 'learn-card-base/helpers/statusBarHelpers';

import { CredentialCategoryEnum, useIsLoggedIn } from 'learn-card-base';
import loadingStore from '../../stores/loadingStore';

import useTheme from '../../theme/hooks/useTheme';

type MainHeaderProps = {
    category?: CredentialCategoryEnum;
    branding?: BrandingEnum;
    customClassName?: string;
    children?: React.ReactNode;
    showBackButton?: boolean;
    subheaderType?: SubheaderTypeEnum;
    customHeaderClass?: string;
    showSideMenuButton?: boolean;
    plusButtonOverride?: React.ReactNode;
    curvedBg?: boolean;
    isBoostsEmpty?: boolean;
    hidePlusBtn?: boolean;
    count?: number;
    countLoading?: boolean;
};

export const MainHeader: React.FC<MainHeaderProps> = ({
    category,
    customClassName,
    children = null,
    subheaderType,
    showBackButton = false,
    branding = BrandingEnum.learncard,
    customHeaderClass,
    showSideMenuButton = false,
    plusButtonOverride,
    curvedBg = true,
    isBoostsEmpty,
    hidePlusBtn = false,
    count,
    countLoading,
}) => {
    const { getThemedCategoryColors } = useTheme();
    const colors = getThemedCategoryColors(category as CredentialCategoryEnum);

    const { backgroundPrimaryColor, statusBarColor: themedStatusBarColor } = colors;

    const isLoggedIn = useIsLoggedIn();
    const location = useLocation();
    const history = useHistory();

    const isLoading = loadingStore.use.loading();

    let subheader: React.ReactNode | null = null;
    if (subheaderType && subheaderType !== 'default') {
        subheader = (
            <MainSubHeader
                category={category}
                subheaderType={subheaderType}
                plusButtonOverride={plusButtonOverride}
                hidePlusBtn={hidePlusBtn}
                count={count}
                countLoading={countLoading}
            />
        );
    }

    const statusBarColor = themedStatusBarColor ?? getStatusBarColor(location.pathname);
    const headerColors =
        colors?.headerBrandingTextColor || getHeaderBrandingColor(branding, location.pathname);

    let mainHeaderBranding: React.ReactElement | null = null;

    mainHeaderBranding = (
        <HeaderBranding
            category={category}
            branding={branding}
            className={`main-header-branding ${customHeaderClass}`}
        />
    );

    return (
        <IonHeader className="learn-card-header ion-no-border relative">
            <IonProgressBar
                type="indeterminate"
                className={`absolute top-0 z-9999 transition-opacity ${
                    isLoading ? 'opacity-100' : 'opacity-0'
                }`}
            />
            <IonToolbar className="ion-no-border" color={statusBarColor}>
                <IonGrid className={`${customClassName} ${backgroundPrimaryColor}`}>
                    <IonRow>
                        <IonCol size="2" className="flex justify-start items-center">
                            {showBackButton && (
                                <button
                                    aria-label="Go back"
                                    className="p-0 mr-[10px] main-header-back-button"
                                    onClick={() => {
                                        history.goBack();
                                    }}
                                >
                                    <LeftArrow className={`w-7 h-auto ${headerColors}`} />
                                </button>
                            )}
                            {showSideMenuButton && isLoggedIn && (
                                <IonMenuToggle menu="appSideMenu">
                                    <Burger className="text-grayscale-900 h-[35px] w-[35px] mr-2 ml-[-10px]" />
                                </IonMenuToggle>
                            )}
                            {mainHeaderBranding}
                        </IonCol>

                        <IonCol size="10" className="flex justify-end items-center">
                            {isLoggedIn ? (
                                <>
                                    <NotificationButton />
                                    <QRCodeScannerButton branding={branding} />
                                </>
                            ) : (
                                <div className="w-full pt-[3px] pb-[3px]">&nbsp;</div>
                            )}
                        </IonCol>
                    </IonRow>
                    {subheader}
                    {children}
                </IonGrid>
            </IonToolbar>
            <div
                role="presentation"
                className={`${
                    curvedBg ? 'header-mask' : 'absolute bottom-0 left-0'
                } ${backgroundPrimaryColor} pointer-events-none`}
            ></div>
        </IonHeader>
    );
};

export default MainHeader;

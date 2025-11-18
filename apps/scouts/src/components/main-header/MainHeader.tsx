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
import HeaderBranding from 'learn-card-base/components/headerBranding/HeaderBranding';

import LeftArrow from 'learn-card-base/svgs/LeftArrow';
import QRCodeScannerButton from '../qrcode-scanner-button/QRCodeScannerButton';
import NotificationButton from 'learn-card-base/components/notification-button/NotificationButton';
import MainSubHeader from '../main-subheader/MainSubHeader';
import { SubheaderTypeEnum, SubheaderContentType } from '../main-subheader/MainSubHeader.types';
import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';

import { getStatusBarColor } from 'learn-card-base/helpers/statusBarHelpers';

import { useIsLoggedIn } from 'learn-card-base';
import Burger from '../svgs/Burger';
import loadingStore from '../../stores/loadingStore';

type MainHeaderProps = {
    branding?: BrandingEnum;
    customClassName?: string;
    children?: React.ReactNode;
    showBackButton?: boolean;
    subheaderType?: SubheaderTypeEnum;
    customHeaderClass?: string;
    curvedBg?: boolean;
    showSideMenuButton?: boolean;
    plusButtonOverride?: React.ReactNode;
    count?: number;
    countLoading?: boolean;
    hidePlusBtn?: boolean;
};

export const MainHeader: React.FC<MainHeaderProps> = ({
    customClassName = '',
    children = null,
    subheaderType,
    showBackButton = false,
    branding = BrandingEnum.scoutPass,
    customHeaderClass,
    curvedBg = true,
    showSideMenuButton = false,
    plusButtonOverride,
    count,
    countLoading,
    hidePlusBtn,
}) => {
    const isLoggedIn = useIsLoggedIn();
    const location = useLocation();
    const history = useHistory();

    const isLoading = loadingStore.use.loading();

    const { bgColor } = SubheaderContentType[subheaderType ?? 'default'];

    let subheader: React.ReactNode | null = null;
    if (subheaderType && subheaderType !== 'default') {
        subheader = (
            <MainSubHeader
                subheaderType={subheaderType}
                branding={branding}
                plusButtonOverride={plusButtonOverride}
                count={count}
                countLoading={countLoading}
                hidePlusBtn={hidePlusBtn}
            />
        );
    }

    const statusBarColor = getStatusBarColor(location.pathname, branding);

    let mainHeaderBranding: React.ReactElement | null = null;

    mainHeaderBranding = (
        <HeaderBranding
            branding={branding}
            className={`main-header-branding ${customHeaderClass}`}
        />
    );

    return (
        <IonHeader className="learn-card-header ion-no-border relative">
            <IonProgressBar
                type="indeterminate"
                className={`absolute top-0 z-[99999999] transition-opacity ${
                    isLoading ? 'opacity-100' : 'opacity-0'
                }`}
            />
            <IonToolbar className="ion-no-border" color={statusBarColor}>
                <IonGrid className={`${customClassName} ${bgColor}`}>
                    <IonRow className={showBackButton ? '' : 'px-[10px]'}>
                        <IonCol size="6" className="flex justify-start items-center pl-0">
                            {showBackButton && (
                                <button
                                    className="text-grayscale-50 p-0 main-header-back-button"
                                    onClick={() => {
                                        history.goBack();
                                    }}
                                >
                                    <LeftArrow className="w-7 h-auto text-white" />
                                </button>
                            )}

                            {showSideMenuButton && isLoggedIn && (
                                <IonMenuToggle menu="appSideMenu">
                                    <Burger className="text-grayscale-900 h-[35px] w-[35px] mr-2 ml-[-10px]" />
                                </IonMenuToggle>
                            )}
                            {mainHeaderBranding}
                        </IonCol>

                        <IonCol size="6" className="flex justify-end items-center pr-0">
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
                } ${bgColor} pointer-events-none`}
            >
                {/* {bgImage && (
                    <img src={bgImage} className="h-full w-full object-cover object-bottom" />
                )} */}
            </div>
        </IonHeader>
    );
};

export default MainHeader;

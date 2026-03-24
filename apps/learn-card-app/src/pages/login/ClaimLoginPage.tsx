import React, { useState } from 'react';

import {
    DeleteUserSuccessConfirmation,
    confirmationStore,
    useDeviceTypeByWidth,
} from 'learn-card-base';

import { IonContent, IonGrid, IonPage } from '@ionic/react';

import {
    SomeoneSentYouACredentialRequest,
    SomeoneSentYouACredentialRequestMobile,
} from '../claim-from-request/LoggedOutRequest';

import { useTenantBrandingAssets } from '../../config/brandingAssets';
import { useTheme } from '../../theme/hooks/useTheme';

import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';
import { LoginContent } from './LoginPage';
import LoginWelcomePanel from './LoginWelcomePanel';

const ClaimLoginPage: React.FC<{
    alternateBgComponent?: React.ReactNode;
    vc_request_url?: string | (string | null)[] | null;
}> = ({ alternateBgComponent, vc_request_url }) => {
    const { desktopLoginBg } = useTenantBrandingAssets();
    const { theme } = useTheme();
    const loginBgColor = theme.colors.defaults.loaders?.[0] ?? '#059669';
    const showConfirmation = confirmationStore.use.showConfirmation();
    const { isDesktop } = useDeviceTypeByWidth();
    return (
        <IonPage className="flex flex-col h-full" style={{ backgroundColor: loginBgColor }}>
            {showConfirmation && (
                <DeleteUserSuccessConfirmation branding={BrandingEnum.learncard} />
            )}
            <IonContent
                fullscreen
                className="flex flex-col flex-grow"
                style={{ '--background': loginBgColor } as React.CSSProperties}
            >
                <IonGrid className="h-full w-full flex items-center justify-center" style={{ backgroundColor: loginBgColor }}>
                    {!isDesktop && <MobileClaimLoginContainer vc_request_url={vc_request_url} />}
                    {/* Desktop background image */}
                    {isDesktop && (
                        <>
                            <LoginContent />
                            <div className="w-full h-full p-0 m-0 flex items-center justify-center overflow-hidden">
                                {alternateBgComponent ? (
                                    alternateBgComponent
                                ) : desktopLoginBg ? (
                                    <img
                                        src={desktopLoginBg}
                                        alt=""
                                        aria-hidden="true"
                                        className="w-full h-full object-cover"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                ) : (
                                    <LoginWelcomePanel />
                                )}
                            </div>
                        </>
                    )}
                </IonGrid>
            </IonContent>
        </IonPage>
    );
};

export default ClaimLoginPage;

const MobileClaimLoginContainer: React.FC<{
    vc_request_url?: string | (string | null)[] | null;
}> = ({ vc_request_url }) => {
    const [showLogin, setShowLogin] = useState(false);

    if (showLogin) {
        return <LoginContent />;
    }
    return (
        <SomeoneSentYouACredentialRequestMobile
            onClick={() => setShowLogin(true)}
            vc_request_url={vc_request_url}
        />
    );
};

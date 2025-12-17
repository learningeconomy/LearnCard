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

import DesktopLoginBG from '../../assets/images/desktop-login-bg.png';

import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';
import { LoginContent } from './LoginPage';

const ClaimLoginPage: React.FC<{
    alternateBgComponent?: React.ReactNode;
    vc_request_url?: string | (string | null)[] | null;
}> = ({ alternateBgComponent, vc_request_url }) => {
    const showConfirmation = confirmationStore.use.showConfirmation();
    const { isDesktop } = useDeviceTypeByWidth();
    return (
        <IonPage color="emerald-700" className="flex flex-col h-full">
            {showConfirmation && (
                <DeleteUserSuccessConfirmation branding={BrandingEnum.learncard} />
            )}
            <IonContent
                fullscreen
                className="flex flex-col flex-grow bg-emerald-700"
                color="emerald-700"
            >
                <IonGrid className="h-full w-full flex items-center justify-center bg-emerald-700">
                    {!isDesktop && <MobileClaimLoginContainer vc_request_url={vc_request_url} />}
                    {/* Desktop background image */}
                    {isDesktop && (
                        <>
                            <LoginContent />
                            <div className="w-full h-full p-0 m-0 flex items-center justify-center">
                                {alternateBgComponent ? (
                                    alternateBgComponent
                                ) : (
                                    <img src={DesktopLoginBG} alt="" aria-hidden="true" />
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

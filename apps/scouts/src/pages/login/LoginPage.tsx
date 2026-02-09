import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
    useWallet,
    LoginTypesEnum,
    usePathQuery,
    redirectStore,
    chapiStore,
    useCurrentUser,
    DeleteUserSuccessConfirmation,
    confirmationStore,
    useIsLoggedIn,
    authStore,
    SocialLoginTypes,
    currentUserStore,
    QrLoginRequester,
    getAuthConfig,
} from 'learn-card-base';

import { useFirebase } from '../../hooks/useFirebase';

import { IonCol, IonContent, IonGrid, IonPage, IonRow } from '@ionic/react';
import ScoutsSSOLogin from './ScoutsSSO/ScoutSSOLogin';
import SocialLogins from '../../components/social-logins/SocialLogins';
import EmailForm from './forms/EmailForm';
import PhoneForm from './forms/PhoneForm';
import LoginFooter from './LoginFooter';
import WorldScoutsIcon from '../../assets/images/world-scouts-icon.svg';
import PhoneIcon from '../../assets/images/Phone.svg';
import EmailIcon from '../../assets/images/Email-outline.svg';
import ScoutPassTextLogo from '../../assets/images/scoutpass-text-logo.svg';
import ScoutPassLogo from '../../assets/images/scoutpass-logo.svg';
import AppleIcon from '../../assets/images/apple-logo.svg';
import GoogleIcon from 'learn-card-base/assets/images/google-G-logo.svg';

import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';
import { useFlags } from 'launchdarkly-react-client-sdk';

const LoginPage: React.FC = () => {
    const flags = useFlags();
    const { initWallet } = useWallet();
    const currentUser = useCurrentUser();
    const isLoggedIn = useIsLoggedIn();
    const { appleLogin, googleLogin } = useFirebase();
    // const { installChapi } = useWallet();
    const query = usePathQuery();
    const history = useHistory();

    const enableWorldScoutsLogin = flags?.enableWorldScoutsLogin;

    const enableSmsLogin = flags?.enableSmsLogin;

    const showConfirmation = confirmationStore.use.showConfirmation();
    const [activeLoginType, setActiveLoginType] = useState<LoginTypesEnum>(LoginTypesEnum.email);
    const [showQrLogin, setShowQrLogin] = useState(false);
    const authConfig = getAuthConfig();

    useEffect(() => {
        // handles redirecting a user to an LC network specific action / page
        const handleLCNetworkRedirect = async (redirect: string) => {
            try {
                const wallet = await initWallet();
                const currentUserLCProfile = await wallet?.invoke?.getProfile();

                if (currentUserLCProfile) {
                    // when logging in with scouts SSO, we need to set the image after login
                    // !! since scouts SSO does not return an image in the response
                    // so we grab the user's image from the LCN network & set it in the currentUser store
                    if (authStore?.get?.typeOfLogin() === SocialLoginTypes?.scoutsSSO) {
                        currentUserStore.set.currentUser({
                            ...currentUser,
                            profileImage: currentUserLCProfile?.image,
                        });
                    }

                    history.push(redirect);
                }

                history.push(redirect);
            } catch (e) {
                history.push(redirect);
            }
        };

        if (currentUser || isLoggedIn) {
            const redirectTo = redirectStore.get.authRedirect() || query.get('redirectTo');
            const lcnRedirectTo = redirectStore.get.lcnRedirect();
            // const isChapiInteraction = chapiStore.get.isChapiInteraction();

            if (redirectTo) {
                try {
                    redirectStore.set.authRedirect(null);
                    chapiStore.set.isChapiInteraction(null);
                } catch (e) {
                    console.error(e);
                }
                history.push(redirectTo);
            } else if (lcnRedirectTo) {
                handleLCNetworkRedirect(lcnRedirectTo);
            } else {
                handleLCNetworkRedirect('/campfire');
            }
            // if (!isChapiInteraction) {
            //     installChapi();
            // }
        }
    }, [currentUser, isLoggedIn]);

    useEffect(() => {
        if (showConfirmation) {
            setTimeout(() => {
                confirmationStore.set.showConfirmation(false);
            }, 3000);
        }
    }, [showConfirmation]);

    let LoginTypeForm: React.ReactNode | null = null;

    if (activeLoginType === LoginTypesEnum.email) {
        LoginTypeForm = <EmailForm />;
    } else if (activeLoginType === LoginTypesEnum.phone) {
        LoginTypeForm = <PhoneForm />;
    } else if (activeLoginType === LoginTypesEnum.scoutsSSO) {
        LoginTypeForm = <ScoutsSSOLogin />;
    }

    // custom logins associated with the app
    const extraSocialLogins = [];

    extraSocialLogins.push(
        {
            id: 1,
            src: GoogleIcon,
            alt: 'google',
            onClick: googleLogin,
            type: SocialLoginTypes.google,
        },
        {
            id: 2,
            src: AppleIcon,
            alt: 'apple',
            onClick: appleLogin,
            type: SocialLoginTypes.apple,
        }
    );

    const activeLoginTypeStyles = 'border-[#FF8DFF]';

    return (
        <IonPage>
            {showConfirmation && (
                <DeleteUserSuccessConfirmation branding={BrandingEnum.scoutPass} />
            )}
            <IonContent fullscreen>
                <IonGrid className="p-0 m-0 w-full flex-col items-center justify-center">
                    <IonRow className="p-0 m-0 w-full flex items-center justify-center bg-sp-purple-base relative login-page-header !overflow-hidden">
                        <IonCol size="12" className="flex flex-col items-center justify-center">
                            <img src={ScoutPassLogo} alt="ScoutPass logo" className="w-[55px]" />
                            <img
                                src={ScoutPassTextLogo}
                                alt="ScoutPass text logo"
                                className="mt-4"
                            />
                        </IonCol>
                        <div className="absolute bottom-[-150px] h-[75%] w-[106%] rounded-[100%] bg-white login-page-curve" />
                    </IonRow>
                    {showQrLogin ? (
                        <IonRow className="w-full flex items-center justify-center p-4">
                            <QrLoginRequester
                                serverUrl={authConfig.serverUrl}
                                onApproved={(deviceShare) => {
                                    window.sessionStorage.setItem('qr_login_device_share', deviceShare);
                                    setShowQrLogin(false);
                                }}
                                onCancel={() => setShowQrLogin(false)}
                                renderQrCode={(data) => (
                                    <QRCodeSVG value={data} size={192} level="M" />
                                )}
                                accentColor="text-sp-purple-base"
                            />
                        </IonRow>
                    ) : (
                    <>
                    <IonRow className="social-logins-container">
                        <div className="w-full flex items-center justify-center">
                            {enableWorldScoutsLogin && (
                                <button
                                    className={`flex items-center justify-center border-solid border-2 rounded-full mr-2 h-[50px] w-[50px] max-w-[50px] max-h-[50px] z-[9999] ${
                                        activeLoginType === LoginTypesEnum.scoutsSSO
                                            ? activeLoginTypeStyles
                                            : 'border-gray-100'
                                    }`}
                                    onClick={() => setActiveLoginType(LoginTypesEnum.scoutsSSO)}
                                >
                                    <img
                                        src={WorldScoutsIcon}
                                        alt="world scouts icon"
                                        className="w-[50px] h-auto rounded-full"
                                    />
                                </button>
                            )}

                            <button
                                className={`flex items-center justify-center border-solid border-2 p-2 bg-[#0094F6] rounded-full mr-2 h-[50px] w-[50px] max-w-[50px] max-h-[50px] z-[9999] ${
                                    activeLoginType === LoginTypesEnum.email
                                        ? activeLoginTypeStyles
                                        : 'border-gray-100'
                                }`}
                                onClick={() => setActiveLoginType(LoginTypesEnum.email)}
                            >
                                <img
                                    src={EmailIcon}
                                    alt="email icon"
                                    className="w-[30px] h-[30px]"
                                />
                            </button>

                            {enableSmsLogin && (
                                <button
                                    className={`flex items-center justify-center border-solid border-2 p-2 bg-[#0094F6] rounded-full mr-2 h-[50px] w-[50px] max-w-[50px] max-h-[50px] z-[9999] ${
                                        activeLoginType === LoginTypesEnum.phone
                                            ? activeLoginTypeStyles
                                            : 'border-gray-100'
                                    }`}
                                    onClick={() => setActiveLoginType(LoginTypesEnum.phone)}
                                >
                                    <img
                                        src={PhoneIcon}
                                        alt="phone icon"
                                        className="w-[30px] h-[30px]"
                                    />
                                </button>
                            )}
                        </div>
                        <IonRow className="w-full max-w-[500px] ion-padding-horizontal">
                            {LoginTypeForm}
                        </IonRow>
                        <SocialLogins
                            branding={BrandingEnum.scoutPass}
                            activeLoginType={activeLoginType}
                            setActiveLoginType={setActiveLoginType}
                            extraSocialLogins={extraSocialLogins}
                        />
                    </IonRow>

                    <IonRow className="w-full flex items-center justify-center mt-2 mb-2">
                        <button
                            onClick={() => setShowQrLogin(true)}
                            className="text-sm text-gray-500 hover:text-gray-700 underline transition-colors"
                        >
                            Sign in from another device
                        </button>
                    </IonRow>
                    </>)
                    }
                </IonGrid>
                <LoginFooter />
            </IonContent>
        </IonPage>
    );
};

export default LoginPage;

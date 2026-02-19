import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
    LoginTypesEnum,
    usePathQuery,
    redirectStore,
    chapiStore,
    useCurrentUser,
    DeleteUserSuccessConfirmation,
    confirmationStore,
    useIsLoggedIn,
    useGeneratePinUpdateToken,
    authStore,
    useWallet,
    useModal,
    ModalTypes,
    SocialLoginTypes,
    useDeviceTypeByWidth,
    useGetPreferencesForDid,
    QrLoginRequester,
    getAuthConfig,
} from 'learn-card-base';

import { Capacitor } from '@capacitor/core';

import { useFirebase } from '../../hooks/useFirebase';
import useLogout from '../../hooks/useLogout';

import { setPublicComputerMode, isPublicComputerMode } from '@learncard/sss-key-manager';
import { setPersistence, browserSessionPersistence, indexedDBLocalPersistence } from 'firebase/auth';
import { getConfigCapabilities } from 'learn-card-base/config/authConfig';

import { auth } from '../../firebase/firebase';

import { IonContent, IonGrid, IonPage, IonRow } from '@ionic/react';
import EmailForm from './forms/EmailForm';
import PhoneForm from './forms/PhoneForm';
import LoginFooter from './LoginFooter';
import OnboardingContainer from '../../components/onboarding/OnboardingContainer';
import EUParentalConsentModalContent from '../../components/onboarding/onboardingNetworkForm/components/EUParentalConsentModalContent';
import GenericErrorBoundary from '../../components/generic/GenericErrorBoundary';
import SocialLoginsButtons from './SocialLogins/SocialLoginsButtons';
import LearnCardTextLogo from '../../assets/images/learncard-text-logo.svg';
import LearnCardBrandMark from '../../assets/images/lca-brandmark.png';
import AppleIcon from 'learn-card-base/assets/images/apple-logo.svg';
import GoogleIcon from 'learn-card-base/assets/images/google-G-logo.svg';
import DesktopLoginBG from '../../assets/images/desktop-login-bg.png';
import EndorsementSuccessfullRequestModal from '../../components/boost-endorsements/EndorsementRequestModal/EndorsementSuccessfullRequestModal';

import { themeStore } from '../../theme/store/themeStore';
import endorsementRequestStore from '../../stores/endorsementsRequestStore';
import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';
import { ThemeEnum } from '../../theme/helpers/theme-helpers';
import { useTheme } from '../../theme/hooks/useTheme';

export const LoginContent: React.FC = () => {
    const { syncThemeDefaults } = useTheme();
    const { newModal, closeModal } = useModal();
    const isLoggedIn = useIsLoggedIn();
    const currentUser = useCurrentUser();
    const { appleLogin, googleLogin } = useFirebase();
    const { handleLogout } = useLogout();

    // const { installChapi } = useWallet();
    const query = usePathQuery();
    const history = useHistory();
    const { initWallet } = useWallet();
    const [showSocialLogins, setShowSocialLogins] = useState<boolean>(true);

    const showConfirmation = confirmationStore.use.showConfirmation();
    const [activeLoginType, setActiveLoginType] = useState<LoginTypesEnum>(LoginTypesEnum.email);
    const [showQrLogin, setShowQrLogin] = useState(false);
    const [qrApproved, setQrApproved] = useState(false);
    const [showLinkedBanner, setShowLinkedBanner] = useState(false);
    const [accountHint, setAccountHint] = useState<string | null>(null);
    const [isPublicMode, setIsPublicMode] = useState(() => isPublicComputerMode());
    const authConfig = getAuthConfig();
    const configCapabilities = getConfigCapabilities();
    const isWeb = !Capacitor.isNativePlatform();

    const { mutateAsync: generatePinUpdateToken } = useGeneratePinUpdateToken();
    const { data: preferences, refetch: refetchPreferences } = useGetPreferencesForDid();

    const fetchPreferences = useCallback(async () => {
        try {
            const result = await refetchPreferences();
            if (result?.data?.theme) {
                const theme = result?.data?.theme ?? ThemeEnum.Colorful;
                themeStore.set.theme(theme);
                syncThemeDefaults(theme);
            }
        } catch (error) {
            console.error('Error fetching preferences:', error);
            return null;
        }
    }, [refetchPreferences]);

    const handleGeneratePinUpdateToken = useCallback(async () => {
        try {
            const result = await generatePinUpdateToken();
            if (result?.token && result.tokenExpire) {
                authStore.set.pinToken(result.token);
                authStore.set.pinTokenExpire(result.tokenExpire);
            }
        } catch (e) {
            console.error('///error handleGeneratePinUpdateToken', e);
        }
    }, [generatePinUpdateToken]);

    // Removed unnecessary LC network redirect helper; inline push is sufficient.

    const handlePromptOnboarding = useCallback(async () => {
        if (!(currentUser && isLoggedIn && currentUser?.privateKey)) return;
        try {
            const wallet = await initWallet(currentUser.privateKey);
            const profile = await wallet?.invoke?.getProfile();
            if (!profile) {
                newModal(
                    <OnboardingContainer />,
                    {},
                    { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
                );
            } else if (profile?.approved === false) {
                // Re-prompt EU Parental Consent if user was previously marked unapproved
                newModal(
                    <EUParentalConsentModalContent
                        name={profile?.displayName ?? ''}
                        dob={profile?.dob ?? ''}
                        country={profile?.country ?? ''}
                        onClose={closeModal}
                    />,
                    {
                        sectionClassName:
                            '!bg-transparent !border-none !shadow-none !rounded-none !mx-auto',
                    },
                    { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
                );
            }
        } catch (e) {
            console.error('///error handlePromptOnboarding', e);
        }
    }, [currentUser, isLoggedIn, initWallet, newModal]);

    const didRedirectRef = useRef(false);

    useEffect(() => {
        if (didRedirectRef.current) return;
        if (!currentUser && !isLoggedIn) return;

        didRedirectRef.current = true;

        const redirectTo = redirectStore.get.authRedirect() || query.get('redirectTo');
        const lcnRedirectTo = redirectStore.get.lcnRedirect();
        // const isChapiInteraction = chapiStore.get.isChapiInteraction();
        try {
            const underageFamily = query.get('underageFamily');
            if (underageFamily) {
                if (currentUser && isLoggedIn) {
                    // Child still logged in: set redirect to families and logout to allow parent login
                    redirectStore.set.lcnRedirect('/families?createFamily=true');
                    handleLogout(BrandingEnum.learncard, {
                        appendQuery: { redirectTo: '/families?createFamily=true' },
                    });
                    return;
                } else {
                    // Not logged in yet: set post-login redirect to family creation
                    redirectStore.set.lcnRedirect('/families?createFamily=true');
                    return;
                }
            }
            if (redirectTo) {
                redirectStore.set.authRedirect(null);
                chapiStore.set.isChapiInteraction(null);
                history.push(redirectTo);
            } else if (lcnRedirectTo) {
                redirectStore.set.lcnRedirect(null);
                history.push(lcnRedirectTo);
            } else {
                history.push('/launchpad');
                void handleGeneratePinUpdateToken();
                void handlePromptOnboarding();
            }

            fetchPreferences();
        } catch (e) {
            console.error(e);
        }
    }, [
        currentUser,
        isLoggedIn,
        history,
        query,
        handleGeneratePinUpdateToken,
        handlePromptOnboarding,
        handleLogout,
    ]);

    useEffect(() => {
        if (showConfirmation) {
            const timer = setTimeout(() => {
                confirmationStore.set.showConfirmation(false);
            }, 3000);
            return () => clearTimeout(timer); // Add cleanup
        }
    }, [showConfirmation]);
    // custom logins associated with the app
    const extraSocialLogins = useMemo(
        () => [
            {
                id: 1,
                src: AppleIcon,
                alt: 'apple',
                onClick: appleLogin,
                type: SocialLoginTypes.apple,
            },
            {
                id: 2,
                src: GoogleIcon,
                alt: 'google',
                onClick: googleLogin,
                type: SocialLoginTypes.google,
            },
        ],
        [appleLogin, googleLogin]
    );

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-0 m-0 px-[30px] overflow-y-auto  pt-[150px] pb-[100px] sm:pt-[0px] sm:pb-[0px] ">
            <IonRow className="p-0 m-0 w-full flex items-center justify-center relative pb-[20px]">
                <div className="flex flex-col items-center justify-center w-full">
                    <img
                        src={LearnCardBrandMark}
                        alt="Learn Card brand mark"
                        className="w-[80px] h-[80px] mb-[20px]"
                    />
                    <img src={LearnCardTextLogo} alt="Learn Card text logo" />
                </div>
            </IonRow>
            {showQrLogin && !qrApproved ? (
                <IonRow className="w-full max-w-[500px] flex items-center justify-center px-4">
                    <div className="w-full bg-white rounded-[20px] shadow-2xl">
                        <QrLoginRequester
                            serverUrl={authConfig.serverUrl}
                            onApproved={(deviceShare, _approverDid, hint, version) => {
                                console.debug(
                                    '[QR Login] approved — share:',
                                    deviceShare.substring(0, 8) + '...',
                                    '| hint:', hint ?? '(none)',
                                    '| shareVersion:', version ?? '(none)'
                                );

                                // Store the device share locally so the coordinator
                                // can reconstruct the key after Firebase auth completes.
                                window.sessionStorage.setItem('qr_login_device_share', deviceShare);

                                if (version != null) {
                                    window.sessionStorage.setItem('qr_login_share_version', String(version));
                                }

                                setAccountHint(hint ?? null);
                                setQrApproved(true);
                            }}
                            onCancel={() => setShowQrLogin(false)}
                            renderQrCode={(data) => (
                                <QRCodeSVG value={data} size={192} level="M" />
                            )}
                        />
                    </div>
                </IonRow>
            ) : showQrLogin && qrApproved ? (
                <IonRow className="w-full max-w-[500px] flex items-center justify-center px-4">
                    <div className="w-full bg-white rounded-[20px] shadow-2xl p-8 text-center font-poppins animate-fade-in-up">
                        <div className="w-16 h-16 mx-auto mb-4 bg-emerald-50 rounded-full flex items-center justify-center">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-emerald-600" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>

                        <h2 className="text-xl font-semibold text-grayscale-900 mb-2">You're all set!</h2>

                        <p className="text-sm text-grayscale-600 leading-relaxed mb-6">
                            {accountHint
                                ? <>Sign in with <span className="font-medium text-grayscale-900">{accountHint}</span> to access your account.</>
                                : 'Now just sign in below to access your account.'
                            }
                        </p>

                        <button
                            onClick={() => {
                                setShowQrLogin(false);
                                setQrApproved(false);
                                setShowLinkedBanner(true);
                            }}
                            className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity"
                        >
                            Continue to Sign In
                        </button>
                    </div>
                </IonRow>
            ) : (
                <>
                    {showLinkedBanner && (
                        <IonRow className="w-full max-w-[500px] flex items-center justify-center px-4 mb-3">
                            <div className="w-full p-3 bg-white/20 backdrop-blur-sm rounded-[20px] flex items-center justify-center gap-2.5">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white shrink-0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>

                                <span className="text-sm text-white font-medium">
                                    {accountHint
                                        ? <>Sign in with <span className="font-semibold">{accountHint}</span> to finish</>
                                        : 'Device linked — sign in to finish'
                                    }
                                </span>
                            </div>
                        </IonRow>
                    )}

                    <IonRow className="w-full flex flex-col items-center justify-center">
                        <GenericErrorBoundary hideGoHome>
                            {showSocialLogins && (
                                <SocialLoginsButtons
                                    branding={BrandingEnum.learncard}
                                    activeLoginType={activeLoginType}
                                    setActiveLoginType={setActiveLoginType}
                                    extraSocialLogins={extraSocialLogins}
                                    showSocialLogins={showSocialLogins}
                                />
                            )}
                        </GenericErrorBoundary>
                        <IonRow className="w-full max-w-[500px] flex items-center justify-center">
                            <GenericErrorBoundary hideGoHome>
                                {activeLoginType === LoginTypesEnum.email && (
                                    <EmailForm
                                        setShowSocialLogins={setShowSocialLogins}
                                        showSocialLogins={showSocialLogins}
                                    />
                                )}
                                {activeLoginType === LoginTypesEnum.phone && (
                                    <PhoneForm
                                        setShowSocialLogins={setShowSocialLogins}
                                        showSocialLogins={showSocialLogins}
                                    />
                                )}
                            </GenericErrorBoundary>
                        </IonRow>
                    </IonRow>

                    {isWeb && configCapabilities.localKeyPersistence && (
                        <IonRow className="w-full max-w-[500px] flex items-center justify-center mt-3">
                            <button
                                onClick={async () => {
                                    const next = !isPublicMode;
                                    setIsPublicMode(next);
                                    setPublicComputerMode(next);

                                    // Switch Firebase persistence: session-only in public
                                    // mode so the auth session dies with the tab, or
                                    // IndexedDB (default) when toggling back.
                                    try {
                                        await setPersistence(
                                            auth(),
                                            next ? browserSessionPersistence : indexedDBLocalPersistence
                                        );
                                    } catch (e) {
                                        console.warn('Failed to set Firebase persistence', e);
                                    }
                                }}
                                className={`
                                    flex items-center gap-2.5 px-4 py-2 rounded-full
                                    transition-all duration-200 select-none
                                    ${isPublicMode
                                        ? 'bg-white/20 ring-1 ring-white/40'
                                        : 'bg-white/10 hover:bg-white/15'
                                    }
                                `}
                            >
                                <div className={`
                                    relative w-8 h-[18px] rounded-full transition-colors duration-200
                                    ${isPublicMode ? 'bg-white/90' : 'bg-white/30'}
                                `}>
                                    <div className={`
                                        absolute top-[2px] w-[14px] h-[14px] rounded-full
                                        transition-all duration-200 shadow-sm
                                        ${isPublicMode
                                            ? 'left-[15px] bg-emerald-600'
                                            : 'left-[2px] bg-white/70'
                                        }
                                    `} />
                                </div>

                                <span className={`
                                    text-sm transition-colors duration-200
                                    ${isPublicMode ? 'text-white font-medium' : 'text-white/60'}
                                `}>
                                    Shared or public computer
                                </span>
                            </button>
                        </IonRow>
                    )}

                    {configCapabilities.deviceLinking && (
                        <IonRow className="w-full max-w-[500px] flex items-center justify-center mt-4">
                            <button
                                onClick={() => setShowQrLogin(true)}
                                className="text-sm text-white/80 hover:text-white underline transition-colors"
                            >
                                Sign in from another device
                            </button>
                        </IonRow>
                    )}

                    <GenericErrorBoundary hideGoHome>
                        <LoginFooter />
                    </GenericErrorBoundary>
                </>
            )}
        </div>
    );
};

const LoginPage: React.FC<{ alternateBgComponent?: React.ReactNode }> = ({
    alternateBgComponent,
}) => {
    const { newModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });
    const endorsementRequest = endorsementRequestStore.useTracked.endorsementRequest();
    const showConfirmation = confirmationStore.use.showConfirmation();
    const { isDesktop, isMobile } = useDeviceTypeByWidth();
    const [isSuccessEndorsementModalOpen, setIsSuccessEndorsementModalOpen] =
        useState<boolean>(false);

    useEffect(() => {
        if (
            isMobile &&
            !isSuccessEndorsementModalOpen &&
            endorsementRequest?.relationship &&
            endorsementRequest?.description
        ) {
            newModal(<EndorsementSuccessfullRequestModal showCloseButton />);
            setIsSuccessEndorsementModalOpen(true);
        }
    }, [isMobile, isDesktop, isSuccessEndorsementModalOpen]);

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
                    <LoginContent />
                    {/* Desktop background image */}
                    {isDesktop &&
                        !endorsementRequest?.relationship?.label &&
                        !endorsementRequest?.description && (
                            <>
                                <div className="w-full h-full p-0 m-0 flex items-center justify-center">
                                    {alternateBgComponent ? (
                                        alternateBgComponent
                                    ) : (
                                        <img src={DesktopLoginBG} alt="" aria-hidden="true" />
                                    )}
                                </div>
                            </>
                        )}

                    {isDesktop &&
                        endorsementRequest?.relationship?.label &&
                        endorsementRequest?.description && (
                            <>
                                <EndorsementSuccessfullRequestModal />
                            </>
                        )}
                </IonGrid>
            </IonContent>
        </IonPage>
    );
};

export default LoginPage;

import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as m from '../../paraglide/messages.js';
import { TransP } from '../../i18n/TransP';
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
    QrLoginRequester,
    getAuthConfig,
    getSSSConfig,
    useAuthStatus,
} from 'learn-card-base';

import { getLogger } from 'learn-card-base';
const log = getLogger('login-page');

import { Capacitor } from '@capacitor/core';

import { useFirebase } from '../../hooks/useFirebase';
import useLogout from '../../hooks/useLogout';

import { setPublicComputerMode, isPublicComputerMode } from '@learncard/sss-key-manager';
import { useSignInAdapter } from 'learn-card-base';
import { getConfigCapabilities } from 'learn-card-base/config/authConfig';

import { IonContent, IonGrid, IonPage, IonRow } from '@ionic/react';
import EmailForm from './forms/EmailForm';
import PhoneForm from './forms/PhoneForm';
import LoginFooter from './LoginFooter';
import { LanguagePickerCompact } from '../../components/sidemenu/LanguagePicker';
import OnboardingFlow from '../../components/onboarding/v2/OnboardingFlow';
import EUParentalConsentModalContent from '../../components/onboarding/onboardingNetworkForm/components/EUParentalConsentModalContent';
import GenericErrorBoundary from '../../components/generic/GenericErrorBoundary';
import SocialLoginsButtons from './SocialLogins/SocialLoginsButtons';
import LoginWelcomePanel from './LoginWelcomePanel';
import DesktopLoginBackground from './DesktopLoginBackground';
import AppleIcon from 'learn-card-base/assets/images/apple-logo.svg';
import GoogleIcon from 'learn-card-base/assets/images/google-G-logo.svg';
import { useTenantBrandingAssets } from '../../config/brandingAssets';
import EndorsementSuccessfullRequestModal from '../../components/boost-endorsements/EndorsementRequestModal/EndorsementSuccessfullRequestModal';

import endorsementRequestStore from '../../stores/endorsementsRequestStore';
import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';
import { useTheme } from '../../theme/hooks/useTheme';
import { useAppAuth } from '../../providers/AuthCoordinatorProvider';
import {
    useAnalytics,
    AnalyticsEvents,
    LAST_LOGIN_METHOD_KEY,
    getOrCreateSignupFlow,
} from '@analytics';

export const LoginContent: React.FC = () => {
    const adapter = useSignInAdapter();
    const { textLogo, brandMarkLight, fullLogoDark, desktopLoginBg } = useTenantBrandingAssets();
    const { theme } = useTheme();
    const { newModal, closeModal } = useModal();
    const { state: coordinatorState, beginIdentityRecovery } = useAppAuth();
    const authStatus = useAuthStatus();
    const { track } = useAnalytics();
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
    const [activeLoginType, setActiveLoginType] = useState<LoginTypesEnum>(
        adapter.capabilities.emailOtp || adapter.capabilities.emailLink
            ? LoginTypesEnum.email
            : LoginTypesEnum.phone
    );
    const [showQrLogin, setShowQrLogin] = useState(false);
    const [qrApproved, setQrApproved] = useState(false);
    const [showLinkedBanner, setShowLinkedBanner] = useState(false);
    const [accountHint, setAccountHint] = useState<string | null>(null);
    const [isPublicMode, setIsPublicMode] = useState(() => isPublicComputerMode());

    const installIntent = redirectStore.use.installIntent();
    const authConfig = getAuthConfig();
    const configCapabilities = getConfigCapabilities();
    const isWeb = !Capacitor.isNativePlatform();

    const { mutateAsync: generatePinUpdateToken } = useGeneratePinUpdateToken();

    const handleGeneratePinUpdateToken = useCallback(async () => {
        try {
            const result = await generatePinUpdateToken();
            if (result?.token && result.tokenExpire) {
                authStore.set.pinToken(result.token);
                authStore.set.pinTokenExpire(result.tokenExpire);
            }
        } catch (e) {
            log.error('///error handleGeneratePinUpdateToken', e);
        }
    }, [generatePinUpdateToken]);

    const openOnboardingModal = useCallback(() => {
        // OnboardingFlow unmount owns the `isOnboardingOpen(false)` reset.
        redirectStore.set.isOnboardingOpen(true);

        newModal(
            <OnboardingFlow />,
            {},
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );
    }, [newModal]);

    // Removed unnecessary LC network redirect helper; inline push is sufficient.

    const handlePromptOnboarding = useCallback(async () => {
        if (redirectStore.get.isOnboardingOpen()) {
            return;
        }

        if (coordinatorState.status === 'needs_setup') {
            openOnboardingModal();
            return;
        }

        if (!(currentUser && isLoggedIn && currentUser?.privateKey)) return;

        try {
            const wallet = await initWallet(currentUser.privateKey);
            const profile = await wallet?.invoke?.getProfile();

            if (!profile) {
                openOnboardingModal();
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
            log.error('///error handlePromptOnboarding', e);
        }
    }, [coordinatorState.status, currentUser, isLoggedIn, initWallet, openOnboardingModal]);

    const didRedirectRef = useRef(false);
    const didOpenOnboardingRef = useRef(false);
    const didTrackSignupStartedRef = useRef(false);

    const trackSignupStarted = useCallback(() => {
        if (didTrackSignupStartedRef.current) {
            return;
        }

        const { flowId, isNew } = getOrCreateSignupFlow();
        const method = localStorage.getItem(LAST_LOGIN_METHOD_KEY) ?? undefined;

        if (isNew) {
            track(AnalyticsEvents.SIGNUP_STARTED, {
                flow_id: flowId,
                method,
                entry_point: 'login_page',
            });
        }

        didTrackSignupStartedRef.current = true;
    }, [track]);

    useEffect(() => {
        const profilePresent = authStatus.tag === 'ready' && authStatus.profile.tag === 'present';

        // Reset the "already prompted" guards only once onboarding actually
        // succeeded (profile present) or the user fully signed out. Resetting on
        // every coordinator transition re-armed the prompt mid-onboarding,
        // risking duplicate modals and lost claim redirects.
        if (profilePresent || authStatus.tag === 'unauthenticated') {
            didOpenOnboardingRef.current = false;
            didTrackSignupStartedRef.current = false;
        }

        if (authStatus.tag === 'unauthenticated') {
            didRedirectRef.current = false;
        }
    }, [authStatus]);

    useEffect(() => {
        if (didRedirectRef.current) return;
        if (!currentUser && !isLoggedIn && coordinatorState.status !== 'needs_setup') return;

        // Onboarding owns navigation while it is open. Leave the pending
        // redirect untouched so OnboardingFlow can resume it after the profile
        // is created — clearing it here is what lost inbox claim links.
        if (redirectStore.get.isOnboardingOpen()) return;

        // Never route during key/wallet rebuild or recovery/migration; the
        // coordinator's overlays own those states.
        if (authStatus.tag === 'resolving' || authStatus.tag === 'recovering') return;
        if (authStatus.tag === 'ready' && authStatus.profile.tag === 'loading') return;

        const needsOnboarding =
            coordinatorState.status === 'needs_setup' ||
            (authStatus.tag === 'ready' && authStatus.profile.tag === 'absent');

        if (needsOnboarding) {
            if (didOpenOnboardingRef.current) return;

            trackSignupStarted();
            didOpenOnboardingRef.current = true;
            didRedirectRef.current = false;
            // Profile is confirmed absent or the coordinator needs setup, so
            // open the existing onboarding flow directly — no async profile
            // re-check that could resolve after navigation.
            openOnboardingModal();
            return;
        }

        // A definitively signed-out visitor has nowhere to go.
        if (authStatus.tag === 'unauthenticated') return;

        didRedirectRef.current = true;

        const redirectTo =
            redirectStore.get.authRedirect() || query.get('redirectTo') || query.get('returnUrl');
        const lcnRedirectTo = redirectStore.get.lcnRedirect();
        // const isChapiInteraction = chapiStore.get.isChapiInteraction();
        try {
            const underageFamily = query.get('underageFamily');
            if (underageFamily) {
                if (currentUser && isLoggedIn) {
                    // Child still logged in: set redirect to families and logout to allow parent login
                    redirectStore.set.lcnRedirect('/families?createFamily=true');
                    handleLogout({
                        appendQuery: { redirectTo: '/families?createFamily=true' },
                    });
                    return;
                } else {
                    // Not logged in yet: set post-login redirect to family creation
                    redirectStore.set.lcnRedirect('/families?createFamily=true');
                    return;
                }
            }

            // Only re-prompt onboarding for an existing profile (EU parental
            // consent). A still-resolving profile must never open a second
            // onboarding modal over the destination page — that page's own gate
            // handles a confirmed absence.
            const canRepromptOnboarding =
                authStatus.tag === 'ready' && authStatus.profile.tag === 'present';

            if (redirectTo) {
                redirectStore.set.lcnRedirect(null);
                redirectStore.set.authRedirect(null);
                chapiStore.set.isChapiInteraction(null);
                history.push(redirectTo);
                void handleGeneratePinUpdateToken();
                if (canRepromptOnboarding) void handlePromptOnboarding();
            } else if (lcnRedirectTo) {
                redirectStore.set.lcnRedirect(null);
                history.push(lcnRedirectTo);
                void handleGeneratePinUpdateToken();
                if (canRepromptOnboarding) void handlePromptOnboarding();
            } else {
                // Preserve the demo shortcut's existing landing page after the
                // profile/onboarding gates above have completed.
                history.push(currentUser?.uid === 'demo' ? '/wallet' : '/dashboard');
                void handleGeneratePinUpdateToken();
                if (canRepromptOnboarding) void handlePromptOnboarding();
            }
        } catch (e) {
            log.error(e);
        }
    }, [
        authStatus,
        currentUser,
        isLoggedIn,
        coordinatorState.status,
        history,
        query,
        handleGeneratePinUpdateToken,
        handlePromptOnboarding,
        handleLogout,
        openOnboardingModal,
        trackSignupStarted,
    ]);

    useEffect(() => {
        if (showConfirmation) {
            const timer = setTimeout(() => {
                confirmationStore.set.showConfirmation(false);
            }, 3000);
            return () => clearTimeout(timer); // Add cleanup
        }
    }, [showConfirmation]);

    const isNewUserSetup = coordinatorState.status === 'needs_setup';
    const isReturningUser =
        coordinatorState.status === 'ready' || coordinatorState.status === 'needs_recovery';

    // custom logins associated with the app
    const extraSocialLogins = [
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
    ];

    // Redirect-pending gate: once the wallet is built and the user counts as
    // logged in, the effect above will history.push away from /login — but
    // only on the tick AFTER React has already painted this component,
    // flashing the login form between the boot loader and the app. Bridge
    // that gap with a loader-colored overlay instead. Intentionally NOT
    // LoginLoadingPage (an IonPage): nesting a page inside this route
    // triggers Ionic's page transition twice — same reasoning as
    // RouteTransitionLoader. needs_setup is excluded so the form stays
    // visible under the onboarding modal.
    const redirectPending =
        (isLoggedIn || !!currentUser) && coordinatorState.status !== 'needs_setup';

    if (redirectPending) {
        return (
            <div
                className="fixed inset-0 z-[1000] flex items-center justify-center"
                style={{ backgroundColor: theme.colors.defaults.loaders?.[0] ?? '#8B5CF6' }}
            >
                <img
                    src={textLogo}
                    alt="Logo"
                    className="max-w-[300px] max-h-[80px] object-contain"
                />
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-0 m-0 px-[30px] overflow-y-auto  pt-[150px] pb-[100px] sm:pt-[0px] sm:pb-[0px] ">
            <IonRow className="p-0 m-0 w-full flex items-center justify-center relative pb-[20px]">
                <div className="flex flex-col items-center justify-center w-full">
                    {fullLogoDark ? (
                        <img
                            src={fullLogoDark}
                            alt="Logo"
                            className="max-w-[300px] max-h-[160px] object-contain"
                        />
                    ) : (
                        <>
                            <img
                                src={brandMarkLight}
                                alt="Brand mark"
                                className="w-[80px] h-[80px] mb-[20px]"
                            />
                            <img
                                src={textLogo}
                                alt="Logo"
                                className="max-w-[300px] max-h-[80px] object-contain"
                            />
                        </>
                    )}
                </div>
            </IonRow>
            {showQrLogin && !qrApproved ? (
                <IonRow className="w-full max-w-[500px] flex items-center justify-center px-4">
                    <div className="w-full bg-white rounded-[20px] shadow-2xl">
                        <QrLoginRequester
                            serverUrl={getSSSConfig().serverUrl}
                            onApproved={(deviceShare, _approverDid, hint, version) => {
                                log.debug(
                                    '[QR Login] approved — share:',
                                    deviceShare.substring(0, 8) + '...',
                                    '| hint:',
                                    hint ?? '(none)',
                                    '| shareVersion:',
                                    version ?? '(none)'
                                );

                                // Store the device share locally so the coordinator
                                // can reconstruct the key after Firebase auth completes.
                                window.sessionStorage.setItem('qr_login_device_share', deviceShare);

                                if (version != null) {
                                    window.sessionStorage.setItem(
                                        'qr_login_share_version',
                                        String(version)
                                    );
                                }

                                setAccountHint(hint ?? null);
                                setQrApproved(true);
                            }}
                            onCancel={() => setShowQrLogin(false)}
                            renderQrCode={data => <QRCodeSVG value={data} size={192} level="M" />}
                        />
                    </div>
                </IonRow>
            ) : showQrLogin && qrApproved ? (
                <IonRow className="w-full max-w-[500px] flex items-center justify-center px-4">
                    <div className="w-full bg-white rounded-[20px] shadow-2xl p-8 text-center font-poppins animate-fade-in-up">
                        <div className="w-16 h-16 mx-auto mb-4 bg-emerald-50 rounded-full flex items-center justify-center">
                            <svg
                                width="28"
                                height="28"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                className="text-emerald-600"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>

                        <h2 className="text-xl font-semibold text-grayscale-900 mb-2">
                            {m['login.qrApproved.heading']()}
                        </h2>

                        <p className="text-sm text-grayscale-600 leading-relaxed mb-6">
                            {accountHint ? (
                                <TransP
                                    m={m['login.qrApproved.withHint']}
                                    values={{ hint: accountHint }}
                                    components={[
                                        <span className="font-medium text-grayscale-900" key="h" />,
                                    ]}
                                />
                            ) : (
                                m['login.qrApproved.noHint']()
                            )}
                        </p>

                        <button
                            onClick={() => {
                                setShowQrLogin(false);
                                setQrApproved(false);
                                setShowLinkedBanner(true);
                            }}
                            className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity"
                        >
                            {m['login.qrApproved.continueButton']()}
                        </button>
                    </div>
                </IonRow>
            ) : (
                <>
                    <IonRow className="w-full max-w-[500px] flex items-center justify-center px-4 mb-3">
                        <p className="w-full text-center text-sm font-medium text-white">
                            {isNewUserSetup
                                ? m['login.prompt.newUser']()
                                : isReturningUser
                                  ? m['login.prompt.returning']()
                                  : m['login.prompt.default']()}
                        </p>
                    </IonRow>

                    {showLinkedBanner && (
                        <IonRow className="w-full max-w-[500px] flex items-center justify-center px-4 mb-3">
                            <div className="w-full p-3 bg-black/10 backdrop-blur-sm rounded-[20px] flex items-center justify-center gap-2.5">
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    className="text-white shrink-0"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>

                                <span className="text-sm text-white font-medium">
                                    {accountHint ? (
                                        <TransP
                                            m={m['login.linkedBanner.withHint']}
                                            values={{ hint: accountHint }}
                                            components={[
                                                <span className="font-semibold" key="h" />,
                                            ]}
                                        />
                                    ) : (
                                        m['login.linkedBanner.noHint']()
                                    )}
                                </span>
                            </div>
                        </IonRow>
                    )}

                    {coordinatorState.status === 'awaiting_rebind' && (
                        <IonRow className="w-full max-w-[500px] flex items-center justify-center px-4 mb-3">
                            <div className="w-full p-4 bg-white rounded-[20px] shadow-xl text-center">
                                <p className="text-sm font-medium text-grayscale-900">
                                    {m['recovery.identity.signInPrompt']()}
                                </p>
                                <p className="text-xs text-grayscale-600 mt-1 leading-relaxed">
                                    {m['recovery.identity.signInPromptDescription']()}
                                </p>
                            </div>
                        </IonRow>
                    )}

                    {installIntent?.listingId && (
                        <IonRow className="w-full max-w-[500px] flex items-center justify-center px-4 mb-3">
                            <div className="w-full p-3 bg-black/10 backdrop-blur-sm rounded-[20px] flex items-center gap-3 justify-center">
                                {installIntent.appIcon && (
                                    <img
                                        src={installIntent.appIcon}
                                        alt=""
                                        className="w-6 h-6 rounded-md object-cover shrink-0"
                                    />
                                )}
                                <span className="text-sm text-white font-medium">
                                    <TransP
                                        m={m['login.installIntent.banner']}
                                        values={{
                                            appName:
                                                installIntent.appName ??
                                                m['login.installIntent.defaultAppName'](),
                                        }}
                                        components={[<span className="font-semibold" key="a" />]}
                                    />
                                </span>
                            </div>
                        </IonRow>
                    )}

                    {((query.get('redirectTo') ?? '').includes('createFamily=true') ||
                        Boolean(query.get('underageFamily'))) && (
                        <IonRow className="w-full max-w-[500px] flex items-center justify-center px-4 mb-3">
                            <div className="w-full p-3 bg-black/10 backdrop-blur-sm rounded-[20px] flex items-start gap-2.5">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="w-5 h-5 text-white shrink-0 mt-0.5"
                                    aria-hidden="true"
                                >
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                                <span className="text-sm text-white leading-relaxed">
                                    Sign in as a parent or guardian to create a family account and
                                    add your child.
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
                                {activeLoginType === LoginTypesEnum.email &&
                                    (adapter.capabilities.emailOtp ||
                                        adapter.capabilities.emailLink) && (
                                        <EmailForm
                                            suppressRedirect
                                            setShowSocialLogins={setShowSocialLogins}
                                            showSocialLogins={showSocialLogins}
                                        />
                                    )}
                                {activeLoginType === LoginTypesEnum.phone &&
                                    adapter.capabilities.phoneOtp && (
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
                                        await adapter.setSessionPersistence?.(next);
                                    } catch (e) {
                                        log.warn('Failed to set Firebase persistence', e);
                                    }
                                }}
                                className="flex items-center gap-2.5 px-4 py-2 rounded-full transition-all duration-200 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                            >
                                <div
                                    className={`
                                    relative w-8 h-[18px] rounded-full transition-colors duration-200
                                    ${isPublicMode ? 'bg-white/90' : 'bg-white/30'}
                                `}
                                >
                                    <div
                                        className={`
                                        absolute top-[2px] w-[14px] h-[14px] rounded-full
                                        transition-all duration-200 shadow-sm
                                        ${
                                            isPublicMode
                                                ? 'left-[15px] bg-emerald-600'
                                                : 'left-[2px] bg-white/70'
                                        }
                                    `}
                                    />
                                </div>

                                <span
                                    className={`
                                    text-sm transition-colors duration-200
                                    ${isPublicMode ? 'text-white font-medium' : 'text-white'}
                                `}
                                >
                                    {m['login.sharedComputer']()}
                                </span>
                            </button>
                        </IonRow>
                    )}

                    {configCapabilities.deviceLinking && (
                        <IonRow className="w-full max-w-[500px] flex items-center justify-center mt-4">
                            <button
                                onClick={() => setShowQrLogin(true)}
                                className="text-sm text-white hover:text-white underline transition-colors"
                            >
                                {m['login.signInFromAnotherDevice']()}
                            </button>
                        </IonRow>
                    )}

                    {configCapabilities.recovery && coordinatorState.status === 'idle' && (
                        <IonRow className="w-full max-w-[500px] flex items-center justify-center mt-3">
                            <button
                                onClick={beginIdentityRecovery}
                                className="text-sm text-white hover:text-white underline transition-colors"
                            >
                                {m['recovery.identity.lostSchoolLogin']()}
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
    const { desktopLoginBg } = useTenantBrandingAssets();
    const { theme } = useTheme();
    const loginBgColor =
        theme.colors.defaults.loginBgColor ?? theme.colors.defaults.loaders?.[0] ?? '#058760';
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
        <IonPage className="flex flex-col h-full" style={{ backgroundColor: loginBgColor }}>
            {showConfirmation && (
                <DeleteUserSuccessConfirmation branding={BrandingEnum.learncard} />
            )}
            <IonContent
                fullscreen
                className="flex flex-col flex-grow"
                style={{ '--background': loginBgColor } as React.CSSProperties}
            >
                {/* Pre-auth language switcher. Positioned over the login background
                    in the safe-area top-right; the side-menu LanguagePicker isn't
                    reachable until after sign-in. */}
                <div className="absolute top-0 end-0 z-10 pe-4 pt-[max(env(safe-area-inset-top),12px)]">
                    <LanguagePickerCompact />
                </div>
                <IonGrid
                    className="h-full w-full flex items-center justify-center"
                    style={{ backgroundColor: loginBgColor }}
                >
                    <LoginContent />
                    {/* Desktop background image */}
                    {isDesktop &&
                        !endorsementRequest?.relationship?.label &&
                        !endorsementRequest?.description && (
                            <>
                                <div className="w-full h-full p-0 m-0 flex items-center justify-center overflow-hidden">
                                    {alternateBgComponent ? (
                                        alternateBgComponent
                                    ) : desktopLoginBg ? (
                                        <DesktopLoginBackground src={desktopLoginBg} />
                                    ) : (
                                        <LoginWelcomePanel />
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

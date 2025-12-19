import React, { useState, useEffect } from 'react';

import queryString from 'query-string';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor } from '@capacitor/core';

import { useHistory, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import authStore from 'learn-card-base/stores/authStore';

import { IonPage, IonCol, IonRow, IonSkeletonText, IonSpinner } from '@ionic/react';
import FullScreenGameFlow from './GameFlow/FullScreenGameFlow';
import ConsentFlowCredFrontDoor from './ConsentFlowCredFrontDoor';

import {
    useWallet,
    ProfilePicture,
    pushUtilities,
    useWeb3Auth,
    useSQLiteStorage,
    useContract,
    redirectStore,
    ModalTypes,
    useModal,
} from 'learn-card-base';
import { SocialLoginTypes } from 'learn-card-base/hooks/useSocialLogins';
import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';
import { LOGIN_REDIRECTS } from 'learn-card-base/constants/redirects';
import { auth } from '../../firebase/firebase';
import { openPP, openToS } from '../../helpers/externalLinkHelpers';
import { useConsentedContracts } from 'learn-card-base/hooks/useConsentedContracts';
import ConsentFlowError from './ConsentFlowError';

import useTheme from '../../theme/hooks/useTheme';

enum Step {
    landing,
    credFrontDoor,
}

const ExternalConsentFlowDoor: React.FC<{ login: boolean }> = ({ login = false }) => {
    const currentUser = useCurrentUser();

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const history = useHistory();
    const location = useLocation();
    const firebaseAuth = auth();
    const queryClient = useQueryClient();
    const { initWallet } = useWallet();
    const { logout } = useWeb3Auth();
    const { clearDB } = useSQLiteStorage();
    const { newModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });

    // Warm up the consented contracts cache
    useConsentedContracts();

    const { uri, returnTo, recipientToken } = queryString.parse(location.search);

    const { data: consentedContracts, isLoading: consentedContractLoading } =
        useConsentedContracts();
    const consentedContract = consentedContracts?.find(c => c?.contract?.uri === uri);

    const [step, setStep] = useState(Step.landing);

    const {
        data: contractDetails,
        isPending,
        error,
    } = useContract(Array.isArray(uri) ? uri[0] ?? '' : uri ?? '');

    useEffect(() => {
        const errorType = error?.shape?.data?.httpStatus;
        const isClientError = errorType === 400 || errorType === 404 || uri === '';
        const isServerError = errorType === 500;

        if (isClientError) {
            history.push('/launchpad');
            newModal(<ConsentFlowError errorType={uri === '' ? 400 : errorType} />);
        } else if (isServerError) {
            history.push('/launchpad');
            newModal(<ConsentFlowError errorType={errorType} uri={uri} />);
        }
    }, [error]);

    // TODO duplicated from QRCodeUserCard, should turn into helper
    const handleLogout = async () => {
        const typeOfLogin = authStore?.get?.typeOfLogin();
        const nativeSocialLogins = [
            SocialLoginTypes.apple,
            SocialLoginTypes.sms,
            SocialLoginTypes.passwordless,
            SocialLoginTypes.google,
        ];

        const redirectUrl =
            IS_PRODUCTION || Capacitor.getPlatform() === 'android'
                ? LOGIN_REDIRECTS[BrandingEnum.learncard].redirectUrl
                : LOGIN_REDIRECTS[BrandingEnum.learncard].devRedirectUrl;

        setTimeout(async () => {
            const deviceToken = authStore?.get?.deviceToken();
            if (deviceToken) {
                await pushUtilities.revokePushToken(initWallet, deviceToken);
            }

            await firebaseAuth.signOut(); // sign out of web layer
            if (nativeSocialLogins.includes(typeOfLogin) && Capacitor.isNativePlatform()) {
                try {
                    await FirebaseAuthentication?.signOut?.();
                } catch (e) {
                    console.log('firebase::signout::error', e);
                }
            }

            logout(redirectUrl);
            await queryClient.resetQueries();

            await clearDB();
        }, 1000);
    };

    const redirectToLogin = () => {
        const redirectPath = location.pathname + location.search;
        redirectStore.set.authRedirect(redirectPath);
        history.push(`/login?redirectTo=${redirectPath}`);
    };

    if (isPending) {
        return (
            <IonPage className="bg-emerald-700 p-[30px] flex items-center justify-center">
                <div className="w-full flex flex-col items-center justify-center min-h-[300px]">
                    <IonSpinner
                        name="crescent"
                        color="grayscale-900"
                        className="scale-[2] mb-8 mt-6"
                    />
                    <p className="font-poppins text-grayscale-900">Loading...</p>
                </div>
            </IonPage>
        );
    }

    const hasCredentialFrontDoor = contractDetails?.frontDoorBoostUri;

    if (hasCredentialFrontDoor && step === Step.credFrontDoor) {
        return <ConsentFlowCredFrontDoor contractDetails={contractDetails} />;
    }

    if (contractDetails?.needsGuardianConsent) {
        return <FullScreenGameFlow contractDetails={contractDetails} />;
    }

    return (
        <IonPage className="bg-emerald-700 p-[30px]">
            <div className="flex flex-col gap-[15px] items-center px-[40px] pb-[30px] pt-[40px] bg-white shadow-bottom rounded-[24px] m-auto max-w-[400px]">
                {isPending && !error ? (
                    <IonSkeletonText animated className="h-[60px] w-[60px] rounded-[10px]" />
                ) : (
                    <img
                        className="w-[60px] h-[60px] object-cover rounded-[10px]"
                        src={contractDetails?.image}
                        alt={`${contractDetails?.name}`}
                    />
                )}

                <div className="flex flex-col items-center font-poppins w-full gap-[2px]">
                    {isPending && !error ? (
                        <>
                            <IonSkeletonText animated className="h-[20px]" />
                            <IonSkeletonText animated className="h-[17px]" />
                        </>
                    ) : (
                        <>
                            <h1 className="text-grayscale-900 text-[20px] font-[600] leading-[160%] text-center">
                                {contractDetails?.name}
                            </h1>
                            <div className="text-grayscale-800 text-[17px] text-center">
                                {contractDetails?.subtitle}
                            </div>
                        </>
                    )}
                </div>

                {currentUser && !error && (
                    <div className="flex flex-col gap-[20px] items-center w-full">
                        <ProfilePicture
                            customContainerClass="flex justify-center items-center h-[80px] w-[80px] rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-4xl"
                            customImageClass="h-full w-full object-cover"
                        />
                        <button
                            type="button"
                            onClick={async () => {
                                if (
                                    login &&
                                    returnTo &&
                                    typeof returnTo === 'string' &&
                                    !consentedContractLoading &&
                                    consentedContract
                                ) {
                                    if (
                                        returnTo.startsWith('http://') ||
                                        returnTo.startsWith('https://')
                                    ) {
                                        const wallet = await initWallet();

                                        // add user's did to returnTo url
                                        const urlObj = new URL(returnTo);
                                        urlObj.searchParams.set('did', wallet.id.did());
                                        if (consentedContract?.contract?.owner?.did) {
                                            const unsignedDelegateCredential =
                                                wallet.invoke.newCredential({
                                                    type: 'delegate',
                                                    subject: consentedContract?.contract?.owner.did,
                                                    access: ['read', 'write'],
                                                });

                                            const delegateCredential =
                                                await wallet.invoke.issueCredential(
                                                    unsignedDelegateCredential
                                                );

                                            const unsignedDidAuthVp =
                                                await wallet.invoke.newPresentation(
                                                    delegateCredential
                                                );
                                            const vp = (await wallet.invoke.issuePresentation(
                                                unsignedDidAuthVp,
                                                {
                                                    proofPurpose: 'authentication',
                                                    proofFormat: 'jwt',
                                                }
                                            )) as any as string;

                                            urlObj.searchParams.set('vp', vp);
                                        }

                                        window.location.href = urlObj.toString();

                                        return;
                                    }
                                }

                                if (hasCredentialFrontDoor) {
                                    setStep(Step.credFrontDoor);
                                } else if (returnTo) {
                                    history.push(
                                        `/consent-flow-sync-data?uri=${uri}&returnTo=${returnTo}${
                                            recipientToken
                                                ? `&recipientToken=${recipientToken}`
                                                : ''
                                        }`
                                    );
                                } else {
                                    history.push(
                                        `/consent-flow-sync-data?uri=${uri}${
                                            recipientToken
                                                ? `&recipientToken=${recipientToken}`
                                                : ''
                                        }`
                                    );
                                }
                            }}
                            className="bg-emerald-700 text-grayscale-50 text-[16px] font-semibold font-poppins normal w-full py-[12px] px-[10px] rounded-[40px] shadow-bottom"
                        >
                            Continue as {currentUser.name}
                        </button>
                        <div className="text-grayscale-900 text-[14px]">
                            Not you?{' '}
                            <button
                                type="button"
                                onClick={handleLogout}
                                className={`text-${primaryColor} font-[600]`}
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                )}

                {!currentUser && !error && (
                    <div className="flex flex-col gap-[15px] items-center w-full">
                        <button
                            type="button"
                            onClick={redirectToLogin}
                            className="bg-emerald-700 text-grayscale-50 text-[16px] font-semibold font-poppins normal w-full py-[12px] px-[10px] rounded-[40px] shadow-bottom"
                        >
                            Sign up for LearnCard
                        </button>
                        <div className="text-grayscale-900 text-[14px]">
                            Have an account?{' '}
                            <button
                                type="button"
                                onClick={redirectToLogin}
                                className={`text-${primaryColor} font-[600]`}
                            >
                                Login
                            </button>
                        </div>
                    </div>
                )}

                <div className="pt-[20px] border-solid border-t-[1px] border-grayscale-200 w-full flex flex-col items-center gap-[10px]">
                    <span className="text-grayscale-900 text-[14px] font-montserrat normal font-[700] tracking-[7px] uppercase">
                        LearnCard
                    </span>
                    <span className="text-grayscale-700 text-[14px]">
                        Universal Learning & Work Portfolio
                    </span>
                    <IonRow className="flex items-center justify-center">
                        <IonCol className="flex items-center justify-center">
                            <button
                                onClick={openPP}
                                className={`text-${primaryColor} font-[600] text-[12px]`}
                            >
                                Privacy Policy
                            </button>
                            <span className="text-grayscale-600 font-bold text-[12px]">
                                &nbsp;•&nbsp;
                            </span>
                            <button
                                onClick={openToS}
                                className={`text-${primaryColor} font-[600] text-[12px]`}
                            >
                                Terms of Service
                            </button>
                        </IonCol>
                    </IonRow>
                </div>
            </div>
        </IonPage>
    );
};

export default ExternalConsentFlowDoor;

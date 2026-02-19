import React, { useState } from 'react';
import queryString from 'query-string';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { Capacitor } from '@capacitor/core';

import { useHistory, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import authStore from 'learn-card-base/stores/authStore';

import { IonPage, IonCol, IonRow, IonSkeletonText, IonSpinner } from '@ionic/react';
import ConsentFlowSyncCard from './ConsentFlowSyncCard';
// import FullScreenGameFlow from './GameFlow/FullScreenGameFlow';
// import ConsentFlowCredFrontDoor from './ConsentFlowCredFrontDoor';

import {
    useWallet,
    ProfilePicture,
    pushUtilities,
    useSQLiteStorage,
    useContract,
    redirectStore,
} from 'learn-card-base';
import { SocialLoginTypes } from 'learn-card-base/hooks/useSocialLogins';
import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';
import { LOGIN_REDIRECTS } from 'learn-card-base/constants/redirects';
import { auth } from '../../firebase/firebase';
import { openPP, openToS } from '../../helpers/externalLinkHelpers';
import { useAuthCoordinator } from '../../providers/AuthCoordinatorProvider';
import { useConsentedContracts } from 'learn-card-base/hooks/useConsentedContracts';

enum Step {
    landing,
    consent,
}

const ExternalConsentFlowDoor: React.FC = () => {
    const currentUser = useCurrentUser();

    const history = useHistory();
    const location = useLocation();
    const firebaseAuth = auth();
    const queryClient = useQueryClient();
    const { initWallet } = useWallet();
    const { logout: coordinatorLogout } = useAuthCoordinator();
    const { clearDB } = useSQLiteStorage();

    // Warm up the consented contracts cache
    useConsentedContracts();

    const { uri } = queryString.parse(location.search);

    const [step, setStep] = useState(Step.landing);

    const contractUri = Array.isArray(uri) ? uri[0] ?? '' : uri ?? '';
    const { data: contractDetails, isPending } = useContract(contractUri);

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

            coordinatorLogout();
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
            <IonPage className="bg-sp-purple-midnight p-[30px] flex items-center justify-center">
                <div className="w-full flex flex-col items-center justify-center min-h-[300px]">
                    <IonSpinner
                        name="crescent"
                        color="grayscale-900"
                        className="scale-[2] mb-8 mt-6"
                    />
                    <p className="font-notoSans text-grayscale-900">Loading...</p>
                </div>
            </IonPage>
        );
    }

    // const hasCredentialFrontDoor = contractDetails?.frontDoorBoostUri;

    // if (hasCredentialFrontDoor && step === Step.credFrontDoor) {
    //     return <ConsentFlowCredFrontDoor contractDetails={contractDetails} />;
    // }

    // if (contractDetails?.needsGuardianConsent) {
    //     return <FullScreenGameFlow contractDetails={contractDetails} />;
    // }

    if (step === Step.consent) {
        return (
            <IonPage className="bg-sp-purple-midnight p-[30px]">
                <div className=" m-auto max-w-[400px]">
                    <ConsentFlowSyncCard
                        contractDetails={contractDetails}
                        contractUri={contractUri}
                    />
                </div>
            </IonPage>
        );
    }

    return (
        <IonPage className="bg-sp-purple-midnight p-[30px]">
            <div className="flex flex-col gap-[15px] items-center px-[40px] pb-[30px] pt-[40px] bg-white shadow-bottom rounded-[24px] m-auto max-w-[400px]">
                {isPending ? (
                    <IonSkeletonText animated className="h-[60px] w-[60px] rounded-[10px]" />
                ) : (
                    <img
                        className="w-[60px] h-[60px] object-cover rounded-[10px]"
                        src={contractDetails?.image}
                        alt={`${contractDetails?.name}`}
                    />
                )}

                <div className="flex flex-col items-center font-notoSans w-full gap-[2px]">
                    {isPending ? (
                        <>
                            <IonSkeletonText animated className="h-[20px]" />
                            <IonSkeletonText animated className="h-[17px]" />
                        </>
                    ) : (
                        <>
                            <h1 className="text-grayscale-900 text-[20px] font-[600] leading-[160%] text-center font-poppins">
                                {contractDetails?.name}
                            </h1>
                            <div className="text-grayscale-800 text-[17px] text-center font-poppins">
                                {contractDetails?.subtitle}
                            </div>
                        </>
                    )}
                </div>

                {currentUser && (
                    <div className="flex flex-col gap-[20px] items-center w-full">
                        <ProfilePicture
                            customContainerClass="flex justify-center items-center h-[80px] w-[80px] rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-4xl"
                            customImageClass="h-full w-full object-cover"
                        />
                        <button
                            type="button"
                            onClick={() => {
                                setStep(Step.consent);

                                /* if (hasCredentialFrontDoor) {
                                    setStep(Step.credFrontDoor);
                                } else if (returnTo) {
                                    history.push(
                                        `/consent-flow-sync-data?uri=${uri}&returnTo=${returnTo}`
                                    );
                                } else {
                                    history.push(`/consent-flow-sync-data?uri=${uri}`);
                                } */
                            }}
                            className="bg-sp-purple-base text-grayscale-50 text-[16px] font-semibold font-notoSans normal w-full py-[12px] px-[10px] rounded-[40px] shadow-bottom"
                        >
                            Continue as {currentUser.name}
                        </button>
                        <div className="text-grayscale-900 text-[14px] font-notoSans">
                            Not you?{' '}
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="text-indigo-500 font-[600]"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                )}

                {!currentUser && (
                    <div className="flex flex-col gap-[15px] items-center w-full">
                        <button
                            type="button"
                            onClick={redirectToLogin}
                            className="bg-sp-purple-base text-grayscale-50 text-[16px] font-semibold font-notoSans normal w-full py-[12px] px-[10px] rounded-[40px] shadow-bottom"
                        >
                            Sign up for LearnCard
                        </button>
                        <div className="text-grayscale-900 text-[14px]">
                            Have an account?{' '}
                            <button
                                type="button"
                                onClick={redirectToLogin}
                                className="text-indigo-500 font-[600]"
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
                    <span className="text-grayscale-700 text-[14px] font-notoSans">
                        Universal Learning & Work Portfolio
                    </span>
                    <IonRow className="flex items-center justify-center">
                        <IonCol className="flex items-center justify-center font-notoSans">
                            <button
                                onClick={openPP}
                                className="text-indigo-500 font-[600] text-[12px]"
                            >
                                Privacy Policy
                            </button>
                            <span className="text-grayscale-600 font-bold text-[12px]">
                                &nbsp;•&nbsp;
                            </span>
                            <button
                                onClick={openToS}
                                className="text-indigo-500 font-[600] text-[12px]"
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

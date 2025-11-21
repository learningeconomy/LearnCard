import React, { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import {
    useWallet,
    useCurrentUser,
    isPlatformIOS,
    useGetCurrentLCNUser,
    isPlatformAndroid,
    pushUtilities,
    currentUserStore,
    useIsCurrentUserLCNUser,
    getNotificationsEndpoint,
} from 'learn-card-base';

import {
    IonHeader,
    IonContent,
    IonRow,
    IonCol,
    useIonModal,
    IonGrid,
    IonPage,
    IonToolbar,
    IonInput,
} from '@ionic/react';
import { ProfilePicture } from 'learn-card-base/components/profilePicture/ProfilePicture';
import NetworkSettings from '../network-settings/NetworkSettings';
import RejectNetworkPrompt from './RejectNetworkPrompt';

import {
    NetworkSettingsState,
    NetworkSettingsEnum,
} from '../network-settings/networkSettings.helpers';
import PushNotificationsPrompt from '../push-notifications-prompt/PushNotificationsPrompt';
import { openPP, openToS } from '../../helpers/externalLinkHelpers';

const StateValidator = z.object({
    profileId: z
        .string()
        .nonempty(' User ID is required.')
        .min(3, ' Must contain at least 3 character(s).')
        .max(25, ' Must contain at most 25 character(s).')
        .regex(
            /^[a-zA-Z0-9-]+$/,
            ` Alpha numeric characters(s) and dashes '-' only, no spaces allowed.`
        ),
});

export const JoinNetworkPrompt: React.FC<{
    handleCloseModal: () => void;
    showNotificationsModal?: boolean;
    showRejectModal?: boolean;
}> = ({ handleCloseModal, showNotificationsModal = false, showRejectModal = true }) => {
    const { initWallet } = useWallet();
    const { refetch } = useGetCurrentLCNUser();
    const { refetch: refetchIsCurrentUserLCNUser } = useIsCurrentUserLCNUser();
    const currentUser = useCurrentUser();
    const queryClient = useQueryClient();
    const [step, setStep] = useState<number>(1);
    const [settings, setSettings] = useState<NetworkSettingsState>({
        sendRequests: true,
        receiveRequests: true,
        showDisplayName: true,
        showProfilePicture: true,
    });
    const [profileId, setProfileId] = useState<string | null | undefined>('');
    const [error, setError] = useState<string>('');
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [loading, setLoading] = useState<boolean>(false);

    const [presentModal, dismissModal] = useIonModal(NetworkSettings, {
        handleCloseModal: () => dismissModal(),
        settings: settings,
        handleStateChange: (settingsType: NetworkSettingsEnum, settingState: boolean) =>
            handleStateChange(settingsType, settingState),
    });

    const [presentRejectModal, dismissRejectModal] = useIonModal(RejectNetworkPrompt, {
        handleCloseModal: () => dismissRejectModal(),
    });

    const [presentNotificationPromptModal, dismissNotificationPromptModal] = useIonModal(
        PushNotificationsPrompt,
        {
            handleCloseModal: () => dismissNotificationPromptModal(),
            settings: settings,
            handleStateChange: (settingsType: NetworkSettingsEnum, settingState: boolean) =>
                handleStateChange(settingsType, settingState),
        }
    );

    const handleStateChange = (settingsType: NetworkSettingsEnum, settingState: boolean) => {
        const _settings = settings;

        _settings[settingsType] = !settingState;
        setSettings({ ..._settings });
    };

    const validate = () => {
        const parsedData = StateValidator.safeParse({
            profileId: profileId,
        });

        if (parsedData.success) {
            setErrors({});
            return true;
        }

        if (parsedData.error) {
            setErrors(parsedData.error.flatten().fieldErrors);
        }

        return false;
    };

    // TODO: UI for entering unique @handle
    const handleJoinLearnCardNetwork = async () => {
        if (validate()) {
            try {
                setLoading(true);
                const wallet = await initWallet();
                const didWeb = await wallet.invoke.createProfile({
                    did: wallet.id.did(),
                    profileId: profileId,
                    displayName: currentUser?.name,
                    image: currentUser?.profileImage,
                    notificationsWebhook: getNotificationsEndpoint(),
                });

                if (didWeb) {
                    await refetchIsCurrentUserLCNUser();
                    await wallet.invoke.resetLCAClient();
                    await queryClient.resetQueries();
                    await refetch(); // refetch to sync -> useGetCurrentLCNUser hook
                    handleCloseModal();
                    setLoading(false);

                    if (Capacitor.isNativePlatform() && isPlatformAndroid()) {
                        // ! sync push token for android after LCN profile creation
                        await pushUtilities.syncPushToken();
                    }

                    if (showNotificationsModal && Capacitor.isNativePlatform() && isPlatformIOS()) {
                        // ! push notification permission prompting is restricted to IOS
                        // ! push notifications are enabled on android by default, no prompting is required
                        presentNotificationPromptModal({
                            cssClass: 'generic-modal show-modal ion-disable-focus-trap',
                            backdropDismiss: false,
                            showBackdrop: false,
                        });
                    }
                }
            } catch (err) {
                console.log('createProfile::error', err);
                setError(err?.message);
                setLoading(false);
            }
        }
    };

    const handleNextStep = () => {
        if (step === 1) {
            setStep(2);
        }
    };

    const networkPromptTitle = step === 1 ? 'Join the ScoutPass Network?' : 'Create Your User ID';

    return (
        <>
            <IonRow className="flex flex-col pb-4 w-full">
                <IonCol className="w-full flex items-center justify-center pt-2">
                    <h6 className="tracking-[12px] text-base font-bold text-black">SCOUTPASS</h6>
                </IonCol>
                <IonCol className="w-full flex items-center justify-center mt-8">
                    <h6 className="text-black text-xl font-medium">{networkPromptTitle}</h6>
                </IonCol>
            </IonRow>

            <IonRow className="flex items-center justify-center w-full">
                <div className="relative flex justify-between items-center bg-grayscale-100/40 rounded-[40px] p-0 m-0 pr-[10px] pb-[3px] pt-[3px] object-fill">
                    <ProfilePicture
                        customContainerClass="flex justify-center items-center h-[70px] w-[70px] rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-3xl min-w-[70px] min-h-[70px]"
                        customImageClass="flex justify-center items-center h-[70px] w-[70px] rounded-full overflow-hidden object-cover border-white border-solid border-2 min-w-[70px] min-h-[70px]"
                        customSize={500}
                    />
                </div>
            </IonRow>
            <IonRow className="flex items-center justify-center w-full">
                <IonCol className="text-center">
                    <p className="text-center text-sm font-semibold px-[16px] text-grayscale-800">
                        The ScoutPass Network allows you to exchange credentials and badges with
                        other members.
                    </p>
                    <br />
                    {step === 1 && (
                        <p className="text-center text-sm font-semibold px-[16px] text-grayscale-600">
                            <span className="font-semibold text-grayscale-800">
                                Requesting access to:
                            </span>
                            <br />
                            Send and receive connection requests, display your profile photo and
                            name in your connections’ contacts lists.
                        </p>
                    )}
                    {step === 2 && (
                        <IonRow className="flex flex-col items-center justify-center w-full px-4">
                            <div className="flex flex-col items-center justify-center max-w-[375px] w-full mb-4">
                                <IonInput
                                    autocapitalize="on"
                                    className={`bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base text-left ${error || errors?.profileId ? 'login-input-email-error' : ''
                                        }`}
                                    onIonInput={e => setProfileId(e.detail.value)}
                                    value={profileId}
                                    placeholder="User ID"
                                    type="text"
                                />
                                {error && (
                                    <p className="p-0 m-0 w-full text-left mt-1 text-red-600">
                                        {error}
                                    </p>
                                )}
                                {errors?.profileId && (
                                    <p className="p-0 m-0 w-full text-left mt-1 text-red-600">
                                        {errors?.profileId}
                                    </p>
                                )}
                            </div>
                        </IonRow>
                    )}
                    <br />
                    {/* <button
                                onClick={() => presentModal()}
                                className="text-indigo-500 font-bold"
                            >
                                Edit Access
                            </button> */}
                </IonCol>
            </IonRow>
            <IonRow className="w-full flex items-center justify-center mt-6">
                <IonCol className="flex items-center flex-col max-w-[90%] border-b-[1px] border-grayscale-200">
                    {step === 1 ? (
                        <button
                            onClick={handleNextStep}
                            type="submit"
                            className="flex items-center justify-center text-white rounded-full px-[18px] py-[12px] bg-emerald-700 text-2xl w-full shadow-lg font-medium max-w-[320px]"
                        >
                            Accept
                        </button>
                    ) : (
                        <button
                            onClick={handleJoinLearnCardNetwork}
                            type="submit"
                            className="flex items-center justify-center text-white rounded-full px-[18px] py-[12px] bg-emerald-700 text-2xl w-full shadow-lg font-medium max-w-[320px]"
                        >
                            {loading ? 'Loading...' : 'Continue'}
                        </button>
                    )}

                    <div className="w-full flex items-center justify-center m-4">
                        <button
                            onClick={() => {
                                handleCloseModal();
                                if (showRejectModal) {
                                    presentRejectModal({
                                        cssClass: 'generic-modal show-modal ion-disable-focus-trap',
                                        backdropDismiss: false,
                                        showBackdrop: false,
                                    });
                                }
                            }}
                            className="text-grayscale-900 text-center text-base w-full font-medium"
                        >
                            Don't Accept
                        </button>
                    </div>
                </IonCol>
            </IonRow>
            <IonRow className="flex items-center justify-center mt-4 w-full">
                <IonCol className="flex flex-col items-center justify-center text-center">
                    <p className="text-center text-sm font-normal px-16 text-grayscale-600">
                        You own your own data.
                        <br />
                        All connections are encrypted.
                    </p>
                    <button className="text-indigo-500 font-bold">Learn More</button>
                </IonCol>
            </IonRow>
            <IonRow className="flex items-center justify-center w-full">
                <IonCol className="flex items-center justify-center">
                    <button onClick={openPP} className="text-indigo-500 font-bold text-sm">
                        Privacy Policy
                    </button>
                    <span className="text-indigo-500 font-bold text-sm">&nbsp;•&nbsp;</span>
                    <button onClick={openToS} className="text-indigo-500 font-bold text-sm">
                        Terms of Service
                    </button>
                </IonCol>
            </IonRow>
        </>
    );
};

export default JoinNetworkPrompt;

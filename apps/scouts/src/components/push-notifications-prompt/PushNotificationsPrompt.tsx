import React, { useState } from 'react';

import { Capacitor } from '@capacitor/core';
import { NativeSettings, IOSSettings, AndroidSettings } from 'capacitor-native-settings';

import { IonRow, IonCol, useIonModal } from '@ionic/react';
import NotificationImage from '../../assets/images/notification-polygon.png';
import PushNotificationsSettings from '../push-notification-settings/PushNotificationsSettings';

import {
    PushNotificationsSettingsState,
    PushNotificationSettingsEnum,
} from '../push-notification-settings/pushNotifications.helpers';
import { pushUtilities } from 'learn-card-base';
import { openToS, openPP } from '../../helpers/externalLinkHelpers';
import ModalLayout from '../../layout/ModalLayout';

export const PushNotificationsPrompt: React.FC<{ handleCloseModal: () => void }> = ({
    handleCloseModal,
}) => {

    const [settings, setSettings] = useState<PushNotificationsSettingsState>({
        connectionRequests: true,
        newBoosts: true,
    });

    const [presentModal, dismissModal] = useIonModal(PushNotificationsSettings, {
        handleCloseModal: () => dismissModal(),
        settings: settings,
        handleStateChange: (settingsType: PushNotificationSettingsEnum, settingState: boolean) =>
            handleStateChange(settingsType, settingState),
    });

    const handleStateChange = (
        settingsType: PushNotificationSettingsEnum,
        settingState: boolean
    ) => {
        const _settings = settings;

        _settings[settingsType] = !settingState;
        setSettings({ ..._settings });
    };

    return (
        <ModalLayout handleOnClick={handleCloseModal}>
            <IonRow className="flex flex-col pb-4 pt-2 w-full">
                <IonCol className="w-full flex items-center justify-center">
                    <h6 className="tracking-[12px] text-base font-bold text-black">SCOUTPASS</h6>
                </IonCol>
                <IonCol className="w-full flex items-center justify-center mt-8">
                    <h6 className="text-center text-black text-2xl text-medium">
                        Stay in the Loop?
                    </h6>
                </IonCol>
            </IonRow>

            <IonRow className="w-full flex items-center justify-center">
                <IonCol className="flex items-center justify-around w-full max-w-[600px]">
                    <div className="relative flex flex-col items-center justify-center p-4 rounded-3xl flex-1">
                        <div className="absolute top-0 left-[%50] w-[70px] h-[70px] bg-rose-100 rounded-full" />
                        <img src={NotificationImage} alt="notification icon" className="z-50" />
                    </div>
                </IonCol>
            </IonRow>
            <IonRow className="flex items-center justify-center w-full">
                <IonCol className="text-center">
                    <p className="text-center text-sm font-semibold px-[16px] text-grayscale-600">
                        <span className="font-bold text-grayscale-800">
                            Receive push notifications for:
                        </span>
                        <br />
                        New connection requests, New boosts (like achievements, credentials, and
                        badges).
                    </p>
                    <br />
                    {/* <button
                                onClick={() => presentModal()}
                                className="text-indigo-500 font-bold"
                            >
                                Settings
                            </button> */}
                </IonCol>
            </IonRow>
            <IonRow className="w-full flex items-center justify-center mt-4">
                <IonCol className="flex items-center flex-col max-w-[90%] border-b-[1px] border-grayscale-200">
                    <button
                        onClick={async () => {
                            const permissionState =
                                await pushUtilities.getPushNotificationPermissionState();

                            if (permissionState === 'PENDING') {
                                await pushUtilities.registerNotifications(async () => {
                                    await pushUtilities.syncPushToken();
                                    handleCloseModal();
                                });
                            } else if (
                                permissionState === 'DENIED' ||
                                permissionState === 'GRANTED'
                            ) {
                                await pushUtilities.syncPushToken();
                                try {
                                    if (Capacitor.isPluginAvailable('NativeSettings')) {
                                        const platform = Capacitor.getPlatform();
                                        if (platform === 'ios') {
                                            NativeSettings.openIOS({
                                                option: IOSSettings.App,
                                            });
                                        } else if (platform === 'android') {
                                            NativeSettings.openAndroid({
                                                option: AndroidSettings.ApplicationDetails,
                                            });
                                        } else {
                                            console.warn(
                                                `Unable to open settings for platform: '${platform}`
                                            );
                                        }
                                    }
                                } catch (err) {
                                    console.error('Issue directing user to settings', err);
                                } finally {
                                    handleCloseModal();
                                    await pushUtilities.syncPushToken();
                                }
                            } else {
                                handleCloseModal();
                            }
                        }}
                        type="button"
                        className="flex items-center justify-center text-white rounded-full px-[18px] py-[12px] bg-sp-purple-base text-2xl w-full shadow-lg font-medium max-w-[320px]"
                    >
                        Continue
                    </button>

                    <div className="w-full flex items-center justify-center m-4">
                        <button
                            onClick={() => {
                                handleCloseModal();
                            }}
                            className="text-grayscale-900 text-center text-base w-full font-medium"
                        >
                            Not Yet
                        </button>
                    </div>
                </IonCol>
            </IonRow>
            <IonRow className="flex items-center justify-center mt-4 w-full">
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
        </ModalLayout>
    );
};

export default PushNotificationsPrompt;

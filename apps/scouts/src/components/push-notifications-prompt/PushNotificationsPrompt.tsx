import React, { useState } from 'react';

import { Capacitor } from '@capacitor/core';
import * as m from '../../paraglide/messages.js';
import { NativeSettings, IOSSettings, AndroidSettings } from 'capacitor-native-settings';

import { IonRow, IonCol } from '@ionic/react';
// @ts-ignore
import NotificationImage from '../../assets/images/notification-polygon.png';
import PushNotificationsSettings from '../push-notification-settings/PushNotificationsSettings';

import {
    PushNotificationsSettingsState,
    PushNotificationSettingsEnum,
} from '../push-notification-settings/pushNotifications.helpers';
import { pushUtilities, useModal, ModalTypes } from 'learn-card-base';
import { openToS, openPP } from '../../helpers/externalLinkHelpers';
import ModalLayout from '../../layout/ModalLayout';
import { getLogger } from 'learn-card-base';
const log = getLogger('push-notifications-prompt');

export const PushNotificationsPrompt: React.FC<{ handleCloseModal: () => void }> = ({
    handleCloseModal,
}) => {
    const [settings, setSettings] = useState<PushNotificationsSettingsState>({
        connectionRequests: true,
        newBoosts: true,
    });

    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Center,
        mobile: ModalTypes.Cancel,
    });

    const handleStateChange = (
        settingsType: PushNotificationSettingsEnum,
        settingState: boolean
    ) => {
        const _settings = { ...settings };

        _settings[settingsType] = !settingState;
        setSettings(_settings);
    };

    const presentSettingsModal = () => {
        newModal(
            <PushNotificationsSettings
                handleCloseModal={closeModal}
                settings={settings}
                handleStateChange={(
                    settingsType: PushNotificationSettingsEnum,
                    settingState: boolean
                ) => handleStateChange(settingsType, settingState)}
            />
        );
    };

    return (
        <ModalLayout handleOnClick={handleCloseModal}>
            <IonRow className="flex flex-col pb-4 pt-2 w-full">
                <IonCol className="w-full flex items-center justify-center">
                    <h6 className="tracking-[12px] text-base font-bold text-black">SCOUTPASS</h6>
                </IonCol>
                <IonCol className="w-full flex items-center justify-center mt-8">
                    <h6 className="text-center text-black text-2xl text-medium">
                        {m['notifications.stayInTheLoop']()}
                    </h6>
                </IonCol>
            </IonRow>

            <IonRow className="w-full flex items-center justify-center">
                <IonCol className="flex items-center justify-around w-full max-w-[600px]">
                    <div className="relative flex flex-col items-center justify-center p-4 rounded-3xl flex-1">
                        <div className="absolute top-0 left-[%50] w-[70px] h-[70px] bg-rose-100 rounded-full" />
                        <img src={NotificationImage} alt={m['notifications.notificationIcon']()} className="z-50" />
                    </div>
                </IonCol>
            </IonRow>
            <IonRow className="flex items-center justify-center w-full">
                <IonCol className="text-center">
                    <p className="text-center text-sm font-semibold px-[16px] text-grayscale-600">
                        <span className="font-bold text-grayscale-800">
                            {m['notifications.receivePushFor']()}
                        </span>
                        <br />
                        {m['notifications.pushDescription']()}
                    </p>
                    <br />
                    {/* <button
                                onClick={() => presentSettingsModal()}
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
                                            log.warn(
                                                `Unable to open settings for platform: '${platform}`
                                            );
                                        }
                                    }
                                } catch (err) {
                                    log.error('Issue directing user to settings', err);
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
                        {m['common.continue']()}
                    </button>

                    <div className="w-full flex items-center justify-center m-4">
                        <button
                            onClick={() => {
                                handleCloseModal();
                            }}
                            className="text-grayscale-900 text-center text-base w-full font-medium"
                        >
                            {m['notifications.notYet']()}
                        </button>
                    </div>
                </IonCol>
            </IonRow>
            <IonRow className="flex items-center justify-center mt-4 w-full">
                <IonCol className="flex items-center justify-center">
                    <button onClick={openPP} className="text-indigo-500 font-bold text-sm">
                        {m['login.privacyPolicy']()}
                    </button>
                    <span className="text-indigo-500 font-bold text-sm">&nbsp;•&nbsp;</span>
                    <button onClick={openToS} className="text-indigo-500 font-bold text-sm">
                        {m['login.termsOfService']()}
                    </button>
                </IonCol>
            </IonRow>
        </ModalLayout>
    );
};

export default PushNotificationsPrompt;

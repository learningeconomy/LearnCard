import React from 'react';

import { Capacitor } from '@capacitor/core';
import { NativeSettings, IOSSettings, AndroidSettings } from 'capacitor-native-settings';

import NotificationImage from '../../assets/images/notification-polygon.png';
import { pushUtilities } from 'learn-card-base';
import { openToS, openPP } from '../../helpers/externalLinkHelpers';
import { useBrandingConfig } from 'learn-card-base/config/TenantConfigProvider';

import useTheme from '../../theme/hooks/useTheme';

export const PushNotificationsPrompt: React.FC<{ handleCloseModal: () => void }> = ({
    handleCloseModal,
}) => {
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;
    const brandingConfig = useBrandingConfig();

    return (
        <section className="w-full px-6 pt-6 pb-4">
            <div className="w-full flex flex-col items-center pb-4 pt-2">
                <div className="w-full flex items-center justify-center">
                    <h6 className="tracking-[12px] text-base font-bold text-black">
                        {brandingConfig?.name}
                    </h6>
                </div>
                <div className="w-full flex items-center justify-center mt-8">
                    <h6 className="text-center text-black font-poppins text-xl">
                        Stay in the Loop?
                    </h6>
                </div>
            </div>

            <div className="w-full flex items-center justify-center">
                <div className="relative flex flex-col items-center justify-center p-4 rounded-3xl flex-1 max-w-[600px]">
                    <div className="absolute top-0 left-[%50] w-[70px] h-[70px] bg-rose-100 rounded-full" />
                    <img src={NotificationImage} alt="notification icon" className="z-50" />
                </div>
            </div>
            <div className="flex items-center justify-center w-full">
                <div className="text-center">
                    <p className="text-center text-sm font-semibold px-[16px] text-grayscale-600">
                        <span className="font-bold text-grayscale-800">
                            Receive push notifications for:
                        </span>
                        <br />
                        New connection requests, New boosts (like achievements, credentials, and
                        badges).
                    </p>
                    <br />
                </div>
            </div>
            <div className="w-full flex items-center justify-center mt-4">
                <div className="flex items-center flex-col w-full border-grayscale-200">
                    <button
                        onClick={async () => {
                            const permissionState =
                                await pushUtilities.getPushNotificationPermissionState();

                            console.log({ permissionState });

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
                        className="flex items-center justify-center text-white rounded-full px-[18px] py-[12px] bg-emerald-700 font-poppins text-xl w-full shadow-lg normal max-w-[320px]"
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
                </div>
            </div>
            <div className="flex items-center justify-center mt-4 w-full">
                <div className="flex items-center justify-center">
                    <button onClick={openPP} className={`text-${primaryColor} font-bold text-sm`}>
                        Privacy Policy
                    </button>
                    <span className={`text-${primaryColor} font-bold text-sm`}>•</span>
                    <button onClick={openToS} className={`text-${primaryColor} font-bold text-sm`}>
                        Terms of Service
                    </button>
                </div>
            </div>
        </section>
    );
};

export default PushNotificationsPrompt;

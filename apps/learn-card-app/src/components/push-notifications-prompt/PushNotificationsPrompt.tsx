import React, { useState, useEffect } from 'react';
import { getLogger } from 'learn-card-base';
const log = getLogger('push-notifications-prompt');

import { Capacitor } from '@capacitor/core';
import { NativeSettings, IOSSettings, AndroidSettings } from 'capacitor-native-settings';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';
import { IonSpinner } from '@ionic/react';

import NotificationImage from '../../assets/images/notification-polygon.png';
import { pushUtilities } from 'learn-card-base';
import { ToastTypeEnum, useToast } from 'learn-card-base/hooks/useToast';
import { openToS, openPP } from '../../helpers/externalLinkHelpers';

import useTheme from '../../theme/hooks/useTheme';

export const PushNotificationsPrompt: React.FC<{ handleCloseModal: () => void }> = ({
    handleCloseModal,
}) => {
    const { getColorSet } = useTheme();
    const primaryColor = getColorSet('defaults')?.primary || '#4f46e5';
    const { presentToast } = useToast();

    const [permState, setPermState] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        const checkPermission = async () => {
            const state = await pushUtilities.getPushNotificationPermissionState();
            setPermState(state);
        };
        checkPermission();
    }, []);

    const handleEnable = async () => {
        setBusy(true);
        try {
            await pushUtilities.registerForNotifications(async success => {
                if (success) {
                    await pushUtilities.syncPushToken();
                    presentToast('Notifications enabled', {
                        type: ToastTypeEnum.Success,
                        hasDismissButton: true,
                    });
                    setPermState('GRANTED');
                } else {
                    presentToast('You can turn on notifications anytime in Settings.', {
                        type: ToastTypeEnum.Error,
                        hasDismissButton: true,
                    });
                    const s = await pushUtilities.getPushNotificationPermissionState();
                    setPermState(s);
                }
            });
        } catch (err) {
            log.error('Failed to enable notifications', err);
            presentToast('Couldn’t enable notifications. Please try again.', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        } finally {
            setBusy(false);
        }
    };

    const handleOpenSettings = async () => {
        try {
            if (Capacitor.isPluginAvailable('NativeSettings')) {
                const platform = Capacitor.getPlatform();
                if (platform === 'ios') {
                    await NativeSettings.openIOS({ option: IOSSettings.App });
                } else if (platform === 'android') {
                    await NativeSettings.openAndroid({
                        option: AndroidSettings.ApplicationDetails,
                    });
                } else {
                    log.warn(`Unable to open settings for platform: '${platform}'`);
                }
            }
        } catch (err) {
            log.error('Issue directing user to settings', err);
        }
    };

    const renderStatusPill = () => {
        if (permState === 'GRANTED') {
            return (
                <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
                    On
                </div>
            );
        }
        if (permState === 'DENIED') {
            return (
                <div className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
                    Blocked
                </div>
            );
        }
        return (
            <div className="bg-grayscale-100 text-grayscale-600 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
                Off
            </div>
        );
    };

    return (
        <section className="h-full flex flex-col bg-white">
            {/* Top Bar */}
            <div
                className="shrink-0 flex items-center px-4 py-3 border-b border-grayscale-100"
                style={{ paddingTop: 'calc(env(safe-area-inset-top) + 1rem)' }}
            >
                <button
                    onClick={handleCloseModal}
                    className="flex items-center text-grayscale-600 hover:text-grayscale-900 transition-colors font-poppins font-medium"
                >
                    <ChevronLeft className="w-6 h-6 mr-1" />
                    Back
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="pt-10 pb-8 px-6 flex flex-col items-center max-w-[500px] mx-auto">
                    <div className="w-24 h-24 mb-6 rounded-full bg-rose-50 flex items-center justify-center shadow-inner">
                        <img
                            src={NotificationImage}
                            alt="notification icon"
                            className="w-16 h-16 object-contain"
                        />
                    </div>

                    <h2 className="text-2xl font-bold text-grayscale-900 font-poppins mb-3 text-center">
                        Notifications
                    </h2>

                    <div className="mb-4">{renderStatusPill()}</div>

                    <p className="text-center text-[15px] text-grayscale-600 leading-relaxed mb-8">
                        Get notified so you never miss what matters.
                    </p>

                    <div className="w-full bg-grayscale-50 rounded-[20px] p-5">
                        <h3 className="text-sm font-semibold text-grayscale-900 mb-4">
                            You'll be notified about:
                        </h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                <span className="text-[15px] text-grayscale-700 leading-relaxed">
                                    New connection requests
                                </span>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                <span className="text-[15px] text-grayscale-700 leading-relaxed">
                                    New boosts — achievements, credentials, and badges.
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Action Area */}
            <div
                className="shrink-0 px-6 pt-4 border-t border-grayscale-100 bg-white"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
            >
                <div className="max-w-[500px] mx-auto flex flex-col items-center gap-4">
                    {permState === 'PENDING' || permState === null ? (
                        <button
                            onClick={handleEnable}
                            disabled={busy || permState === null}
                            className="flex items-center justify-center text-white rounded-full px-6 py-3.5 font-poppins font-semibold text-[17px] w-full shadow-[0_4px_12px_rgba(79,70,229,0.25)] hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed"
                            style={{ backgroundColor: primaryColor }}
                        >
                            {busy ? (
                                <>
                                    <IonSpinner
                                        name="crescent"
                                        color="light"
                                        className="w-5 h-5 mr-2"
                                    />
                                    Working...
                                </>
                            ) : (
                                'Enable Notifications'
                            )}
                        </button>
                    ) : permState === 'DENIED' ? (
                        <button
                            onClick={handleOpenSettings}
                            className="flex items-center justify-center text-white rounded-full px-6 py-3.5 font-poppins font-semibold text-[17px] w-full shadow-[0_4px_12px_rgba(79,70,229,0.25)] hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: primaryColor }}
                        >
                            Open Settings
                        </button>
                    ) : (
                        <button
                            onClick={handleOpenSettings}
                            className="flex items-center justify-center text-grayscale-700 bg-grayscale-100 hover:bg-grayscale-200 rounded-full px-6 py-3.5 font-poppins font-semibold text-[17px] w-full transition-colors"
                        >
                            Open System Settings
                        </button>
                    )}

                    {permState !== 'GRANTED' && (
                        <button
                            onClick={handleCloseModal}
                            className="text-[15px] font-medium text-grayscale-500 hover:text-grayscale-900 transition-colors"
                        >
                            Not now
                        </button>
                    )}

                    <div className="flex items-center justify-center gap-2 mt-2">
                        <button
                            onClick={openPP}
                            className="text-xs font-medium hover:opacity-80 transition-opacity"
                            style={{ color: primaryColor }}
                        >
                            Privacy Policy
                        </button>
                        <span className="text-xs font-medium" style={{ color: primaryColor }}>
                            •
                        </span>
                        <button
                            onClick={openToS}
                            className="text-xs font-medium hover:opacity-80 transition-opacity"
                            style={{ color: primaryColor }}
                        >
                            Terms of Service
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PushNotificationsPrompt;

import React from 'react';
import { Link } from 'react-router-dom';
import { useFlags } from 'launchdarkly-react-client-sdk';

import * as m from '../../../paraglide/messages.js';

import LaunchPadAiSessionComingSoon from './LaunchPadAiSessionsComingSoon';

import {
    ModalTypes,
    useGetUnreadUserNotifications,
    useModal,
    useAiFeatureGate,
    useToast,
    ToastTypeEnum,
} from 'learn-card-base';

import { useFeatureConfig } from 'learn-card-base/config/TenantConfigProvider';
import { useTheme } from '../../../theme/hooks/useTheme';
import { IconSetEnum } from '../../../theme/icons';
import { ColorSetEnum } from '../../../theme/colors';
import { StyleSetEnum } from '../../../theme/styles';

const LaunchPadHeaderLinks: React.FC = () => {
    const { launchPadQuickActions } = useFeatureConfig();
    const { getIconSet, getColorSet, getStyleSet, theme } = useTheme();
    const {
        contacts: ContactsIcon,
        aiSessions: AiSessionsIcon,
        alerts: AlertsIcon,
    } = getIconSet(IconSetEnum.launchPad);
    const { contacts, aiSessions, alerts } = getColorSet(ColorSetEnum.launchPad);
    const styles = getStyleSet(StyleSetEnum.launchPad);

    const { newModal } = useModal({ desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel });
    const flags = useFlags();
    const { isAiEnabled, reason } = useAiFeatureGate();
    const { presentToast } = useToast();

    const { data: unreadNotifications } = useGetUnreadUserNotifications();

    const unreadCount = unreadNotifications?.notifications?.length;

    const enableLaunchPadUpdates = flags?.enableLaunchPadUpdates;

    if (!launchPadQuickActions) return null;

    return (
        <div className="w-full flex items-center justify-center px-2 bg-white mb-9 relative z-10">
            <div className="flex items-center justify-around w-full max-w-[600px]">
                <Link
                    to="/contacts"
                    className="relative flex flex-col items-center justify-center p-4 rounded-3xl flex-1 xxs:p-1 max-h-[133px] min-h-[133px]"
                >
                    <ContactsIcon className={styles?.iconStyles} />
                    <p
                        className={`text-${contacts.color} ${styles?.textStyles} font-poppins font-semibold phone:text-[14px]`}
                    >
                        {m['launchpad.header.contacts']()}
                    </p>
                </Link>

                {enableLaunchPadUpdates && isAiEnabled ? (
                    <Link
                        to="/ai/topics"
                        className="relative flex flex-col items-center justify-center p-4 rounded-3xl flex-1 xxs:p-1 max-h-[133px] min-h-[133px]"
                    >
                        <AiSessionsIcon className={styles?.iconStyles} />
                        <p
                            className={`text-${aiSessions.color} ${styles?.textStyles} font-poppins font-semibold phone:text-[14px] text-center`}
                        >
                            {m['launchpad.header.aiSessions']()}
                        </p>
                    </Link>
                ) : enableLaunchPadUpdates && !isAiEnabled ? (
                    <button
                        onClick={() => {
                            const msg =
                                reason === 'disabled_minor'
                                    ? m['launchpad.aiDisabledMinor']()
                                    : m['launchpad.aiDisabledPrivacy']();
                            presentToast(msg, { type: ToastTypeEnum.Error });
                        }}
                        className="relative flex flex-col items-center justify-center p-4 rounded-3xl flex-1 xxs:p-1 max-h-[133px] min-h-[133px] opacity-50"
                    >
                        <AiSessionsIcon className={styles?.iconStyles} />
                        <p
                            className={`text-${aiSessions.color} ${styles?.textStyles} font-poppins font-semibold phone:text-[14px] text-center`}
                        >
                            {m['launchpad.header.aiSessions']()}
                        </p>
                    </button>
                ) : (
                    <button
                        onClick={() => {
                            newModal(<LaunchPadAiSessionComingSoon />, {
                                sectionClassName: '!max-w-[370px]',
                            });
                        }}
                        className="relative flex flex-col items-center justify-center p-4 rounded-3xl flex-1 xxs:p-1 max-h-[133px] min-h-[133px]"
                    >
                        <AiSessionsIcon className={styles?.iconStyles} />
                        <p
                            className={`text-${aiSessions.color} ${styles?.textStyles} font-poppins font-semibold phone:text-[14px] text-center`}
                        >
                            {m['launchpad.header.aiSessions']()}
                        </p>
                    </button>
                )}

                <Link
                    to="/notifications"
                    className="relative flex flex-col items-center justify-center p-4 rounded-3xl flex-1 xxs:p-1 max-h-[133px] min-h-[133px]"
                >
                    <div
                        className={`py-[2px] px-[12px] font-bold rounded-[20px] text-sm flex items-center justify-center notification-badge xxs:top-[-0px] xxs:right-[15px] ${styles?.indicatorStyles} ${alerts.indicatorTextColor} ${alerts.indicatorBgColor}`}
                    >
                        {unreadCount ?? 0}
                    </div>
                    <AlertsIcon className={styles?.iconStyles} />
                    <p
                        className={`text-${alerts.color} ${styles?.textStyles} font-poppins font-semibold phone:text-[14px] pt-1`}
                    >
                        {m['launchpad.header.alerts']()}
                    </p>
                </Link>
            </div>
        </div>
    );
};

export default LaunchPadHeaderLinks;

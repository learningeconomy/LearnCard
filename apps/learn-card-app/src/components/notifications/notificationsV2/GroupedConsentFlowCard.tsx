import React from 'react';
import moment from 'moment';
import { IonIcon } from '@ionic/react';
import { chevronForwardOutline, syncOutline } from 'ionicons/icons';

import { ErrorBoundary } from '@sentry/react';
import X from 'learn-card-base/svgs/X';
import {
    ModalTypes,
    UserProfilePicture,
    useGetProfile,
    useModal,
    useUpdateNotification,
} from 'learn-card-base';
import { NotificationType } from 'packages/plugins/lca-api-plugin/src/types';
import { getTransactionDate, parseContractName } from './consentFlowGrouping';
import ConsentActivityDetailModal from './ConsentActivityDetailModal';

type GroupedConsentFlowCardProps = {
    notifications: NotificationType[];
};

const GroupedConsentFlowCard: React.FC<GroupedConsentFlowCardProps> = ({ notifications }) => {
    const { mutateAsync: updateNotification } = useUpdateNotification();
    const { newModal } = useModal({ desktop: ModalTypes.Center, mobile: ModalTypes.BottomSheet });

    const primary = notifications[0];
    const { data: profile } = useGetProfile(primary?.from?.profileId);

    const actorName = profile?.displayName || primary?.from?.displayName || 'Someone';
    const contractName = parseContractName(primary?.message?.body) || 'your contract';
    const count = notifications.length;
    const hasUnread = notifications.some(notification => !notification?.read);
    const latestDate = moment(getTransactionDate(primary)).format('MMM D, YYYY');

    const markGroupRead = async () => {
        await Promise.all(
            notifications
                .filter(notification => notification?._id && !notification.read)
                .map(notification =>
                    updateNotification({
                        notificationId: notification._id as string,
                        payload: { read: true },
                    })
                )
        );
    };

    const handleArchiveGroup = async (event: React.MouseEvent) => {
        event.stopPropagation();
        await Promise.all(
            notifications
                .filter(notification => notification?._id)
                .map(notification =>
                    updateNotification({
                        notificationId: notification._id as string,
                        payload: { archived: true, read: true },
                    })
                )
        );
    };

    const openDetails = () => {
        markGroupRead();
        newModal(
            <ConsentActivityDetailModal
                notifications={notifications}
                onArchiveGroup={handleArchiveGroup}
            />,
            { sectionClassName: '!max-w-[520px]' }
        );
    };

    return (
        <ErrorBoundary
            fallback={
                <div className="flex w-full max-w-[600px] items-start p-4 my-2 bg-white">
                    Unable to load notification
                </div>
            }
        >
            <div
                onClick={openDetails}
                className="flex items-center justify-between gap-3 w-full max-w-[600px] p-4 my-2 rounded-[20px] border border-grayscale-200 bg-white hover:bg-grayscale-10 transition-colors cursor-pointer"
            >
                <div className="flex items-start gap-3 min-w-0">
                    <div className="relative shrink-0">
                        <div className="w-[44px] h-[44px] overflow-hidden rounded-full">
                            <UserProfilePicture
                                user={profile ?? primary?.from}
                                customImageClass="w-full h-full object-cover"
                                customContainerClass="flex items-center justify-center h-full text-white font-medium text-sm"
                            />
                        </div>
                        <span className="absolute -bottom-1 -right-1 flex items-center justify-center w-5 h-5 rounded-full bg-grayscale-100 border border-white">
                            <IonIcon
                                icon={syncOutline}
                                className="text-grayscale-600 text-[12px]"
                            />
                        </span>
                    </div>

                    <div className="flex flex-col min-w-0 gap-0.5 mt-0.5">
                        <div className="flex items-center gap-2">
                            <h4 className="font-poppins font-semibold text-sm text-grayscale-900 truncate">
                                {actorName}
                            </h4>
                            {hasUnread && (
                                <span className="shrink-0 w-2 h-2 rounded-full bg-emerald-500" />
                            )}
                        </div>
                        <div className="flex items-center flex-wrap gap-2 mt-0.5">
                            <p className="text-sm text-grayscale-600 truncate">
                                Shared credentials with {contractName}
                            </p>
                            {count > 1 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-grayscale-100 text-xs font-medium text-grayscale-700">
                                    {count} updates
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-grayscale-400 mt-0.5">Latest {latestDate}</p>
                    </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    <button
                        onClick={handleArchiveGroup}
                        aria-label="Archive"
                        className="flex items-center justify-center h-8 w-8 rounded-full hover:bg-grayscale-100 transition-colors"
                    >
                        <X className="text-grayscale-500 w-4 h-4" />
                    </button>
                    <IonIcon
                        icon={chevronForwardOutline}
                        className="text-grayscale-400 text-[18px]"
                    />
                </div>
            </div>
        </ErrorBoundary>
    );
};

export default GroupedConsentFlowCard;

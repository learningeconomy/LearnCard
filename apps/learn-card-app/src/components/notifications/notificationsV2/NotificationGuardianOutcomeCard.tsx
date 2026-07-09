import React from 'react';
import { useHistory } from 'react-router-dom';
import moment from 'moment';
import { ErrorBoundary } from '@sentry/react';
import { UserProfilePicture, useModal } from 'learn-card-base';
import Checkmark from 'learn-card-base/svgs/Checkmark';
import X from 'learn-card-base/svgs/X';
import { NotificationType } from 'packages/plugins/lca-api-plugin/src/types';
import { notificationCardStyles } from './types';
import { clearFinalizeCache } from '../../../hooks/useFinalizeInboxCredentials';
import autoVerifyStore from '../../../stores/autoVerifyStore';
import { getCategoryRouteForAchievementType } from '../../../helpers/categoryRoutes';

type NotificationGuardianOutcomeCardProps = {
    notification: NotificationType;
    variant: 'approved' | 'rejected';
    onRead?: () => void;
};

const NotificationGuardianOutcomeCard: React.FC<NotificationGuardianOutcomeCardProps> = ({
    notification,
    variant,
    onRead,
}) => {
    const history = useHistory();
    const { closeAllModals } = useModal();
    const transactionDate = notification.sent;
    const formattedDate = moment(transactionDate).format('MMM D, YYYY h:mma');

    const accentColor = variant === 'approved' ? 'text-emerald-600' : 'text-red-500';
    const statusText = variant === 'approved' ? 'Approved' : 'Not Approved';

    const handleClick = async () => {
        await onRead?.();

        if (variant === 'approved') {
            // Clear finalize cache so the newly-approved credential gets picked up
            clearFinalizeCache();
            // Trigger re-finalization so the credential moves from inbox to wallet
            autoVerifyStore.set.markVerifySuccess();

            // Navigate to the credential's category page if we know the type, otherwise wallet
            const achievementType = notification?.data?.achievementType as string | undefined;
            const route = getCategoryRouteForAchievementType(achievementType);
            closeAllModals();
            history.push(route ?? '/wallet');
        }
    };

    return (
        <ErrorBoundary
            fallback={
                <div className={notificationCardStyles.fallbackShell}>
                    Unable to load notification
                </div>
            }
        >
            <div
                onClick={handleClick}
                className={`${notificationCardStyles.shell} min-h-[120px] cursor-pointer`}
            >
                <div className="notification-card-left-side px-[0px] flex cursor-pointer shrink-0">
                    <div className="overflow-hidden cursor-pointer w-[90px] h-[90px] flex items-start notification-card-thumbnail">
                        <UserProfilePicture
                            user={notification.from}
                            customContainerClass="flex justify-center items-center w-full h-full rounded-full overflow-hidden text-white font-medium text-4xl p-[6px]"
                            customImageClass="flex justify-center items-center w-full h-full rounded-full overflow-hidden object-cover"
                            customSize={90}
                        />
                    </div>
                </div>

                <div className="flex flex-col justify-center items-start relative w-full">
                    <div className="text-left ml-3 flex flex-col items-start justify-start w-full">
                        <h4
                            className={`cursor-pointer ${notificationCardStyles.title}`}
                            data-testid="notification-title"
                        >
                            {notification.message?.body}
                        </h4>
                        <p
                            className={`${notificationCardStyles.meta} mt-[10px] ${accentColor}`}
                            data-testid="notification-type"
                        >
                            {statusText}{' '}
                            {transactionDate && (
                                <span className={notificationCardStyles.date}>
                                    • {formattedDate}
                                </span>
                            )}
                        </p>

                        <div className="relative flex items-center mt-3 w-full">
                            {variant === 'approved' ? (
                                <div
                                    className={`${notificationCardStyles.primaryButton} border-emerald-600 text-emerald-600 bg-white`}
                                >
                                    View Credential <Checkmark className="h-[24px] p-0 m-0" />
                                </div>
                            ) : (
                                <div
                                    className={`${notificationCardStyles.primaryButton} border-grayscale-300 text-grayscale-500 bg-white`}
                                >
                                    Rejected <X className="h-[14px] w-[14px] ml-1" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
};

export default NotificationGuardianOutcomeCard;

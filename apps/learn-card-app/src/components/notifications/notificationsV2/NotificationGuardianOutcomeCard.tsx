import React from 'react';
import { useHistory } from 'react-router-dom';
import moment from 'moment';
import { ErrorBoundary } from '@sentry/react';
import { UserProfilePicture } from 'learn-card-base';
import Checkmark from 'learn-card-base/svgs/Checkmark';
import X from 'learn-card-base/svgs/X';
import { CATEGORY_MAP } from 'learn-card-base/helpers/credentialHelpers';
import { NotificationType } from 'packages/plugins/lca-api-plugin/src/types';
import { clearFinalizeCache } from '../../../hooks/useFinalizeInboxCredentials';
import autoVerifyStore from '../../../stores/autoVerifyStore';

const CATEGORY_DISPLAY_TO_ROUTE: Record<string, string> = {
    'Achievement': '/achievements',
    'Social Badge': '/socialBadges',
    'Learning History': '/learninghistory',
    'Accomplishment': '/accomplishments',
    'Accommodation': '/accommodations',
    'Work History': '/workhistory',
    'Family': '/families',
    'ID': '/ids',
    'Skill': '/skills',
    'Membership': '/memberships',
};

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
            const categoryName = achievementType ? CATEGORY_MAP[achievementType] : undefined;
            const route = categoryName ? CATEGORY_DISPLAY_TO_ROUTE[categoryName] : undefined;
            history.push(route ?? '/wallet');
        }
    };

    return (
        <ErrorBoundary
            fallback={
                <div className="flex min-h-[120px] justify-start max-w-[600px] items-start relative w-full py-[10px] px-[10px] bg-white my-[15px]">
                    Unable to load notification
                </div>
            }
        >
            <div
                onClick={handleClick}
                className="flex min-h-[120px] justify-start max-w-[600px] items-start relative w-full py-[10px] px-[10px] bg-white my-[15px] cursor-pointer"
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
                            className="cursor-pointer font-semibold tracking-wide line-clamp-2 text-grayscale-900 text-[14px] pr-[20px] notification-card-title"
                            data-testid="notification-title"
                        >
                            {notification.message?.body}
                        </h4>
                        <p
                            className={`font-bold p-0 mt-[10px] leading-none tracking-wide text-[12px] ${accentColor} notification-card-type-text`}
                            data-testid="notification-type"
                        >
                            {statusText}{' '}
                            {transactionDate && (
                                <span className="text-grayscale-600 normal-case font-normal text-[12px]">
                                    • {formattedDate}
                                </span>
                            )}
                        </p>

                        <div className="relative flex items-center mt-3 w-full">
                            {variant === 'approved' ? (
                                <div className="notification-claim-btn flex items-center justify-center flex-1 rounded-[24px] border-2 border-solid border-emerald-600 text-emerald-600 bg-white font-semibold py-2 px-3 tracking-wide text-[13px]">
                                    View Credential <Checkmark className="h-[24px] p-0 m-0" />
                                </div>
                            ) : (
                                <div className="notification-claim-btn flex items-center justify-center flex-1 rounded-[24px] border-2 border-solid border-grayscale-300 text-grayscale-500 bg-white font-semibold py-2 px-3 tracking-wide text-[13px]">
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

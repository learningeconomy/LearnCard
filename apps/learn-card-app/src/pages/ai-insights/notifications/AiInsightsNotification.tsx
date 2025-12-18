import React, { useState, useRef, useEffect } from 'react';
import { capitalize } from 'lodash';
import moment from 'moment';

import useOnScreen from 'learn-card-base/hooks/useOnScreen';
import useConsentFlow from '../../../pages/consentFlow/useConsentFlow';

import X from 'learn-card-base/svgs/X';
import { ErrorBoundary } from 'react-error-boundary';
import Checkmark from 'learn-card-base/svgs/Checkmark';
import ArrowArcLeft from '../../../assets/images/ArrowArcLeft.svg';
import ShareInsightsWithUser from '../share-insights/ShareInsightsWithUser';
import LearnerInsightsPreview from '../learner-insights/LearnerInsightsPreview';
import AiInsightsParentConsent from '../ai-insights-parent-consent/AiInsightsParentConsent';
import NotificationSkeleton from '../../../components/notifications/notificationsV2/NotificationSkeleton';
import { RequestInsightsFromUserModalWrapper } from '../request-insights/RequestInsightsFromUserModal';

import {
    useUpdateNotification,
    UserProfilePicture,
    useContract,
    useContractRequestStatusForProfile,
    useModal,
    ModalTypes,
    useGetCurrentLCNUser,
    useToast,
    switchedProfileStore,
} from 'learn-card-base';

import {
    NotificationTypeEnum,
    NotificationTypeStyles,
} from '../../../components/notifications/notificationsV2/types';

import { LCNProfile } from '@learncard/types';
import { useGetAiInsightsServicesContract } from '../learner-insights/learner-insights.helpers';

type AiInsightsNotificationProps = {
    notification: any;
    claimStatus?: boolean;
    handleArchive?: () => void;
    cardLoading?: boolean;
};

const AiInsightsNotification: React.FC<AiInsightsNotificationProps> = ({
    notification,
    claimStatus = false,
    handleArchive,
    cardLoading,
}) => {
    const { currentLCNUser } = useGetCurrentLCNUser();
    const { presentToast } = useToast();
    const { newModal } = useModal({ desktop: ModalTypes.Right, mobile: ModalTypes.Right });

    // external contract (teacher -> student) -> (student -> teacher)
    // student consents to share insights
    const contractUri = notification?.data?.metadata?.contractUri;
    const { data: contract } = useContract(contractUri, !!contractUri);
    const { openConsentFlowModal, hasConsented } = useConsentFlow(contract, undefined, contractUri);

    // current user contract (student -> teacher) -> (teacher -> student)
    // teacher sends request to student after accepting shared insights request
    const { contractUri: currentUserContractUri } = useGetAiInsightsServicesContract(
        currentLCNUser?.did!,
        true
    );

    const [isClaimed, setIsClaimed] = useState<boolean>(claimStatus || false);

    const [isRead, setIsRead] = useState<boolean>(notification?.read || false);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        if (hasConsented) {
            setIsClaimed(true);
        }
    }, [hasConsented]);

    const isContractOwner = contract?.owner?.profileId === currentLCNUser?.profileId;
    const isShareRequest = notification?.data?.metadata?.subtype === 'share';

    let targetProfileId = notification?.from?.profileId;

    if (!hasConsented && !isContractOwner) {
        targetProfileId = currentLCNUser?.profileId;
    } else if (hasConsented && !isContractOwner) {
        targetProfileId = currentLCNUser?.profileId;
    } else if (isContractOwner) {
        targetProfileId = notification?.from?.profileId;
    }

    if (isShareRequest) {
        targetProfileId = notification?.from?.profileId;
    }

    const { data: insightsRequest } = useContractRequestStatusForProfile(
        notification?.data?.transaction?.id,
        isShareRequest
            ? currentUserContractUri
            : (notification?.data?.metadata?.contractUri as string),
        targetProfileId as string
    );

    // Ref for the element that we want to detect whether on screen
    const ref: any = useRef<HTMLDivElement>();
    // Call the hook passing in ref and root margin
    // In this case it would only be considered onScreen if more ...
    // ... than 300px of element is visible.
    const onScreen: boolean = useOnScreen<HTMLDivElement>(ref, '-130px');

    const { mutate: updateNotification } = useUpdateNotification();

    const handleReadStatus = async () => {
        setIsRead(true);
        await updateNotification({
            notificationId: notification?._id,
            payload: { read: true },
        });
    };

    const {
        iconCircleStyles,
        textStyles,
        viewButtonStyles,
        claimedButtonStyles,
        unclaimedButtonStyles,
        typeText,
    } = NotificationTypeStyles[NotificationTypeEnum.consentFlowTransaction ?? 'loading'];

    let claimButtonStyles = isClaimed
        ? `${claimedButtonStyles} !bg-emerald-600/50`
        : `${unclaimedButtonStyles} !bg-emerald-600`;

    const issueDate = moment(notification?.sent).format('MMMM DD YYYY');
    let buttonText: string = '';

    const expiredRequest =
        insightsRequest?.status === undefined ||
        insightsRequest?.status === null ||
        !insightsRequest?.status;

    if (hasConsented) {
        buttonText = 'Accepted';
    } else if (insightsRequest?.status === 'accepted' && !hasConsented) {
        buttonText = 'View Insights';
    } else if (expiredRequest) {
        buttonText = 'Expired';
        claimButtonStyles = `${claimedButtonStyles} !bg-grayscale-200`;
    } else {
        buttonText = 'View Request';
    }

    if (isShareRequest && !insightsRequest?.status) {
        claimButtonStyles = `${claimedButtonStyles} !bg-emerald-600`;
        buttonText = 'View Request';
    } else if (isShareRequest && !!insightsRequest?.status) {
        claimButtonStyles = `${claimedButtonStyles} !bg-emerald-600/50`;
        buttonText = 'Accepted';
    }

    const isChild = switchedProfileStore.use.profileType() === 'child';
    const isForwardedRequest = notification?.data?.metadata?.subtype === 'forwarded-share';
    if (isForwardedRequest) {
        buttonText = 'View Request';
        claimButtonStyles = `${claimedButtonStyles} !bg-emerald-600`;
    }

    if (isChild) {
        buttonText = 'Get Permission';
        claimButtonStyles = `${claimedButtonStyles} !bg-emerald-600`;

        if (hasConsented) {
            buttonText = 'Approved';
            claimButtonStyles = `${claimedButtonStyles} !bg-emerald-600/50`;
        }

        if (expiredRequest) {
            buttonText = 'Expired';
            claimButtonStyles = `${claimedButtonStyles} !bg-grayscale-200`;
        }
    }

    const isArchived = false;
    let title = notification?.message?.body || notification?.message?.title;

    const handleArchiveAction = () => {
        handleArchive?.();
    };

    const handleMarkRead = () => {
        if (!isRead) {
            setIsRead(true);
            handleReadStatus?.();
        }
    };

    const handleButtonClick = () => {
        if (expiredRequest && !isShareRequest && !isForwardedRequest) return;

        if (isForwardedRequest) {
            if (contractUri && notification?.data?.metadata?.targetProfileId) {
                openConsentFlowModal(
                    true,
                    () => {
                        presentToast('AI Insights shared!');
                    },
                    notification?.data?.metadata?.targetProfileId as string,
                    notification?.from?.profileId as string
                );
                return;
            } else {
                newModal(
                    <ShareInsightsWithUser
                        targetProfile={notification?.data?.metadata?.targetProfileId as string}
                        childProfileId={notification?.from?.profileId as string}
                    />,
                    { className: '!bg-transparent' },
                    { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
                );
                return;
            }
        }

        if (isChild && !hasConsented) {
            newModal(
                <AiInsightsParentConsent targetProfile={notification?.from as LCNProfile} />,
                { className: '!bg-transparent' },
                { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
            );
            return;
        }

        if (insightsRequest?.status === 'accepted' && !hasConsented) {
            if (isShareRequest && !!insightsRequest?.status) return;
            handleMarkRead();
            newModal(
                <LearnerInsightsPreview
                    profile={notification?.from as LCNProfile}
                    readStatus={isRead ? 'seen' : 'unseen'}
                    status={insightsRequest?.status}
                />
            );
        } else if (isShareRequest && !insightsRequest?.status) {
            handleMarkRead();
            newModal(
                <RequestInsightsFromUserModalWrapper
                    profileId={notification?.from?.profileId as string}
                />,
                { className: '!bg-transparent' },
                { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
            );
        } else {
            handleMarkRead();
            openConsentFlowModal(
                true,
                () => {
                    presentToast('AI Insights shared!');
                },
                notification?.from?.profileId as string
            );
        }
    };

    const handleCardClick = () => {
        if (expiredRequest && !isShareRequest && !isForwardedRequest) return;
        handleButtonClick();
        handleMarkRead();
    };

    if (cardLoading || isLoading) {
        return <NotificationSkeleton />;
    }

    return (
        <>
            <ErrorBoundary
                fallback={
                    <div
                        className={`flex min-h-[120px] justify-start max-w-[600px] items-start relative w-full py-[10px] px-[10px] bg-white my-[15px]`}
                    >
                        Unable to load notification
                    </div>
                }
            >
                <div
                    onClick={handleCardClick}
                    ref={ref}
                    className={`flex min-h-[120px] justify-start max-w-[600px] items-start relative w-full py-[10px] px-[10px] bg-white my-[15px]`}
                >
                    {!isRead && !isLoading && (
                        <div className="notification-count-mobile unread-indicator-dot" />
                    )}
                    <div className="notification-card-left-side px-[0px] flex cursor-pointer">
                        <div className="w-[78px] h-[78px] min-w-[78px] min-h-[78px] max-w-[78px] max-h-[78px] overflow-hidden rounded-full">
                            <UserProfilePicture
                                user={notification.from}
                                customImageClass="w-full h-full object-cover"
                                customContainerClass="flex items-center justify-center h-full text-white font-medium text-lg"
                            />
                        </div>

                        {isLoading && <div className="w-[78px] h-[78px] rounded-full bg-gray-50" />}
                    </div>
                    <div className="flex flex-col justify-center items-start relative w-full">
                        <div className="text-left ml-3 flex flex-col items-start justify-start w-full">
                            <h4
                                className="cursor-pointer font-semibold tracking-wide line-clamp-2 text-grayscale-900 text-[14px] pr-[20px] notification-card-title"
                                data-testid="notification-title"
                            >
                                {capitalize(title)}
                            </h4>
                            <p
                                className={`font-bold p-0 mt-[10px] leading-none tracking-wide line-clamp-1 text-[12px] notification-card-type-text text-indigo-600`}
                                data-testid="notification-type"
                            >
                                Insights{' '}
                                {issueDate && (
                                    <span
                                        className="text-[rgba(24,34,78,0.8)] normal-case font-normal text-[12px] notification-card-type-issue-date"
                                        data-testid="notification-cred-issue-date"
                                    >
                                        • {issueDate}
                                    </span>
                                )}
                            </p>

                            <div className="flex relative items-center justify-between mt-3 w-full">
                                <button
                                    className={`cursor-pointer notification-claim-btn flex items-center mr-[15px] w-[143px] justify-center flex-1 rounded-[24px] border-2 border-solid font-semibold font-poppins py-2 px-3 tracking-wide ${claimButtonStyles}`}
                                    onClick={e => {
                                        e.stopPropagation();
                                        handleButtonClick();
                                    }}
                                    name="notification-claim-button"
                                >
                                    {isLoading ? 'Loading...' : buttonText}
                                    {isClaimed && <Checkmark className="h-[24px] p-0 m-0" />}{' '}
                                </button>

                                <button
                                    onClick={handleArchiveAction}
                                    className={`rounded-[40px] flex items-center justify-center border-[1px] border-[#E2E3E9] border-solid h-[42px] w-[42px] bg-white font-semibold mr-2 p-[0px] tracking-wide`}
                                    name="notification-view-button"
                                >
                                    {!isArchived && (
                                        <X className="text-grayscale-700 w-[20px] h-[20px] notification-card-x" />
                                    )}

                                    {isArchived && (
                                        <img
                                            src={ArrowArcLeft ?? ''}
                                            alt="Cancel"
                                            className="notification-card-x"
                                        />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </ErrorBoundary>
        </>
    );
};

export default AiInsightsNotification;

import React, { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { capitalize } from 'lodash';
import useOnScreen from 'learn-card-base/hooks/useOnScreen';

import X from 'learn-card-base/svgs/X';

import Checkmark from 'learn-card-base/svgs/Checkmark';
import ArrowArcLeft from '../../../assets/images/ArrowArcLeft.svg';
import CredentialBadge from 'learn-card-base/components/CredentialBadge/CredentialBadge';
import BoostClaimCard from '../../boost/claim-boost-card/BoostClaimCard';
import NotificationSkeleton from './NotificationSkeleton';

import {
    unwrapBoostCredential,
    getDefaultCategoryForCredential,
    getImageUrlFromCredential,
    isEndorsementCredential,
} from 'learn-card-base/helpers/credentialHelpers';
import { formatDid } from 'learn-card-base/helpers/didHelpers';

import {
    useGetResolvedCredential,
    useAcceptCredentialMutation,
    useUpdateNotification,
    usePathQuery,
    useModal,
    ModalTypes,
    CredentialCategoryEnum,
    useGetCredentialWithEdits,
} from 'learn-card-base';

import { ErrorBoundary } from 'react-error-boundary';
import { NotificationTypeStyles, CATEGORY_TO_NOTIFICATION_ENUM } from './types';
import { NotificationType } from 'packages/plugins/lca-api-plugin/src/types';
import { NOTIFICATION_TYPES } from './NotificationCardContainer';
import { useGetVCInfo } from 'learn-card-base';

type NotificationBoostCardProps = {
    notification: NotificationType;
    className?: string;
    claimStatus?: boolean;
    handleArchive?: () => void;
    handleRead?: () => void;
    issueDate?: string;
    cardLoading?: boolean;
};

const NotificationBoostCard: React.FC<NotificationBoostCardProps> = ({
    notification,
    className,
    claimStatus = false,
    handleArchive,
    handleRead,
    issueDate,
    cardLoading,
}) => {
    const { newModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });

    const [isClaimed, setIsClaimed] = useState<boolean>(claimStatus || false);
    const [isRead, setIsRead] = useState<boolean>(notification?.read || false);
    const [claimModalOpen, setClaimModalOpen] = useState<boolean>(false);

    // Ref for the element that we want to detect whether on screen
    const ref: any = useRef<HTMLDivElement>();
    // Call the hook passing in ref and root margin
    // In this case it would only be considered onScreen if more ...
    // ... than 300px of element is visible.
    const onScreen: boolean = useOnScreen<HTMLDivElement>(ref, '-130px');

    const credentialUri = notification?.data?.vcUris?.[0];
    const history = useHistory();
    const query = usePathQuery();
    const _uri = query.get('uri') ?? '';
    const _claim = query.get('claim') ?? '';

    //for now assume the first uri is what we need...
    // unsure what the situation is when there are multiple uris to resolved
    // eg current component is not built to handle displaying multiple resolved vcs as such....
    // so it seeems like some kind of future use case
    const { data, isLoading } = useGetResolvedCredential(notification?.data?.vcUris?.[0]);
    const { mutate, isLoading: acceptCredentialLoading } = useAcceptCredentialMutation();
    const { mutate: updateNotification } = useUpdateNotification();

    const boostVc = data;

    let unwrappedCred = data && unwrapBoostCredential(boostVc);

    const { issuerProfileImageElement } = useGetVCInfo(unwrappedCred);

    if (Array.isArray(unwrappedCred) && unwrappedCred.length === 1) {
        unwrappedCred = unwrappedCred[0];
    }
    const { credentialWithEdits } = useGetCredentialWithEdits(unwrappedCred);
    unwrappedCred = credentialWithEdits ?? unwrappedCred;

    const credCategory = boostVc && getDefaultCategoryForCredential(unwrappedCred);
    const isEndorsementCredentialType = isEndorsementCredential(unwrappedCred);

    const credImgUrl = boostVc && getImageUrlFromCredential(unwrappedCred, credCategory);
    let notificationCategoryFromCredCategory =
        credCategory && CATEGORY_TO_NOTIFICATION_ENUM[credCategory];

    if (isEndorsementCredentialType) notificationCategoryFromCredCategory = 'endorsement';

    let modalDisplayType = {
        mobile: ModalTypes.FullScreen,
        desktop: ModalTypes.FullScreen,
    };

    if (isEndorsementCredentialType) {
        modalDisplayType = {
            mobile: ModalTypes.Right,
            desktop: ModalTypes.Right,
        };
    }

    const displayType = unwrappedCred?.display?.displayType;
    const isCertDisplayType = displayType === 'certificate';
    const isAwardDisplayType = displayType === 'award';
    const isID = displayType === 'id' || unwrappedCred?.hasOwnProperty('boostID') || false;
    const isFamily = credCategory === CredentialCategoryEnum.family;

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
    } = NotificationTypeStyles[notificationCategoryFromCredCategory ?? 'loading'];

    const claimButtonStyles = isClaimed ? claimedButtonStyles : unclaimedButtonStyles;

    const handleClaimOnClick = async () => {
        await updateNotification({
            notificationId: notification?._id,
            payload: { actionStatus: 'COMPLETED', read: true },
        });
    };

    const handleSuccess = async () => {
        const res = await updateNotification({
            notificationId: notification?._id,
            payload: { actionStatus: 'COMPLETED', read: true },
        });

        setIsClaimed(true);
    };

    useEffect(() => {
        if (_uri === credentialUri && _claim && !claimModalOpen && !isClaimed) {
            setClaimModalOpen(true);
            const claimModalEl = document.querySelector('.notification-claim-boost-modal-open');
            if (!claimModalEl) {
                newModal(
                    <BoostClaimCard
                        credential={unwrappedCred}
                        credentialUri={credentialUri}
                        showFooter={false}
                        showBoostFooter={true}
                        handleClaimBoostCredential={handleClaimOnClick}
                        isLoading={isLoading}
                        acceptCredentialLoading={acceptCredentialLoading}
                        acceptCredentialCompleted={isClaimed}
                        successCallback={async () => {
                            await handleSuccess();
                            setClaimModalOpen(false);
                            history.replace('/notifications');
                        }}
                        onDismiss={async () => {
                            handleReadStatus();
                            setClaimModalOpen(false);
                            history.replace('/notifications');
                        }}
                        notification={notification}
                        hideEndorsementRequestCard
                    />,
                    {
                        className: 'notification-claim-boost-modal-open',
                        backgroundImage:
                            isCertDisplayType || isID || isAwardDisplayType || isFamily
                                ? unwrappedCred?.display?.backgroundImage
                                : undefined,
                    },
                    modalDisplayType
                );
            }
        }
    }, []);

    let buttonText: string = '';

    if (isClaimed) {
        buttonText = 'Claimed';
    } else if (!isClaimed) {
        buttonText = 'Claim';
    }

    const handleCardClick = () => {
        newModal(
            <BoostClaimCard
                credential={unwrappedCred}
                credentialUri={credentialUri}
                showFooter={false}
                showBoostFooter={true}
                handleClaimBoostCredential={handleClaimOnClick}
                isLoading={isLoading}
                acceptCredentialLoading={acceptCredentialLoading}
                acceptCredentialCompleted={isClaimed}
                successCallback={handleSuccess}
                notification={notification}
                onDismiss={async () => {
                    handleReadStatus();
                    setClaimModalOpen(false);
                    history.replace('/notifications');
                }}
                hideEndorsementRequestCard
            />,
            {
                backgroundImage:
                    isCertDisplayType || isID || isAwardDisplayType || isFamily
                        ? unwrappedCred?.display?.backgroundImage
                        : undefined,
            },
            modalDisplayType
        );
    };

    const isArchived = false;
    let title = notification?.message?.body || notification?.message?.title;

    // bandaid for boosts from users with no display name
    if (
        notification.type === NOTIFICATION_TYPES.BOOST_RECEIVED &&
        notification.message?.body === ' has boosted you!'
    ) {
        const fromName = notification.from.profileId || formatDid(notification.from.did);
        title = `${fromName} has boosted you!`;
    }

    // override text when endorsement
    if (
        isEndorsementCredentialType &&
        notification.type === NOTIFICATION_TYPES.BOOST_ACCEPTED &&
        notification.message?.body?.includes('has accepted your boost!')
    ) {
        const fromName = notification.from.profileId || formatDid(notification.from.did);
        title = `${fromName} has accepted your endorsement!`;
    }

    const handleArchiveAction = () => {
        handleArchive?.();
    };

    const handleButtonClick = () => {
        newModal(
            <BoostClaimCard
                credential={unwrappedCred}
                credentialUri={credentialUri}
                showFooter={false}
                showBoostFooter={true}
                handleClaimBoostCredential={handleClaimOnClick}
                isLoading={isLoading}
                acceptCredentialLoading={acceptCredentialLoading}
                acceptCredentialCompleted={isClaimed}
                successCallback={handleSuccess}
                notification={notification}
                onDismiss={async () => {
                    handleReadStatus();
                    setClaimModalOpen(false);
                    history.replace('/notifications');
                }}
                hideEndorsementRequestCard
            />,

            {
                backgroundImage:
                    isCertDisplayType || isID || isAwardDisplayType
                        ? unwrappedCred?.display?.backgroundImage
                        : undefined,
            },
            modalDisplayType
        );
    };

    const handleMarkRead = () => {
        if (!isRead) {
            setIsRead(true);
            handleReadStatus?.();
        }
    };

    if (cardLoading || isLoading) {
        return <NotificationSkeleton />;
    }

    const credentialBadgeAchievementType =
        unwrappedCred?.type.includes('ClrCredential') &&
        Array.isArray(unwrappedCred?.credentialSubject?.verifiableCredential)
            ? unwrappedCred.credentialSubject.verifiableCredential[0]?.credentialSubject
                  ?.achievement?.achievementType
            : unwrappedCred?.credentialSubject?.achievement?.achievementType;

    return (
        <>
            <ErrorBoundary
                fallback={
                    <div
                        className={`flex min-h-[120px] justify-start max-w-[600px] items-start relative w-full py-[10px] px-[10px] bg-white my-[15px] ${className}`}
                    >
                        Unable to load notification
                    </div>
                }
            >
                <div
                    onClick={handleMarkRead}
                    ref={ref}
                    className={`flex min-h-[120px] justify-start max-w-[600px] items-start relative w-full py-[10px] px-[10px] bg-white my-[15px] ${className}`}
                >
                    {!isRead && !isLoading && (
                        <div className="notification-count-mobile unread-indicator-dot" />
                    )}
                    <div
                        className="notification-card-left-side px-[0px] flex cursor-pointer"
                        onClick={handleCardClick}
                    >
                        {isEndorsementCredentialType && !isLoading && (
                            <div className="w-[90px] h-[90px] min-w-[90px] min-h-[90px] overflow-hidden rounded-full">
                                {issuerProfileImageElement}
                            </div>
                        )}

                        {!isLoading && !isEndorsementCredentialType && (
                            <CredentialBadge
                                achievementType={credentialBadgeAchievementType}
                                boostType={credCategory}
                                badgeThumbnail={credImgUrl}
                                badgeCircleCustomClass="!w-[90px] h-[90px]"
                                badgeContainerCustomClass="notification-cred-badge mt-[0px] mb-[0px]"
                                badgeRibbonContainerCustomClass="notification-cred-badge-ribbon my-[0px]"
                                displayType={displayType}
                            />
                        )}

                        {isLoading && <div className="w-[90px] h-[90px] rounded-full bg-gray-50" />}
                    </div>
                    <div className="flex flex-col justify-center items-start relative w-full">
                        <div className="text-left ml-3 flex flex-col items-start justify-start w-full">
                            <h4
                                onClick={handleCardClick}
                                className="cursor-pointer font-semibold tracking-wide line-clamp-2 text-grayscale-900 text-[14px] pr-[20px] notification-card-title"
                                data-testid="notification-title"
                            >
                                {capitalize(title)}
                            </h4>
                            <p
                                className={`font-bold p-0 mt-[10px] leading-none tracking-wide line-clamp-1 text-[12px] notification-card-type-text ${textStyles}`}
                                data-testid="notification-type"
                            >
                                {typeText}{' '}
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
                                    onClick={handleButtonClick}
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

export default NotificationBoostCard;

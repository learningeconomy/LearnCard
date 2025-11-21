import React, { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';

import X from 'learn-card-base/svgs/X';
import Checkmark from 'learn-card-base/svgs/Checkmark';
import NotificationSkeleton from './NotificationSkeleton';
import ArrowArcLeft from '../../../assets/images/ArrowArcLeft.svg';
import BoostClaimCard from '../../boost/claim-boost-card/BoostClaimCard';
import CredentialBadge from 'learn-card-base/components/CredentialBadge/CredentialBadge';
import ViewTroopIdModal from '../../../pages/troop/ViewTroopIdModal';

import { useIonModal, useIonAlert } from '@ionic/react';
import useOnScreen from 'learn-card-base/hooks/useOnScreen';

import {
    useModal,
    usePathQuery,
    useGetResolvedCredential,
    useAcceptCredentialMutation,
    useUpdateNotification,
    setIonicModalBackground,
    resetIonicModalBackground,
    ModalTypes,
    BrandingEnum,
    CredentialCategoryEnum,
} from 'learn-card-base';
import {
    unwrapBoostCredential,
    getDefaultCategoryForCredential,
    getImageUrlFromCredential,
} from 'learn-card-base/helpers/credentialHelpers';

import { NotificationType } from 'packages/plugins/lca-api-plugin/src/types';
import { NotificationTypeStyles, CATEGORY_TO_NOTIFICATION_ENUM } from './types';

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
    const [isClaimed, setIsClaimed] = useState<boolean>(claimStatus || false);
    const [isRead, setIsRead] = useState<boolean>(notification?.read || false);
    const [claimModalOpen, setClaimModalOpen] = useState<boolean>(false);

    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });

    // Ref for the element that we want to detect whether on screen
    const ref: any = useRef<HTMLDivElement>();
    // Call the hook passing in ref and root margin
    // In this case it would only be considered onScreen if more ...
    // ... than 300px of element is visible.
    const onScreen: boolean = useOnScreen<HTMLDivElement>(ref, '-130px');

    // const [isLoading, setIsLoading] = useState<boolean>( true);
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
    const {
        mutate: updateNotification,
        isLoading: updateNotificationLoading,
        isSuccess: updateNotificationSuccess,
    } = useUpdateNotification();
    const boostVc = data;
    const unwrappedCred = data && unwrapBoostCredential(boostVc);
    const credCategory = boostVc && getDefaultCategoryForCredential(unwrappedCred);
    const credImgUrl = boostVc && getImageUrlFromCredential(unwrappedCred);
    const notificationCategoryFromCredCategory =
        credCategory && CATEGORY_TO_NOTIFICATION_ENUM[credCategory];

    const [presentAlert, dismissAlert] = useIonAlert();

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

    const isID =
        unwrappedCred?.display?.displayType === 'id' ||
        unwrappedCred?.hasOwnProperty('boostID') ||
        false;
    const isMeritBadge = credCategory === CredentialCategoryEnum.meritBadge;

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

    const [presentModal, dismissModal] = useIonModal(BoostClaimCard, {
        credential: unwrappedCred,
        credentialUri,
        dismiss: () => dismissModal(),
        showFooter: false,
        showBoostFooter: true,
        handleClaimBoostCredential: handleClaimOnClick,
        isLoading: isLoading,
        acceptCredentialLoading: acceptCredentialLoading,
        acceptCredentialCompleted: isClaimed,
        successCallback: handleSuccess,
    });
    useEffect(() => {
        if (_uri === credentialUri && _claim && !claimModalOpen && !isClaimed) {
            setClaimModalOpen(true);
            const claimModalEl = document.querySelector('.notification-claim-boost-modal-open');
            if (!claimModalEl) {
                if (isID) {
                    newModal(
                        <ViewTroopIdModal
                            credential={unwrappedCred}
                            boostUri={unwrappedCred.boostId}
                            claimCredentialUri={credentialUri}
                            useCurrentUserInfo
                            isClaimMode
                            isAlreadyClaimed={isClaimed}
                            onClaimSuccess={async () => {
                                await handleSuccess();
                                closeModal();
                            }}
                            showCounts={false}
                            profileId={notification?.from?.profileId}
                        />
                    );
                    return;
                }

                if (isMeritBadge) {
                    setIonicModalBackground(unwrappedCred?.display?.backgroundImage);
                }

                presentModal({
                    cssClass: 'notification-claim-boost-modal-open',
                    onDidDismiss: async () => {
                        resetIonicModalBackground();
                        updateNotification({
                            notificationId: notification?._id,
                            payload: { actionStatus: 'COMPLETED', read: true },
                        });
                        setClaimModalOpen(false);
                        history.replace('/notifications');
                    },
                });
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
        if (isID) {
            newModal(
                <ViewTroopIdModal
                    credential={unwrappedCred}
                    boostUri={unwrappedCred.boostId}
                    claimCredentialUri={credentialUri}
                    useCurrentUserInfo
                    isClaimMode
                    isAlreadyClaimed={isClaimed}
                    onClaimSuccess={async () => {
                        await handleSuccess();
                        closeModal();
                    }}
                    showCounts={false}
                    profileId={notification?.from?.profileId}
                />
            );
            return;
        }

        if (isMeritBadge) {
            setIonicModalBackground(unwrappedCred?.display?.backgroundImage);
        }
        presentModal({
            onDidDismiss: () => resetIonicModalBackground(),
        });
    };

    const isArchived = false;
    const title = notification?.message?.body || notification?.message?.title;

    const handleArchiveAction = () => {
        handleArchive?.();
    };

    const handleButtonClick = () => {
        handleCardClick();
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

    return (
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
                {!isLoading && (
                    <CredentialBadge
                        achievementType={
                            unwrappedCred?.credentialSubject?.achievement?.achievementType
                        }
                        boostType={credCategory}
                        badgeThumbnail={credImgUrl}
                        badgeCircleCustomClass="w-[90px] h-[90px]"
                        badgeContainerCustomClass="notification-cred-badge mt-[0px] mb-[0px]"
                        badgeRibbonContainerCustomClass="notification-cred-badge-ribbon my-[0px]"
                        branding={BrandingEnum.scoutPass}
                    />
                )}

                {isLoading && <div className="w-[90px] h-[90px] rounded-full bg-gray-50"></div>}
            </div>
            <div className="flex flex-col justify-center items-start relative w-full">
                <div className="text-left ml-3 flex flex-col items-start justify-start w-full">
                    <h4
                        onClick={handleCardClick}
                        className="cursor-pointer font-bold tracking-wide line-clamp-2 text-black text-[14px] pr-[20px] notification-card-title"
                        data-testid="notification-title"
                    >
                        {title}
                    </h4>
                    <p
                        className={`font-semibold p-0 mt-[10px] leading-none tracking-wide line-clamp-1 text-[12px] notification-card-type-text ${textStyles}`}
                        data-testid="notification-type"
                    >
                        {typeText}{' '}
                        {issueDate && (
                            <span
                                className="text-grayscale-600 normal-case font-normal text-[12px] notification-card-type-issue-date"
                                data-testid="notification-cred-issue-date"
                            >
                                • {issueDate}
                            </span>
                        )}
                    </p>

                    <div className="flex relative items-center justify-between mt-3 w-full">
                        <button
                            className={`cursor-pointer notification-claim-btn flex items-center mr-[15px] w-[143px] justify-center flex-1 rounded-[24px] border-2 border-solid font-semibold py-2 px-3 tracking-wide ${claimButtonStyles}`}
                            onClick={handleButtonClick}
                            name="notification-claim-button"
                        >
                            {isLoading ? 'Loading...' : buttonText}
                            {isClaimed && <Checkmark className="h-[24px] p-0 m-0" />}{' '}
                        </button>

                        <button
                            onClick={handleArchiveAction}
                            className={`rounded-[24px] flex items-center justify-center border-[1px] border-[#E2E3E9] border-solid h-[42px] w-[42px] bg-white font-semibold mr-2 p-[0px] tracking-wide`}
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
    );
};

export default NotificationBoostCard;

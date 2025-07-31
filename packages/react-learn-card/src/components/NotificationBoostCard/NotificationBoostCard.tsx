import React, { useState, useEffect } from 'react';
import X from '../../assets/images/X.svg';
import { NotificationBoostCardProps } from './types';
import { NotificationTypeStyles } from '../Notification/types';
import { NotificationTypeEnum } from '../../constants/notifications';
import Checkmark from '../svgs/Checkmark';
import ArrowArcLeft from '../../assets/images/ArrowArcLeft.svg';
import UserProfilePicture from '../UserProfilePicture/UserProfilePicture';

export const NotificationBoostCard: React.FC<NotificationBoostCardProps> = ({
    title,
    customThumbComponent,
    className,
    thumbImage,
    notificationType = NotificationTypeEnum.Achievement,
    issueDate,
    issuerInfo,
    claimStatus = false,
    loadingState = false,
    handleButtonClick,
    handleCancelClick,
    handleCardClick,
    showIssuerInfo = true,
    isArchived,
}) => {
    const [isClaimed, setIsClaimed] = useState<boolean>(claimStatus || false);
    const [isLoading, setIsLoading] = useState<boolean>(loadingState || false);

    useEffect(() => {
        setIsClaimed(claimStatus);
    }, [claimStatus]);

    useEffect(() => {
        setIsLoading(loadingState);
    }, [loadingState]);

    const {
        iconCircleStyles,
        textStyles,
        viewButtonStyles,
        claimedButtonStyles,
        unclaimedButtonStyles,
        typeText,
    } = NotificationTypeStyles[notificationType];

    const claimButtonStyles = isClaimed ? claimedButtonStyles : unclaimedButtonStyles;

    let buttonText: string = '';

    if (isClaimed) {
        buttonText = 'Claimed';
    } else if (!isClaimed) {
        buttonText = 'Claim';
    }

    return (
        <div
            className={`flex justify-start max-w-[600px] items-start relative w-full rounded-3xl shadow-bottom py-[10px] px-[10px] bg-white ${className}`}
        >
            <div className="notification-card-left-side px-[0px] flex">
                {!customThumbComponent && (
                    <div
                        onClick={handleCardClick}
                        className={`overflow-hidden cursor-pointer w-[90px] h-[90px] rounded-full flex items-start ${iconCircleStyles} notification-card-thumbnail`}
                    >
                        <img
                            src={thumbImage}
                            alt="Notification Thumb"
                            className="w-full h-full w-[100px] h-[100px] object-cover"
                        />
                    </div>
                )}
                {customThumbComponent && { customThumbComponent }}
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

                    {showIssuerInfo && (
                        <div className="notification-card-issuer-info flex items-center mt-[10px]">
                            <div className="profile-thumb-img border-[2px] border-white border-solid  vc-issuee-image h-[35px] w-[35px] rounded-full overflow-hidden mx-[-5px]">
                                <UserProfilePicture
                                    customContainerClass={`h-full w-full object-cover text-xl ${
                                        !issuerInfo?.image ? 'pt-[3px]' : ''
                                    }`}
                                    user={{ image: issuerInfo?.image, name: issuerInfo?.fullName }}
                                    alt="profile"
                                />
                            </div>
                            <div className="notification-issuer-info-text flex items-center px-[10px]">
                                <p className="text-[13px] text-gray-700 font-medium">
                                    From {issuerInfo?.fullName || issuerInfo?.displayName}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between mt-3 w-full">
                        <button
                            className={`notification-claim-btn flex items-center mr-[15px] w-[143px] justify-center flex-1 rounded-[24px] border-2 border-solid font-semibold py-2 px-3 tracking-wide ${claimButtonStyles}`}
                            onClick={handleButtonClick}
                            role="button"
                            name="notification-claim-button"
                        >
                            {isClaimed && <Checkmark className="h-[24px] p-0 m-0" />}{' '}
                            {isLoading ? 'Loading...' : buttonText}
                        </button>

                        <button
                            onClick={handleCancelClick}
                            className={`rounded-[24px] flex items-center justify-center  h-[42px] w-[42px] shadow-bottom bg-white font-semibold mr-2 p-[0px] tracking-wide ${viewButtonStyles}`}
                            role="button"
                            name="notification-view-button"
                        >
                            {!isArchived && (
                                <img src={X ?? ''} alt="Cancel" className="notification-card-x" />
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

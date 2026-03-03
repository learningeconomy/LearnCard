import React from 'react';

import { EndorsmentThumbWithCircle } from 'learn-card-base/svgs/EndorsementThumb';

import { BoostEndorsementStatusEnum } from './boost-endorsement.helpers';
import {
    useGetVCInfo,
    CredentialCategoryEnum,
    ProfilePicture,
    useGetCurrentLCNUser,
} from 'learn-card-base';
import { VC } from '@learncard/types';
import { boostPreviewStore } from 'learn-card-base/stores/boostPreviewStore';
import { BoostPreviewTabsEnum } from '../boost-preview-tabs/boost-preview-tabs.helpers';
import { hasEndorsedCredential } from 'learn-card-base/helpers/credentialHelpers';

const EndorsementBadge: React.FC<{
    credential: VC;
    className?: string;
    showBadge?: boolean;
    categoryType: CredentialCategoryEnum;
    onClick?: () => void;
    existingEndorsements?: VC[];
}> = ({ className, credential, categoryType, showBadge, onClick, existingEndorsements = [] }) => {
    const { currentLCNUser } = useGetCurrentLCNUser();
    const { isCurrentUserSubject, endorsements } = useGetVCInfo(credential, categoryType);

    // TODOS:
    // - Get current user endorsement status
    const hasEndorsed = hasEndorsedCredential(existingEndorsements, currentLCNUser?.did);
    const endorsementCount =
        existingEndorsements.length > 0 ? existingEndorsements.length : endorsements.length ?? 0;
    const endorsementStatus = BoostEndorsementStatusEnum.Approved;

    let buttonStyles = '';
    let iconStyles = '';
    let fill = '';

    // badge styles
    const badgeDefaultStyles = 'bg-grayscale-200 text-grayscale-900';
    const badgeDefaultIconStyles = 'text-grayscale-900';
    const badgeDefaultFill = '#ffffff';

    // endorser styles
    const endorserDefaultStyles = 'bg-teal-100 text-grayscale-900';
    const endorserDefaultIconStyles = 'text-white';
    const endorserDefaultFill = '#2DD4BF';

    if (isCurrentUserSubject) {
        buttonStyles = badgeDefaultStyles;
        iconStyles = badgeDefaultIconStyles;
        fill = badgeDefaultFill;
    } else {
        buttonStyles = badgeDefaultStyles;
        iconStyles = badgeDefaultIconStyles;
        fill = badgeDefaultFill;

        if (
            endorsementStatus === BoostEndorsementStatusEnum.Pending ||
            endorsementStatus === BoostEndorsementStatusEnum.Approved
        ) {
            buttonStyles = endorserDefaultStyles;
            iconStyles = endorserDefaultIconStyles;
            fill = endorserDefaultFill;
        }
    }

    const handleOnEndorsementClick = () => {
        if (onClick) onClick?.();
        boostPreviewStore.set.updateSelectedTab(BoostPreviewTabsEnum.Endorsements);
    };

    return (
        <button
            onClick={e => {
                e.stopPropagation();
                handleOnEndorsementClick();
            }}
            className={`text-[17px] flex items-center justify-center text-center py-1 px-2 rounded-[20px] mt-2 ${buttonStyles} ${className} z`}
        >
            {hasEndorsed && (
                <ProfilePicture
                    customContainerClass="w-[25px] h-[25px] min-w-[25px] min-h-[25px] ml-[-5px]"
                    customImageClass="w-full h-full"
                />
            )}
            <EndorsmentThumbWithCircle
                className={`${hasEndorsed ? 'ml-[-10px] z-10' : 'mr-2'} ${iconStyles}`}
                fill={fill}
            />{' '}
            {endorsementCount}
        </button>
    );
};

export default EndorsementBadge;

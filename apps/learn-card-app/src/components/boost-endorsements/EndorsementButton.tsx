import React from 'react';

import EndorsementForm from './EndorsementForm/EndorsementForm';
import { EndorsmentThumbWithCircle } from 'learn-card-base/svgs/EndorsementThumb';
import EndorsementRequestForm from './EndorsementRequestForm/EndorsementRequestForm';

import { useGetVCInfo, CredentialCategoryEnum, useModal, ModalTypes } from 'learn-card-base';
import { VC } from '@learncard/types';

const EndorsementButton: React.FC<{
    credential: VC;
    className?: string;
    categoryType: CredentialCategoryEnum;
    onClick?: () => void;
}> = ({ className, credential, categoryType, onClick }) => {
    const { newModal } = useModal({ mobile: ModalTypes.Right, desktop: ModalTypes.Right });
    const { isCurrentUserSubject } = useGetVCInfo(credential, categoryType);

    let buttonStyles = '';
    let iconStyles = '';

    if (isCurrentUserSubject) {
        buttonStyles = 'bg-grayscale-900';
        iconStyles = 'text-grayscale-600';
    } else {
        buttonStyles = 'bg-teal-400';
        iconStyles = 'text-teal-400';
    }

    const handleOnEndorsementClick = () => {
        // if (onClick) onClick?.();
        // boostPreviewStore.set.updateSelectedTab(BoostPreviewTabsEnum.Endorsements);
        if (isCurrentUserSubject) {
            newModal(
                <EndorsementRequestForm credential={credential} categoryType={categoryType} />
            );
        } else {
            newModal(<EndorsementForm credential={credential} categoryType={categoryType} />);
        }
    };

    return (
        <button
            onClick={e => {
                e.stopPropagation();
                handleOnEndorsementClick();
            }}
            className={`w-full text-[17px] flex items-center justify-center text-center font-semibold  py-[8px] px-4 rounded-[20px] text-white ${buttonStyles} ${className}`}
        >
            <EndorsmentThumbWithCircle className={`mr-2 ${iconStyles}`} /> Request Endorsement
        </button>
    );
};

export default EndorsementButton;

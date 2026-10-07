import React from 'react';

import EndorsementForm from './EndorsementForm/EndorsementForm';
import { EndorsmentThumbWithCircle } from 'learn-card-base/svgs/EndorsementThumb';
import EndorsementRequestForm from './EndorsementRequestForm/EndorsementRequestForm';

import { useGetVCInfo, CredentialCategoryEnum, useModal, ModalTypes } from 'learn-card-base';
import { VC } from '@learncard/types';
import * as m from '../../paraglide/messages.js';

const EndorsementButton: React.FC<{
    credential: VC;
    shareCredentialUri?: string;
    className?: string;
    categoryType: CredentialCategoryEnum;
    onClick?: () => void;
}> = ({ className, credential, shareCredentialUri, categoryType, onClick }) => {
    const { newModal } = useModal({ mobile: ModalTypes.Right, desktop: ModalTypes.Right });
    const { isCurrentUserSubject } = useGetVCInfo(credential, categoryType);

    const buttonStyles = isCurrentUserSubject ? 'bg-grayscale-900' : 'bg-teal-400';
    const iconStyles = isCurrentUserSubject ? 'text-grayscale-600' : 'text-teal-400';

    const handleOnEndorsementClick = () => {
        // if (onClick) onClick?.();
        // boostPreviewStore.set.updateSelectedTab(BoostPreviewTabsEnum.Endorsements);
        if (isCurrentUserSubject) {
            newModal(
                <EndorsementRequestForm
                    credential={credential}
                    shareCredentialUri={shareCredentialUri}
                    categoryType={categoryType}
                />
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
            <EndorsmentThumbWithCircle className={`mr-2 ${iconStyles}`} />{' '}
            {m['endorsement.button.request']()}
        </button>
    );
};

export default EndorsementButton;

import React from 'react';

import CaretRight from '../../svgs/SlimCaretRight';
import BoostLinkedCredentialsModal from './BoostLinkedCredentialsModal';

import { VC } from '@learncard/types';
import { BoostCategoryOptionsEnum, DisplayTypeEnum, getDisplayIcon } from 'learn-card-base';
import { ModalTypes, useModal } from 'learn-card-base';

export const BoostLinkedCredentialsBox: React.FC<{
    credential: VC;
    categoryType: BoostCategoryOptionsEnum;
    linkedCredentialCount: number;
    linkedCredentials: VC[] | undefined;
    defaultImg?: string;
    displayType: DisplayTypeEnum;
}> = ({
    credential,
    categoryType,
    linkedCredentialCount,
    linkedCredentials,
    defaultImg,
    displayType,
}) => {
    const { newModal, closeModal, closeAllModals } = useModal({
        mobile: ModalTypes.FullScreen,
        desktop: ModalTypes.Right,
    });

    const DisplayIcon = getDisplayIcon(displayType);

    const handleOpenModal = () => {
        closeAllModals();
        setTimeout(() => {
            newModal(
                <BoostLinkedCredentialsModal
                    credential={credential}
                    linkedCredentials={linkedCredentials}
                    linkedCredentialCount={linkedCredentialCount}
                    categoryType={categoryType}
                    defaultImg={defaultImg}
                />,
                { className: '!bg-transparent' }
            );
        }, 300);
    };

    return (
        <div
            className={`p-[15px] bg-white flex items-center justify-between gap-[10px] rounded-[20px] w-full shadow-bottom-2-4`}
        >
            <h3 className="text-[22px] leading-[130%] tracking-[-0.25px] text-grayscale-900 font-notoSans flex items-center justify-start">
                <DisplayIcon className="w-[30px] h-[30px] mr-2" version="2" /> Linked Credentials
            </h3>

            <button
                onClick={handleOpenModal}
                className="text-grayscale-900 flex items-center font-semibold"
            >
                {linkedCredentialCount}{' '}
                <CaretRight className="w-[25px] h-[25px] text-grayscale-400" />
            </button>
        </div>
    );
};

export default BoostLinkedCredentialsBox;

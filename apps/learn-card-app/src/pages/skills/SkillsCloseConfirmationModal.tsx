import React from 'react';
import { useModal } from 'learn-card-base';

import TrashBin from '../../components/svgs/TrashBin';

type SkillsCloseConfirmationModalProps = {};

const SkillsCloseConfirmationModal: React.FC<SkillsCloseConfirmationModalProps> = ({}) => {
    const { closeModal, closeAllModals } = useModal();
    return (
        <div className="flex flex-col gap-[10px] px-[20px]">
            <div className="bg-white rounded-[15px] flex flex-col items-center gap-[10px] px-[20px] py-[30px] shadow-bottom-4-4">
                <TrashBin className="w-[60px] h-[60px] text-rose-600" version="2" strokeWidth="2" />
                <h2 className="text-[22px] font-[600] font-poppins text-grayscale-900">
                    Close Without Saving?
                </h2>
                <p className="text-[22px] font-poppins text-grayscale-900 leading-[130%] tracking-[-0.25px] text-center">
                    Do you want to discard your selected skills?
                </p>
            </div>

            <button
                onClick={closeAllModals}
                className="bg-grayscale-10 rounded-[30px] px-[20px] py-[10px] shadow-bottom-4-4 font-poppins text-[17px] leading-[130%] tracking-[-0.25px] text-grayscale-900"
            >
                Yes, Discard
            </button>

            <button
                onClick={closeModal}
                className="bg-grayscale-10 rounded-[30px] px-[20px] py-[10px] shadow-bottom-4-4 font-poppins text-[17px] leading-[130%] tracking-[-0.25px] text-grayscale-900"
            >
                Continue Editing
            </button>
        </div>
    );
};

export default SkillsCloseConfirmationModal;

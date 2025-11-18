import React from 'react';
import TrashBin from '../../components/svgs/TrashBin';
import { useModal } from 'learn-card-base';

type ManageSkillsCancelUpdateModalProps = {
    onCancel: () => void;
    confirmationText: string;
};

const ManageSkillsCancelUpdateModal: React.FC<ManageSkillsCancelUpdateModalProps> = ({
    onCancel,
    confirmationText,
}) => {
    const { closeModal } = useModal();
    return (
        <div className="flex flex-col gap-[10px] px-[20px]">
            <div className="bg-white rounded-[15px] flex flex-col items-center gap-[10px] px-[20px] py-[30px]">
                <TrashBin className="w-[60px] h-[60px] text-rose-600" version={2} />
                <h2 className="text-[22px] font-[600] font-poppins text-grayscale-900">
                    Cancel Update?
                </h2>
                <p className="text-[22px] font-poppins text-grayscale-900 leading-[130%] tracking-[-0.25px] text-center">
                    Do you want to discard your changes?
                </p>
            </div>

            <button
                onClick={() => {
                    onCancel();
                    closeModal();
                }}
                className="bg-grayscale-10 rounded-[30px] px-[20px] py-[10px] shadow-bottom-4-4 font-poppins text-[17px] leading-[130%] tracking-[-0.25px] text-grayscale-900"
            >
                {confirmationText}
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

export default ManageSkillsCancelUpdateModal;

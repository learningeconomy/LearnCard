import React from 'react';

import { ModalTypes, useModal } from 'learn-card-base';

import UploadIcon from 'learn-card-base/svgs/UploadIcon';
import CheckListUploadRawVC from './checklist-steps/CheckListUploadRawVC';

import { useTheme } from '../../../theme/hooks/useTheme';

type UploadJsonVcBoxProps = {};

const UploadJsonVcBox: React.FC<UploadJsonVcBoxProps> = ({}) => {
    const { newModal } = useModal();
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const openUploadJsonVcModal = () => {
        newModal(
            <CheckListUploadRawVC />,
            { className: '!bg-transparent' },
            { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
        );
    };

    return (
        <div className="flex flex-col gap-[20px] items-center justify-center p-[15px] rounded-[15px] bg-white shadow-bottom-2-4 mt-4">
            <div className="flex flex-col gap-[5px]">
                <h2 className="text-grayscale-900 font-notoSans text-[20px] flex items-center">
                    Add Verifiable Credentials
                </h2>
                <p className="text-grayscale-600 font-notoSans text-[14px]">
                    If you have raw JSON credentials, you can add them to your wallet here.
                    {/* Upload raw JSON credentials to add them to your wallet. */}
                </p>
            </div>

            <button
                className={`py-[7px] px-[20px] rounded-[30px] font-notoSans text-[17px] font-[600] leading-[24px] tracking-[0.25px] text-white w-full flex gap-[10px] items-center justify-center disabled:opacity-60 max-w-[650px] bg-${primaryColor}`}
                onClick={openUploadJsonVcModal}
            >
                <UploadIcon className="w-[25px] h-[26px] text-white" strokeWidth="2" />
                Upload
            </button>
        </div>
    );
};

export default UploadJsonVcBox;

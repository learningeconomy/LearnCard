import React from 'react';

import { ModalTypes, useModal } from 'learn-card-base';

import PuzzlePiece from 'learn-card-base/svgs/PuzzlePiece';
import ManageSkills from './ManageSkills';
import FrameworkImage from './FrameworkImage';

import { SkillFramework } from '../../components/boost/boost';

type FrameworkCreatedSuccessModalProps = {
    isUpdate?: boolean;
    framework: SkillFramework;
};

const FrameworkCreatedSuccessModal: React.FC<FrameworkCreatedSuccessModalProps> = ({
    isUpdate,
    framework,
}) => {
    const { newModal, closeModal, closeAllModals } = useModal();

    return (
        <div className="flex flex-col gap-[10px] px-[20px] min-w-[356px]">
            <div className="flex flex-col items-center gap-[10px] px-[20px] py-[30px] bg-white rounded-[15px] overflow-hidden min-w-[356px]">
                <FrameworkImage
                    image={framework.image}
                    sizeClassName="w-[75px] h-[75px]"
                    iconSizeClassName="w-[35px] h-[35px]"
                />

                <div className="w-full text-center">
                    {isUpdate ? (
                        <>
                            <span className="font-poppins text-[22px] text-grayscale-900">
                                Framework has been successfully updated.
                            </span>
                        </>
                    ) : (
                        <>
                            <span className="font-poppins text-[22px] font-[600] text-grayscale-900">
                                {framework.name}
                            </span>{' '}
                            <span className="font-poppins text-[22px] text-grayscale-900">
                                has been successfully created.
                            </span>
                        </>
                    )}
                </div>

                {!isUpdate && (
                    <p className="text-grayscale-900 text-center font-poppins text-[22px]">
                        Would you like to add skills now?
                    </p>
                )}
            </div>
            {!isUpdate && (
                <button
                    onClick={() => {
                        closeModal();
                        setTimeout(() => {
                            newModal(
                                <ManageSkills initialFrameworkId={framework.id} />,
                                { className: '!bg-transparent' },
                                { desktop: ModalTypes.Right, mobile: ModalTypes.FullScreen }
                            );
                        }, 300);
                    }}
                    className="bg-indigo-500 text-white py-[10px] px-[20px] rounded-[30px] flex gap-[10px] items-center justify-center font-[600] text-[17px] font-notoSans leading-[24px] tracking-[0.25px]"
                >
                    <PuzzlePiece version="with-plus" className="w-[25px] h-[25px]" />
                    Add Skills
                </button>
            )}
            <button
                onClick={isUpdate ? closeAllModals : closeModal}
                className="bg-white text-grayscale-900 py-[10px] px-[20px] rounded-[30px] flex gap-[10px] items-center justify-center text-[17px] font-poppins leading-[24px] tracking-[-0.25px]"
            >
                {isUpdate ? 'Close' : 'Later'}
            </button>
        </div>
    );
};

export default FrameworkCreatedSuccessModal;

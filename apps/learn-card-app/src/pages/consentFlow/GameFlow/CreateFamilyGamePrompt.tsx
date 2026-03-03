import React from 'react';

import FamilyCMS from 'apps/learn-card-app/src/components/familyCMS/FamilyCMS';
import GamePromptHeader from './GamePromptHeader';

import { ModalTypes, useModal } from 'learn-card-base';
import { ConsentFlowContractDetails } from '@learncard/types';

type CreateFamilyGamePromptProps = {
    contractDetails?: ConsentFlowContractDetails;
    isFromGame: boolean;
    onFamilyCreationSuccess?: () => void;
    handleBackToGame: () => void;
};

export const CreateFamilyGamePrompt: React.FC<CreateFamilyGamePromptProps> = ({
    contractDetails,
    isFromGame,
    onFamilyCreationSuccess,
    handleBackToGame,
}) => {
    const { closeModal, newModal, closeAllModals } = useModal();

    const { name, image } = contractDetails ?? {};
    const gameTitle = name ?? '...';
    const gameImage = image ?? '';

    const handleCreateFamily = () => {
        newModal(
            <FamilyCMS
                handleCloseModal={closeModal}
                onFamilyCreationSuccess={onFamilyCreationSuccess}
            />,
            {
                sectionClassName: '!bg-transparent !border-none !shadow-none !rounded-none',
                hideButton: true,
            },
            { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
        );
    };

    return (
        <div className="flex flex-col gap-[10px]">
            <div className="w-full flex flex-col justify-center items-center gap-[20px] bg-white rounded-[24px] px-[20px] py-[40px] shadow-box-bottom">
                <div className="flex flex-col gap-[15px]">
                    <GamePromptHeader gameImage={gameImage} />

                    <div className="w-full text-center text-grayscale-700 text-[14px] font-notoSans font-[600] px-[30px]">
                        {gameTitle}
                    </div>
                </div>

                <div className="h-[1px] w-[80px] bg-grayscale-200" />

                <div className="text-[20px] text-grayscale-800 font-notoSans text-center">
                    Create a family to select a player.
                </div>
            </div>

            <button
                onClick={handleCreateFamily}
                type="button"
                className="w-full py-[10px] text-[20px] bg-emerald-700 rounded-[40px] text-white shadow-box-bottom"
            >
                New Family
            </button>
            <button
                onClick={isFromGame ? handleBackToGame : closeAllModals}
                type="button"
                className="w-full py-[10px] text-[20px] bg-white rounded-[40px] text-grayscale-900 shadow-box-bottom"
            >
                {isFromGame ? 'Back to Game' : 'Cancel'}
            </button>
        </div>
    );
};

export default CreateFamilyGamePrompt;

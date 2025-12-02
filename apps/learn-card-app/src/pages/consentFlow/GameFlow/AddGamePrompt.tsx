import React from 'react';
import { useModal } from 'learn-card-base';

import { IonSpinner } from '@ionic/react';
import GamePromptHeader from './GamePromptHeader';

import { ConsentFlowContractDetails } from '@learncard/types';

type AddGamePromptProps = {
    contractDetails?: ConsentFlowContractDetails;
    isFromGame: boolean;
    handleImAnAdult: () => void;
    handleBackToGame: () => void;
    isPreview?: boolean;
};

export const AddGamePrompt: React.FC<AddGamePromptProps> = ({
    contractDetails,
    isFromGame,
    handleImAnAdult,
    handleBackToGame,
    isPreview,
}) => {
    const { closeModal, closeAllModals } = useModal();

    const gameTitle = contractDetails?.name ?? '...';
    const gameImage = contractDetails?.image ?? '';

    if (!contractDetails) {
        return (
            <div className="w-full flex flex-col items-center justify-center min-h-[300px]">
                <IonSpinner name="crescent" color="grayscale-900" className="scale-[2] mb-8 mt-6" />
                <p className="font-poppins text-grayscale-900">Loading...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-[10px]">
            <div className="w-full flex flex-col justify-center items-center gap-[20px] bg-white rounded-[24px] px-[20px] py-[40px] shadow-box-bottom">
                <div className="flex flex-col gap-[15px]">
                    <GamePromptHeader gameImage={gameImage} />

                    <div className="w-full text-center text-grayscale-900 text-[17px] font-notoSans px-[30px]">
                        <span>Add</span>{' '}
                        <span className="font-[600] leading-[24px] tracking-[0.25px]">
                            {gameTitle}
                        </span>{' '}
                        <span>
                            to <span className="font-[600]">LearnCard</span>
                        </span>
                    </div>
                </div>

                {contractDetails?.reasonForAccessing && (
                    <>
                        <p className="text-center text-[17px] text-grayscale-900">
                            {contractDetails.reasonForAccessing}
                        </p>

                        <div className="h-[1px] w-[80px] bg-grayscale-200" />

                        <div className="text-[22px] text-grayscale-900 font-poppins leading-[130%] tracking-[-0.25px]">
                            Get an adult to continue.
                        </div>
                    </>
                )}
                {!contractDetails?.reasonForAccessing && (
                    <p className="text-center text-[17px] text-grayscale-900 px-[30px]">
                        Get an adult to save your progress and skills
                    </p>
                )}
            </div>

            <button
                onClick={handleImAnAdult}
                type="button"
                className="w-full py-[10px] text-[20px] bg-emerald-700 rounded-[40px] text-white shadow-box-bottom disabled:opacity-80"
                disabled={isPreview}
            >
                {isPreview && (
                    <div className="flex flex-col gap-[2px]">
                        <span>I'm an Adult</span>
                        <span className="text-[14px]">(disabled for preview)</span>
                    </div>
                )}
                {!isPreview && <>{isFromGame ? "I'm an Adult" : 'Select Player'}</>}
            </button>
            <button
                onClick={() => {
                    if (isPreview) {
                        closeModal();
                    } else if (isFromGame) {
                        handleBackToGame();
                    } else {
                        closeAllModals();
                    }
                }}
                type="button"
                className="w-full py-[10px] text-[20px] bg-white rounded-[40px] text-grayscale-900 shadow-box-bottom"
            >
                {isFromGame ? 'Back to Game' : 'Cancel'}
            </button>
        </div>
    );
};

export default AddGamePrompt;

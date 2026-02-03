import React from 'react';
import { BoostCMSState } from '../boost';

type BoostCMSRecoveryPromptProps = {
    recoveredState: BoostCMSState;
    onRecover: () => void;
    onDiscard: () => void;
};

export const BoostCMSRecoveryPrompt: React.FC<BoostCMSRecoveryPromptProps> = ({
    recoveredState,
    onRecover,
    onDiscard,
}) => {
    const boostName = recoveredState?.basicInfo?.name || 'Untitled Boost';
    const boostType = recoveredState?.basicInfo?.achievementType || recoveredState?.basicInfo?.type;

    return (
        <section className="pt-[36px] pb-[16px]">
            <div className="flex flex-col items-center justify-center w-full">
                <div className="w-full flex flex-col items-center justify-center px-4 text-grayscale-900">
                    <div className="flex flex-col">
                        <div className="w-full flex items-center justify-center">
                            <h6 className="tracking-[12px] text-base font-bold text-black">
                                LEARNCARD
                            </h6>
                        </div>
                    </div>

                    <h6 className="font-semibold text-black font-poppins text-xl mb-2 mt-4">
                        Recover Your Progress?
                    </h6>

                    <p className="text-center text-grayscale-600 font-poppins text-sm mb-4">
                        We found unsaved progress for{' '}
                        <span className="font-semibold">{boostName}</span>
                        {boostType && (
                            <span className="text-grayscale-500"> ({boostType})</span>
                        )}
                        . Would you like to continue where you left off?
                    </p>

                    <button
                        onClick={onRecover}
                        className="flex items-center justify-center text-white rounded-full px-[64px] py-[10px] bg-emerald-700 font-poppins font-medium text-xl w-full shadow-lg"
                    >
                        Continue Editing
                    </button>

                    <button
                        onClick={onDiscard}
                        className="flex items-center justify-center text-white rounded-full px-[50px] py-[10px] bg-grayscale-900 font-poppins font-medium text-xl w-full shadow-lg mt-4"
                    >
                        Start Fresh
                    </button>
                </div>
            </div>
        </section>
    );
};

export default BoostCMSRecoveryPrompt;

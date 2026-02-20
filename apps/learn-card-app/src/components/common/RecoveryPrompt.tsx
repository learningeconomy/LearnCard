import React from 'react';
import progressBarIcon from '../../../src/assets/images/progress-bar.svg';

type RecoveryPromptProps = {
    title?: string;
    itemName: string;
    itemType?: string | null;
    onRecover: () => void;
    onDiscard: () => void;
    recoverButtonText?: string;
    discardButtonText?: string;
    icon?: string | null;
};

export const RecoveryPrompt: React.FC<RecoveryPromptProps> = ({
    title = 'Recover Your Progress',
    itemName,
    itemType = 'item',
    onRecover,
    onDiscard,
    recoverButtonText = 'Continue Editing',
    discardButtonText = 'Start Fresh',
    icon,
}) => {
    return (
        <section className="pt-[36px] pb-[16px]">
            <div className="flex flex-col items-center justify-center w-full">
                <div className="w-full flex flex-col items-center justify-center px-4 text-grayscale-900">
                    {icon && (
                        <>
                            <img
                                className="w-[70px] h-[70px] opacity-50 mb-[10px]"
                                src={icon || ''}
                                alt=""
                            />
                            <img
                                className="w-[70px] h-[5px] mb-[10px]"
                                src={progressBarIcon}
                                alt="progress bar"
                            />
                        </>
                    )}
                    <h5 className="mb-[15px] text-grayscale-700 font-poppins text-[17px]">
                        {itemName}
                    </h5>
                    <h6 className="font-semibold text-grayscale-900 font-poppins text-[23px] mb-[10px] leading-[130%]">
                        {title}
                    </h6>
                    <p className="text-center text-grayscale-900 font-poppins text-[20px] mb-4">
                        We found a {itemType} with unsaved changes. Would you like to continue where
                        you left off?
                    </p>

                    <button
                        onClick={onRecover}
                        className="flex items-center justify-center text-white rounded-[30px] px-[15px] py-[7px] bg-emerald-700 font-poppins font-semibold text-[17px] w-full"
                    >
                        {recoverButtonText}
                    </button>
                    <button
                        onClick={onDiscard}
                        className="flex items-center justify-center text-grayscale-800 rounded-[30px] border-solid border-[1px] border-grayscale-200 px-[15px] py-[7px] bg-grayscale-50 font-poppins font-semibold text-[17px] w-full mt-4"
                    >
                        {discardButtonText}
                    </button>
                </div>
            </div>
        </section>
    );
};

export default RecoveryPrompt;

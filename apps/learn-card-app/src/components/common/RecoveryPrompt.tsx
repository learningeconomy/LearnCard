import React from 'react';

type RecoveryPromptProps = {
    title?: string;
    itemName: string;
    itemType?: string;
    onRecover: () => void;
    onDiscard: () => void;
    recoverButtonText?: string;
    discardButtonText?: string;
};

export const RecoveryPrompt: React.FC<RecoveryPromptProps> = ({
    title = 'Recover Your Progress',
    itemName,
    itemType = 'item',
    onRecover,
    onDiscard,
    recoverButtonText = 'Continue Editing',
    discardButtonText = 'Start Fresh',
}) => {
    return (
        <section className="pt-[36px] pb-[16px]">
            <div className="flex flex-col items-center justify-center w-full">
                <div className="w-full flex flex-col items-center justify-center px-4 text-grayscale-900">
                    <h6 className="font-semibold text-black font-poppins text-xl mb-2">{title}</h6>
                    <p className="text-center text-grayscale-600 font-poppins text-sm mb-4">
                        We found unsaved changes for {itemType}{' '}
                        <strong>"{itemName || 'Untitled'}"</strong>. Would you like to continue
                        where you left off?
                    </p>

                    <button
                        onClick={onRecover}
                        className="flex items-center justify-center text-white rounded-full px-[64px] py-[10px] bg-emerald-700 font-poppins font-medium text-xl w-full shadow-lg"
                    >
                        {recoverButtonText}
                    </button>
                    <button
                        onClick={onDiscard}
                        className="flex items-center justify-center text-white rounded-full px-[50px] py-[10px] bg-grayscale-900 font-poppins font-medium text-xl w-full shadow-lg mt-4"
                    >
                        {discardButtonText}
                    </button>
                </div>
            </div>
        </section>
    );
};

export default RecoveryPrompt;

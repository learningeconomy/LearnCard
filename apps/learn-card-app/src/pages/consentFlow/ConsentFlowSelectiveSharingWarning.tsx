import React from 'react';
import { useModal } from 'learn-card-base';

type ConsentFlowSelectiveSharingWarningProps = {
    onContinue: () => void;
};

const ConsentFlowSelectiveSharingWarning: React.FC<ConsentFlowSelectiveSharingWarningProps> = ({
    onContinue,
}) => {
    const { closeModal } = useModal();
    return (
        <section className="max-h-full py-[5px] overflow-y-auto disable-scrollbars safe-area-top-margin">
            <section className="w-full flex flex-col gap-[20px] items-center px-[20px] py-[30px] bg-white shadow-bottom rounded-[24px] max-w-[350px]">
                <header className="flex flex-col gap-[10px] items-center">
                    <h3 className="text-grayscale-900 text-xl font-poppins font-[400] ">
                        Switch to Selective Sharing?
                    </h3>

                    <p className="text-grayscale-600 text-sm font-poppins text-center">
                        Deselecting data switches off Live Syncing and activates Selective Sharing,
                        giving you full control over which credentials you share. You can easily
                        revert to Live Syncing at any time.
                    </p>
                </header>
            </section>

            <button
                className="text-white w-full bg-emerald-700 flex items-center justify-center px-[20px] py-[10px] rounded-[24px] shadow-bottom font-poppins normal text-center text-xl font-normal max-w-[350px] mt-[10px]"
                type="button"
                onClick={() => {
                    onContinue();
                    closeModal();
                }}
            >
                Continue
            </button>

            <button
                className="text-black w-full bg-white flex items-center justify-center px-[20px] py-[10px] rounded-[24px] shadow-bottom font-poppins normal text-center text-xl font-normal max-w-[350px] mt-[15px]"
                type="button"
                onClick={closeModal}
            >
                Cancel
            </button>
        </section>
    );
};

export default ConsentFlowSelectiveSharingWarning;

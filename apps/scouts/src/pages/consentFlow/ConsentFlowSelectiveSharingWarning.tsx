import React from 'react';
import { useModal } from 'learn-card-base';
import * as m from '../../paraglide/messages.js';

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
                        {m['consentFlow.switchToSel']()}
                    </h3>

                    <p className="text-grayscale-600 text-sm font-poppins text-center">
                        {m['consentFlow.switchDesc']()}
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
                {m['common.continue']()}
            </button>

            <button
                className="text-black w-full bg-white flex items-center justify-center px-[20px] py-[10px] rounded-[24px] shadow-bottom font-poppins normal text-center text-xl font-normal max-w-[350px] mt-[15px]"
                type="button"
                onClick={closeModal}
            >
                {m['common.cancel']()}
            </button>
        </section>
    );
};

export default ConsentFlowSelectiveSharingWarning;

import React from 'react';
import WarningCircle from '../../../svgs/WarningCircle';
import LoggingOutPanel from './LoggingOutPanel';

export type UnderageModalContentProps = {
    onBack: () => void;
    onAdult: () => void;
    isLoggingOut: boolean;
};

const UnderageModalContent: React.FC<UnderageModalContentProps> = ({
    onBack,
    onAdult,
    isLoggingOut,
}) => {
    return (
        <div className="flex flex-col gap-[10px] items-center w-full h-full justify-center px-[20px] ">
            <div className="w-full bg-white rounded-[24px] px-[20px] py-[28px] shadow-3xl text-center max-w-[500px]">
                <div className="mx-auto mb-4 h-[60px] w-[60px] flex items-center justify-center">
                    <div className="flex items-center justify-center h-[60px] w-[60px]">
                        <WarningCircle className="h-full w-full" />
                    </div>
                </div>
                <h2 className="text-[22px] font-semibold text-grayscale-900 mb-2 font-noto">
                    Get an Adult
                </h2>
                <p className="text-grayscale-700 text-[17px] leading-[24px] px-[10px]">
                    You'll need a parent or guardian to add you to a family account before you can
                    join.
                </p>
            </div>
            <LoggingOutPanel isLoggingOut={isLoggingOut} />
            <div className="w-full flex gap-[10px] justify-center px-[10px] left-[0px] items-center ion-no-border bg-opacity-60 backdrop-blur-[10px] py-4 absolute bottom-0 bg-white !max-h-[100px] safe-area-bottom">
                <div className="w-full max-w-[700px] flex gap-[10px]">
                    <button
                        type="button"
                        onClick={onBack}
                        className=" shadow-button-bottom flex-1 py-[10px] text-[17px] bg-white rounded-[40px] text-grayscale-900 shadow-box-bottom border border-grayscale-200"
                    >
                        Back
                    </button>
                    <button
                        type="button"
                        onClick={onAdult}
                        className=" shadow-button-bottom font-semibold flex-1 py-[10px] text-[17px] bg-emerald-700 rounded-[40px] text-white shadow-box-bottom"
                    >
                        I'm an Adult
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UnderageModalContent;

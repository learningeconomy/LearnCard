import React from 'react';

import X from 'learn-card-base/svgs/X';
import { IonFooter } from '@ionic/react';
import ThreeDots from 'learn-card-base/svgs/ThreeDots';
import NewAiSessionIcon from 'learn-card-base/svgs/NewAiSessionIcon';

import { useDeviceTypeByWidth, useModal } from 'learn-card-base';

import { useTheme } from '../../theme/hooks/useTheme';

export const AiAssessmentPreviewFooter: React.FC<{
    handleStartAssessment?: () => void;
    isCompleted?: boolean;
    isFront?: boolean;
    setIsFront?: (isFront: boolean) => void;
    handleOptions?: () => void;
    handleShare?: () => void;
}> = ({ handleStartAssessment, isCompleted, isFront, setIsFront, handleOptions, handleShare }) => {
    const { closeModal } = useModal();
    const { isDesktop } = useDeviceTypeByWidth();
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    if (isCompleted && !isFront) {
        return (
            <IonFooter
                mode="ios"
                className="w-full flex justify-center items-center ion-no-border bg-opacity-60 backdrop-blur-[10px] py-4 left-0 absolute bottom-0 bg-white !max-h-[100px]"
            >
                <div className="w-full flex items-center justify-center">
                    <div className="w-full flex items-center justify-between max-w-[600px] ion-padding">
                        <button
                            onClick={() => {
                                setIsFront?.(!isFront);
                            }}
                            className=" py-[9px] pl-[20px] pr-[15px] bg-white rounded-[30px] font-notoSans text-[17px] leading-[24px] max-h-[42px] tracking-[0.25px] text-grayscale-900 w-full shadow-button-bottom flex gap-[5px] justify-center mr-2 font-semibold"
                        >
                            Back
                        </button>
                    </div>
                </div>
            </IonFooter>
        );
    }

    if (!isCompleted && isDesktop) {
        return (
            <IonFooter
                mode="ios"
                className="w-full flex justify-center items-center ion-no-border !bg-transparent py-4 left-0 absolute bottom-0 bg-white !max-h-[100px] pb-[50px]"
            >
                <div className="w-full flex items-center justify-center max-w-[600px] bg-white rounded-[20px]">
                    <div className="w-full flex items-center justify-between ion-padding">
                        <button
                            onClick={handleStartAssessment}
                            className={`bg-${primaryColor} py-[12px] pl-[20px] pr-[15px] rounded-[30px] font-notoSans text-[17px] leading-[24px] tracking-[0.25px] text-white w-full shadow-button-bottom flex gap-[5px] items-center justify-center font-semibold mr-4`}
                        >
                            Finish Session <NewAiSessionIcon />
                        </button>
                        {/* <button
                            onClick={closeModal}
                            className="flex items-center justify-center py-[8px] pl-[20px] pr-[15px] bg-white rounded-[30px] font-notoSans text-[17px] leading-[24px] tracking-[0.25px] text-indigo-500 w-full shadow-button-bottom gap-[5px] mr-4 font-semibold border-[2px] border-solid border-indigo-500"
                        >
                            Keep Going <RevisitIcon className="text-indigo-500" version="2" />
                        </button>
                        <button className="rounded-full bg-grayscale-100 min-h-[50px] min-w-[50px] flex items-center justify-center">
                            <TrashBin version="2" />
                        </button> */}
                    </div>
                </div>
            </IonFooter>
        );
    }

    return (
        <IonFooter
            mode="ios"
            className="w-full flex justify-center items-center ion-no-border bg-opacity-60 backdrop-blur-[10px] py-4 left-0 absolute bottom-0 bg-white !max-h-[100px]"
        >
            <div className="w-full flex items-center justify-center">
                <div className="w-full flex items-center justify-between max-w-[600px] ion-padding">
                    {isCompleted ? (
                        <>
                            {!isDesktop && (
                                <button
                                    onClick={closeModal}
                                    className="min-w-[46px] min-h-[46px] bg-white rounded-full flex items-center justify-center mr-2 shadow-soft-bottom"
                                >
                                    <X className="w-[20px] h-auto text-grayscale-900" />
                                </button>
                            )}

                            <button
                                onClick={() => setIsFront?.(!isFront)}
                                className="bg-white text-grayscale-800 py-[9px] pl-[20px] pr-[15px] rounded-[30px] font-notoSans text-[17px] font-[600] leading-[24px] tracking-[0.25px] w-full shadow-button-bottom flex gap-[5px] items-center justify-center mr-2"
                            >
                                Details
                            </button>
                            <button
                                onClick={() => handleShare?.()}
                                className={`bg-${primaryColor} py-[9px] pl-[20px] pr-[15px] rounded-[30px] font-notoSans text-[17px] font-[600] leading-[24px] tracking-[0.25px] text-white w-full shadow-button-bottom flex gap-[5px] items-center justify-center mr-2`}
                            >
                                Share
                            </button>
                            <button
                                onClick={() => handleOptions?.()}
                                className="min-w-[46px] min-h-[46px] bg-white rounded-full flex items-center justify-center mr-2 shadow-soft-bottom"
                            >
                                <ThreeDots className="w-[20px] h-auto text-grayscale-900" />
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={closeModal}
                                className=" py-[9px] pl-[20px] pr-[15px] bg-white rounded-[30px] font-notoSans text-[17px] leading-[24px] max-h-[42px] tracking-[0.25px] text-grayscale-900 w-full shadow-button-bottom flex gap-[5px] justify-center mr-2 font-semibold"
                            >
                                Close
                            </button>

                            <button
                                onClick={handleStartAssessment}
                                className={`bg-${primaryColor} py-[9px] pl-[20px] pr-[15px] rounded-[30px] font-notoSans text-[17px] leading-[24px] max-h-[42px] tracking-[0.25px] text-white w-full shadow-button-bottom flex gap-[5px] items-center justify-center font-semibold`}
                            >
                                Finish <NewAiSessionIcon />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </IonFooter>
    );
};

export default AiAssessmentPreviewFooter;

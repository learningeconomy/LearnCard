import React from 'react';
import { Capacitor } from '@capacitor/core';

import { IonFooter } from '@ionic/react';

import { ModalTypes, useModal } from 'learn-card-base';
import { useSafeArea } from 'learn-card-base/hooks/useSafeArea';

const EndorsementRequestFormFooter: React.FC<{
    className?: string;
    handleEndorsementPreview?: () => void;
    showEndorsementPreview?: boolean;
    handleCloseModal?: () => void;
}> = ({ className, handleEndorsementPreview, showEndorsementPreview, handleCloseModal }) => {
    const { closeModal } = useModal({
        desktop: ModalTypes.Right,
        mobile: ModalTypes.Right,
    });
    const safeArea = useSafeArea();

    let bottomPosition = safeArea.bottom;
    if (Capacitor.isNativePlatform()) bottomPosition = 20 + safeArea.bottom;

    return (
        <IonFooter
            mode="ios"
            className={`w-full flex justify-center items-center ion-no-border bg-opacity-60 backdrop-blur-[10px] py-4 absolute bottom-0 left-0 bg-white !max-h-[100px] ${className}`}
            style={{
                bottom: `${bottomPosition}px`,
            }}
        >
            <div className="w-full flex items-center justify-center">
                <div className="w-full flex items-center justify-between max-w-[600px] ion-padding">
                    <button
                        onClick={() => {
                            if (handleCloseModal) {
                                handleCloseModal?.();
                                return;
                            } else {
                                closeModal();
                            }
                        }}
                        className={`py-[9px] pl-[20px] pr-[15px] bg-white rounded-[30px] font-poppins text-[17px] leading-[24px] tracking-[0.25px] text-grayscale-900 shadow-button-bottom flex gap-[5px] justify-center mr-2 ${
                            showEndorsementPreview ? '' : 'w-full'
                        }`}
                    >
                        Close
                    </button>
                    {showEndorsementPreview && (
                        <button
                            onClick={handleEndorsementPreview}
                            className="flex-1 py-[9px] pl-[20px] pr-[15px] bg-grayscale-900 text-white rounded-[30px] font-poppins text-[17px] leading-[24px] tracking-[0.25px] text-white w-full shadow-button-bottom flex gap-[5px] justify-center mr-2"
                        >
                            View Endorsement
                        </button>
                    )}
                </div>
            </div>
        </IonFooter>
    );
};

export default EndorsementRequestFormFooter;

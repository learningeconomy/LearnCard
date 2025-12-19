import React from 'react';
import { Capacitor } from '@capacitor/core';

import X from 'learn-card-base/svgs/X';
import { IonFooter } from '@ionic/react';
import { EndorsmentThumbWithCircle } from 'learn-card-base/svgs/EndorsementThumb';

import { useModal } from 'learn-card-base';
import { useSafeArea } from 'learn-card-base/hooks/useSafeArea';

const EndorsementFormFooter: React.FC<{
    isDisabled?: boolean;
    isLoading?: boolean;
    className?: string;
    showDeclineButton?: boolean;
    handleEndorsementSubmit?: () => void;
}> = ({ isDisabled, isLoading, className, showDeclineButton = false, handleEndorsementSubmit }) => {
    const { closeModal } = useModal();
    const safeArea = useSafeArea();

    let bottomPosition = safeArea.bottom;
    if (Capacitor.isNativePlatform()) bottomPosition = 20 + safeArea.bottom;

    let iconStyles = '';
    if (isDisabled) iconStyles = 'text-grayscale-300';
    else iconStyles = 'text-teal-400';

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
                    {showDeclineButton ? (
                        <button
                            onClick={closeModal}
                            className="min-w-[46px] min-h-[46px] bg-white rounded-full flex items-center justify-center mr-2 shadow-soft-bottom"
                        >
                            <X className="w-[20px] h-auto text-grayscale-900" />
                        </button>
                    ) : (
                        <button
                            onClick={closeModal}
                            className="py-[9px] pl-[20px] pr-[15px] bg-white rounded-[30px] font-poppins text-[17px] leading-[24px] tracking-[0.25px] text-grayscale-900 w-full shadow-button-bottom flex gap-[5px] justify-center mr-2"
                        >
                            Back
                        </button>
                    )}
                    {showDeclineButton && (
                        <button className="py-[9px] pl-[20px] pr-[15px] bg-white rounded-[30px] font-poppins text-[17px] leading-[24px] tracking-[0.25px] text-grayscale-900 w-full shadow-button-bottom flex gap-[5px] justify-center mr-2">
                            Decline
                        </button>
                    )}
                    <button
                        disabled={isDisabled || isLoading}
                        onClick={handleEndorsementSubmit}
                        className={`py-[9px] pl-[20px] pr-[15px] rounded-[30px] font-poppins text-[17px] leading-[24px] tracking-[0.25px] text-white w-full shadow-button-bottom flex gap-[5px] justify-center mr-2 ${
                            isDisabled || isLoading ? 'bg-grayscale-300' : 'bg-teal-400'
                        }`}
                    >
                        {isLoading ? 'Sending...' : 'Endorse'}{' '}
                        <EndorsmentThumbWithCircle className={`w-6 h-6 ${iconStyles}`} />
                    </button>
                </div>
            </div>
        </IonFooter>
    );
};

export default EndorsementFormFooter;

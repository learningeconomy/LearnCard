import React from 'react';
import { useModal } from 'learn-card-base';

import { IonFooter } from '@ionic/react';

import useTheme from '../../theme/hooks/useTheme';

type ConsentFlowErrorFooterProps = {
    hideRetry?: boolean;
    buttonAction?: () => void;
};

const ConsentFlowErrorFooter: React.FC<ConsentFlowErrorFooterProps> = ({
    hideRetry,
    buttonAction,
}) => {
    const { closeModal } = useModal();

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    return (
        <IonFooter
            mode="ios"
            className="w-full bg-white border-white border-t-1px bg-opacity-60 border-t-[1px] sticky bottom-0 p-[20px] backdrop-blur-[10px] h-[85px]"
        >
            <div className="flex items-center justify-between max-w-[600px] mx-auto gap-[10px]">
                {hideRetry ? (
                    <button
                        onClick={closeModal}
                        className={`py-[9px] pl-[20px] pr-[15px] bg-${primaryColor} text-white rounded-[35px] font-notoSans text-[17px] font-[600] leading-[24px] tracking-[0.25px] w-[450px] m-auto shadow-button-bottom flex gap-[5px] justify-center`}
                    >
                        Back to LearnCard
                    </button>
                ) : (
                    <button
                        onClick={closeModal}
                        className="bg-white py-[9px] px-[15px] rounded-[30px] font-notoSans text-[17px] text-grayscale-900 w-full shadow-button-bottom"
                    >
                        Cancel
                    </button>
                )}

                {!hideRetry && (
                    <button
                        onClick={buttonAction}
                        className={`bg-${primaryColor} text-white py-[9px] px-[15px] rounded-[30px] font-notoSans text-[17px] font-semibold w-full shadow-button-bottom`}
                    >
                        Retry
                    </button>
                )}
            </div>
        </IonFooter>
    );
};

export default ConsentFlowErrorFooter;

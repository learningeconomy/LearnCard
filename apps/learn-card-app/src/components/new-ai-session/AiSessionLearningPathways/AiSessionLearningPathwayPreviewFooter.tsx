import React from 'react';

import { IonFooter } from '@ionic/react';
import NewAiSessionIcon from 'learn-card-base/svgs/NewAiSessionIcon';

import { useModal } from 'learn-card-base';

import useTheme from '../../../theme/hooks/useTheme';

export const AiSessionLearningPathwayPreviewFooter: React.FC<{
    handleStartAiSession?: () => void;
}> = ({ handleStartAiSession }) => {
    const { closeModal } = useModal();
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    return (
        <IonFooter
            mode="ios"
            className="w-full flex justify-center items-center ion-no-border bg-opacity-60 backdrop-blur-[10px] py-4 left-0 absolute bottom-0 bg-white !max-h-[100px]"
        >
            <div className="w-full flex items-center justify-center">
                <div className="w-full flex items-center justify-between max-w-[600px] ion-padding">
                    <button
                        onClick={closeModal}
                        className=" py-[9px] pl-[20px] pr-[15px] bg-white rounded-[30px] font-notoSans text-[17px] leading-[24px] max-h-[42px] tracking-[0.25px] text-grayscale-900 w-full shadow-button-bottom flex gap-[5px] justify-center mr-2 font-semibold"
                    >
                        Close
                    </button>

                    <button
                        onClick={handleStartAiSession}
                        className={`bg-${primaryColor} py-[9px] pl-[20px] pr-[15px] rounded-[30px] font-notoSans text-[17px] leading-[24px] max-h-[42px] tracking-[0.25px] text-white w-full shadow-button-bottom flex gap-[5px] items-center justify-center font-semibold`}
                    >
                        Start <NewAiSessionIcon />
                    </button>
                </div>
            </div>
        </IonFooter>
    );
};

export default AiSessionLearningPathwayPreviewFooter;

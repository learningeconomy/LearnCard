import React from 'react';

import { IonFooter } from '@ionic/react';

import { useModal } from 'learn-card-base';

import NewAiSessionButton, {
    NewAiSessionButtonEnum,
} from '../../new-ai-session/NewAiSessionButton/NewAiSessionButton';
import { LaunchPadAppListItem } from 'learn-card-base';

export const AiPassportAppProfileFooter: React.FC<{
    showBackButton?: boolean;
    app: LaunchPadAppListItem;
}> = ({ showBackButton, app }) => {
    const { closeModal } = useModal();

    return (
        <IonFooter
            mode="ios"
            className="w-full flex justify-center items-center ion-no-border bg-opacity-60 backdrop-blur-[10px] py-4 absolute bottom-0 bg-white !max-h-[100px]"
        >
            <div className="w-full flex items-center justify-center">
                <div className="w-full flex items-center justify-between max-w-[600px] ion-padding">
                    {showBackButton ? (
                        <button
                            onClick={closeModal}
                            className=" py-[9px] pl-[20px] pr-[15px] bg-white rounded-[30px] font-notoSans text-[17px] leading-[24px] tracking-[0.25px] text-grayscale-900 w-full shadow-button-bottom flex gap-[5px] justify-center mr-2"
                        >
                            Back
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={closeModal}
                                className=" py-[9px] pl-[20px] pr-[15px] bg-white rounded-[30px] font-notoSans text-[17px] leading-[24px] max-h-[42px] tracking-[0.25px] text-grayscale-900 w-full shadow-button-bottom flex gap-[5px] justify-center mr-2"
                            >
                                Close
                            </button>

                            <NewAiSessionButton
                                type={NewAiSessionButtonEnum.default}
                                selectedApp={app}
                            />
                        </>
                    )}
                </div>
            </div>
        </IonFooter>
    );
};

export default AiPassportAppProfileFooter;

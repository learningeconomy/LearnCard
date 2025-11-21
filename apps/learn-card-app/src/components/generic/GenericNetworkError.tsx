import { IonFooter } from '@ionic/react';
import NetworkErrorIcon from 'learn-card-base/svgs/NetworkErrorIcon';

const GenericNetworkError: React.FC<{
    text: string;
    closeModal: () => void;
    handleRetry: () => void;
}> = ({ text, closeModal, handleRetry }) => {
    return (
        <div className="h-full w-full flex items-center justify-center">
            <div className="flex flex-col items-center justify-center bg-white max-w-[375px] xs:max-w-[320px] xxs:max-w-[300px] h-[335px] w-full rounded-[24px] px-4 py-8">
                <NetworkErrorIcon />
                <h4 className="text-center text-[22px] font-bold leading-[24px] tracking-[0.25px] text-grayscale-900">
                    Network Error
                </h4>
                <p className="text-center text-[17px] leading-[24px] tracking-[0.25px] text-grayscale-900 mt-2">
                    {text}
                </p>
            </div>

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
                            onClick={handleRetry}
                            className="bg-indigo-500 py-[9px] pl-[20px] pr-[15px] rounded-[30px] font-notoSans text-[17px] leading-[24px] max-h-[42px] tracking-[0.25px] text-white w-full shadow-button-bottom flex gap-[5px] items-center justify-center font-semibold"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </IonFooter>
        </div>
    );
};

export default GenericNetworkError;

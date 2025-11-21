import React from 'react';

import { useScreenWidth } from 'learn-card-base';

import { IonContent, IonRow, IonCol } from '@ionic/react';

const ModalLayoutActionButton: React.FC<{ handleOnClick: () => void; buttonText?: string }> = ({
    handleOnClick,
    buttonText = 'Close',
}) => {
    return (
        <IonRow className="flex w-full items-center justify-center">
            <IonCol className="mt-2 flex w-full max-w-[400px] items-center justify-center rounded-[20px] bg-white">
                <button
                    onClick={handleOnClick}
                    className="text-grayscale-900 flex flex-1 items-center justify-center py-1 text-lg font-notoSans"
                >
                    {buttonText}
                </button>
            </IonCol>
        </IonRow>
    );
};

const ModalLayout: React.FC<{
    allowScroll?: boolean;
    buttonText?: string;
    handleOnClick: () => void;
    containerClass?: string;
    extraActionButtons?: React.ReactNode;
    children: any;
}> = ({
    allowScroll = false,
    buttonText,
    handleOnClick,
    containerClass,
    extraActionButtons,
    children,
}) => {
    const width = useScreenWidth(true);

    const containerStyles = width > 991 ? 'justify-center' : 'justify-end';

    if (allowScroll) {
        return (
            <IonContent className="ion-padding transparent-modal-backdrop flex items-center justify-center">
                <IonRow className="flex h-full flex-col items-center justify-center">
                    <IonCol
                        size="12"
                        className={`flex w-full flex-col items-center ${containerStyles}`}
                    >
                        <div
                            className={`shadow-3xl relative mt-3 flex w-full max-w-[400px] flex-col items-start justify-start overflow-hidden rounded-[20px] bg-white pb-4 pt-9 ${containerClass}`}
                        >
                            <div className="w-full overflow-y-scroll">{children}</div>
                        </div>
                        {extraActionButtons && extraActionButtons}
                        <ModalLayoutActionButton
                            handleOnClick={handleOnClick}
                            buttonText={buttonText}
                        />
                    </IonCol>
                </IonRow>
            </IonContent>
        );
    }

    return (
        <IonContent className="ion-padding transparent-modal-backdrop flex items-center justify-center">
            <IonRow className="flex h-full flex-col items-center justify-center">
                <IonCol
                    size="12"
                    className={`flex w-full flex-col items-center ${containerStyles}`}
                >
                    <div
                        className={`shadow-3xl relative mt-3 flex w-full max-w-[400px] flex-col items-start justify-start overflow-hidden rounded-[20px] bg-white pb-4 pt-9 ${containerClass}`}
                    >
                        {children}
                    </div>

                    {extraActionButtons && extraActionButtons}
                    <ModalLayoutActionButton
                        handleOnClick={handleOnClick}
                        buttonText={buttonText}
                    />
                </IonCol>
            </IonRow>
        </IonContent>
    );
};

export default ModalLayout;

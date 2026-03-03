import React from 'react';
import { IonCol, IonContent, IonGrid, IonHeader, IonPage, IonRow } from '@ionic/react';

export const ClaimBoostLoggedOutPrompt: React.FC<{
    handleCloseModal: () => void;
    handleRedirectTo: () => void;
}> = ({ handleCloseModal, handleRedirectTo }) => {
    return (
        <IonPage>
            <IonHeader className="ion-no-border ion-no-padding bg-white">
                <IonRow className="flex flex-col pt-[50px]">
                    <IonCol className="w-full flex items-center justify-center">
                        <h6 className="tracking-[12px] text-base font-bold text-black">
                             SCOUTPASS
                        </h6>
                    </IonCol>
                </IonRow>
            </IonHeader>
            <IonContent>
                <IonGrid className="relative flex flex-col items-center justify-center h-[100%] w-full">
                    <IonRow className="flex flex-col items-center justify-center">
                        <IonCol className="w-full flex flex-col items-center justify-center">
                            <h6 className="font-semi-bold text-black text-2xl mb-[25px]">
                                One more step!
                            </h6>
                            <p className="w-full text-center text-sm mb-4 text-grayscale-600 mb-[25px]">
                                Please login to claim your <br /> boost/credential.
                            </p>
                            <button
                                onClick={handleRedirectTo}
                                className="flex items-center justify-center text-white font-medium rounded-full px-[64px] py-[10px] bg-sp-purple-base  text-2xl w-full shadow-lg"
                            >
                                Login
                            </button>
                            <button
                                onClick={handleRedirectTo}
                                className="mt-4 text-grayscale-900 font-medium"
                            >
                                Signup
                            </button>
                            <button
                                onClick={handleCloseModal}
                                className="mt-2 text-grayscale-900 font-medium"
                            >
                                Skip for now
                            </button>
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </IonContent>
        </IonPage>
    );
};

export default ClaimBoostLoggedOutPrompt;

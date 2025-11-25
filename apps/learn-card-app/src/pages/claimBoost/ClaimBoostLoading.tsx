import React from 'react';
import { IonCol, IonContent, IonRow, IonGrid, IonHeader, IonPage } from '@ionic/react';

import Lottie from 'react-lottie-player';
import HourGlass from '../../assets/lotties/hourglass.json';

const ClaimBoostLoading: React.FC = () => {
    return (
        <IonPage className="claim-boost-loading">
            <IonContent className="">
                <IonCol className="flex m-auto items-center flex-wrap w-full h-full">
                    <div className="flex flex-col w-full h-full items-center justify-center">
                        <h3 className="text-grayscale-900 text-xl font-poppins font-bold">
                            Claiming...
                        </h3>
                        <div className="max-w-[150px]">
                            <Lottie
                                loop
                                animationData={HourGlass}
                                play
                                style={{ width: '100%', height: '100%' }}
                            />
                        </div>
                    </div>
                </IonCol>
            </IonContent>
        </IonPage>
    );
};

export default ClaimBoostLoading;

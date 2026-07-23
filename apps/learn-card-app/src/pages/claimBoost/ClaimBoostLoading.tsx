import React from 'react';
import { IonCol, IonContent, IonRow, IonGrid, IonHeader, IonPage } from '@ionic/react';
import * as m from '../../paraglide/messages.js';

import { LoadingSpinner } from 'learn-card-base/components/loaders/LoadingSpinner';

const ClaimBoostLoading: React.FC = () => {
    return (
        <IonPage className="claim-boost-loading">
            <IonContent className="">
                <IonCol className="flex m-auto items-center flex-wrap w-full h-full">
                    <div className="flex flex-col w-full h-full items-center justify-center">
                        <h3 className="text-grayscale-900 text-xl font-poppins font-bold">
                            {m['claim.claiming']()}
                        </h3>
                        <div className="max-w-[150px]">
                            <LoadingSpinner className="h-full w-full" />
                        </div>
                    </div>
                </IonCol>
            </IonContent>
        </IonPage>
    );
};

export default ClaimBoostLoading;

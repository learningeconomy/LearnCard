import React from 'react';
import { IonContent, IonPage, IonButton } from '@ionic/react';
import * as m from '../../paraglide/messages.js';

interface ExchangeInitiateProps {
    onStart: () => void;
}

const ExchangeInitiate: React.FC<ExchangeInitiateProps> = ({ onStart }) => {
    return (
        <IonPage>
            <IonContent fullscreen className="ion-padding">
                <div className="flex flex-col items-center justify-center h-full">
                    <h1 className="text-2xl font-bold text-center mb-4">
                        {m['claim.initiate.heading']()}
                    </h1>
                    <p className="text-center mb-8">{m['claim.initiate.description']()}</p>
                    <IonButton onClick={onStart}>{m['claim.initiate.begin']()}</IonButton>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default ExchangeInitiate;

import React from 'react';
import { IonContent, IonPage, IonButton } from '@ionic/react';

interface ExchangeInitiateProps {
    onStart: () => void;
}

const ExchangeInitiate: React.FC<ExchangeInitiateProps> = ({ onStart }) => {
    return (
        <IonPage>
            <IonContent fullscreen className="ion-padding">
                <div className="flex flex-col items-center justify-center h-full">
                    <h1 className="text-2xl font-bold text-center mb-4">
                        You've been sent a request
                    </h1>
                    <p className="text-center mb-8">
                        Click the button below to begin the exchange process.
                    </p>
                    <IonButton onClick={onStart}>Begin</IonButton>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default ExchangeInitiate;
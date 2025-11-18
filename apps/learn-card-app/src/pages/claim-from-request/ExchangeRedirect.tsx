import React from 'react';
import { IonContent, IonPage, IonButton } from '@ionic/react';

interface ExchangeRedirectProps {
    redirectUrl: string; // Contains the redirectUrl from the server
}

const ExchangeRedirect: React.FC<ExchangeRedirectProps> = ({ redirectUrl }) => {
    const handleRedirect = () => {
        if (redirectUrl) {
            window.open(redirectUrl, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <IonPage>
            <IonContent fullscreen className="ion-padding">
                <div className="flex flex-col items-center justify-center h-full">
                    <h1 className="text-2xl font-bold text-center mb-4">
                        Redirect Required
                    </h1>
                    <p className="text-center mb-8">
                        To continue, you need to complete a step on an external website.
                    </p>
                    <IonButton onClick={handleRedirect} disabled={!redirectUrl}>
                        Continue
                    </IonButton>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default ExchangeRedirect;
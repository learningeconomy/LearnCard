import React from 'react';
import { IonContent, IonPage, IonButton } from '@ionic/react';
import * as m from '../../paraglide/messages.js';

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
                        {m['claim.redirect.heading']()}
                    </h1>
                    <p className="text-center mb-8">{m['claim.redirect.description']()}</p>
                    <IonButton onClick={handleRedirect} disabled={!redirectUrl}>
                        {m['common.continue']()}
                    </IonButton>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default ExchangeRedirect;

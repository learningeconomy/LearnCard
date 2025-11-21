import React from 'react';
import {
    IonContent,
    IonPage,
    IonButton,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
} from '@ionic/react';
import { VP } from '@learncard/types';
import { useWallet, useIsLoggedIn } from 'learn-card-base';
import { useHistory } from 'react-router-dom';
import { VCAPIRequestStrategy } from './ClaimFromRequest';

interface ExchangeDidAuthProps {
    // This should contain the challenge and domain from the VPR
    verifiablePresentationRequest?: {
        query: object[];
        challenge: string;
        domain: string;
    };
    strategy?: VCAPIRequestStrategy;

    onSubmit: (body: VP | { verifiablePresentation: VP }) => void;
    onDecline?: () => void; // Optional: if specific decline logic is needed beyond navigation
}

const ExchangeDidAuth: React.FC<ExchangeDidAuthProps> = ({
    verifiablePresentationRequest,
    onSubmit,
    onDecline,
    strategy,
}) => {
    const { initWallet } = useWallet();
    const isLoggedIn = useIsLoggedIn();
    const history = useHistory();

    const handleAccept = async () => {
        const wallet = await initWallet();
        if (!isLoggedIn || !wallet) {
            // This should ideally be handled before even reaching this component,
            // but as a safeguard:
            console.error('User not logged in or wallet not initialized');
            // Optionally, prompt for login or initialization
            return;
        }

        try {
            const didAuthVp: VP = await wallet.invoke.getDidAuthVp({
                challenge: verifiablePresentationRequest?.challenge,
                domain: verifiablePresentationRequest?.domain, // Ensure this domain is what the verifier expects
            });

            if (strategy === VCAPIRequestStrategy.Wrapped) {
                onSubmit({ verifiablePresentation: didAuthVp });
            } else {
                onSubmit(didAuthVp);
            }
        } catch (error) {
            console.error('Failed to create DID Auth VP:', error);
            // Optionally, display an error to the user
        }
    };

    const handleDecline = () => {
        if (onDecline) {
            onDecline();
        } else {
            history.push('/home'); // Default decline action
        }
    };

    const purpose =
        verifiablePresentationRequest?.query?.[0]?.credentialQuery?.[0]?.reason ||
        'authenticate to proceed with an exchange.';

    return (
        <IonPage>
            <IonHeader>
                <IonToolbar>
                    <IonTitle className="px-5">Authentication Request</IonTitle>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen className="ion-padding">
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <h2 className="text-xl font-semibold mb-2">Confirm Action</h2>
                    <p className="mb-6">The requesting service wants you to {purpose}</p>

                    <div className="w-full max-w-xs">
                        <IonButton expand="block" onClick={handleAccept} className="mb-3">
                            Accept & Authenticate
                        </IonButton>
                        <IonButton expand="block" color="light" onClick={handleDecline}>
                            Decline
                        </IonButton>
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default ExchangeDidAuth;

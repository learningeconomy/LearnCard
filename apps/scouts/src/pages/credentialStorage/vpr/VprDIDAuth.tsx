import React, { useState, useEffect } from 'react';
import { initLearnCard } from '@learncard/init';

import { useCurrentUser, chapiStore, redirectStore } from 'learn-card-base';

import { IonPage, IonContent, IonRow, IonCol } from '@ionic/react';

const VprDIDAuth: React.FC = ({ event, currentUser }) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const accept = async () => {
        setIsLoading(true);
        const wallet = await initLearnCard({ seed: currentUser?.privateKey });

        const presentation = event.credentialRequestOptions.web.VerifiablePresentation;
        const { challenge, domain } = presentation;

        try {
            chapiStore.set.isChapiInteraction(null);
            redirectStore.set.authRedirect(null);
        } catch (e) {
            console.error(e);
        }

        // TODO: Move this logic into LearnCard - LearnCard should handle DID-Auth presentation flow.
        const didAuthVp = {
            '@context': [
                'https://www.w3.org/2018/credentials/v1',
                'https://w3id.org/security/suites/ed25519-2020/v1',
            ],
            type: 'VerifiablePresentation',
            holder: wallet.id.did(),
        };

        const data = await wallet.invoke.issuePresentation(didAuthVp, {
            challenge,
            domain,
            proofPurpose: 'authentication',
        });

        event.respondWith(
            Promise.resolve({
                dataType: 'VerifiablePresentation',
                data,
            })
        );
        setIsLoading(false);
    };

    const reject = () => {
        try {
            chapiStore.set.isChapiInteraction(null);
            redirectStore.set.authRedirect(null);
        } catch (e) {
            console.error(e);
        }
        event.respondWith(Promise.resolve(null));
    };

    return (
        <IonPage>
            <IonContent fullscreen>
                <IonRow className="w-full flex items-center justify-center h-full">
                    <IonCol className="w-full flex flex-col items-center justify-center text-center">
                        <h2 className="mt-6 font-bold">
                            {event?.credentialRequestOrigin}
                            <br />
                            would like to send you a credential?
                        </h2>
                        <div className="flex items-center justify-center w-full mt-4">
                            <button
                                type="button"
                                className="bg-emerald-700 rounded-full text-white font-bold border px-4 py-2 mr-2 w-full max-w-[200px]"
                                onClick={accept}
                            >
                                {isLoading ? 'Accepting...' : 'Accept'}
                            </button>
                            <button
                                type="button"
                                className="bg-rose-600 rounded-full text-white font-bold border px-4 py-2 w-full max-w-[200px]"
                                onClick={reject}
                            >
                                Reject
                            </button>
                        </div>
                    </IonCol>
                </IonRow>
            </IonContent>
        </IonPage>
    );
};

export default VprDIDAuth;

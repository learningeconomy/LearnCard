import React, { useState, useEffect } from 'react';
import { initLearnCard } from '@learncard/init';
import type { VP, VC } from '@learncard/types';

import { useCurrentUser, chapiStore, redirectStore } from 'learn-card-base';

import { IonPage, IonContent, IonRow, IonCol } from '@ionic/react';
import LoadingPage from '../loadingPage/LoadingPage';

import VprDIDAuth from './vpr/VprDIDAuth';
import VprQueryByExample from './vpr/VprQueryByExample';

export const getCredentialFromVp = (vp: VP): VC => {
    const vcField = vp.verifiableCredential;

    return Array.isArray(vcField) ? vcField[0] : vcField;
};

const CredentialStorageGet: React.FC = () => {
    const currentUser = useCurrentUser();

    const [event, setEvent] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser?.privateKey) {
                console.warn('🤔 Current user still loading...');
                return;
            }

            const wallet = await initLearnCard({ seed: currentUser?.privateKey });

            const _event = await wallet.invoke.receiveChapiEvent();

            if (_event) setEvent(_event);
        };
        fetchData();
    }, [currentUser]);

    if (!event) return <LoadingPage />;

    const vprType = event?.credentialRequestOptions?.web?.VerifiablePresentation?.query?.[0]?.type;

    switch (vprType) {
        case 'QueryByExample':
            return <VprQueryByExample event={event} currentUser={currentUser} />;
        case 'DIDAuthentication':
        case 'DIDAuth':
        default:
            return <VprDIDAuth event={event} currentUser={currentUser} />;
    }
};

export default CredentialStorageGet;

import React, { useState, useEffect } from 'react';
import { initLearnCard } from '@learncard/init';
import type { VP, VC } from '@learncard/types';

import { useCurrentUser, chapiStore, redirectStore } from 'learn-card-base';

import LoadingPage from '../loadingPage/LoadingPage';

import VprDIDAuth from './vpr/VprDIDAuth';
import VprQueryByExample from './vpr/VprQueryByExample';
import { getLogger } from 'learn-card-base';
import { AppContent, AppPage } from 'learn-card-base/ui/chrome';
import { AppCol, AppRow } from 'learn-card-base/ui/layout';
const log = getLogger('credential-storage-get');

export const getCredentialFromVp = (vp: VP): VC => {
    const vcField = vp.verifiableCredential;

    return Array.isArray(vcField) ? vcField[0] : vcField;
};

const CredentialStorageGet: React.FC = () => {
    const currentUser = useCurrentUser();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- existing loose type; tightening it is a typing change, out of scope for the Ionic removal
    const [event, setEvent] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser?.privateKey) {
                log.warn('🤔 Current user still loading...');
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

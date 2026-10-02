import React, { useState, useEffect } from 'react';
import {
    IonContent,
    IonPage,
    IonButton,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonLoading,
    IonList,
    IonItem,
    IonCheckbox,
    IonLabel,
    IonSpinner,
} from '@ionic/react';
import { useWallet } from 'learn-card-base';
import { VC, VP } from '@learncard/types';
import { useGetCredentialList } from 'learn-card-base';
import VprQueryByExample from '../credentialStorage/vpr/VprQueryByExample';
import { useCurrentUser } from 'learn-card-base';
import { VCAPIRequestStrategy } from './ClaimFromRequest';
import type { VerifierPresentationRequest } from '../../helpers/verifier-history/disclosure';
import type { DisclosureAttempt } from '../../helpers/verifier-history/history';

import { getLogger } from 'learn-card-base';
const log = getLogger('exchange-presentation-request');

interface ExchangePresentationRequestProps {
    verifiablePresentationRequest: VerifierPresentationRequest; // Contains the verifiablePresentationRequest from the server
    strategy?: VCAPIRequestStrategy;
    onSubmit: (
        body: { verifiablePresentation: VP } | VP,
        credentialClaimCount?: number,
        history?: DisclosureAttempt
    ) => void | Promise<void>;
    onCancel?: () => void;
}

const ExchangePresentationRequest: React.FC<ExchangePresentationRequestProps> = ({
    verifiablePresentationRequest,
    onSubmit,
    strategy,
    onCancel,
}) => {
    const currentUser = useCurrentUser();

    const purpose = verifiablePresentationRequest?.purpose || 'share some information';

    const handleSubmit = async (
        data: { verifiablePresentation: VP },
        history?: DisclosureAttempt
    ) => {
        if (strategy === VCAPIRequestStrategy.Wrapped) {
            await onSubmit(data, undefined, history);
        } else {
            await onSubmit(data?.verifiablePresentation, undefined, history);
        }
    };

    const handleReject = () => {
        log.info('reject');
        onCancel?.();
    };

    return (
        <VprQueryByExample
            currentUser={currentUser}
            verifiablePresentationRequest={verifiablePresentationRequest}
            onSubmit={handleSubmit}
            onReject={handleReject}
        />
    );
};

export default ExchangePresentationRequest;

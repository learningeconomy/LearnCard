import React, { useState, useEffect } from 'react';
import {
    IonContent,
    IonPage,
    IonButton,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonLoading,
    useIonToast,
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

interface ExchangePresentationRequestProps {
    verifiablePresentationRequest: any; // Contains the verifiablePresentationRequest from the server
    strategy?: VCAPIRequestStrategy;
    onSubmit: (body: { verifiablePresentation: VP } | VP) => void;
}

const ExchangePresentationRequest: React.FC<ExchangePresentationRequestProps> = ({ verifiablePresentationRequest, onSubmit, strategy }) => {
    const currentUser = useCurrentUser();

    const purpose = verifiablePresentationRequest?.purpose || 'share some information';


    const handleSubmit = async (data: { verifiablePresentation: VP }) => {
        if (strategy === VCAPIRequestStrategy.Wrapped) {
            onSubmit(data);
        } else {
            onSubmit(data?.verifiablePresentation);
        }
    };

    const handleReject = () => {
     console.log('reject');   
    };

    return (
        <VprQueryByExample currentUser={currentUser} verifiablePresentationRequest={verifiablePresentationRequest} onSubmit={handleSubmit}  onReject={handleReject}/>
    );
};

export default ExchangePresentationRequest;
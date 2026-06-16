import React, { Suspense, lazy, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { IonContent, IonPage, IonSpinner } from '@ionic/react';

import { ModalTypes, QRCodeScannerStore, useModal, getLogger } from 'learn-card-base';

import IssueManagedBoostSelector from '../../launchPad/LaunchPadHeader/IssueManagedBoostSelector';

const log = getLogger('dashboard');

const importPasteOrUploadClaimModal = () =>
    import('../../../components/paste-or-upload-claim/PasteOrUploadClaimModal');

const LazyPasteOrUploadClaimModal = lazy(importPasteOrUploadClaimModal);

const PasteOrUploadClaimModalFallback: React.FC = () => (
    <IonPage>
        <IonContent>
            <div className="font-poppins flex items-center justify-center min-h-[360px] p-8">
                <IonSpinner name="crescent" className="text-grayscale-700" />
            </div>
        </IonContent>
    </IonPage>
);

type AddToLearnCardActions = {
    openClaimLink: () => void;
    openIssueCredential: () => void;
    openScanQr: (() => void) | null;
};

const useAddToLearnCardActions = (): AddToLearnCardActions => {
    const { newModal: openRightModal } = useModal({
        mobile: ModalTypes.Right,
        desktop: ModalTypes.Right,
    });

    useEffect(() => {
        void importPasteOrUploadClaimModal().catch(err => {
            log.error('Failed to preload PasteOrUploadClaimModal', err);
        });
    }, []);

    const openClaimLink = () => {
        openRightModal(
            <Suspense fallback={<PasteOrUploadClaimModalFallback />}>
                <LazyPasteOrUploadClaimModal />
            </Suspense>,
            { hideButton: true, sectionClassName: '!max-w-[500px]' }
        );
    };

    const openIssueCredential = () => {
        openRightModal(
            <IssueManagedBoostSelector />,
            { hideButton: true, sectionClassName: '!max-w-[500px]' },
            { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
        );
    };

    const openScanQr = Capacitor.isNativePlatform()
        ? () => QRCodeScannerStore.set.showScanner(true)
        : null;

    return { openClaimLink, openIssueCredential, openScanQr };
};

export default useAddToLearnCardActions;

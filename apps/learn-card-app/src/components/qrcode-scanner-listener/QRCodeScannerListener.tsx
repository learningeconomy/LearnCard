import React, { useEffect, useState } from 'react';
import { BarcodeScanner, BarcodeFormat, LensFacing } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';

import ClaimBoost from '../../pages/claimBoost/ClaimBoost';
import AddContactView, {
    AddContactViewMode,
} from '../../pages/addressBook/addContactView/AddContactView';
import { IonModal, IonContent, IonPage, IonSpinner } from '@ionic/react';

import { useToast, ToastTypeEnum, getLogger } from 'learn-card-base';
import QRCodeScannerStore from 'learn-card-base/stores/QRCodeScannerStore';

import { AddressBookContact } from '../../pages/addressBook/addressBookHelpers';
import { VC } from '@learncard/types';
import { useClaimInputRouter } from '../../hooks/useClaimInputRouter';

const log = getLogger('qr-scanner');

export const QRCodeScannerListener: React.FC = () => {
    const { presentToast } = useToast();
    const route = useClaimInputRouter({ defaultSource: 'camera' });

    const showScanner = QRCodeScannerStore.useTracked.showScanner();

    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [contact, setContact] = useState<AddressBookContact | null>(null);

    const [isClaimModalOpen, setIsClaimModalOpen] = useState<boolean>(false);
    const [boost, setBoost] = useState<{ uri: string; challenge: string } | null>(null);
    const [vc, setVC] = useState<VC | null>(null);

    const [loading, setLoading] = useState<boolean>(false);

    const handleStartScanning = async () => {
        return new Promise(async resolve => {
            const listener = await BarcodeScanner?.addListener('barcodeScanned', async result => {
                await listener.remove();
                await BarcodeScanner.stopScan();
                resolve(result.barcode);
            });

            await BarcodeScanner.startScan({
                formats: [BarcodeFormat.QrCode],
                lensFacing: LensFacing.Back,
            });
        });
    };

    const handleScan = async (qrCodeValue: string) => {
        await handleCancelScanning();

        try {
            if (!qrCodeValue) return;

            setLoading(true);
            const result = await route(qrCodeValue);
            setLoading(false);

            if (result.kind === 'open_contact') {
                setContact(result.contact);
                setIsOpen(true);
                return;
            }
            if (result.kind === 'open_claim_boost') {
                setBoost(result.boost);
                setVC(null);
                setIsClaimModalOpen(true);
                return;
            }
            if (result.kind === 'open_claim_vc') {
                setBoost(null);
                setVC(result.vc);
                setIsClaimModalOpen(true);
                return;
            }
            if (result.kind === 'open_website') {
                window.open(result.url, '_blank');
                return;
            }
            if (result.kind === 'unrecognized') {
                setContact(null);
                setIsOpen(true);
                return;
            }
            // 'routed' — the router already called history.push; nothing more to do.
        } catch (error) {
            log.error('scanner::error', error);
            await handleCancelScanning();
            setLoading(false);

            presentToast(
                `Oops! ${error instanceof Error ? error.message : 'There was an error scanning the QR Code.'}`,
                {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                }
            );
        }
    };

    const handleCancelScanning = async () => {
        document?.querySelector('#app-router')?.classList?.remove('scanner-active');
        QRCodeScannerStore.set.showScanner(false);

        await BarcodeScanner?.removeAllListeners();
        await BarcodeScanner?.stopScan();
    };

    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            if (showScanner) {
                handleStartScanning()
                    .then(async (res: any) => {
                        log.debug('scan::success', { rawValue: res?.rawValue });
                        await handleScan(res?.rawValue);
                    })
                    .catch(async error => {
                        log.error('scan::error', error);
                        await handleCancelScanning();
                    });
            } else if (!showScanner) {
                handleCancelScanning();
            }
        }
    }, [showScanner]);

    return (
        <>
            <IonModal
                isOpen={isOpen}
                className="center-modal add-contact-modal"
                backdropDismiss={false}
                showBackdrop={false}
            >
                <IonPage>
                    <IonContent fullscreen>
                        {loading && (
                            <section className="relative loading-spinner-container flex flex-col items-center justify-center h-[80%] w-full ">
                                <IonSpinner color="black" />
                                <p className="mt-2 font-bold text-lg">Loading...</p>
                            </section>
                        )}
                        {!loading && contact && (
                            <AddContactView
                                handleCancel={() => setIsOpen(false)}
                                user={contact}
                                mode={AddContactViewMode.requestConnection}
                            />
                        )}
                        {!loading && !contact && (
                            <section className="flex flex-col items-center text-center justify-center h-[90%]">
                                <h1 className="text-center text-xl font-bold text-grayscale-800 m-0 p-0 mt-4">
                                    Eeek!
                                </h1>
                                <strong className="text-center font-medium text-grayscale-600 m-0 p-0">
                                    An error ocurred!
                                </strong>
                                <div className="w-full flex items-center justify-center mt-8">
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="text-grayscale-900 text-center text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </section>
                        )}
                    </IonContent>
                </IonPage>
            </IonModal>
            <IonModal isOpen={isClaimModalOpen} backdropDismiss={false} showBackdrop={false}>
                <ClaimBoost
                    uri={boost?.uri}
                    claimChallenge={boost?.challenge}
                    dismissClaimModal={() => setIsClaimModalOpen(false)}
                    vc={vc}
                />
            </IonModal>
        </>
    );
};

export default QRCodeScannerListener;

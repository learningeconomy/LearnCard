import React, { useCallback, useEffect, useState } from 'react';
import { BarcodeScanner, BarcodeFormat, LensFacing } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';

import ClaimBoost from '../../pages/claimBoost/ClaimBoost';
import AddContactView, {
    AddContactViewMode,
} from '../../pages/addressBook/addContactView/AddContactView';
import { IonModal, IonContent, IonPage, IonSpinner } from '@ionic/react';

import { useToast, ToastTypeEnum, getLogger } from 'learn-card-base';
import QRCodeScannerStore from 'learn-card-base/stores/QRCodeScannerStore';

import { AddressBookContact } from '../../pages/addressBook/addressBookHelpers';
import * as m from '../../paraglide/messages.js';
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

    const handleScan = useCallback(
        async (qrCodeValue: string) => {
            if (!qrCodeValue) return;

            setLoading(true);

            try {
                const result = await route(qrCodeValue);

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
                }
                // 'routed' — the router already called history.push; nothing more to do.
            } catch (error) {
                log.error('scanner::error', error);
                presentToast(m['scanner.failed'](), {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });
            } finally {
                setLoading(false);
            }
        },
        [presentToast, route]
    );

    useEffect(() => {
        if (!Capacitor.isNativePlatform() || !showScanner) return;

        let disposed = false;
        let listener: PluginListenerHandle | null = null;
        let stopPromise: Promise<void> | null = null;

        const stopOwnedScan = (): Promise<void> => {
            if (stopPromise) return stopPromise;

            stopPromise = (async () => {
                const activeListener = listener;
                listener = null;

                await activeListener?.remove();
                await BarcodeScanner.stopScan();
                document.querySelector('#app-router')?.classList.remove('scanner-active');
            })();

            return stopPromise;
        };

        const handleBarcodeScanned = async (rawValue: string) => {
            if (disposed) return;

            disposed = true;
            log.debug('scan::success', { rawValue });

            try {
                await stopOwnedScan();
            } catch (error) {
                log.warn('scan::cleanup-error', error);
            }

            QRCodeScannerStore.set.showScanner(false);
            await handleScan(rawValue);
        };

        const startScanning = async () => {
            try {
                const registeredListener = await BarcodeScanner.addListener(
                    'barcodeScanned',
                    result => {
                        void handleBarcodeScanned(result.barcode.rawValue);
                    }
                );

                if (disposed) {
                    await registeredListener.remove();
                    return;
                }

                listener = registeredListener;
                await BarcodeScanner.startScan({
                    formats: [BarcodeFormat.QrCode],
                    lensFacing: LensFacing.Back,
                });

                if (disposed) {
                    await BarcodeScanner.stopScan();
                    document.querySelector('#app-router')?.classList.remove('scanner-active');
                }
            } catch (error) {
                if (disposed) return;

                disposed = true;
                log.error('scan::error', error);

                try {
                    await stopOwnedScan();
                } catch (cleanupError) {
                    log.warn('scan::cleanup-error', cleanupError);
                }

                QRCodeScannerStore.set.showScanner(false);
                presentToast(m['scanner.failed'](), {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });
            }
        };

        void startScanning();

        return () => {
            disposed = true;
            void stopOwnedScan().catch(error => log.warn('scan::cleanup-error', error));
        };
    }, [handleScan, presentToast, showScanner]);

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
                                <p className="mt-2 font-bold text-lg">
                                    {m['scanner.processing']()}
                                </p>
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
                                    {m['scanner.failed']()}
                                </h1>
                                <div className="w-full flex items-center justify-center mt-8">
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="text-grayscale-900 text-center text-sm"
                                    >
                                        {m['common.close']()}
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

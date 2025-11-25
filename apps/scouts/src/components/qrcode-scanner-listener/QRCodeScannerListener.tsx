import React, { useEffect, useState } from 'react';
import { BarcodeScanner, BarcodeFormat, LensFacing } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';

import { useWallet } from 'learn-card-base';

import { IonModal, IonContent, IonPage, IonSpinner } from '@ionic/react';
import { ClaimBoostModal } from '../../pages/claimBoost/ClaimBoost';
import MiniGhost from 'learn-card-base/assets/images/emptystate-ghost.png';
import AddContactView, {
    AddContactViewMode,
} from '../../pages/addressBook/addContactView/AddContactView';

import QRCodeScannerStore from 'learn-card-base/stores/QRCodeScannerStore';
import { AddressBookContact } from '../../pages/addressBook/addressBookHelpers';

export const QRCodeScannerListener: React.FC = () => {
    const { initWallet } = useWallet();
    const showScanner = QRCodeScannerStore.useTracked.showScanner();

    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [contact, setContact] = useState<AddressBookContact | null>(null);

    const [isClaimModalOpen, setIsClaimModalOpen] = useState<boolean>(false);
    const [boost, setBoost] = useState<{ uri: string; challenge: string } | null>(null);

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
        const wallet = await initWallet();
        await handleCancelScanning();

        try {
            if (qrCodeValue) {
                await handleCancelScanning();

                const query = new URLSearchParams(qrCodeValue);

                let profileId = null;
                // for scanning user qr codes
                const userDid = query.get('did') ?? '';

                // for scanning boost qr codes
                const boostUri = query.get('boostUri');
                const challenge = query.get('challenge');

                const isLCNetworkUrl = userDid.includes(`did:web:scoutnetwork.org`);

                if (boostUri && challenge) {
                    setBoost({ uri: boostUri, challenge: challenge });
                    setIsClaimModalOpen(true);
                    return;
                } else if (isLCNetworkUrl) {
                    const regex = /(users:)(.*)/;
                    profileId = userDid?.match(regex)?.[2];

                    if (profileId) {
                        try {
                            setLoading(true);
                            const user = await wallet?.invoke?.getProfile(profileId);
                            if (user) {
                                setContact(user);
                                setIsOpen(true);
                                setLoading(false);
                                return;
                            }
                        } catch (err) {
                            setIsOpen(true);
                            setLoading(false);
                        }
                    }
                } else {
                    // if (!isLCNetworkUrl ) {
                    setContact(null);
                    setIsOpen(true);

                    setBoost(null);
                    setIsClaimModalOpen(false);

                    setLoading(false);
                    return;
                    // }
                }
            }
        } catch (error) {
            console.log('❌❌ scanner::error ❌❌', error);
            await handleCancelScanning();
        }
    };

    const handleCancelScanning = async () => {
        document?.querySelector('#app-router')?.classList?.remove('scanner-active');
        QRCodeScannerStore.set.showScanner(false);

        // Remove all listeners
        await BarcodeScanner?.removeAllListeners();

        // Stop the barcode scanner
        await BarcodeScanner?.stopScan();
    };

    useEffect(() => {
        if (Capacitor.isNativePlatform()) {
            if (showScanner) {
                handleStartScanning()
                    .then(async res => {
                        console.log('scan::success', res);
                        await handleScan(res?.rawValue);
                    })
                    .catch(async error => {
                        console.log('scan::error', error);
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
                                <img
                                    src={MiniGhost}
                                    alt="ghost"
                                    className="relative max-w-[250px] m-auto mb-0"
                                />
                                <h1 className="text-center text-3xl font-bold text-grayscale-800 m-0 p-0 mt-4">
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
                <ClaimBoostModal
                    uri={boost?.uri}
                    claimChallenge={boost?.challenge}
                    dismissClaimModal={() => setIsClaimModalOpen(false)}
                />
            </IonModal>
        </>
    );
};

export default QRCodeScannerListener;

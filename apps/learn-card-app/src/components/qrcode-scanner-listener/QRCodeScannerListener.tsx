import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { BarcodeScanner, BarcodeFormat, LensFacing } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';

import ClaimBoost from '../../pages/claimBoost/ClaimBoost';
import AddContactView, {
    AddContactViewMode,
} from '../../pages/addressBook/addContactView/AddContactView';
import { IonModal, IonContent, IonPage, IonSpinner } from '@ionic/react';

import { useWallet, useToast, ToastTypeEnum } from 'learn-card-base';
import { useUploadVcFromText } from '../../hooks/useUploadVcFromText';

import QRCodeScannerStore from 'learn-card-base/stores/QRCodeScannerStore';

import { AddressBookContact } from '../../pages/addressBook/addressBookHelpers';
import { VC } from '@learncard/types';

export const QRCodeScannerListener: React.FC = () => {
    const history = useHistory();
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const { validateTextVC } = useUploadVcFromText();

    const showScanner = QRCodeScannerStore.useTracked.showScanner();

    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [contact, setContact] = useState<AddressBookContact | null>(null);

    const [isClaimModalOpen, setIsClaimModalOpen] = useState<boolean>(false);
    const [boost, setBoost] = useState<{ uri: string; challenge: string } | null>(null);
    const [vc, setVC] = useState<VC | null>(null);

    const [interaction, setInteraction] = useState<string | null>(null);

    const [loading, setLoading] = useState<boolean>(false);

    const fetchInteractionData = async () => {
        console.log('Fetching interaction data!', interaction);
        try {
            if (!interaction) return;
            setLoading(true);

            const response = await fetch(interaction, {
                headers: {
                    Accept: 'application/json',
                },
            });
            const interactionData = await response.json();
            console.log('Interaction data', interactionData);
            if (interactionData?.protocols?.vcapi) {
                console.log('VC API URL', interactionData?.protocols?.vcapi);
                history.push(`/request?vc_request_url=${interactionData?.protocols?.vcapi}`);
            } else if (interactionData?.protocols?.website) {
                console.log('Website URL', interactionData?.protocols?.website);
                window.open(interactionData?.protocols?.website, '_blank');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setInteraction(null);
        }
    };

    useEffect(() => {
        if (interaction) {
            fetchInteractionData();
        }
    }, [interaction]);

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

                let eventUrl: URL | null = null;
                try {
                    eventUrl = new URL(qrCodeValue);
                } catch {
                    // Not a URL → skip this check
                }

                // handles custom schemes and https domains
                if (eventUrl) {
                    const scheme = eventUrl.protocol.replace(':', '');
                    const customSchemes = ['dccrequest', 'msprequest', 'asuprequest'];
                    const httpsDomains = ['https://lcw.app'];

                    if (customSchemes.includes(scheme) || httpsDomains.includes(eventUrl.origin)) {
                        let fullPath = eventUrl.pathname + eventUrl.search + eventUrl.hash;

                        // If pathname is empty (custom scheme), default to /request
                        if (!eventUrl.pathname) {
                            fullPath = '/request' + fullPath;
                        }

                        history.push(fullPath);
                        return;
                    }
                }

                const queryStringIndex = qrCodeValue.indexOf('?');
                const queryString =
                    queryStringIndex !== -1 ? qrCodeValue.substring(queryStringIndex) : qrCodeValue;
                const query = new URLSearchParams(queryString);

                let profileId = null;
                const userDid = query.get('did') ?? '';
                const boostUri = query.get('boostUri');
                const challenge = query.get('challenge');
                const iuv = query.get('iuv');

                const isLCNetworkUrl = userDid.includes('did:web');

                if (boostUri && challenge) {
                    setBoost({ uri: boostUri, challenge: challenge });
                    setIsClaimModalOpen(true);
                    return;
                } else if (iuv === '1') {
                    setInteraction(qrCodeValue);
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
                        } catch {
                            setIsOpen(true);
                            setLoading(false);
                        }
                    }
                }
                // handle raw VCs
                try {
                    const rawVC = JSON.parse(qrCodeValue);

                    if (rawVC['@context'] && rawVC?.type?.includes('VerifiableCredential')) {
                        const validationErrors = validateTextVC(qrCodeValue);
                        if (!validationErrors) {
                            setVC(rawVC);
                            setIsClaimModalOpen(true);
                            return;
                        } else {
                            presentToast(`Invalid VC: ${validationErrors.join(', ')}`, {
                                type: ToastTypeEnum.Error,
                                hasDismissButton: true,
                            });
                        }
                    }
                } catch {
                    // not JSON, ignore
                }

                setContact(null);
                setIsOpen(true);

                setBoost(null);
                setVC(null);
                setInteraction(null);
                setIsClaimModalOpen(false);

                setLoading(false);
                return;
            }
        } catch (error) {
            console.log('❌❌ scanner::error ❌❌', error);
            await handleCancelScanning();
            setInteraction(null);

            presentToast(`Oops! ${error?.message ?? 'There was an error scanning the QR Code.'}`, {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
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

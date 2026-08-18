import React, { useEffect } from 'react';
import * as m from '../../paraglide/messages.js';
import { BarcodeScanner, BarcodeFormat, LensFacing } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';

import { useWallet, useModal, ModalTypes, getLogger } from 'learn-card-base';

import { ClaimBoostModal } from '../../pages/claimBoost/ClaimBoost';
import MiniGhost from 'learn-card-base/assets/images/emptystate-ghost.png';
import AddContactView, {
    AddContactViewMode,
} from '../../pages/addressBook/addContactView/AddContactView';

import QRCodeScannerStore from 'learn-card-base/stores/QRCodeScannerStore';
const log = getLogger('qr-code-scanner-listener');

export const QRCodeScannerListener: React.FC = () => {
    const { initWallet } = useWallet();
    const { newModal, closeModal } = useModal();
    const showScanner = QRCodeScannerStore.useTracked.showScanner();

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

    const presentScannerFailedModal = () => {
        newModal(
            <section className="flex flex-col items-center text-center justify-center h-[90%]">
                <img src={MiniGhost} alt="ghost" className="relative max-w-[250px] m-auto mb-0" />
                <h1 className="text-center text-3xl font-bold text-grayscale-800 m-0 p-0 mt-4">
                    {m['scanner.eek']()}
                </h1>
                <strong className="text-center font-medium text-grayscale-600 m-0 p-0">
                    {m['scanner.errOcurred']()}
                </strong>
                <div className="w-full flex items-center justify-center mt-8">
                    <button
                        onClick={() => closeModal()}
                        className="text-grayscale-900 text-center text-sm"
                    >
                        {m['common.cancel']()}
                    </button>
                </div>
            </section>,
            { hideButton: true, hideDimmer: true },
            { desktop: ModalTypes.Center, mobile: ModalTypes.Center }
        );
    };

    const handleScan = async (qrCodeValue: string) => {
        const wallet = await initWallet();
        await handleCancelScanning();

        try {
            if (qrCodeValue) {
                const query = new URLSearchParams(qrCodeValue);

                let profileId = null;
                // for scanning user qr codes
                const userDid = query.get('did') ?? '';

                // for scanning boost qr codes
                const boostUri = query.get('boostUri');
                const challenge = query.get('challenge');

                const isLCNetworkUrl = userDid.includes(`did:web:scoutnetwork.org`);

                if (boostUri && challenge) {
                    newModal(
                        <ClaimBoostModal
                            uri={boostUri}
                            claimChallenge={challenge}
                            dismissClaimModal={() => closeModal()}
                        />,
                        { hideButton: true },
                        { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
                    );
                    return;
                } else if (isLCNetworkUrl) {
                    const regex = /(users:)(.*)/;
                    profileId = userDid?.match(regex)?.[2];

                    if (profileId) {
                        try {
                            const user = await wallet?.invoke?.getProfile(profileId);
                            if (user) {
                                newModal(
                                    <AddContactView
                                        handleCancel={() => closeModal()}
                                        user={user}
                                        mode={AddContactViewMode.requestConnection}
                                    />,
                                    { hideButton: true, hideDimmer: true },
                                    { desktop: ModalTypes.Center, mobile: ModalTypes.Center }
                                );
                                return;
                            }
                        } catch (err) {
                            log.debug('❌❌ scanner::error ❌❌', err);
                        }
                        presentScannerFailedModal();
                    }
                } else {
                    presentScannerFailedModal();
                }
            }
        } catch (error) {
            log.debug('❌❌ scanner::error ❌❌', error);
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
                        log.debug('scan::success', res);
                        await handleScan(res?.rawValue);
                    })
                    .catch(async error => {
                        log.debug('scan::error', error);
                        await handleCancelScanning();
                    });
            } else if (!showScanner) {
                handleCancelScanning();
            }
        }
    }, [showScanner]);

    return null;
};

export default QRCodeScannerListener;

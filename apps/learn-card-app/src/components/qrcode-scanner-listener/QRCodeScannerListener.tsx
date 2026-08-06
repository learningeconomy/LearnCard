import React, { useEffect } from 'react';
import { BarcodeScanner, BarcodeFormat, LensFacing } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';

import ClaimBoost from '../../pages/claimBoost/ClaimBoost';
import AddContactView, {
    AddContactViewMode,
} from '../../pages/addressBook/addContactView/AddContactView';

import { useToast, ToastTypeEnum, getLogger, useModal, ModalTypes } from 'learn-card-base';
import QRCodeScannerStore from 'learn-card-base/stores/QRCodeScannerStore';

import * as m from '../../paraglide/messages.js';
import { useClaimInputRouter } from '../../hooks/useClaimInputRouter';

const log = getLogger('qr-scanner');

export const QRCodeScannerListener: React.FC = () => {
    const { presentToast } = useToast();
    const route = useClaimInputRouter({ defaultSource: 'camera' });

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

    const handleScan = async (qrCodeValue: string) => {
        await handleCancelScanning();

        try {
            if (!qrCodeValue) return;

            const result = await route(qrCodeValue);

            if (result.kind === 'open_contact') {
                newModal(
                    <AddContactView
                        handleCancel={() => closeModal()}
                        user={result.contact}
                        mode={AddContactViewMode.requestConnection}
                    />,
                    { hideButton: true, hideDimmer: true },
                    { desktop: ModalTypes.Center, mobile: ModalTypes.Center }
                );
                return;
            }
            if (result.kind === 'open_claim_boost') {
                newModal(
                    <ClaimBoost
                        uri={result.boost.uri}
                        claimChallenge={result.boost.challenge}
                        dismissClaimModal={() => closeModal()}
                        vc={null}
                    />,
                    { hideButton: true },
                    { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
                );
                return;
            }
            if (result.kind === 'open_claim_vc') {
                newModal(
                    <ClaimBoost dismissClaimModal={() => closeModal()} vc={result.vc} />,
                    { hideButton: true },
                    { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
                );
                return;
            }
            if (result.kind === 'open_website') {
                window.open(result.url, '_blank');
                return;
            }
            if (result.kind === 'unrecognized') {
                newModal(
                    <section className="flex flex-col items-center text-center justify-center h-[90%]">
                        <h1 className="text-center text-xl font-bold text-grayscale-800 m-0 p-0 mt-4">
                            {m['scanner.failed']()}
                        </h1>
                        <div className="w-full flex items-center justify-center mt-8">
                            <button
                                onClick={() => closeModal()}
                                className="text-grayscale-900 text-center text-sm"
                            >
                                {m['common.close']()}
                            </button>
                        </div>
                    </section>,
                    { hideButton: true, hideDimmer: true },
                    { desktop: ModalTypes.Center, mobile: ModalTypes.Center }
                );
                return;
            }
            // 'routed' — the router already called history.push; nothing more to do.
        } catch (error) {
            log.error('scanner::error', error);
            await handleCancelScanning();

            presentToast(m['scanner.failed'](), {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
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

    return null;
};

export default QRCodeScannerListener;

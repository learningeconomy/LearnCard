import React, { useEffect, useRef } from 'react';
import * as m from '../../paraglide/messages.js';
import { BarcodeScanner, BarcodeFormat, LensFacing } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';

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

    const cleanupRef = useRef<Promise<void>>(Promise.resolve());

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
        try {
            const wallet = await initWallet();
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
                            log.error('scan::contact-error', err);
                        }
                        presentScannerFailedModal();
                    }
                } else {
                    presentScannerFailedModal();
                }
            }
        } catch (error) {
            log.error('scan::result-error', error);
            presentScannerFailedModal();
        }
    };

    const handleScanRef = useRef(handleScan);
    const presentFailureRef = useRef(presentScannerFailedModal);
    useEffect(() => {
        handleScanRef.current = handleScan;
        presentFailureRef.current = presentScannerFailedModal;
    });

    useEffect(() => {
        if (!Capacitor.isNativePlatform() || !showScanner) return;

        const previousCleanup = cleanupRef.current;
        const listeners: PluginListenerHandle[] = [];
        let disposed = false;
        let processing = false;
        let scanRequested = false;
        let stopPromise: Promise<void> | undefined;

        // Wait for startup to settle before stopping, and finish this session's
        // cleanup before another session can start the same native camera.
        const stopSession = (): Promise<void> => {
            stopPromise ??= (async () => {
                await startup.catch(() => undefined);
                for (const listener of listeners) {
                    try {
                        await listener.remove();
                    } catch (error) {
                        log.warn('scan::listener-remove-error', error);
                    }
                }
                try {
                    if (scanRequested) await BarcodeScanner.stopScan();
                } catch (error) {
                    log.warn('scan::stop-error', error);
                } finally {
                    document.body.classList.remove('scanner-active');
                }
            })();
            return stopPromise;
        };

        const fail = async (error: unknown): Promise<void> => {
            if (disposed || processing) return;
            processing = true;
            log.error('scan::start-error', error);
            await stopSession();
            if (disposed) return;
            QRCodeScannerStore.set.closeScanner();
            presentFailureRef.current();
        };

        const onResult = async (rawValue: string): Promise<void> => {
            if (disposed || processing) return;
            processing = true;
            await stopSession();
            if (disposed) return;
            QRCodeScannerStore.set.closeScanner();
            await handleScanRef.current(rawValue);
        };

        const startup = (async () => {
            await previousCleanup;
            if (disposed) return;
            listeners.push(
                await BarcodeScanner.addListener('barcodesScanned', result => {
                    const rawValue = result.barcodes.find(barcode => barcode.rawValue)?.rawValue;
                    if (rawValue) void onResult(rawValue);
                })
            );
            if (disposed) return;
            listeners.push(
                await BarcodeScanner.addListener('scanError', error => void fail(error))
            );
            if (disposed) return;
            document.body.classList.add('scanner-active');
            scanRequested = true;
            await BarcodeScanner.startScan({
                formats: [BarcodeFormat.QrCode],
                lensFacing: LensFacing.Back,
            });
        })();
        void startup.catch(fail);

        return () => {
            disposed = true;
            cleanupRef.current = stopSession();
        };
    }, [showScanner]);

    return null;
};

export default QRCodeScannerListener;

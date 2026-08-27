import React, { useCallback, useEffect, useRef } from 'react';
import {
    BarcodeScanner,
    BarcodeFormat,
    LensFacing,
    type BarcodeScannedEvent,
} from '@capacitor-mlkit/barcode-scanning';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';

import ClaimBoost from '../../pages/claimBoost/ClaimBoost';
import AddContactView, {
    AddContactViewMode,
} from '../../pages/addressBook/addContactView/AddContactView';

import { useToast, ToastTypeEnum, getLogger, useModal, ModalTypes } from 'learn-card-base';
import QRCodeScannerStore from 'learn-card-base/stores/QRCodeScannerStore';

import * as m from '../../paraglide/messages.js';
import { useClaimInputRouter } from '../../hooks/useClaimInputRouter';

const log = getLogger('qr-scanner');

// Native v8 still emits the one-result event used by the app, although the
// package declaration only exposes the newer batched event overload. Keep this
// compatibility shim visible while the native event differs from the documented
// batched API: https://github.com/capawesome-team/capacitor-mlkit/tree/main/packages/barcode-scanning#addlistenerbarcodesscanned-
const nativeBarcodeScanner = BarcodeScanner as typeof BarcodeScanner & {
    addListener(
        eventName: 'barcodeScanned',
        listenerFunc: (event: BarcodeScannedEvent) => void
    ): Promise<PluginListenerHandle>;
};

export const QRCodeScannerListener: React.FC = () => {
    const { presentToast } = useToast();
    const route = useClaimInputRouter({ defaultSource: 'camera' });
    const { newModal, closeModal } = useModal();

    const showScanner = QRCodeScannerStore.useTracked.showScanner();
    const latestSessionIdRef = useRef(0);
    const cleanupPromiseRef = useRef<Promise<void>>(Promise.resolve());

    const handleScan = useCallback(
        async (qrCodeValue: string) => {
            if (!qrCodeValue) return;

            try {
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
                }
                // 'routed' — the router already called history.push; nothing more to do.
            } catch (error) {
                log.error('scanner::error', error);
                presentToast(m['scanner.failed'](), {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });
            }
        },
        [closeModal, newModal, presentToast, route]
    );
    const handleScanRef = useRef(handleScan);
    const presentToastRef = useRef(presentToast);

    useEffect(() => {
        handleScanRef.current = handleScan;
        presentToastRef.current = presentToast;
    });

    useEffect(() => {
        if (!Capacitor.isNativePlatform() || !showScanner) return;
        const sessionId = ++latestSessionIdRef.current;
        const previousCleanupPromise = cleanupPromiseRef.current;

        let disposed = false;
        let processingResult = false;
        let listener: PluginListenerHandle | null = null;
        let stopPromise: Promise<void> | null = null;
        let activeScanId = 0;

        const stopOwnedScan = (): Promise<void> => {
            if (stopPromise) return stopPromise;

            stopPromise = (async () => {
                const activeListener = listener;
                listener = null;

                try {
                    await activeListener?.remove();
                } catch (error) {
                    log.warn('scan::listener-remove-error', error);
                }

                await BarcodeScanner.stopScan();
                document.querySelector('#app-router')?.classList.remove('scanner-active');
            })();

            return stopPromise;
        };

        const handleBarcodeScanned = async (rawValue: string, scanId: number) => {
            if (disposed || processingResult || scanId !== activeScanId) return;

            processingResult = true;
            log.debug('scan::success', { rawValue });

            try {
                await stopOwnedScan();
            } catch (error) {
                log.warn('scan::cleanup-error', error);
            }

            const onResult = QRCodeScannerStore.get.onResult();

            if (!onResult) {
                QRCodeScannerStore.set.closeScanner();

                try {
                    await handleScanRef.current(rawValue);
                } catch (error) {
                    log.error('scan::result-handler-error', error);
                    presentToastRef.current(m['scanner.failed'](), {
                        type: ToastTypeEnum.Error,
                        hasDismissButton: true,
                    });
                }

                return;
            }

            try {
                const feedback = await onResult(rawValue);

                if (feedback && QRCodeScannerStore.get.showScanner()) {
                    QRCodeScannerStore.set.setFeedback(feedback);

                    const durationMs = feedback.durationMs ?? 650;
                    if (durationMs > 0) {
                        await new Promise(resolve => window.setTimeout(resolve, durationMs));
                    }
                }

                if (feedback?.tone === 'error') {
                    if (!disposed && QRCodeScannerStore.get.showScanner()) {
                        QRCodeScannerStore.set.clearFeedback();
                        processingResult = false;
                        stopPromise = null;
                        await startScanning();
                    }

                    return;
                }

                QRCodeScannerStore.set.closeScanner();
            } catch (error) {
                log.error('scan::result-handler-error', error);
                presentToastRef.current(m['scanner.failed'](), {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });
                QRCodeScannerStore.set.closeScanner();
            }
        };

        const startScanning = async () => {
            try {
                await previousCleanupPromise;
                if (disposed) return;

                const scanId = ++activeScanId;
                const registeredListener = await nativeBarcodeScanner.addListener(
                    'barcodeScanned',
                    result => {
                        const rawValue = result?.barcode?.rawValue;
                        if (rawValue) void handleBarcodeScanned(rawValue, scanId);
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

                if (disposed && latestSessionIdRef.current === sessionId) {
                    await BarcodeScanner.stopScan();
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

                QRCodeScannerStore.set.closeScanner();
                presentToastRef.current(m['scanner.failed'](), {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });
            }
        };

        void startScanning();

        return () => {
            disposed = true;
            if (QRCodeScannerStore.get.showScanner()) {
                QRCodeScannerStore.set.closeScanner();
            }
            cleanupPromiseRef.current = previousCleanupPromise
                .then(stopOwnedScan)
                .catch(error => log.warn('scan::cleanup-error', error));
        };
    }, [showScanner]);

    return null;
};

export default QRCodeScannerListener;

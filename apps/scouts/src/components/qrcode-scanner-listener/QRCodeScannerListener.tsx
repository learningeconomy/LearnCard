import React, { useEffect, useRef } from 'react';
import { BarcodeScanner, BarcodeFormat, LensFacing } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';

import { useWallet, useModal, ModalTypes, getLogger } from 'learn-card-base';

import { ClaimBoostModal } from '../../pages/claimBoost/ClaimBoost';
import { QRCodeScannerNotice } from './QRCodeScannerNotice';
import AddContactView, {
    AddContactViewMode,
} from '../../pages/addressBook/addContactView/AddContactView';

import QRCodeScannerStore from 'learn-card-base/stores/QRCodeScannerStore';
import { openExternalLink } from '../../helpers/externalLinkHelpers';
const log = getLogger('qr-code-scanner-listener');

export const QRCodeScannerListener: React.FC = () => {
    const { initWallet } = useWallet();
    const { newModal, closeModal } = useModal();
    const showScanner = QRCodeScannerStore.useTracked.showScanner();

    const cleanupRef = useRef<Promise<void>>(Promise.resolve());

    const presentScannerFailedModal = (incompatible = false): void => {
        newModal(
            <QRCodeScannerNotice
                incompatible={incompatible}
                onDismiss={closeModal}
                onScanAgain={() => {
                    closeModal();
                    QRCodeScannerStore.set.openScanner();
                }}
            />,
            { hideButton: true, className: 'scanner-notice-modal' },
            { desktop: ModalTypes.Center, mobile: ModalTypes.Center }
        );
    };

    const handleScan = async (qrCodeValue: string): Promise<void> => {
        const value = qrCodeValue.trim();
        let url: URL | undefined;
        try {
            url = new URL(value);
        } catch {
            // Older QR codes contain query parameters without a full URL.
        }
        const query = url?.searchParams ?? new URLSearchParams(value);
        const boostUri = query.get('boostUri');
        const challenge = query.get('challenge');
        const profileId = query.get('did')?.match(/^did:web:scoutnetwork\.org:users:(.+)$/)?.[1];

        try {
            // Recognize ScoutPass content before considering a browser fallback.
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
            }

            if (profileId) {
                const wallet = await initWallet();
                const user = await wallet.invoke.getProfile(profileId);
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
                } else {
                    presentScannerFailedModal(true);
                }
                return;
            }

            // Only website URLs may leave the app; never execute QR payloads
            // using javascript:, data:, file:, or arbitrary custom schemes.
            if (url && (url.protocol === 'https:' || url.protocol === 'http:')) {
                try {
                    await openExternalLink(url.href);
                    return;
                } catch {
                    log.warn('scan::browser-open-failed');
                }
            }

            presentScannerFailedModal(true);
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
        let stopping = false;
        let stopPromise: Promise<void> | undefined;

        // Wait for startup to settle before stopping, and finish this session's
        // cleanup before another session can start the same native camera.
        const stopSession = (): Promise<void> => {
            // Latch the stop request synchronously, before any pending startup resumes.
            stopping = true;
            stopPromise ??= (async () => {
                // A cached cleanup cannot finish before startup adds its body class.
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
            const shouldPresentFailure = !disposed && !processing;
            processing = true;
            if (shouldPresentFailure) log.error('scan::start-error', error);
            // Every error joins cleanup; only the first live error presents a notice.
            await stopSession();
            if (disposed || !shouldPresentFailure) return;
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
            if (disposed || stopping) return;
            listeners.push(
                await BarcodeScanner.addListener('barcodesScanned', result => {
                    const rawValue = result.barcodes.find(barcode => barcode.rawValue)?.rawValue;
                    if (rawValue) void onResult(rawValue);
                })
            );
            if (disposed || stopping) return;
            listeners.push(
                await BarcodeScanner.addListener('scanError', error => void fail(error))
            );
            if (disposed || stopping) return;
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

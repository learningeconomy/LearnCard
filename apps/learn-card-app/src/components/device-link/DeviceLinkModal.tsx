/**
 * DeviceLinkModal — approver UI for the logged-in device (Device A).
 *
 * Presented as an overlay when the user taps "Link New Device" from settings.
 * Delegates to the shared QrLoginApprover component from learn-card-base.
 *
 * On native platforms, provides a camera-based QR scanner via
 * @capacitor-mlkit/barcode-scanning. On desktop, only manual code entry is available.
 */

import React, { useCallback } from 'react';

import { BarcodeScanner, BarcodeFormat, LensFacing } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';

import { QrLoginApprover, getAuthConfig } from 'learn-card-base';

interface DeviceLinkModalProps {
    /** The device share from this device's local storage */
    deviceShare: string;

    /** The DID of this (approving) device */
    approverDid: string;

    /** Optional email or phone to send as a login hint to Device B */
    accountHint?: string;

    /** Share version so Device B can fetch the matching auth share */
    shareVersion?: number;

    /** Called when the link flow completes or is cancelled */
    onClose: () => void;
}

export const DeviceLinkModal: React.FC<DeviceLinkModalProps> = ({
    deviceShare,
    approverDid,
    accountHint,
    shareVersion,
    onClose,
}) => {
    const authConfig = getAuthConfig();

    const handleScanQr = useCallback(async (): Promise<string | null> => {
        try {
            // Check and request camera permission before scanning
            const { camera } = await BarcodeScanner.checkPermissions();

            if (camera !== 'granted') {
                const requested = await BarcodeScanner.requestPermissions();

                if (requested.camera !== 'granted') {
                    console.warn('Camera permission denied');
                    return null;
                }
            }

            return new Promise(async (resolve) => {
                const listener = await BarcodeScanner.addListener('barcodeScanned', async (result) => {
                    await listener.remove();
                    await BarcodeScanner.stopScan();
                    resolve(result.barcode?.rawValue ?? null);
                });

                await BarcodeScanner.startScan({
                    formats: [BarcodeFormat.QrCode],
                    lensFacing: LensFacing.Back,
                });
            });
        } catch (e) {
            console.warn('QR scan failed:', e);
            await BarcodeScanner.removeAllListeners();
            await BarcodeScanner.stopScan();
            return null;
        }
    }, []);

    return (
        <QrLoginApprover
            serverUrl={authConfig.serverUrl}
            deviceShare={deviceShare}
            approverDid={approverDid}
            accountHint={accountHint}
            shareVersion={shareVersion}
            onDone={onClose}
            onCancel={onClose}
            onScanQr={Capacitor.isNativePlatform() ? handleScanQr : undefined}
        />
    );
};

export default DeviceLinkModal;

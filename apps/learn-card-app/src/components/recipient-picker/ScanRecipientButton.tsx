import React, { useCallback, useEffect, useState } from 'react';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { IonIcon } from '@ionic/react';
import { qrCodeOutline } from 'ionicons/icons';

import {
    QRCodeScannerStore,
    type QRCodeScannerResultFeedback,
    ToastTypeEnum,
    useConnectWithMutation,
    useGetCurrentLCNUser,
    useGetProfile,
    useToast,
} from 'learn-card-base';

import { parseClaimInput } from '../../hooks/parseClaimInput';
import { Recipient } from '../../pages/issue/components/recipientTypes';
import * as m from '../../paraglide/messages.js';

interface PendingScannedProfile {
    profileId: string;
    did: string;
}

interface ScanRecipientButtonProps {
    recipients: Recipient[];
    onRecipientScanned: (recipient: Extract<Recipient, { kind: 'profile' }>) => void;
    className?: string;
}

/**
 * Opens the native QR scanner in one-shot recipient capture mode. The recipient
 * is inserted immediately with a profile-id fallback, then enriched from the
 * normal profile query without delaying issuance.
 */
export const ScanRecipientButton: React.FC<ScanRecipientButtonProps> = ({
    recipients,
    onRecipientScanned,
    className = '',
}) => {
    const { presentToast } = useToast();
    const { currentLCNUser } = useGetCurrentLCNUser();
    const connectWith = useConnectWithMutation();
    const [pendingProfile, setPendingProfile] = useState<PendingScannedProfile>();
    const { data: scannedProfile, isFetched: isProfileFetched } = useGetProfile(
        pendingProfile?.profileId,
        Boolean(pendingProfile)
    );

    useEffect(() => {
        if (!pendingProfile || !isProfileFetched) return;

        if (scannedProfile) {
            onRecipientScanned({
                kind: 'profile',
                profileId: scannedProfile.profileId,
                displayName: scannedProfile.displayName || scannedProfile.profileId,
                image: scannedProfile.image,
                did: 'did' in scannedProfile ? scannedProfile.did : pendingProfile.did,
            });
        }

        setPendingProfile(undefined);
    }, [isProfileFetched, onRecipientScanned, pendingProfile, scannedProfile]);

    const showError = useCallback(
        (message: string): void => {
            presentToast(message, {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        },
        [presentToast]
    );

    const handleScanResult = useCallback(
        async (rawValue: string): Promise<void | QRCodeScannerResultFeedback> => {
            const result = parseClaimInput(rawValue);

            if (result.kind !== 'connection-request') {
                showError(m['boostAFriend.recip.scanInvalid']());
                return;
            }

            const currentProfileDid =
                currentLCNUser && 'did' in currentLCNUser ? currentLCNUser.did : undefined;
            const isCurrentProfile =
                result.profileId === currentLCNUser?.profileId || result.did === currentProfileDid;
            if (isCurrentProfile) {
                const message = m['boostAFriend.recip.scanSelf']();
                showError(message);

                return { message, tone: 'error', durationMs: 1200 };
            }

            const isDuplicate = recipients.some(
                recipient =>
                    recipient.kind === 'profile' && recipient.profileId === result.profileId
            );
            if (isDuplicate) {
                showError(m['boostAFriend.recip.scanDuplicate']());
                return;
            }

            onRecipientScanned({
                kind: 'profile',
                profileId: result.profileId,
                displayName: result.profileId,
                did: result.did,
            });
            setPendingProfile({ profileId: result.profileId, did: result.did });

            void Haptics.impact({ style: ImpactStyle.Light }).catch(() => undefined);
            connectWith.mutate({ profileId: result.profileId });

            return {
                message: m['boostAFriend.recip.scanFound']({
                    profileName: `@${result.profileId}`,
                }),
                tone: 'success',
                durationMs: 650,
            };
        },
        [connectWith, currentLCNUser, onRecipientScanned, recipients, showError]
    );

    const handleOpenScanner = useCallback(async (): Promise<void> => {
        try {
            const permissions = await BarcodeScanner.checkPermissions();

            if (permissions.camera === 'granted') {
                QRCodeScannerStore.set.openScanner({
                    onResult: handleScanResult,
                    mode: 'recipient',
                });
                return;
            }

            if (permissions.camera === 'denied') {
                showError(m['boostAFriend.recip.scanPermission']());
                return;
            }

            const requestedPermissions = await BarcodeScanner.requestPermissions();
            if (requestedPermissions.camera === 'granted') {
                QRCodeScannerStore.set.openScanner({
                    onResult: handleScanResult,
                    mode: 'recipient',
                });
                return;
            }

            showError(m['boostAFriend.recip.scanPermission']());
        } catch {
            showError(m['scanner.failed']());
        }
    }, [handleScanResult, showError]);

    if (!Capacitor.isNativePlatform()) return null;

    return (
        <button
            type="button"
            onClick={() => void handleOpenScanner()}
            className={`absolute top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full text-grayscale-500 hover:bg-grayscale-100 hover:text-grayscale-900 transition-colors ${className}`}
            aria-label={m['boostAFriend.recip.scanAria']()}
        >
            <IonIcon icon={qrCodeOutline} className="text-xl" />
        </button>
    );
};

export default ScanRecipientButton;

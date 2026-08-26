import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { IonIcon } from '@ionic/react';
import { qrCodeOutline } from 'ionicons/icons';

import {
    QRCodeScannerStore,
    type QRCodeScannerResultFeedback,
    ToastTypeEnum,
    getLogger,
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
    onRecipientsChange: (recipients: Recipient[]) => void;
    className?: string;
}

const log = getLogger('scan-recipient');

export const canScanRecipients = (): boolean => Capacitor.isNativePlatform();

const getDidWebHost = (did?: string): string | undefined =>
    did?.startsWith('did:web:') ? did.split(':')[2]?.toLowerCase() : undefined;

/**
 * Opens the native QR scanner in one-shot recipient capture mode. The recipient
 * is inserted immediately with a profile-id fallback, then enriched from the
 * normal profile query without delaying issuance.
 */
export const ScanRecipientButton: React.FC<ScanRecipientButtonProps> = ({
    recipients,
    onRecipientsChange,
    className = '',
}) => {
    const { presentToast } = useToast();
    const { currentLCNUser } = useGetCurrentLCNUser();
    const connectWith = useConnectWithMutation();
    const [pendingProfile, setPendingProfile] = useState<PendingScannedProfile>();
    const recipientsRef = useRef(recipients);
    const onRecipientsChangeRef = useRef(onRecipientsChange);
    const { data: scannedProfile, isFetched: isProfileFetched } = useGetProfile(
        pendingProfile?.profileId,
        Boolean(pendingProfile)
    );

    useEffect(() => {
        recipientsRef.current = recipients;
        onRecipientsChangeRef.current = onRecipientsChange;
    }, [onRecipientsChange, recipients]);

    const updateScannedRecipient = useCallback(
        (recipient: Extract<Recipient, { kind: 'profile' }>): void => {
            const existingIndex = recipientsRef.current.findIndex(
                existing =>
                    existing.kind === 'profile' && existing.profileId === recipient.profileId
            );
            const nextRecipients =
                existingIndex === -1
                    ? [...recipientsRef.current, recipient]
                    : recipientsRef.current.map((existing, index) =>
                          index === existingIndex ? recipient : existing
                      );

            recipientsRef.current = nextRecipients;
            onRecipientsChangeRef.current(nextRecipients);
        },
        []
    );

    const showError = useCallback(
        (message: string): void => {
            presentToast(message, {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        },
        [presentToast]
    );

    useEffect(() => {
        if (!pendingProfile || !isProfileFetched) return;

        if (scannedProfile) {
            updateScannedRecipient({
                kind: 'profile',
                profileId: scannedProfile.profileId,
                displayName: scannedProfile.displayName || scannedProfile.profileId,
                image: scannedProfile.image,
                did: 'did' in scannedProfile ? scannedProfile.did : pendingProfile.did,
            });
        } else {
            const nextRecipients = recipientsRef.current.filter(
                recipient =>
                    recipient.kind !== 'profile' || recipient.profileId !== pendingProfile.profileId
            );

            recipientsRef.current = nextRecipients;
            onRecipientsChangeRef.current(nextRecipients);
            showError(m['scanner.recipientInvalid']());
        }

        setPendingProfile(undefined);
    }, [isProfileFetched, pendingProfile, scannedProfile, showError, updateScannedRecipient]);

    const handleScanResult = useCallback(
        async (rawValue: string): Promise<void | QRCodeScannerResultFeedback> => {
            const result = parseClaimInput(rawValue);

            if (result.kind !== 'connection-request') {
                const message = m['scanner.recipientInvalid']();
                showError(message);
                return { message, tone: 'error', durationMs: 1200 };
            }

            const currentProfileDid =
                currentLCNUser && 'did' in currentLCNUser ? currentLCNUser.did : undefined;
            const scannedHost = getDidWebHost(result.did);
            const currentHost = getDidWebHost(currentProfileDid);
            if (scannedHost && currentHost && scannedHost !== currentHost) {
                const message = m['scanner.recipientInvalid']();
                showError(message);
                return { message, tone: 'error', durationMs: 1200 };
            }

            const isCurrentProfile =
                result.profileId === currentLCNUser?.profileId || result.did === currentProfileDid;
            if (isCurrentProfile) {
                const message = m['scanner.recipientSelf']();
                showError(message);

                return { message, tone: 'error', durationMs: 1200 };
            }

            const isDuplicate = recipientsRef.current.some(
                recipient =>
                    recipient.kind === 'profile' && recipient.profileId === result.profileId
            );
            if (isDuplicate) {
                const message = m['scanner.recipientDuplicate']();
                showError(message);
                return { message, tone: 'error', durationMs: 1200 };
            }

            updateScannedRecipient({
                kind: 'profile',
                profileId: result.profileId,
                displayName: result.profileId,
                did: result.did,
            });
            setPendingProfile({ profileId: result.profileId, did: result.did });

            void Haptics.impact({ style: ImpactStyle.Light }).catch(() => undefined);
            connectWith.mutate(
                { profileId: result.profileId },
                { onError: error => log.warn('scan::connect-failed', error) }
            );

            return {
                message: m['scanner.recipientFound']({
                    profileName: `@${result.profileId}`,
                }),
                tone: 'success',
                durationMs: 650,
            };
        },
        [connectWith, currentLCNUser, showError, updateScannedRecipient]
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
                showError(m['scanner.recipientPermission']());
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

            showError(m['scanner.recipientPermission']());
        } catch {
            showError(m['scanner.failed']());
        }
    }, [handleScanResult, showError]);

    if (!canScanRecipients()) return null;

    return (
        <button
            type="button"
            onClick={() => void handleOpenScanner()}
            className={`absolute top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full text-grayscale-500 hover:bg-grayscale-100 hover:text-grayscale-900 transition-colors ${className}`}
            aria-label={m['scanner.recipientAria']()}
        >
            <IonIcon icon={qrCodeOutline} className="text-xl" />
        </button>
    );
};

export default ScanRecipientButton;

import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
    let isNative = true;
    let onResult:
        | ((value: string) =>
              | void
              | { message: string; durationMs?: number; tone?: 'success' | 'error' }
              | Promise<void | {
                    message: string;
                    durationMs?: number;
                    tone?: 'success' | 'error';
                }>)
        | undefined;

    return {
        isNative: () => isNative,
        setNative: (value: boolean) => {
            isNative = value;
        },
        openScanner: vi.fn(({ onResult: handler }) => {
            onResult = handler;
        }),
        getResultHandler: () => onResult,
        checkPermissions: vi.fn(async () => ({ camera: 'granted' })),
        requestPermissions: vi.fn(async () => ({ camera: 'granted' })),
        impact: vi.fn(async () => undefined),
        mutate: vi.fn(),
        presentToast: vi.fn(),
        currentProfile: {
            profileId: 'current-user',
            did: 'did:web:network.learncard.com:users:current-user',
        },
    };
});

vi.mock('@capacitor/core', () => ({
    Capacitor: { isNativePlatform: mocks.isNative },
}));
vi.mock('@capacitor-mlkit/barcode-scanning', () => ({
    BarcodeScanner: {
        checkPermissions: mocks.checkPermissions,
        requestPermissions: mocks.requestPermissions,
    },
}));
vi.mock('@capacitor/haptics', () => ({
    Haptics: { impact: mocks.impact },
    ImpactStyle: { Light: 'LIGHT' },
}));
vi.mock('@ionic/react', () => ({
    IonIcon: () => <span data-testid="scan-icon" />,
}));
vi.mock('ionicons/icons', () => ({ qrCodeOutline: 'qr-code' }));
vi.mock('learn-card-base', () => ({
    QRCodeScannerStore: { set: { openScanner: mocks.openScanner } },
    ToastTypeEnum: { Error: 'error' },
    useConnectWithMutation: () => ({ mutate: mocks.mutate }),
    useGetCurrentLCNUser: () => ({ currentLCNUser: mocks.currentProfile }),
    useGetProfile: (profileId?: string) => ({
        data: profileId
            ? {
                  profileId,
                  displayName: 'Scanned Person',
                  image: 'https://example.com/avatar.png',
                  did: `did:web:network.learncard.com:users:${profileId}`,
              }
            : undefined,
        isFetched: Boolean(profileId),
    }),
    useToast: () => ({ presentToast: mocks.presentToast }),
}));
vi.mock('../../paraglide/messages.js', () => ({
    'boostAFriend.recip.scanAria': () => 'Scan a profile QR code',
    'boostAFriend.recip.scanInvalid': () => 'Invalid profile QR',
    'boostAFriend.recip.scanSelf': () => "You can't add yourself as a recipient.",
    'boostAFriend.recip.scanDuplicate': () => 'Duplicate recipient',
    'boostAFriend.recip.scanPermission': () => 'Camera permission required',
    'boostAFriend.recip.scanFound': ({ profileName }: { profileName: string }) =>
        `Found ${profileName}`,
    'scanner.failed': () => 'Scanner failed',
}));

import ScanRecipientButton from './ScanRecipientButton';

const profileQr = (profileId: string): string =>
    `https://learncard.app/connect?connect=true&did=did:web:network.learncard.com:users:${profileId}`;

describe('ScanRecipientButton', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.setNative(true);
    });

    it('is hidden outside the native app', () => {
        mocks.setNative(false);

        render(<ScanRecipientButton recipients={[]} onRecipientScanned={vi.fn()} />);

        expect(screen.queryByRole('button')).toBeNull();
    });

    it('adds and enriches a scanned profile without global routing', async () => {
        const onRecipientScanned = vi.fn();
        render(<ScanRecipientButton recipients={[]} onRecipientScanned={onRecipientScanned} />);

        fireEvent.click(screen.getByRole('button', { name: 'Scan a profile QR code' }));
        await waitFor(() => expect(mocks.openScanner).toHaveBeenCalledOnce());
        expect(mocks.openScanner).toHaveBeenCalledWith(
            expect.objectContaining({ mode: 'recipient' })
        );

        let feedback: void | { message: string; durationMs?: number; tone?: 'success' | 'error' } =
            undefined;
        await act(async () => {
            feedback = await mocks.getResultHandler()?.(profileQr('scanned-user'));
        });

        expect(onRecipientScanned).toHaveBeenNthCalledWith(1, {
            kind: 'profile',
            profileId: 'scanned-user',
            displayName: 'scanned-user',
            did: 'did:web:network.learncard.com:users:scanned-user',
        });
        await waitFor(() =>
            expect(onRecipientScanned).toHaveBeenLastCalledWith({
                kind: 'profile',
                profileId: 'scanned-user',
                displayName: 'Scanned Person',
                image: 'https://example.com/avatar.png',
                did: 'did:web:network.learncard.com:users:scanned-user',
            })
        );
        expect(mocks.mutate).toHaveBeenCalledWith({ profileId: 'scanned-user' });
        expect(mocks.impact).toHaveBeenCalledWith({ style: 'LIGHT' });
        expect(feedback).toEqual({
            message: 'Found @scanned-user',
            tone: 'success',
            durationMs: 650,
        });
    });

    it('shows an error without adding anything when the user scans themselves', async () => {
        const onRecipientScanned = vi.fn();
        render(<ScanRecipientButton recipients={[]} onRecipientScanned={onRecipientScanned} />);

        fireEvent.click(screen.getByRole('button', { name: 'Scan a profile QR code' }));
        await waitFor(() => expect(mocks.openScanner).toHaveBeenCalledOnce());

        let feedback: void | { message: string; durationMs?: number; tone?: 'success' | 'error' } =
            undefined;
        await act(async () => {
            feedback = await mocks.getResultHandler()?.(profileQr('current-user'));
        });

        expect(mocks.presentToast).toHaveBeenCalledWith("You can't add yourself as a recipient.", {
            type: 'error',
            hasDismissButton: true,
        });
        expect(onRecipientScanned).not.toHaveBeenCalled();
        expect(mocks.mutate).not.toHaveBeenCalled();
        expect(mocks.impact).not.toHaveBeenCalled();
        expect(feedback).toEqual({
            message: "You can't add yourself as a recipient.",
            tone: 'error',
            durationMs: 1200,
        });
    });

    it.each([
        ['a non-profile QR', 'https://example.com', [], 'Invalid profile QR'],
        [
            'an existing recipient',
            profileQr('existing-user'),
            [
                {
                    kind: 'profile' as const,
                    profileId: 'existing-user',
                    displayName: 'Existing User',
                },
            ],
            'Duplicate recipient',
        ],
    ])('rejects %s with a friendly toast', async (_label, qrValue, recipients, message) => {
        const onRecipientScanned = vi.fn();
        render(
            <ScanRecipientButton recipients={recipients} onRecipientScanned={onRecipientScanned} />
        );

        fireEvent.click(screen.getByRole('button'));
        await waitFor(() => expect(mocks.openScanner).toHaveBeenCalledOnce());
        await act(async () => {
            await mocks.getResultHandler()?.(qrValue);
        });

        expect(onRecipientScanned).not.toHaveBeenCalled();
        expect(mocks.presentToast).toHaveBeenCalledWith(message, {
            type: 'error',
            hasDismissButton: true,
        });
        expect(mocks.mutate).not.toHaveBeenCalled();
    });
});

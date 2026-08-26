import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
    let isNative = true;
    let profileExists = true;
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
        setProfileExists: (value: boolean) => {
            profileExists = value;
        },
        hasProfile: () => profileExists,
        openScanner: vi.fn(({ onResult: handler }) => {
            onResult = handler;
        }),
        getResultHandler: () => onResult,
        checkPermissions: vi.fn(async () => ({ camera: 'granted' })),
        requestPermissions: vi.fn(async () => ({ camera: 'granted' })),
        impact: vi.fn(async () => undefined),
        mutate: vi.fn(),
        warn: vi.fn(),
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
    getLogger: () => ({ warn: mocks.warn }),
    useConnectWithMutation: () => ({ mutate: mocks.mutate }),
    useGetCurrentLCNUser: () => ({ currentLCNUser: mocks.currentProfile }),
    useGetProfile: (profileId?: string) => ({
        data:
            profileId && mocks.hasProfile()
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
    'scanner.recipientAria': () => 'Scan a profile QR code',
    'scanner.recipientInvalid': () => 'Invalid profile QR',
    'scanner.recipientSelf': () => "You can't add yourself as a recipient.",
    'scanner.recipientDuplicate': () => 'Duplicate recipient',
    'scanner.recipientPermission': () => 'Camera permission required',
    'scanner.recipientFound': ({ profileName }: { profileName: string }) => `Found ${profileName}`,
    'scanner.failed': () => 'Scanner failed',
}));

import ScanRecipientButton from './ScanRecipientButton';

const profileQr = (profileId: string): string =>
    `https://learncard.app/connect?connect=true&did=did:web:network.learncard.com:users:${profileId}`;

describe('ScanRecipientButton', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.setNative(true);
        mocks.setProfileExists(true);
    });

    it('is hidden outside the native app', () => {
        mocks.setNative(false);

        render(<ScanRecipientButton recipients={[]} onRecipientsChange={vi.fn()} />);

        expect(screen.queryByRole('button')).toBeNull();
    });

    it('adds and enriches a scanned profile without global routing', async () => {
        const onRecipientsChange = vi.fn();
        render(<ScanRecipientButton recipients={[]} onRecipientsChange={onRecipientsChange} />);

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

        expect(onRecipientsChange).toHaveBeenNthCalledWith(1, [
            {
                kind: 'profile',
                profileId: 'scanned-user',
                displayName: 'scanned-user',
                did: 'did:web:network.learncard.com:users:scanned-user',
            },
        ]);
        await waitFor(() =>
            expect(onRecipientsChange).toHaveBeenLastCalledWith([
                {
                    kind: 'profile',
                    profileId: 'scanned-user',
                    displayName: 'Scanned Person',
                    image: 'https://example.com/avatar.png',
                    did: 'did:web:network.learncard.com:users:scanned-user',
                },
            ])
        );
        expect(mocks.mutate).toHaveBeenCalledWith(
            { profileId: 'scanned-user' },
            expect.objectContaining({ onError: expect.any(Function) })
        );
        expect(mocks.impact).toHaveBeenCalledWith({ style: 'LIGHT' });
        expect(feedback).toEqual({
            message: 'Found @scanned-user',
            tone: 'success',
            durationMs: 650,
        });
    });

    it('shows an error without adding anything when the user scans themselves', async () => {
        const onRecipientsChange = vi.fn();
        render(<ScanRecipientButton recipients={[]} onRecipientsChange={onRecipientsChange} />);

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
        expect(onRecipientsChange).not.toHaveBeenCalled();
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
            'a profile from another network',
            'https://learncard.app/connect?connect=true&did=did:web:other.learncard.com:users:other-user',
            [],
            'Invalid profile QR',
        ],
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
        const onRecipientsChange = vi.fn();
        render(
            <ScanRecipientButton recipients={recipients} onRecipientsChange={onRecipientsChange} />
        );

        fireEvent.click(screen.getByRole('button'));
        await waitFor(() => expect(mocks.openScanner).toHaveBeenCalledOnce());
        await act(async () => {
            await mocks.getResultHandler()?.(qrValue);
        });

        expect(onRecipientsChange).not.toHaveBeenCalled();
        expect(mocks.presentToast).toHaveBeenCalledWith(message, {
            type: 'error',
            hasDismissButton: true,
        });
        expect(mocks.mutate).not.toHaveBeenCalled();
    });

    it('checks for duplicates against recipients added after the scanner opens', async () => {
        const onRecipientsChange = vi.fn();
        const { rerender } = render(
            <ScanRecipientButton recipients={[]} onRecipientsChange={onRecipientsChange} />
        );

        fireEvent.click(screen.getByRole('button'));
        await waitFor(() => expect(mocks.openScanner).toHaveBeenCalledOnce());

        rerender(
            <ScanRecipientButton
                recipients={[
                    {
                        kind: 'profile',
                        profileId: 'newly-added-user',
                        displayName: 'Newly Added User',
                    },
                ]}
                onRecipientsChange={onRecipientsChange}
            />
        );

        await act(async () => {
            await mocks.getResultHandler()?.(profileQr('newly-added-user'));
        });

        expect(onRecipientsChange).not.toHaveBeenCalled();
        expect(mocks.presentToast).toHaveBeenCalledWith('Duplicate recipient', {
            type: 'error',
            hasDismissButton: true,
        });
        expect(mocks.mutate).not.toHaveBeenCalled();
    });

    it('uses the latest change callback after the scanner opens', async () => {
        const initialOnChange = vi.fn();
        const latestOnChange = vi.fn();
        const { rerender } = render(
            <ScanRecipientButton recipients={[]} onRecipientsChange={initialOnChange} />
        );

        fireEvent.click(screen.getByRole('button'));
        await waitFor(() => expect(mocks.openScanner).toHaveBeenCalledOnce());

        rerender(<ScanRecipientButton recipients={[]} onRecipientsChange={latestOnChange} />);
        await act(async () => {
            await mocks.getResultHandler()?.(profileQr('fresh-user'));
        });

        expect(initialOnChange).not.toHaveBeenCalled();
        expect(latestOnChange).toHaveBeenCalled();
    });

    it('removes the optimistic recipient when the profile cannot be verified', async () => {
        mocks.setProfileExists(false);
        const onRecipientsChange = vi.fn();
        render(<ScanRecipientButton recipients={[]} onRecipientsChange={onRecipientsChange} />);

        fireEvent.click(screen.getByRole('button'));
        await waitFor(() => expect(mocks.openScanner).toHaveBeenCalledOnce());
        await act(async () => {
            await mocks.getResultHandler()?.(profileQr('missing-user'));
        });

        expect(onRecipientsChange).toHaveBeenNthCalledWith(1, [
            expect.objectContaining({ profileId: 'missing-user' }),
        ]);
        await waitFor(() => expect(onRecipientsChange).toHaveBeenLastCalledWith([]));
        expect(mocks.presentToast).toHaveBeenCalledWith('Invalid profile QR', {
            type: 'error',
            hasDismissButton: true,
        });
    });
});

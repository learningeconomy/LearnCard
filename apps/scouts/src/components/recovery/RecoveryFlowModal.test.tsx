// @vitest-environment jsdom
/* eslint-disable react/jsx-props-no-spreading -- tests share base props across renders */

import * as jestDomMatchers from '@testing-library/jest-dom/matchers';
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    loadPendingEscrowRecovery,
    savePendingEscrowRecovery,
    clearPendingEscrowRecovery,
    isEscrowRecoveryStorageAvailable,
} from './escrowRecoveryStorage';

vi.mock('./escrowRecoveryStorage', () => ({
    loadPendingEscrowRecovery: vi.fn(),
    savePendingEscrowRecovery: vi.fn(),
    clearPendingEscrowRecovery: vi.fn(),
    isEscrowRecoveryStorageAvailable: vi.fn().mockReturnValue(true),
}));

vi.mock('@capacitor/core', () => ({
    Capacitor: { isNativePlatform: () => false },
}));

vi.mock('@learncard/sss-key-manager', async importOriginal => ({
    ...(await importOriginal<typeof import('@learncard/sss-key-manager')>()),
    isWebAuthnSupported: () => true,
}));

vi.mock('@ionic/react', () => ({
    IonIcon: ({ className }: { className?: string }) => <span className={className} />,
}));

vi.mock('learn-card-base', async () => {
    const { Overlay } = await import('learn-card-base/auth-coordinator/components/Overlay');

    return {
        Overlay,
        getLogger: () => ({ error: vi.fn() }),
        QrLoginRequester: () => <div>QrLoginRequester</div>,
        getSSSConfig: () => ({ serverUrl: 'https://example.com' }),
    };
});

import { RecoveryFlowModal } from './RecoveryFlowModal';

expect.extend(jestDomMatchers);

describe('RecoveryFlowModal', () => {
    beforeEach(() => {
        vi.mocked(isEscrowRecoveryStorageAvailable).mockReturnValue(true);
        vi.mocked(loadPendingEscrowRecovery).mockResolvedValue(undefined);
        vi.clearAllMocks();
    });
    const defaultProps = {
        availableMethods: [],
        onRecoverWithPasskey: vi.fn(),
        onRecoverWithPhrase: vi.fn(),
        onRecoverWithBackup: vi.fn(),
        onCancel: vi.fn(),
    };

    const record = {
        holdId: 'hold',
        resumeToken: 'resume',
        clientEphemeralPrivateKey: 'ephemeral',
        releaseAfter: '2099-09-01T12:00:00Z',
        requestedAt: '2026-09-01',
    };
    const escrowRecovery = {
        onStart: vi
            .fn()
            .mockResolvedValue({ ...record, status: 'pending', requestedAt: '2026-09-01' }),
        onStatus: vi.fn().mockResolvedValue({ holdId: 'hold', status: 'pending' }),
        onRecover: vi.fn().mockResolvedValue(undefined),
        onConfirmCode: vi.fn().mockResolvedValue({ success: true }),
        onResendCode: vi.fn().mockResolvedValue({ success: true }),
    };
    it('requires durable browser storage before starting a hold', async () => {
        vi.mocked(isEscrowRecoveryStorageAvailable).mockReturnValue(false);
        render(
            <RecoveryFlowModal
                {...defaultProps}
                availableMethods={[{ type: 'escrow', createdAt: '2026-09-01' }]}
                escrowRecovery={escrowRecovery}
            />
        );
        expect(screen.queryByLabelText('PIN digit 1')).not.toBeInTheDocument();
        expect(
            await screen.findByRole('button', { name: 'Start a 7-day recovery' })
        ).toBeDisabled();
        expect(
            screen.getByText(/Use an up-to-date browser on a personal device/)
        ).toBeInTheDocument();
    });

    it('discovers cancellation before the release date and allows restarting', async () => {
        vi.mocked(loadPendingEscrowRecovery).mockResolvedValue(record);
        render(
            <RecoveryFlowModal
                {...defaultProps}
                availableMethods={[{ type: 'escrow', createdAt: '2026-09-01' }]}
                escrowRecovery={{
                    ...escrowRecovery,
                    onStatus: vi.fn().mockResolvedValue({ status: 'cancelled' }),
                }}
            />
        );
        fireEvent.click(await screen.findByRole('button', { name: 'Check status' }));
        expect(await screen.findByText('This recovery request was cancelled.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Start a 7-day recovery' })).toBeEnabled();
    });

    it('does not try consuming a completed hold after its in-memory rebind is lost', async () => {
        vi.mocked(loadPendingEscrowRecovery).mockResolvedValue({
            ...record,
            releaseAfter: '2020-01-01',
        });
        render(
            <RecoveryFlowModal
                {...defaultProps}
                escrowRecovery={{
                    ...escrowRecovery,
                    onStatus: vi.fn().mockResolvedValue({ status: 'completed' }),
                }}
            />
        );
        fireEvent.click(await screen.findByRole('button', { name: 'Restore my account' }));
        expect(
            await screen.findByText('This recovery request has already finished. Start a new one.')
        ).toBeInTheDocument();
        expect(escrowRecovery.onRecover).not.toHaveBeenCalled();
    });

    it('does not erase recovery details when explaining how to cancel', async () => {
        vi.mocked(loadPendingEscrowRecovery).mockResolvedValue(record);
        render(<RecoveryFlowModal {...defaultProps} escrowRecovery={escrowRecovery} />);
        fireEvent.click(await screen.findByRole('button', { name: 'Cancel request' }));
        expect(
            screen.getAllByText(
                'Open your account on a signed-in device and choose Cancel recovery request.'
            )[0]
        ).toBeInTheDocument();
        expect(clearPendingEscrowRecovery).not.toHaveBeenCalled();
        expect(screen.getByText('Recovery in progress')).toBeInTheDocument();
    });

    it('does not replace a request when storage cannot be read', async () => {
        vi.mocked(loadPendingEscrowRecovery).mockRejectedValueOnce(
            new Error('storage unavailable')
        );
        render(
            <RecoveryFlowModal
                {...defaultProps}
                availableMethods={[{ type: 'escrow', createdAt: '2026-09-01' }]}
                escrowRecovery={escrowRecovery}
            />
        );
        expect(
            await screen.findByText('Recovery details could not be loaded. Please try again.')
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Start a 7-day recovery' })).toBeDisabled();
        fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
        await waitFor(() =>
            expect(screen.getByRole('button', { name: 'Start a 7-day recovery' })).toBeEnabled()
        );
        expect(escrowRecovery.onStart).not.toHaveBeenCalled();
    });

    it('retains the proof if completion fails', async () => {
        vi.mocked(loadPendingEscrowRecovery).mockResolvedValue({
            ...record,
            releaseAfter: '2020-01-01',
        });
        render(
            <RecoveryFlowModal
                {...defaultProps}
                escrowRecovery={{
                    ...escrowRecovery,
                    onRecover: vi.fn().mockRejectedValue(new Error('private failure')),
                }}
            />
        );
        fireEvent.click(await screen.findByRole('button', { name: 'Restore my account' }));
        expect(
            await screen.findByText('Something went wrong. Please try again.')
        ).toBeInTheDocument();
        expect(clearPendingEscrowRecovery).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: 'Restore my account' })).toBeEnabled();
    });

    it('starts and persists a seven-day request and displays its release time', async () => {
        render(
            <RecoveryFlowModal
                {...defaultProps}
                availableMethods={[{ type: 'escrow', createdAt: '2026-09-01' }]}
                escrowRecovery={escrowRecovery}
            />
        );
        const button = screen.getByRole('button', { name: 'Start a 7-day recovery' });
        await waitFor(() => expect(button).toBeEnabled());
        fireEvent.click(button);
        expect(await screen.findByText('Recovery in progress')).toBeInTheDocument();
        expect(escrowRecovery.onStart).toHaveBeenCalledTimes(1);
        expect(savePendingEscrowRecovery).toHaveBeenCalledWith(record, 'default');
        expect(
            screen.getByText(
                new Intl.DateTimeFormat(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                }).format(new Date(record.releaseAfter))
            )
        ).toBeInTheDocument();
    });
    it('finishes a persisted request after the release time', async () => {
        const pending = { ...record, releaseAfter: '2020-01-01T00:00:00Z' };
        vi.mocked(loadPendingEscrowRecovery).mockResolvedValue(pending);
        render(<RecoveryFlowModal {...defaultProps} escrowRecovery={escrowRecovery} />);
        fireEvent.click(await screen.findByRole('button', { name: 'Restore my account' }));
        await waitFor(() =>
            expect(escrowRecovery.onRecover).toHaveBeenCalledWith({
                method: 'escrow',
                holdId: pending.holdId,
                resumeToken: pending.resumeToken,
                clientEphemeralPrivateKey: pending.clientEphemeralPrivateKey,
            })
        );
        expect(clearPendingEscrowRecovery).toHaveBeenCalled();
    });

    it('retains an unsaved request and lets the user retry persistence', async () => {
        vi.mocked(savePendingEscrowRecovery).mockRejectedValueOnce(
            new Error('storage unavailable')
        );
        render(
            <RecoveryFlowModal
                {...defaultProps}
                availableMethods={[{ type: 'escrow', createdAt: '2026-09-01' }]}
                escrowRecovery={escrowRecovery}
            />
        );
        const start = screen.getByRole('button', { name: 'Start a 7-day recovery' });
        await waitFor(() => expect(start).toBeEnabled());
        fireEvent.click(start);
        const save = await screen.findByRole('button', { name: 'Save recovery request' });
        await waitFor(() => expect(save).toBeEnabled());
        fireEvent.click(save);
        await waitFor(() =>
            expect(
                screen.queryByRole('button', { name: 'Save recovery request' })
            ).not.toBeInTheDocument()
        );
        expect(escrowRecovery.onStart).toHaveBeenCalledTimes(1);
    });
});

describe('RecoveryFlowModal sign-in picker', () => {
    const base = {
        onRecoverWithPasskey: vi.fn(),
        onRecoverWithPhrase: vi.fn(),
        onRecoverWithBackup: vi.fn(),
        onCancel: vi.fn(),
        recoveryReason: 'new_device' as const,
    };
    // Accounts without a PIN keep the method-first picker; `withPin` leads with the PIN.
    const escrowRecovery = {
        pinAvailable: false,
        onStart: vi.fn(),
        onStatus: vi.fn().mockResolvedValue({ holdId: 'hold', status: 'pending' }),
        onRecover: vi.fn().mockResolvedValue(undefined),
        onConfirmCode: vi.fn().mockResolvedValue({ success: true }),
        onResendCode: vi.fn().mockResolvedValue({ success: true }),
    };
    const withPin = { ...escrowRecovery, pinAvailable: true };
    const methods = (...types: string[]) =>
        types.map(type => ({ type, createdAt: '2026-09-01', credentialId: `${type}-id` }));
    const pastePin = (pin = '135790') =>
        fireEvent.paste(screen.getAllByLabelText(/PIN digit/)[0], {
            clipboardData: { getData: () => pin },
        });

    beforeEach(() => {
        vi.mocked(isEscrowRecoveryStorageAvailable).mockReturnValue(true);
        vi.mocked(loadPendingEscrowRecovery).mockResolvedValue(undefined);
        withPin.onRecover = vi.fn().mockResolvedValue(undefined);
    });

    const buttonNames = () => screen.getAllByRole('button').map(button => button.textContent ?? '');

    it('leads with PIN sign-in, above every other method, without reset warnings', () => {
        render(
            <RecoveryFlowModal
                {...base}
                availableMethods={methods('passkey', 'phrase', 'escrow')}
                onRecoverWithDevice={vi.fn()}
                escrowRecovery={withPin}
            />
        );

        expect(screen.getByRole('heading', { name: "Confirm it's you" })).toBeTruthy();
        expect(screen.getByText('Enter your 6-digit PIN to finish signing in.')).toBeTruthy();
        const pinInput = screen.getAllByLabelText(/PIN digit/)[0];
        const passkey = screen.getByRole('button', { name: /passkey/i });
        expect(
            pinInput.compareDocumentPosition(passkey) & Node.DOCUMENT_POSITION_FOLLOWING
        ).toBeTruthy();
        expect(screen.getByText('Other ways to confirm')).toBeTruthy();
        expect(screen.queryByText('Other ways to sign in')).toBeNull();
        // Passkey is secondary now: its hero copy is not used.
        expect(screen.queryByText('Use your passkey')).toBeNull();
        expect(screen.queryByText('Sign you out on your other devices')).toBeNull();
        expect(screen.queryByText(/Turn off your other sign-in methods/)).toBeNull();
        // The 7-day wait stays behind one quiet "Trouble signing in?" link.
        expect(screen.getByRole('button', { name: 'Trouble signing in?' })).toBeTruthy();
        expect(screen.queryByText("Can't use any of these?")).toBeNull();
        expect(screen.queryByRole('button', { name: 'Get back into your account' })).toBeNull();
        expect(screen.queryByRole('button', { name: 'Start a 7-day recovery' })).toBeNull();
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
    });

    it('confirms with another device under the PIN, in calm PIN-screen copy', () => {
        render(
            <RecoveryFlowModal
                {...base}
                availableMethods={methods('phrase', 'escrow')}
                onRecoverWithDevice={vi.fn()}
                escrowRecovery={withPin}
            />
        );

        const device = screen.getByRole('button', { name: /Approve from another device/ });
        expect(device.textContent).toContain("Scan a code with a device you're signed in on");
        expect(screen.queryByText('Another Device')).toBeNull();
        expect(screen.queryByText('Scan a code from a signed-in device')).toBeNull();
        // No tinted panel behind the PIN boxes.
        const pinSection = screen.getByRole('region', { name: 'Recovery PIN' });
        expect(pinSection.className).not.toMatch(/bg-emerald/);

        // ScoutPass keeps every method listed; ones not set up keep their "Not set up" label.
        expect(screen.getAllByText('Not set up')).toHaveLength(3);
    });

    it('takes "Trouble signing in?" to the 7-day screen and back', () => {
        render(
            <RecoveryFlowModal
                {...base}
                availableMethods={methods('phrase', 'escrow')}
                escrowRecovery={withPin}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Trouble signing in?' }));
        expect(screen.getByRole('heading', { name: 'Get back into your account' })).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: /Back/ }));
        expect(screen.getByRole('heading', { name: "Confirm it's you" })).toBeTruthy();
    });

    it('signs in with the PIN', async () => {
        render(
            <RecoveryFlowModal
                {...base}
                availableMethods={methods('escrow')}
                escrowRecovery={withPin}
            />
        );

        pastePin();

        await waitFor(() =>
            expect(withPin.onRecover).toHaveBeenCalledWith({ method: 'escrow-pin', pin: '135790' })
        );
    });

    it('keeps the warnings on the hold-only last-resort screen', async () => {
        render(
            <RecoveryFlowModal
                {...base}
                availableMethods={methods('phrase', 'escrow')}
                onRecoverWithDevice={vi.fn()}
                escrowRecovery={withPin}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Trouble signing in?' }));

        expect(screen.getByRole('heading', { name: 'Get back into your account' })).toBeTruthy();
        expect(screen.getByText('Sign you out on your other devices')).toBeTruthy();
        expect(
            screen.getByText('Turn off your other sign-in methods until you set them up again')
        ).toBeTruthy();
        expect(await screen.findByRole('button', { name: 'Start a 7-day recovery' })).toBeTruthy();
        expect(screen.queryAllByLabelText(/PIN digit/)).toHaveLength(0);

        fireEvent.click(screen.getByRole('button', { name: 'Use my recovery PIN instead' }));
        expect(screen.getByRole('heading', { name: "Confirm it's you" })).toBeTruthy();
        expect(screen.getAllByLabelText(/PIN digit/)).toHaveLength(6);
    });

    it('shows wrong-PIN feedback and keeps the PIN on offer', async () => {
        const error = Object.assign(new Error('Incorrect PIN'), {
            name: 'EscrowPinMismatchError',
            attemptsRemaining: 8,
        });
        withPin.onRecover = vi.fn().mockRejectedValue(error);
        render(
            <RecoveryFlowModal
                {...base}
                availableMethods={methods('escrow')}
                escrowRecovery={withPin}
            />
        );

        pastePin();

        expect(await screen.findByText('Incorrect PIN. 8 attempts left.')).toBeTruthy();
        expect(screen.getAllByLabelText(/PIN digit/)).toHaveLength(6);
    });

    it('drops a locked PIN and falls back to the 7-day wait', async () => {
        const error = Object.assign(new Error('Locked'), { name: 'EscrowPinLockedError' });
        withPin.onRecover = vi.fn().mockRejectedValue(error);
        render(
            <RecoveryFlowModal
                {...base}
                availableMethods={methods('escrow')}
                escrowRecovery={withPin}
            />
        );

        pastePin();

        expect(
            await screen.findByText('Too many attempts. You can still recover by waiting 7 days.')
        ).toBeTruthy();
        expect(screen.getByRole('heading', { name: 'Get back into your account' })).toBeTruthy();
        expect(await screen.findByRole('button', { name: 'Start a 7-day recovery' })).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Use my recovery PIN instead' })).toBeNull();
        expect(screen.queryAllByLabelText(/PIN digit/)).toHaveLength(0);
    });

    it('never shows raw server errors from a PIN attempt', async () => {
        const error = Object.assign(new Error('private server details'), {
            name: 'EscrowRequestError',
            status: 403,
        });
        withPin.onRecover = vi.fn().mockRejectedValue(error);
        render(
            <RecoveryFlowModal
                {...base}
                availableMethods={methods('phrase', 'escrow')}
                escrowRecovery={withPin}
            />
        );

        pastePin();

        expect(
            await screen.findByText(
                "PIN sign-in isn't available for this account. Use another way to sign in."
            )
        ).toBeTruthy();
        expect(screen.queryByText('private server details')).toBeNull();
        expect(screen.queryAllByLabelText(/PIN digit/)).toHaveLength(0);
    });

    it('opens on the PIN when the PIN is the only way in', () => {
        render(
            <RecoveryFlowModal
                {...base}
                availableMethods={methods('escrow')}
                escrowRecovery={withPin}
            />
        );

        expect(screen.getByRole('heading', { name: "Confirm it's you" })).toBeTruthy();
        expect(screen.queryByText('Other ways to confirm')).toBeNull();
        expect(screen.getByRole('button', { name: 'Trouble signing in?' })).toBeTruthy();
    });

    it('moves the waiting period behind a clear last-resort screen without a PIN', async () => {
        render(
            <RecoveryFlowModal
                {...base}
                availableMethods={methods('phrase', 'escrow')}
                onRecoverWithDevice={vi.fn()}
                escrowRecovery={escrowRecovery}
            />
        );

        expect(screen.getByText("Can't use any of these?")).toBeTruthy();
        fireEvent.click(screen.getByRole('button', { name: 'Get back into your account' }));

        expect(screen.getByText('Sign you out on your other devices')).toBeTruthy();
        expect(await screen.findByRole('button', { name: 'Start a 7-day recovery' })).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Use my recovery PIN instead' })).toBeNull();

        fireEvent.click(screen.getByRole('button', { name: /Back/ }));
        expect(screen.getByRole('heading', { name: 'Verify Your Identity' })).toBeTruthy();
    });

    it('offers "I can\'t use another device" when that is the only option', () => {
        render(
            <RecoveryFlowModal
                {...base}
                availableMethods={methods('escrow')}
                onRecoverWithDevice={vi.fn()}
                escrowRecovery={escrowRecovery}
            />
        );

        expect(screen.getByText("Can't use another device?")).toBeTruthy();
        expect(screen.getByRole('button', { name: 'Get back into your account' })).toBeTruthy();
    });

    it('opens straight on the last-resort screen when nothing else can be used', async () => {
        render(
            <RecoveryFlowModal
                {...base}
                availableMethods={methods('escrow')}
                escrowRecovery={escrowRecovery}
            />
        );

        expect(screen.getByRole('heading', { name: 'Get back into your account' })).toBeTruthy();
        expect(screen.queryByRole('button', { name: /Back/ })).toBeNull();
    });

    it('shows a recovery already underway on the first screen', async () => {
        vi.mocked(loadPendingEscrowRecovery).mockResolvedValue({
            holdId: 'hold',
            resumeToken: 'resume',
            clientEphemeralPrivateKey: 'ephemeral',
            releaseAfter: '2099-09-01T12:00:00Z',
            requestedAt: '2026-09-01',
        });
        render(
            <RecoveryFlowModal
                {...base}
                availableMethods={methods('phrase', 'escrow')}
                onRecoverWithDevice={vi.fn()}
                escrowRecovery={escrowRecovery}
            />
        );

        expect(screen.getByRole('heading', { name: 'Verify Your Identity' })).toBeTruthy();
        expect(
            await screen.findByRole('region', { name: 'Account recovery request' })
        ).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Start a 7-day recovery' })).toBeNull();
    });

    it('keeps the first screen free of recovery chrome when nothing is underway', async () => {
        vi.mocked(isEscrowRecoveryStorageAvailable).mockReturnValue(false);
        render(
            <RecoveryFlowModal
                {...base}
                availableMethods={methods('phrase', 'escrow')}
                onRecoverWithDevice={vi.fn()}
                escrowRecovery={escrowRecovery}
            />
        );

        await waitFor(() => expect(loadPendingEscrowRecovery).toHaveBeenCalled());
        expect(screen.queryByRole('region', { name: 'Account recovery request' })).toBeNull();
    });

    it('has no escape hatch when automatic recovery is not set up', () => {
        render(
            <RecoveryFlowModal
                {...base}
                availableMethods={methods('phrase')}
                onRecoverWithDevice={vi.fn()}
                escrowRecovery={escrowRecovery}
            />
        );

        expect(screen.queryByText(/Can't use/)).toBeNull();
        expect(screen.queryByRole('button', { name: 'Get back into your account' })).toBeNull();
    });
});

describe('RecoveryFlowModal legacy picker without escrow', () => {
    const base = {
        onRecoverWithPasskey: vi.fn(),
        onRecoverWithPhrase: vi.fn(),
        onRecoverWithBackup: vi.fn(),
        onCancel: vi.fn(),
        recoveryReason: 'new_device' as const,
    };
    const escrowRecovery = {
        pinAvailable: true,
        onStart: vi.fn(),
        onStatus: vi.fn(),
        onRecover: vi.fn(),
        onConfirmCode: vi.fn(),
        onResendCode: vi.fn(),
    };
    const legacyMethods = [{ type: 'phrase', createdAt: '2026-09-01' }];

    beforeEach(() => {
        vi.mocked(isEscrowRecoveryStorageAvailable).mockReturnValue(true);
        vi.mocked(loadPendingEscrowRecovery).mockResolvedValue(undefined);
    });

    const expectLegacyPicker = async () => {
        expect(screen.getByRole('heading', { name: 'Verify Your Identity' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /recovery phrase/i })).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
        expect(screen.queryByLabelText(/PIN digit/)).not.toBeInTheDocument();
        expect(screen.queryByText('Trouble signing in?')).not.toBeInTheDocument();
        expect(screen.queryByText('Get back into your account')).not.toBeInTheDocument();
        expect(
            screen.queryByRole('region', { name: 'Account recovery request' })
        ).not.toBeInTheDocument();
    };

    it('renders the legacy picker without an escrowRecovery prop', async () => {
        render(<RecoveryFlowModal {...base} availableMethods={legacyMethods} />);
        await expectLegacyPicker();
    });

    it('renders the legacy picker when the account has no escrow method', async () => {
        render(
            <RecoveryFlowModal
                {...base}
                availableMethods={legacyMethods}
                escrowRecovery={escrowRecovery}
            />
        );
        expect(screen.getByRole('heading', { name: 'Verify Your Identity' })).toBeInTheDocument();
        await waitFor(() => expect(loadPendingEscrowRecovery).toHaveBeenCalled());
        expect(screen.queryByLabelText(/PIN digit/)).not.toBeInTheDocument();
        expect(screen.queryByText('Trouble signing in?')).not.toBeInTheDocument();
        expect(screen.queryByText('Get back into your account')).not.toBeInTheDocument();
        expect(
            screen.queryByRole('region', { name: 'Account recovery request' })
        ).not.toBeInTheDocument();
    });
});

const renderModal = (
    onCancel: () => void,
    onRecoverWithPhrase = vi.fn().mockResolvedValue(undefined)
): void => {
    render(
        <RecoveryFlowModal
            availableMethods={[{ type: 'phrase', createdAt: '2026-09-06T00:00:00Z' }]}
            onRecoverWithPasskey={vi.fn().mockResolvedValue(undefined)}
            onRecoverWithPhrase={onRecoverWithPhrase}
            onRecoverWithBackup={vi.fn().mockResolvedValue(undefined)}
            onCancel={onCancel}
        />
    );
};

describe('RecoveryFlowModal keyboard behavior', () => {
    beforeEach(() => {
        vi.stubGlobal(
            'requestAnimationFrame',
            vi.fn(() => 1)
        );
        vi.stubGlobal('cancelAnimationFrame', vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('keeps Back and Escape unavailable while recovery is pending', () => {
        const onCancel = vi.fn();
        const recover = vi.fn(() => new Promise<void>(() => {}));
        renderModal(onCancel, recover);
        fireEvent.click(screen.getByRole('button', { name: /phrase/i }));
        fireEvent.change(screen.getByRole('textbox'), {
            target: { value: Array(25).fill('word').join(' ') },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Recover Account' }));
        expect(recover).toHaveBeenCalledOnce();
        const back = screen.getByRole('button', { name: 'Back' }) as HTMLButtonElement;
        expect(back.disabled).toBe(true);
        fireEvent.click(back);
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull();
        expect(onCancel).not.toHaveBeenCalled();
    });

    it('returns to the method picker before cancelling recovery on Escape', () => {
        const onCancel = vi.fn();
        renderModal(onCancel);

        fireEvent.click(screen.getByRole('button', { name: /recovery phrase/i }));

        expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy();

        fireEvent.keyDown(document, { key: 'Escape' });
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
        expect(onCancel).not.toHaveBeenCalled();

        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onCancel).toHaveBeenCalledOnce();
    });
});

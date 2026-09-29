// @vitest-environment jsdom

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

    it('renders identity enter_email phase', () => {
        render(<RecoveryFlowModal {...defaultProps} identityPhase="enter_email" />);
        expect(screen.getByRole('heading', { name: /Restore Your Account/i })).toBeInTheDocument();
        expect(screen.getByRole('textbox')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Send Recovery Code/i })).toBeInTheDocument();
    });

    it.each(['cancelled', 'expired'] as const)(
        'handles a %s hold without attempting recovery',
        async status => {
            vi.mocked(loadPendingEscrowRecovery).mockResolvedValue({
                ...record,
                releaseAfter: '2020-01-01T00:00:00Z',
            });
            const onStatus = vi.fn().mockResolvedValue({ status });
            render(
                <RecoveryFlowModal
                    {...defaultProps}
                    escrowRecovery={{ ...escrowRecovery, onStatus }}
                />
            );
            fireEvent.click(await screen.findByRole('button', { name: 'Restore my account' }));
            expect(
                await screen.findByText(
                    status === 'cancelled'
                        ? 'This recovery request was cancelled.'
                        : 'This recovery request expired. Start a new one.'
                )
            ).toBeInTheDocument();
            expect(escrowRecovery.onRecover).not.toHaveBeenCalled();
        }
    );

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

    it('renders identity verify_email phase', () => {
        render(
            <RecoveryFlowModal
                {...defaultProps}
                identityPhase="verify_email"
                identityEmail="test@example.com"
            />
        );
        expect(screen.getByRole('heading', { name: /Check Your Email/i })).toBeInTheDocument();
        expect(screen.getByRole('textbox')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Verify Code/i })).toBeInTheDocument();
    });

    it('renders identity new_login phase', () => {
        render(<RecoveryFlowModal {...defaultProps} identityPhase="new_login" />);
        expect(screen.getByRole('heading', { name: /Account Verified/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Continue to Sign In/i })).toBeInTheDocument();
    });

    it('renders identity success phase', () => {
        render(<RecoveryFlowModal {...defaultProps} identityPhase="success" />);
        expect(screen.getByRole('heading', { name: /Access Restored/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Done/i })).toBeInTheDocument();
    });

    it('hides device linking in the lost-login chooser even with a device callback', () => {
        render(
            <RecoveryFlowModal
                {...defaultProps}
                identityPhase="choose_method"
                onRecoverWithDevice={vi.fn()}
                availableMethods={[{ type: 'phrase', createdAt: '2026-09-06T00:00:00Z' }]}
            />
        );

        expect(screen.queryByRole('button', { name: /approve from another device/i })).toBeNull();
        expect(screen.getByRole('button', { name: /phrase/i })).toBeEnabled();
        expect(screen.queryByText('QrLoginRequester')).toBeNull();
    });

    it('keeps device linking available in ordinary recovery', () => {
        render(<RecoveryFlowModal {...defaultProps} onRecoverWithDevice={vi.fn()} />);

        const deviceButton = screen.getByRole('button', { name: /approve from another device/i });
        expect(deviceButton).toBeEnabled();
        fireEvent.click(deviceButton);
        expect(screen.getByText('QrLoginRequester')).toBeInTheDocument();
    });

    it('shows a friendly error and enables retry and Back after an invalid lost-login phrase', async () => {
        const recover = vi.fn().mockRejectedValue(new Error('Invalid recovery phrase'));
        render(
            <RecoveryFlowModal
                {...defaultProps}
                identityPhase="choose_method"
                availableMethods={[{ type: 'phrase', createdAt: '2026-09-06T00:00:00Z' }]}
                onRecoverWithPhrase={recover}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: /phrase/i }));
        const invalidPhrase = Array(25).fill('invalid').join(' ');
        fireEvent.change(screen.getByRole('textbox'), { target: { value: invalidPhrase } });
        fireEvent.click(screen.getByRole('button', { name: 'Recover Account' }));

        expect(await screen.findByText(/Please check for typos/)).toBeInTheDocument();
        expect(recover).toHaveBeenCalledWith(invalidPhrase);
        expect(screen.getByRole('button', { name: 'Recover Account' })).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Back' })).toBeEnabled();
        fireEvent.click(screen.getByRole('button', { name: 'Back' }));
        expect(screen.getByRole('button', { name: /phrase/i })).toBeEnabled();
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

describe('RecoveryFlowModal sign-in picker', () => {
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
        onStatus: vi.fn().mockResolvedValue({ holdId: 'hold', status: 'pending' }),
        onRecover: vi.fn().mockResolvedValue(undefined),
    };
    const methods = (...types: string[]) =>
        types.map(type => ({ type, createdAt: '2026-09-01', credentialId: `${type}-id` }));

    beforeEach(() => {
        vi.mocked(isEscrowRecoveryStorageAvailable).mockReturnValue(true);
        vi.mocked(loadPendingEscrowRecovery).mockResolvedValue(undefined);
    });

    const buttonNames = () => screen.getAllByRole('button').map(button => button.textContent ?? '');

    it('frames a new device as routine and leads with a passkey when one is set up', () => {
        render(
            <RecoveryFlowModal
                {...base}
                availableMethods={methods('passkey', 'phrase', 'escrow')}
                onRecoverWithDevice={vi.fn()}
                escrowRecovery={escrowRecovery}
            />
        );

        expect(screen.getByRole('heading', { name: 'Sign in on this device' })).toBeTruthy();
        const names = buttonNames();
        const hero = names.findIndex(name => name.includes('Use your passkey'));
        const device = names.findIndex(name => name.includes('Sign In from Another Device'));
        const phrase = names.findIndex(name => name.includes('Recovery Phrase'));
        expect(hero).toBeGreaterThanOrEqual(0);
        expect(device).toBeGreaterThan(hero);
        expect(phrase).toBeGreaterThan(device);
        expect(screen.queryByText('Enter my recovery PIN')).toBeNull();
    });

    it('leads with another device when no passkey is set up', () => {
        render(
            <RecoveryFlowModal
                {...base}
                availableMethods={methods('phrase', 'escrow')}
                onRecoverWithDevice={vi.fn()}
                escrowRecovery={escrowRecovery}
            />
        );

        expect(buttonNames()[0]).toContain('Approve from another device');
    });

    it('hides methods that are not set up until asked', () => {
        render(
            <RecoveryFlowModal
                {...base}
                availableMethods={methods('phrase', 'escrow')}
                onRecoverWithDevice={vi.fn()}
                escrowRecovery={escrowRecovery}
            />
        );

        expect(screen.queryByText('Backup File')).toBeNull();
        const more = screen.getByRole('button', { name: 'More ways to sign in' });
        expect(more.getAttribute('aria-expanded')).toBe('false');

        fireEvent.click(more);

        expect(more.getAttribute('aria-expanded')).toBe('true');
        expect(screen.getByText('Backup File')).toBeTruthy();
    });

    it('moves the PIN and the waiting period behind a clear last-resort screen', async () => {
        render(
            <RecoveryFlowModal
                {...base}
                availableMethods={methods('phrase', 'escrow')}
                onRecoverWithDevice={vi.fn()}
                escrowRecovery={escrowRecovery}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: "I can't use any of these" }));

        expect(screen.getByRole('heading', { name: 'Get back into your account' })).toBeTruthy();
        expect(screen.getByText('Sign you out on your other devices')).toBeTruthy();
        expect(
            screen.getByText('Turn off your other sign-in methods until you set them up again')
        ).toBeTruthy();
        expect(await screen.findByText('Enter my recovery PIN')).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: "I don't have a PIN" }));
        expect(await screen.findByRole('button', { name: 'Start a 7-day recovery' })).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: /Back/ }));
        expect(screen.getByRole('heading', { name: 'Sign in on this device' })).toBeTruthy();
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

        expect(screen.getByRole('button', { name: "I can't use another device" })).toBeTruthy();
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

        expect(screen.getByRole('heading', { name: 'Sign in on this device' })).toBeTruthy();
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

        expect(screen.queryByRole('button', { name: /I can't use/ })).toBeNull();
    });
});

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

        fireEvent.click(screen.getByRole('button', { name: /phrase/i }));

        expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy();

        fireEvent.keyDown(document, { key: 'Escape' });
        expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
        expect(onCancel).not.toHaveBeenCalled();

        fireEvent.keyDown(document, { key: 'Escape' });
        expect(onCancel).toHaveBeenCalledOnce();
    });
});

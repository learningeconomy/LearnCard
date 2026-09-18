import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { RecoveryFlowModal } from './RecoveryFlowModal';
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

vi.mock('@learncard/sss-key-manager', () => ({
    isWebAuthnSupported: () => true,
}));

vi.mock('@ionic/react', () => ({
    IonIcon: ({ className }: { className?: string }) => <span className={className} />,
}));

vi.mock('learn-card-base', () => ({
    getLogger: () => ({ error: vi.fn() }),
    QrLoginRequester: () => <div>QrLoginRequester</div>,
    getSSSConfig: () => ({}),
}));

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
        fireEvent.click(await screen.findByRole('button', { name: 'Check request status' }));
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
        fireEvent.click(await screen.findByRole('button', { name: 'Finish recovery' }));
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
            screen.getByText(
                'Open your account on a signed-in device and choose Cancel recovery request.'
            )
        ).toBeInTheDocument();
        expect(clearPendingEscrowRecovery).not.toHaveBeenCalled();
        expect(screen.getByText('Recovery requested')).toBeInTheDocument();
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
        fireEvent.click(await screen.findByRole('button', { name: 'Finish recovery' }));
        expect(
            await screen.findByText('Something went wrong. Please try again.')
        ).toBeInTheDocument();
        expect(clearPendingEscrowRecovery).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: 'Finish recovery' })).toBeEnabled();
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
        expect(await screen.findByText('Recovery requested')).toBeInTheDocument();
        expect(escrowRecovery.onStart).toHaveBeenCalledTimes(1);
        expect(savePendingEscrowRecovery).toHaveBeenCalledWith(record, 'default');
        expect(
            screen.getByText(
                `You can restore your account after ${new Date(record.releaseAfter).toLocaleString()}.`
            )
        ).toBeInTheDocument();
    });
    it('finishes a persisted request after the release time', async () => {
        const pending = { ...record, releaseAfter: '2020-01-01T00:00:00Z' };
        vi.mocked(loadPendingEscrowRecovery).mockResolvedValue(pending);
        render(<RecoveryFlowModal {...defaultProps} escrowRecovery={escrowRecovery} />);
        fireEvent.click(await screen.findByRole('button', { name: 'Finish recovery' }));
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
            fireEvent.click(await screen.findByRole('button', { name: 'Finish recovery' }));
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
});

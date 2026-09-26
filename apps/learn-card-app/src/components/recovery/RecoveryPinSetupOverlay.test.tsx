import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecoveryPinSetupOverlay } from './RecoveryPinSetupOverlay';
import { createRecoveryPinActions } from '../../providers/recoveryPinActions';
import { createRecoverySetupRunner } from '../../../../../packages/learn-card-base/src/auth-coordinator/recoverySetup';

vi.mock('learn-card-base', () => ({
    Overlay: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('RecoveryPinSetupOverlay', () => {
    const mockSetEscrowPin = vi.fn();
    const mockOnComplete = vi.fn();
    const mockOnSkip = vi.fn();

    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('explains why a new PIN is needed after a PIN recovery', () => {
        render(
            <RecoveryPinSetupOverlay
                setPin={mockSetEscrowPin}
                onComplete={mockOnComplete}
                onSkip={mockOnSkip}
                reason="after-recovery"
            />
        );

        expect(screen.getByText('Set a new recovery PIN')).toBeInTheDocument();
        expect(screen.getByText(/The PIN you just used has been retired/)).toBeInTheDocument();
        expect(screen.queryByText('Set a recovery PIN')).not.toBeInTheDocument();
    });

    it('uses first-time copy by default', () => {
        render(
            <RecoveryPinSetupOverlay
                setPin={mockSetEscrowPin}
                onComplete={mockOnComplete}
                onSkip={mockOnSkip}
            />
        );

        expect(screen.getByText('Set a recovery PIN')).toBeInTheDocument();
        expect(screen.queryByText(/has been retired/)).not.toBeInTheDocument();
    });

    it('rejects trivial PINs', () => {
        render(
            <RecoveryPinSetupOverlay
                setPin={mockSetEscrowPin}
                onComplete={mockOnComplete}
                onSkip={mockOnSkip}
            />
        );

        const inputs = screen.getAllByLabelText(/PIN digit/);

        fireEvent.paste(inputs[0], { clipboardData: { getData: () => '123456' } });
        expect(screen.getByText("Choose a PIN that's harder to guess.")).toBeInTheDocument();

        fireEvent.paste(inputs[0], { clipboardData: { getData: () => '111111' } });
        expect(screen.getByText("Choose a PIN that's harder to guess.")).toBeInTheDocument();
    });

    it('shows mismatch error if confirm PIN is different', () => {
        render(
            <RecoveryPinSetupOverlay
                setPin={mockSetEscrowPin}
                onComplete={mockOnComplete}
                onSkip={mockOnSkip}
            />
        );

        const inputs = screen.getAllByLabelText(/PIN digit/);
        fireEvent.paste(inputs[0], { clipboardData: { getData: () => '135790' } });

        expect(screen.getByText('Confirm your PIN')).toBeInTheDocument();

        const confirmInputs = screen.getAllByLabelText(/PIN digit/);
        fireEvent.paste(confirmInputs[0], { clipboardData: { getData: () => '135791' } });

        expect(screen.getByText("PINs don't match.")).toBeInTheDocument();
    });

    it('calls setEscrowPin on success', async () => {
        mockSetEscrowPin.mockResolvedValueOnce(undefined);
        render(
            <RecoveryPinSetupOverlay
                setPin={mockSetEscrowPin}
                onComplete={mockOnComplete}
                onSkip={mockOnSkip}
            />
        );

        const inputs = screen.getAllByLabelText(/PIN digit/);
        fireEvent.paste(inputs[0], { clipboardData: { getData: () => '135790' } });

        const confirmInputs = screen.getAllByLabelText(/PIN digit/);
        fireEvent.paste(confirmInputs[0], { clipboardData: { getData: () => '135790' } });

        expect(screen.getByText('Saving PIN...')).toBeInTheDocument();

        await waitFor(() => {
            expect(mockSetEscrowPin).toHaveBeenCalledWith('135790');
            expect(screen.getByText('PIN set successfully')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Done'));
        expect(mockOnComplete).toHaveBeenCalled();
    });

    it('calls onSkip when skip is clicked', () => {
        render(
            <RecoveryPinSetupOverlay
                setPin={mockSetEscrowPin}
                onComplete={mockOnComplete}
                onSkip={mockOnSkip}
            />
        );
        fireEvent.click(screen.getByText('Skip for Now'));
        expect(mockOnSkip).toHaveBeenCalled();
    });

    it.each([
        'PIN must contain 6–12 digits.',
        'Choose a PIN without trivial or sequential patterns.',
        'Automatic recovery is not available for this account.',
    ])('displays the safe validation message: %s', async message => {
        mockSetEscrowPin.mockRejectedValueOnce(new Error(message));
        render(
            <RecoveryPinSetupOverlay
                setPin={mockSetEscrowPin}
                onComplete={mockOnComplete}
                onSkip={mockOnSkip}
            />
        );
        fireEvent.paste(screen.getAllByLabelText(/PIN digit/)[0], {
            clipboardData: { getData: () => '135790' },
        });
        fireEvent.paste(screen.getAllByLabelText(/PIN digit/)[0], {
            clipboardData: { getData: () => '135790' },
        });
        expect(await screen.findByText(message)).toBeInTheDocument();
        expect(mockOnComplete).not.toHaveBeenCalled();
    });

    it('does not report success when PIN setup is unavailable', async () => {
        mockSetEscrowPin.mockRejectedValueOnce(new Error('PIN setup is unavailable'));
        render(
            <RecoveryPinSetupOverlay
                setPin={mockSetEscrowPin}
                onComplete={mockOnComplete}
                onSkip={mockOnSkip}
            />
        );
        fireEvent.paste(screen.getAllByLabelText(/PIN digit/)[0], {
            clipboardData: { getData: () => '135790' },
        });
        fireEvent.paste(screen.getAllByLabelText(/PIN digit/)[0], {
            clipboardData: { getData: () => '135790' },
        });
        await waitFor(() => expect(screen.getByText('Confirm your PIN')).toBeInTheDocument());
        expect(screen.queryByText('PIN set successfully')).not.toBeInTheDocument();
        expect(mockSetEscrowPin).toHaveBeenCalledOnce();
    });

    it.each(['first-time', 'after-recovery'] as const)(
        '%s retries activation before showing success without saving the PIN again',
        async reason => {
            const activate = vi
                .fn()
                .mockRejectedValueOnce(new Error('offline'))
                .mockResolvedValue(undefined);
            const identity = {};
            const runner = createRecoverySetupRunner(
                () => ({ identity, needsActivation: true, activate }),
                vi.fn()
            );
            const actions = createRecoveryPinActions({
                runRecoverySetup: runner.run,
                resetRecoverySetup: runner.reset,
                setEscrowPin: mockSetEscrowPin,
                clearEscrowPin: vi.fn(),
            });
            render(
                <RecoveryPinSetupOverlay
                    reason={reason}
                    setPin={actions.setEscrowPin}
                    onComplete={mockOnComplete}
                    onSkip={mockOnSkip}
                />
            );
            const enterPin = () =>
                fireEvent.paste(screen.getAllByLabelText(/PIN digit/)[0], {
                    clipboardData: { getData: () => '135790' },
                });
            enterPin();
            enterPin();
            await waitFor(() => expect(activate).toHaveBeenCalledOnce());
            await screen.findByText('Confirm your PIN');
            expect(screen.queryByText('PIN set successfully')).not.toBeInTheDocument();
            expect(mockOnComplete).not.toHaveBeenCalled();
            enterPin();
            await screen.findByText('PIN set successfully');
            expect(mockSetEscrowPin).toHaveBeenCalledOnce();
            expect(activate).toHaveBeenCalledTimes(2);
            fireEvent.click(screen.getByText('Done'));
            expect(mockOnComplete).toHaveBeenCalledOnce();
        }
    );
});

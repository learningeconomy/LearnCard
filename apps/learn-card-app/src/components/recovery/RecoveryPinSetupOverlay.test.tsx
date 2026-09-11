import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecoveryPinSetupOverlay } from './RecoveryPinSetupOverlay';
import { useAuthCoordinator } from 'learn-card-base';

vi.mock('learn-card-base', () => ({
    useAuthCoordinator: vi.fn(),
    Overlay: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('RecoveryPinSetupOverlay', () => {
    const mockSetEscrowPin = vi.fn();
    const mockOnComplete = vi.fn();
    const mockOnSkip = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAuthCoordinator).mockReturnValue({
            setEscrowPin: mockSetEscrowPin,
        } as unknown as ReturnType<typeof useAuthCoordinator>);
    });

    it('rejects trivial PINs', () => {
        render(<RecoveryPinSetupOverlay onComplete={mockOnComplete} onSkip={mockOnSkip} />);

        const inputs = screen.getAllByLabelText(/PIN digit/);

        fireEvent.paste(inputs[0], { clipboardData: { getData: () => '123456' } });
        expect(screen.getByText("Choose a PIN that's harder to guess.")).toBeInTheDocument();

        fireEvent.paste(inputs[0], { clipboardData: { getData: () => '111111' } });
        expect(screen.getByText("Choose a PIN that's harder to guess.")).toBeInTheDocument();
    });

    it('shows mismatch error if confirm PIN is different', () => {
        render(<RecoveryPinSetupOverlay onComplete={mockOnComplete} onSkip={mockOnSkip} />);

        const inputs = screen.getAllByLabelText(/PIN digit/);
        fireEvent.paste(inputs[0], { clipboardData: { getData: () => '135790' } });

        expect(screen.getByText('Confirm your PIN')).toBeInTheDocument();

        const confirmInputs = screen.getAllByLabelText(/PIN digit/);
        fireEvent.paste(confirmInputs[0], { clipboardData: { getData: () => '135791' } });

        expect(screen.getByText("PINs don't match.")).toBeInTheDocument();
    });

    it('calls setEscrowPin on success', async () => {
        mockSetEscrowPin.mockResolvedValueOnce(undefined);
        render(<RecoveryPinSetupOverlay onComplete={mockOnComplete} onSkip={mockOnSkip} />);

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
        render(<RecoveryPinSetupOverlay onComplete={mockOnComplete} onSkip={mockOnSkip} />);
        fireEvent.click(screen.getByText('Skip for Now'));
        expect(mockOnSkip).toHaveBeenCalled();
    });

    it.each([
        'PIN must contain 6–12 digits.',
        'Choose a PIN without trivial or sequential patterns.',
        'Automatic recovery is not available for this account.',
    ])('displays the safe validation message: %s', async message => {
        mockSetEscrowPin.mockRejectedValueOnce(new Error(message));
        render(<RecoveryPinSetupOverlay onComplete={mockOnComplete} onSkip={mockOnSkip} />);
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
        vi.mocked(useAuthCoordinator).mockReturnValue({} as ReturnType<typeof useAuthCoordinator>);
        render(<RecoveryPinSetupOverlay onComplete={mockOnComplete} onSkip={mockOnSkip} />);
        fireEvent.paste(screen.getAllByLabelText(/PIN digit/)[0], {
            clipboardData: { getData: () => '135790' },
        });
        fireEvent.paste(screen.getAllByLabelText(/PIN digit/)[0], {
            clipboardData: { getData: () => '135790' },
        });
        await waitFor(() => expect(screen.getByText('Confirm your PIN')).toBeInTheDocument());
        expect(screen.queryByText('PIN set successfully')).not.toBeInTheDocument();
        expect(mockSetEscrowPin).not.toHaveBeenCalled();
    });
});

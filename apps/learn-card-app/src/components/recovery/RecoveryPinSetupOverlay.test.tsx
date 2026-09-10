import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecoveryPinSetupOverlay } from './RecoveryPinSetupOverlay';
import { useBaseAuthCoordinator } from 'learn-card-base';

vi.mock('learn-card-base', () => ({
    useBaseAuthCoordinator: vi.fn(),
    Overlay: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('RecoveryPinSetupOverlay', () => {
    const mockSetEscrowPin = vi.fn();
    const mockOnComplete = vi.fn();
    const mockOnSkip = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useBaseAuthCoordinator).mockReturnValue({
            setEscrowPin: mockSetEscrowPin,
        } as unknown as ReturnType<typeof useBaseAuthCoordinator>);
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
});

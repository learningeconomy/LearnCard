import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EscrowRecoveryPanel } from './EscrowRecoveryPanel';

vi.mock('./escrowRecoveryStorage', () => ({
    isEscrowRecoveryStorageAvailable: () => true,
    loadPendingEscrowRecovery: vi.fn().mockResolvedValue(undefined),
    savePendingEscrowRecovery: vi.fn().mockResolvedValue(undefined),
    clearPendingEscrowRecovery: vi.fn().mockResolvedValue(undefined),
}));

describe('EscrowRecoveryPanel', () => {
    const mockOnStart = vi.fn();
    const mockOnStatus = vi.fn();
    const mockOnRecover = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows PIN flow first', async () => {
        render(
            <EscrowRecoveryPanel
                available={true}
                onStart={mockOnStart}
                onStatus={mockOnStatus}
                onRecover={mockOnRecover}
            />
        );

        expect(screen.getByText('Do you have a recovery PIN?')).toBeInTheDocument();
        expect(screen.getByText("I don't have a PIN")).toBeInTheDocument();
    });

    it('handles PIN mismatch error', async () => {
        const error = new Error('Incorrect PIN') as Error & { attemptsRemaining: number };
        error.name = 'EscrowPinMismatchError';
        error.attemptsRemaining = 8;
        mockOnRecover.mockRejectedValueOnce(error);

        render(
            <EscrowRecoveryPanel
                available={true}
                onStart={mockOnStart}
                onStatus={mockOnStatus}
                onRecover={mockOnRecover}
            />
        );

        const inputs = screen.getAllByLabelText(/PIN digit/);
        fireEvent.paste(inputs[0], { clipboardData: { getData: () => '135790' } });

        await waitFor(() => {
            expect(mockOnRecover).toHaveBeenCalledWith({ method: 'escrow-pin', pin: '135790' });
            expect(screen.getByText('Incorrect PIN. 8 attempts left.')).toBeInTheDocument();
        });
    });

    it('handles PIN locked error and falls back to hold flow', async () => {
        const error = new Error('Locked');
        error.name = 'EscrowPinLockedError';
        mockOnRecover.mockRejectedValueOnce(error);

        render(
            <EscrowRecoveryPanel
                available={true}
                onStart={mockOnStart}
                onStatus={mockOnStatus}
                onRecover={mockOnRecover}
            />
        );

        const inputs = screen.getAllByLabelText(/PIN digit/);
        fireEvent.paste(inputs[0], { clipboardData: { getData: () => '135790' } });

        await waitFor(() => {
            expect(
                screen.getByText('Too many attempts. You can still recover by waiting 7 days.')
            ).toBeInTheDocument();
            expect(screen.getByText('Start a 7-day recovery')).toBeInTheDocument();
        });
    });

    it('switches to hold flow when clicking I dont have a PIN', async () => {
        render(
            <EscrowRecoveryPanel
                available={true}
                onStart={mockOnStart}
                onStatus={mockOnStatus}
                onRecover={mockOnRecover}
            />
        );

        fireEvent.click(screen.getByText("I don't have a PIN"));

        expect(screen.getByText('Start a 7-day recovery')).toBeInTheDocument();
    });
});

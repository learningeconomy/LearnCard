import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EscrowHoldRestartThrottledError } from '@learncard/sss-key-manager';
import { EscrowRecoveryPanel, formatTimeRemaining } from './EscrowRecoveryPanel';

vi.mock('./escrowRecoveryStorage', () => ({
    isEscrowRecoveryStorageAvailable: () => true,
    loadPendingEscrowRecovery: vi.fn().mockResolvedValue(undefined),
    savePendingEscrowRecovery: vi.fn().mockResolvedValue(undefined),
    clearPendingEscrowRecovery: vi.fn().mockResolvedValue(undefined),
}));

describe('EscrowRecoveryPanel', () => {
    it('defaults to delayed recovery when PIN availability is unknown', async () => {
        render(
            <EscrowRecoveryPanel
                available
                onStart={vi.fn()}
                onStatus={vi.fn()}
                onRecover={vi.fn()}
            />
        );
        expect(screen.queryByLabelText('PIN digit 1')).not.toBeInTheDocument();
        expect(await screen.findByText('Start a 7-day recovery')).toBeInTheDocument();
    });

    it.each(['EscrowPinUnavailableError', 'EscrowRequestError'])(
        'falls back safely for %s',
        async name => {
            const error = Object.assign(new Error('private server details'), { name, status: 403 });
            render(
                <EscrowRecoveryPanel
                    available
                    pinAvailable
                    onStart={vi.fn()}
                    onStatus={vi.fn()}
                    onRecover={vi.fn().mockRejectedValue(error)}
                />
            );
            fireEvent.paste(screen.getAllByLabelText(/PIN digit/)[0], {
                clipboardData: { getData: () => '135790' },
            });
            expect(
                await screen.findByText(
                    "PIN sign-in isn't available for this account. Start a 7-day recovery instead."
                )
            ).toBeInTheDocument();
            expect(screen.queryByLabelText('PIN digit 1')).not.toBeInTheDocument();
            expect(screen.queryByText('private server details')).not.toBeInTheDocument();
        }
    );
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
                pinAvailable
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
                pinAvailable
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

    it('keeps the PIN step visible after a temporary throttle without auto-retrying', async () => {
        const error = new Error('Throttled');
        error.name = 'EscrowPinThrottledError';
        mockOnRecover.mockRejectedValueOnce(error);
        render(
            <EscrowRecoveryPanel
                available
                pinAvailable
                onStart={mockOnStart}
                onStatus={mockOnStatus}
                onRecover={mockOnRecover}
            />
        );
        fireEvent.paste(screen.getAllByLabelText(/PIN digit/)[0], {
            clipboardData: { getData: () => '135790' },
        });
        expect(
            await screen.findByText('Too many tries right now. Wait a minute and try again.')
        ).toBeInTheDocument();
        expect(screen.getByText('Do you have a recovery PIN?')).toBeInTheDocument();
        expect(screen.getAllByLabelText(/PIN digit/)).toHaveLength(6);
        expect(mockOnRecover).toHaveBeenCalledTimes(1);
        expect(mockOnStart).not.toHaveBeenCalled();
    });

    it('handles PIN locked error and falls back to hold flow', async () => {
        const error = new Error('Locked');
        error.name = 'EscrowPinLockedError';
        mockOnRecover.mockRejectedValueOnce(error);

        render(
            <EscrowRecoveryPanel
                available={true}
                pinAvailable
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

    it('shows existing request card when onStart returns null resumeToken', async () => {
        const requestedAt = new Date().toISOString();
        const releaseAfter = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        mockOnStart.mockResolvedValueOnce({
            holdId: 'hold-123',
            resumeToken: null,
            requestedAt,
            releaseAfter,
        });

        render(
            <EscrowRecoveryPanel
                available
                onStart={mockOnStart}
                onStatus={mockOnStatus}
                onRecover={mockOnRecover}
            />
        );

        await waitFor(() => expect(screen.getByText('Start a 7-day recovery')).not.toBeDisabled());
        fireEvent.click(screen.getByText('Start a 7-day recovery'));
        expect(mockOnStart).toHaveBeenCalled();

        await waitFor(() => {
            expect(screen.getByText('A recovery request is already waiting')).toBeInTheDocument();
        });

        expect(screen.getByText(/Started .* · ready .*/)).toBeInTheDocument();
        expect(screen.getByText('Lost that browser?')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument(); // No error banner
    });

    it('calls onStart with restart: true when clicking Start over', async () => {
        const requestedAt = new Date().toISOString();
        const releaseAfter = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        mockOnStart.mockResolvedValueOnce({
            holdId: 'hold-123',
            resumeToken: null,
            requestedAt,
            releaseAfter,
        });

        render(
            <EscrowRecoveryPanel
                available
                onStart={mockOnStart}
                onStatus={mockOnStatus}
                onRecover={mockOnRecover}
            />
        );

        await waitFor(() => expect(screen.getByText('Start a 7-day recovery')).not.toBeDisabled());
        fireEvent.click(screen.getByText('Start a 7-day recovery'));

        await waitFor(() => {
            expect(screen.getByText('Start over')).toBeInTheDocument();
        });

        mockOnStart.mockResolvedValueOnce({
            holdId: 'hold-456',
            resumeToken: 'token-456',
            clientEphemeralPrivateKey: 'key-456',
            requestedAt,
            releaseAfter,
        });

        fireEvent.click(screen.getByText('Start over'));

        await waitFor(() => {
            expect(mockOnStart).toHaveBeenCalledWith({ restart: true });
            expect(screen.getByText('Recovery in progress')).toBeInTheDocument();
        });
    });

    it('shows amber callout on throttled error', async () => {
        const requestedAt = new Date().toISOString();
        const releaseAfter = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        mockOnStart.mockResolvedValueOnce({
            holdId: 'hold-123',
            resumeToken: null,
            requestedAt,
            releaseAfter,
        });

        render(
            <EscrowRecoveryPanel
                available
                onStart={mockOnStart}
                onStatus={mockOnStatus}
                onRecover={mockOnRecover}
            />
        );

        await waitFor(() => expect(screen.getByText('Start a 7-day recovery')).not.toBeDisabled());
        fireEvent.click(screen.getByText('Start a 7-day recovery'));

        await waitFor(() => {
            expect(screen.getByText('Start over')).toBeInTheDocument();
        });

        const error = new EscrowHoldRestartThrottledError(
            new Date(Date.now() + 60 * 1000).toISOString()
        );
        mockOnStart.mockRejectedValueOnce(error);

        fireEvent.click(screen.getByText('Start over'));

        await waitFor(() => {
            expect(
                screen.getByText(/A request was started recently. You can start over after/)
            ).toBeInTheDocument();
        });
    });

    it('returns to start state when clicking Back', async () => {
        const requestedAt = new Date().toISOString();
        const releaseAfter = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        mockOnStart.mockResolvedValueOnce({
            holdId: 'hold-123',
            resumeToken: null,
            requestedAt,
            releaseAfter,
        });

        render(
            <EscrowRecoveryPanel
                available
                onStart={mockOnStart}
                onStatus={mockOnStatus}
                onRecover={mockOnRecover}
            />
        );

        await waitFor(() => expect(screen.getByText('Start a 7-day recovery')).not.toBeDisabled());
        fireEvent.click(screen.getByText('Start a 7-day recovery'));

        await waitFor(() => {
            expect(screen.getByText('Back')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('Back'));

        await waitFor(() => {
            expect(screen.getByText('Start a 7-day recovery')).toBeInTheDocument();
            expect(
                screen.queryByText('A recovery request is already waiting')
            ).not.toBeInTheDocument();
        });
    });

    it('switches to hold flow when clicking I dont have a PIN', async () => {
        render(
            <EscrowRecoveryPanel
                available={true}
                pinAvailable
                onStart={mockOnStart}
                onStatus={mockOnStatus}
                onRecover={mockOnRecover}
            />
        );

        fireEvent.click(screen.getByText("I don't have a PIN"));

        expect(screen.getByText('Start a 7-day recovery')).toBeInTheDocument();
    });
});

describe('formatTimeRemaining', () => {
    it('formats days and hours', () => {
        expect(formatTimeRemaining(1000 * 60 * 60 * 24 * 6 + 1000 * 60 * 60 * 23)).toBe(
            'Ready in 6 days 23 hr'
        );
        expect(formatTimeRemaining(1000 * 60 * 60 * 24 * 1 + 1000 * 60 * 60 * 2)).toBe(
            'Ready in 1 day 2 hr'
        );
    });

    it('formats hours and minutes', () => {
        expect(formatTimeRemaining(1000 * 60 * 60 * 4 + 1000 * 60 * 12)).toBe(
            'Ready in 4 hr 12 min'
        );
    });

    it('formats minutes', () => {
        expect(formatTimeRemaining(1000 * 60 * 3 + 1000 * 45)).toBe('Ready in 3 min');
    });

    it('formats seconds', () => {
        expect(formatTimeRemaining(1000 * 45)).toBe('Ready in 45 sec');
    });

    it('formats ready', () => {
        expect(formatTimeRemaining(0)).toBe('Ready');
        expect(formatTimeRemaining(-1000)).toBe('Ready');
    });
});

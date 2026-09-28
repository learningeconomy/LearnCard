import React from 'react';
import { fireEvent, render, screen, waitFor, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { EscrowRecoveryHoldBanner } from './EscrowRecoveryHoldBanner';

vi.mock('@ionic/react', () => ({ IonIcon: () => <span /> }));

vi.mock('../../paraglide/messages.js', () => ({
    'recovery.escrowHold.title': () => 'Was this you?',
    'recovery.escrowHold.body': (opts: { timeAgo?: string; timeRemaining?: string }) =>
        `Someone started recovering your account ${opts.timeAgo}.`,
    'recovery.escrowHold.finishesIn': (opts: { timeAgo?: string; timeRemaining?: string }) =>
        `It finishes in ${opts.timeRemaining} unless you stop it.`,
    'recovery.escrowHold.stop': () => 'Stop recovery',
    'recovery.escrowHold.stopping': () => 'Stopping…',
    'recovery.escrowHold.success': () => 'Recovery stopped. Your account is safe.',
    'recovery.escrowHold.dismiss': () => 'It was me',
    'recovery.error.default': () => 'Something went wrong. Please try again.',
}));

describe('EscrowRecoveryHoldBanner', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders headline, relative time, and releaseAfter countdown', () => {
        const now = new Date();
        const requestedAt = new Date(now.getTime() - 2 * 60000).toISOString(); // 2 minutes ago
        const releaseAfter = new Date(now.getTime() + 6 * 86400000).toISOString(); // 6 days from now

        render(
            <EscrowRecoveryHoldBanner
                requestedAt={requestedAt}
                releaseAfter={releaseAfter}
                onCancel={vi.fn()}
            />
        );

        expect(screen.getByText('Was this you?')).toBeInTheDocument();
        expect(
            screen.getByText(/Someone started recovering your account 2 minutes ago/)
        ).toBeInTheDocument();
        expect(screen.getByText(/It finishes in 6 days unless you stop it/)).toBeInTheDocument();
    });

    it('stop flow: loading text, success state, then removal', async () => {
        const onCancel = vi.fn().mockResolvedValue(undefined);
        const requestedAt = new Date().toISOString();

        render(<EscrowRecoveryHoldBanner requestedAt={requestedAt} onCancel={onCancel} />);

        const stopButton = screen.getByRole('button', { name: 'Stop recovery' });
        fireEvent.click(stopButton);

        expect(screen.getByText('Stopping…')).toBeInTheDocument();

        // Wait for the promise to resolve
        await act(async () => {
            await Promise.resolve();
        });

        expect(screen.getByText('Recovery stopped. Your account is safe.')).toBeInTheDocument();
        expect(onCancel).toHaveBeenCalledTimes(1);

        // Fast forward 2.5s
        act(() => {
            vi.advanceTimersByTime(2500);
        });

        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('shows friendly failure copy and keeps button', async () => {
        const onCancel = vi.fn().mockRejectedValue(new Error('private server error'));
        const requestedAt = new Date().toISOString();

        render(<EscrowRecoveryHoldBanner requestedAt={requestedAt} onCancel={onCancel} />);

        fireEvent.click(screen.getByRole('button', { name: 'Stop recovery' }));

        await act(async () => {
            await Promise.resolve();
        });

        expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Stop recovery' })).toBeEnabled();
        expect(screen.queryByText('private server error')).not.toBeInTheDocument();
    });

    it('"It was me" dismisses without calling onCancel', async () => {
        const onCancel = vi.fn();
        const requestedAt = new Date().toISOString();

        render(<EscrowRecoveryHoldBanner requestedAt={requestedAt} onCancel={onCancel} />);

        fireEvent.click(screen.getByRole('button', { name: 'It was me' }));

        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        expect(onCancel).not.toHaveBeenCalled();
    });
});

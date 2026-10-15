import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EscrowHoldRestartThrottledError } from '@learncard/sss-key-manager';
import { EscrowRecoveryPanel, formatTimeRemaining } from './EscrowRecoveryPanel';
import {
    clearPendingEscrowRecovery,
    loadPendingEscrowRecovery,
    savePendingEscrowRecovery,
} from './escrowRecoveryStorage';

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
                view="start"
                available
                onStart={vi.fn()}
                onStatus={vi.fn()}
                onRecover={vi.fn()}
                onConfirmCode={vi.fn()}
                onResendCode={vi.fn()}
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
                    view="start"
                    available
                    pinAvailable
                    onStart={vi.fn()}
                    onStatus={vi.fn()}
                    onRecover={vi.fn().mockRejectedValue(error)}
                    onConfirmCode={vi.fn()}
                    onResendCode={vi.fn()}
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
    // Fixture initiating-client bindings for an authority-mode (Nitro) hold;
    // shared so every test that needs a non-legacy `requiresConfirmation`
    // record uses the same shape as production's `EscrowRecoveryExpectations`.
    const expectations = {
        tenant: 'learncard',
        did: 'did:key:z6Mkexample',
        holdId: 'hold-confirm-1',
        clientEphemeralPublicKey: 'ephemeral-pub',
        blobHash: 'blob-hash',
        authorityGeneration: 'generation-1',
        holdDigest: 'hold-digest',
        ledgerPublicKey: 'ledger-pub',
        keyId: 'key-1',
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows PIN flow first', async () => {
        render(
            <EscrowRecoveryPanel
                view="start"
                available={true}
                pinAvailable
                onStart={mockOnStart}
                onStatus={mockOnStatus}
                onRecover={mockOnRecover}
                onConfirmCode={vi.fn()}
                onResendCode={vi.fn()}
            />
        );

        expect(screen.getByText('Enter my recovery PIN')).toBeInTheDocument();
        expect(screen.getByText("I don't have a PIN")).toBeInTheDocument();
    });

    it('handles PIN mismatch error', async () => {
        const error = new Error('Incorrect PIN') as Error & { attemptsRemaining: number };
        error.name = 'EscrowPinMismatchError';
        error.attemptsRemaining = 8;
        mockOnRecover.mockRejectedValueOnce(error);

        render(
            <EscrowRecoveryPanel
                view="start"
                available={true}
                pinAvailable
                onStart={mockOnStart}
                onStatus={mockOnStatus}
                onRecover={mockOnRecover}
                onConfirmCode={vi.fn()}
                onResendCode={vi.fn()}
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
                view="start"
                available
                pinAvailable
                onStart={mockOnStart}
                onStatus={mockOnStatus}
                onRecover={mockOnRecover}
                onConfirmCode={vi.fn()}
                onResendCode={vi.fn()}
            />
        );
        fireEvent.paste(screen.getAllByLabelText(/PIN digit/)[0], {
            clipboardData: { getData: () => '135790' },
        });
        expect(
            await screen.findByText('Too many attempts. Please try again later.')
        ).toBeInTheDocument();
        expect(screen.getByText('Enter my recovery PIN')).toBeInTheDocument();
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
                view="start"
                available={true}
                pinAvailable
                onStart={mockOnStart}
                onStatus={mockOnStatus}
                onRecover={mockOnRecover}
                onConfirmCode={vi.fn()}
                onResendCode={vi.fn()}
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
        expect(screen.queryByText('Use my recovery PIN instead')).not.toBeInTheDocument();
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
                view="start"
                available
                onStart={mockOnStart}
                onStatus={mockOnStatus}
                onRecover={mockOnRecover}
                onConfirmCode={vi.fn()}
                onResendCode={vi.fn()}
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
                view="start"
                available
                onStart={mockOnStart}
                onStatus={mockOnStatus}
                onRecover={mockOnRecover}
                onConfirmCode={vi.fn()}
                onResendCode={vi.fn()}
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
                view="start"
                available
                onStart={mockOnStart}
                onStatus={mockOnStatus}
                onRecover={mockOnRecover}
                onConfirmCode={vi.fn()}
                onResendCode={vi.fn()}
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
                view="start"
                available
                onStart={mockOnStart}
                onStatus={mockOnStatus}
                onRecover={mockOnRecover}
                onConfirmCode={vi.fn()}
                onResendCode={vi.fn()}
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
                view="start"
                available={true}
                pinAvailable
                onStart={mockOnStart}
                onStatus={mockOnStatus}
                onRecover={mockOnRecover}
                onConfirmCode={vi.fn()}
                onResendCode={vi.fn()}
            />
        );

        fireEvent.click(screen.getByText("I don't have a PIN"));

        expect(screen.getByText('Start a 7-day recovery')).toBeInTheDocument();
    });

    // [B] releaseAfter can move after the start-time estimate (e.g. an
    // overdue release-warning send advances it, or confirmation corrects
    // it) — the panel must adopt the server's current value on "Check
    // status" rather than keep showing a countdown to the stale one.
    it('[B] refreshes releaseAfter from the server when clicking Check status', async () => {
        const staleReleaseAfter = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        const freshReleaseAfter = new Date(Date.now() - 1000).toISOString();
        vi.mocked(loadPendingEscrowRecovery).mockResolvedValueOnce({
            holdId: 'hold-1',
            resumeToken: 'resume-token',
            clientEphemeralPrivateKey: 'private-key',
            releaseAfter: staleReleaseAfter,
            requestedAt: new Date(Date.now() - 1000).toISOString(),
        });
        mockOnStatus.mockResolvedValue({
            holdId: 'hold-1',
            status: 'pending' as const,
            releasePolicy: 'hold' as const,
            requestedAt: new Date(Date.now() - 1000).toISOString(),
            releaseAfter: freshReleaseAfter,
        });

        render(
            <EscrowRecoveryPanel
                view="status"
                available={false}
                onStart={mockOnStart}
                onStatus={mockOnStatus}
                onRecover={mockOnRecover}
                onConfirmCode={vi.fn()}
                onResendCode={vi.fn()}
            />
        );

        expect(await screen.findByText('Check status')).toBeInTheDocument();
        expect(screen.queryByText('Ready to restore')).not.toBeInTheDocument();

        fireEvent.click(screen.getByText('Check status'));

        expect(await screen.findByText('Ready to restore')).toBeInTheDocument();
        expect(savePendingEscrowRecovery).toHaveBeenCalledWith(
            expect.objectContaining({ releaseAfter: freshReleaseAfter }),
            'default'
        );
    });

    // [P2] Confirmation recomputes the deadline server-side, but the load
    // effect only re-runs on `holdId` (which never changes here) — a delayed
    // confirmation must refresh on its own rather than wait for a manual
    // "Check status" click or a remount.
    it('[P2] refreshes the countdown immediately after a delayed confirmation, without remounting', async () => {
        const holdId = 'hold-confirm-1';
        const resumeToken = 'resume-token-1';
        const requestedAt = new Date(Date.now() - 1000).toISOString();
        const creationEstimate = new Date(Date.now() + 1000 * 60 * 60).toISOString();
        const confirmedReleaseAfter = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString();

        vi.mocked(loadPendingEscrowRecovery).mockResolvedValueOnce({
            holdId,
            resumeToken,
            clientEphemeralPrivateKey: 'private-key',
            releaseAfter: creationEstimate,
            requestedAt,
            requiresConfirmation: true,
            expectations,
        });
        mockOnStatus
            .mockResolvedValueOnce({
                holdId,
                status: 'pending' as const,
                releasePolicy: 'hold' as const,
                requestedAt,
                releaseAfter: creationEstimate,
                requiresConfirmation: true,
                confirmed: false,
            })
            .mockResolvedValueOnce({
                holdId,
                status: 'pending' as const,
                releasePolicy: 'hold' as const,
                requestedAt,
                releaseAfter: confirmedReleaseAfter,
                confirmed: true,
            });
        const onConfirmCode = vi.fn().mockResolvedValue({ success: true });

        render(
            <EscrowRecoveryPanel
                view="status"
                available={false}
                onStart={mockOnStart}
                onStatus={mockOnStatus}
                onRecover={mockOnRecover}
                onConfirmCode={onConfirmCode}
                onResendCode={vi.fn()}
            />
        );

        expect(await screen.findByText('Check your email')).toBeInTheDocument();

        fireEvent.paste(screen.getAllByLabelText(/PIN digit/)[0], {
            clipboardData: { getData: () => '12345678' },
        });

        await waitFor(() => {
            expect(onConfirmCode).toHaveBeenCalledWith({
                holdId,
                resumeToken,
                code: '12345678',
                expectations,
            });
        });

        await waitFor(() => {
            expect(screen.queryByText('Check your email')).not.toBeInTheDocument();
            expect(
                screen.getByText(
                    new Intl.DateTimeFormat(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                    }).format(new Date(confirmedReleaseAfter))
                )
            ).toBeInTheDocument();
        });
        expect(mockOnStatus).toHaveBeenCalledTimes(2);
    });

    // [P2] checkStatus previously reported "ok to continue" from hold status
    // alone (pending/cancelled/expired/completed), ignoring whether the
    // *refreshed* releaseAfter had moved into the future — an already-open
    // Restore click would call onRecover one tick too early.
    it('[P2] does not call onRecover when the refreshed deadline moves into the future', async () => {
        const holdId = 'hold-restore-1';
        const resumeToken = 'resume-token-restore-1';
        const requestedAt = new Date(Date.now() - 1000 * 60 * 60).toISOString();
        const pastReleaseAfter = new Date(Date.now() - 1000).toISOString();
        const futureReleaseAfter = new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString();

        vi.mocked(loadPendingEscrowRecovery).mockResolvedValueOnce({
            holdId,
            resumeToken,
            clientEphemeralPrivateKey: 'private-key',
            releaseAfter: pastReleaseAfter,
            requestedAt,
        });
        mockOnStatus.mockResolvedValue({
            holdId,
            status: 'pending' as const,
            releasePolicy: 'hold' as const,
            requestedAt,
            releaseAfter: futureReleaseAfter,
        });

        render(
            <EscrowRecoveryPanel
                view="status"
                available={false}
                onStart={mockOnStart}
                onStatus={mockOnStatus}
                onRecover={mockOnRecover}
                onConfirmCode={vi.fn()}
                onResendCode={vi.fn()}
            />
        );

        expect(await screen.findByText('Restore my account')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Restore my account'));

        await waitFor(() => {
            expect(screen.getByText('Recovery in progress')).toBeInTheDocument();
        });
        expect(screen.queryByText('Restore my account')).not.toBeInTheDocument();
        expect(mockOnRecover).not.toHaveBeenCalled();
    });

    it('[P2] calls onRecover once when the refreshed deadline has already passed', async () => {
        const holdId = 'hold-restore-2';
        const resumeToken = 'resume-token-restore-2';
        const requestedAt = new Date(Date.now() - 1000 * 60 * 60).toISOString();
        const pastReleaseAfter = new Date(Date.now() - 1000).toISOString();
        const refreshedPastReleaseAfter = new Date(Date.now() - 500).toISOString();

        vi.mocked(loadPendingEscrowRecovery).mockResolvedValueOnce({
            holdId,
            resumeToken,
            clientEphemeralPrivateKey: 'private-key',
            releaseAfter: pastReleaseAfter,
            requestedAt,
        });
        mockOnStatus.mockResolvedValue({
            holdId,
            status: 'pending' as const,
            releasePolicy: 'hold' as const,
            requestedAt,
            releaseAfter: refreshedPastReleaseAfter,
        });
        mockOnRecover.mockResolvedValue(undefined);

        render(
            <EscrowRecoveryPanel
                view="status"
                available={false}
                onStart={mockOnStart}
                onStatus={mockOnStatus}
                onRecover={mockOnRecover}
                onConfirmCode={vi.fn()}
                onResendCode={vi.fn()}
            />
        );

        expect(await screen.findByText('Restore my account')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Restore my account'));

        await waitFor(() => {
            expect(mockOnRecover).toHaveBeenCalledTimes(1);
        });
        expect(mockOnRecover).toHaveBeenCalledWith({
            method: 'escrow',
            holdId,
            resumeToken,
            clientEphemeralPrivateKey: 'private-key',
        });
    });

    it('[P2] keeps the previous deadline and does not crash when the post-confirm status is malformed', async () => {
        const holdId = 'hold-confirm-2';
        const resumeToken = 'resume-token-2';
        const requestedAt = new Date(Date.now() - 1000).toISOString();
        const creationEstimate = new Date(Date.now() + 1000 * 60 * 60).toISOString();

        vi.mocked(loadPendingEscrowRecovery).mockResolvedValueOnce({
            holdId,
            resumeToken,
            clientEphemeralPrivateKey: 'private-key',
            releaseAfter: creationEstimate,
            requestedAt,
            requiresConfirmation: true,
            expectations,
        });
        mockOnStatus
            .mockResolvedValueOnce({
                holdId,
                status: 'pending' as const,
                releasePolicy: 'hold' as const,
                requestedAt,
                releaseAfter: creationEstimate,
                requiresConfirmation: true,
                confirmed: false,
            })
            .mockResolvedValueOnce({
                holdId,
                status: 'pending' as const,
                releasePolicy: 'hold' as const,
                requestedAt,
                releaseAfter: 'not-a-real-date',
                confirmed: true,
            });
        const onConfirmCode = vi.fn().mockResolvedValue({ success: true });

        render(
            <EscrowRecoveryPanel
                view="status"
                available={false}
                onStart={mockOnStart}
                onStatus={mockOnStatus}
                onRecover={mockOnRecover}
                onConfirmCode={onConfirmCode}
                onResendCode={vi.fn()}
            />
        );

        expect(await screen.findByText('Check your email')).toBeInTheDocument();

        fireEvent.paste(screen.getAllByLabelText(/PIN digit/)[0], {
            clipboardData: { getData: () => '12345678' },
        });

        await waitFor(() => {
            expect(onConfirmCode).toHaveBeenCalled();
        });
        await waitFor(() => {
            expect(screen.queryByText('Check your email')).not.toBeInTheDocument();
        });

        expect(
            screen.getByText(
                new Intl.DateTimeFormat(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                }).format(new Date(creationEstimate))
            )
        ).toBeInTheDocument();
    });

    // Nitro escrow recovery binds every status/confirm/restore call to the
    // bindings captured when the hold started; none of those calls' own
    // responses ever carry `expectations`, so the panel must keep passing the
    // *original* value through rather than ever treating a response's absence
    // of the field as "clear it".
    it('[expectations] retains the hold-start expectations across status, confirm, and restore calls', async () => {
        const holdId = 'hold-expect-1';
        const resumeToken = 'resume-expect-1';
        const requestedAt = new Date(Date.now() - 1000).toISOString();
        const pastReleaseAfter = new Date(Date.now() - 1000).toISOString();

        vi.mocked(loadPendingEscrowRecovery).mockResolvedValueOnce({
            holdId,
            resumeToken,
            clientEphemeralPrivateKey: 'private-key',
            releaseAfter: pastReleaseAfter,
            requestedAt,
            requiresConfirmation: true,
            expectations,
        });
        // Mount-time status check (requiresConfirmation effect): not yet confirmed.
        mockOnStatus.mockResolvedValueOnce({
            holdId,
            status: 'pending' as const,
            releasePolicy: 'hold' as const,
            requestedAt,
            releaseAfter: pastReleaseAfter,
            requiresConfirmation: true,
            confirmed: false,
        });
        const onConfirmCode = vi.fn().mockResolvedValue({ success: true });

        render(
            <EscrowRecoveryPanel
                view="status"
                available={false}
                onStart={mockOnStart}
                onStatus={mockOnStatus}
                onRecover={mockOnRecover}
                onConfirmCode={onConfirmCode}
                onResendCode={vi.fn()}
            />
        );

        expect(await screen.findByText('Check your email')).toBeInTheDocument();
        expect(mockOnStatus).toHaveBeenCalledWith(
            expect.objectContaining({ holdId, resumeToken, expectations })
        );

        // Authoritative status refresh triggered by confirmation.
        mockOnStatus.mockResolvedValueOnce({
            holdId,
            status: 'pending' as const,
            releasePolicy: 'hold' as const,
            requestedAt,
            releaseAfter: pastReleaseAfter,
            confirmed: true,
        });

        fireEvent.paste(screen.getAllByLabelText(/PIN digit/)[0], {
            clipboardData: { getData: () => '12345678' },
        });

        await waitFor(() => {
            expect(onConfirmCode).toHaveBeenCalledWith(
                expect.objectContaining({ holdId, resumeToken, code: '12345678', expectations })
            );
        });
        await waitFor(() => {
            expect(screen.getByText('Restore my account')).toBeInTheDocument();
        });

        mockOnStatus.mockResolvedValueOnce({
            holdId,
            status: 'pending' as const,
            releasePolicy: 'hold' as const,
            requestedAt,
            releaseAfter: pastReleaseAfter,
            confirmed: true,
        });
        mockOnRecover.mockResolvedValueOnce(undefined);

        fireEvent.click(screen.getByText('Restore my account'));

        await waitFor(() => {
            expect(mockOnRecover).toHaveBeenCalledWith(
                expect.objectContaining({ method: 'escrow', holdId, resumeToken, expectations })
            );
        });
        expect(mockOnStatus).toHaveBeenLastCalledWith(
            expect.objectContaining({ holdId, resumeToken, expectations })
        );
    });

    // Only authority (Nitro) mode ever reports `requiresConfirmation`, and that
    // mode always returns `expectations` alongside a fresh hold (see
    // EscrowRecoveryStart) -- a stored record with the former but not the
    // latter predates this requirement and can never satisfy a Nitro
    // status/confirm call, so it must be dropped rather than resumed.
    it('[expectations] clears a legacy Nitro hold missing expectations and shows the start view', async () => {
        const holdId = 'hold-legacy-1';
        vi.mocked(loadPendingEscrowRecovery).mockResolvedValueOnce({
            holdId,
            resumeToken: 'resume-legacy-1',
            clientEphemeralPrivateKey: 'private-key',
            releaseAfter: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
            requestedAt: new Date().toISOString(),
            requiresConfirmation: true,
        });

        render(
            <EscrowRecoveryPanel
                view="start"
                available
                onStart={mockOnStart}
                onStatus={mockOnStatus}
                onRecover={mockOnRecover}
                onConfirmCode={vi.fn()}
                onResendCode={vi.fn()}
            />
        );

        expect(
            await screen.findByText('This recovery request is no longer valid. Start a new one.')
        ).toBeInTheDocument();
        expect(screen.queryByText('Check your email')).not.toBeInTheDocument();
        await waitFor(() => expect(screen.getByText('Start a 7-day recovery')).not.toBeDisabled());
        expect(clearPendingEscrowRecovery).toHaveBeenCalledWith(holdId, 'default');
        expect(mockOnStatus).not.toHaveBeenCalled();
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

/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
expect.extend(matchers);
import CancelRecoveryPage from './CancelRecoveryPage';

const VALID_SEARCH =
    '?holdId=00000000-0000-4000-8000-000000000000&token=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const mockLocation = vi.hoisted(() => ({ search: '' }));
const mockPush = vi.fn();
vi.mock('react-router-dom', () => ({
    useLocation: () => mockLocation,
    useHistory: () => ({
        push: mockPush,
    }),
}));

vi.mock('learn-card-base', () => ({
    networkStore: {
        get: {
            tenantId: () => 'learncard',
        },
    },
    getSSSConfig: () => ({
        serverUrl: 'http://localhost:5100/api',
    }),
}));

vi.mock('../../paraglide/messages.js', () => ({
    'recovery.cancel.invalidLink.title': () => "This link isn't valid",
    'recovery.cancel.invalidLink.body': () =>
        'Open the most recent email we sent, or sign in to check on your account.',
    'recovery.cancel.invalidLink.signIn': () => 'Sign In',
    'recovery.cancel.confirm.title': () => 'Cancel account recovery?',
    'recovery.cancel.confirm.body': () =>
        "Someone asked to recover your account. If this wasn't you, cancel it now.",
    'recovery.cancel.confirm.cancelBtn': () => 'Cancel Recovery',
    'recovery.cancel.confirm.notNowBtn': () => 'Not now',
    'recovery.cancel.confirm.cancelling': () => 'Cancelling...',
    'recovery.cancel.success.title': () => 'Recovery cancelled. Your account is safe.',
    'recovery.cancel.success.body': () =>
        'We recommend signing in and reviewing your recovery options.',
    'recovery.cancel.success.doneBtn': () => 'Open LearnCard',
    'recovery.cancel.expired.title': () => 'Link expired',
    'recovery.cancel.expired.body': () =>
        'This link has expired or was already used. If you still see a recovery in progress, sign in to cancel it.',
    'recovery.cancel.expired.signInBtn': () => 'Sign In',
    'recovery.cancel.error.network': () =>
        'Connection issue. Please check your internet and try again.',
    'recovery.cancel.error.tooMany': () => 'Too many attempts. Please wait a minute and try again.',
    'recovery.cancel.error.generic': () => 'Something went wrong. Please try again.',
    'recovery.cancel.error.tryAgainBtn': () => 'Try Again',
}));

describe('CancelRecoveryPage', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchMock = vi.fn();
        global.fetch = fetchMock;
        mockPush.mockClear();
        mockLocation.search = VALID_SEARCH;
    });

    it.each([
        ['missing params', ''],
        ['malformed hold id', '?holdId=not-a-uuid&token=' + 'a'.repeat(64)],
        ['short token', '?holdId=00000000-0000-4000-8000-000000000000&token=abc'],
    ])('shows the invalid-link state without calling the API (%s)', (_label, search) => {
        mockLocation.search = search;
        render(<CancelRecoveryPage />);

        expect(screen.getByText("This link isn't valid")).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Cancel Recovery' })).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
        expect(mockPush).toHaveBeenCalledWith('/login');
        expect(fetchMock).not.toHaveBeenCalled();
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    it('renders confirmation and does not call fetch on mount', () => {
        render(<CancelRecoveryPage />);

        expect(screen.getByText('Cancel account recovery?')).toBeInTheDocument();
        expect(
            screen.getByText(
                "Someone asked to recover your account. If this wasn't you, cancel it now."
            )
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Cancel Recovery' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Not now' })).toBeInTheDocument();

        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('calls API on click and shows success state', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ cancelled: true }),
        });

        render(<CancelRecoveryPage />);

        const cancelButton = screen.getByRole('button', { name: 'Cancel Recovery' });
        fireEvent.click(cancelButton);

        expect(screen.getByText('Cancelling...')).toBeInTheDocument();

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith(
                'http://localhost:5100/api/keys/escrow/cancel-link',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Tenant-Id': 'learncard',
                    },
                    body: JSON.stringify({
                        holdId: '00000000-0000-4000-8000-000000000000',
                        token: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
                    }),
                }
            );
        });

        expect(
            await screen.findByText('Recovery cancelled. Your account is safe.')
        ).toBeInTheDocument();
        expect(
            screen.getByText('We recommend signing in and reviewing your recovery options.')
        ).toBeInTheDocument();

        const doneButton = screen.getByRole('button', { name: 'Open LearnCard' });
        fireEvent.click(doneButton);
        expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('shows neutral state when already cancelled or expired', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ cancelled: false }),
        });

        render(<CancelRecoveryPage />);

        fireEvent.click(screen.getByRole('button', { name: 'Cancel Recovery' }));

        expect(await screen.findByText('Link expired')).toBeInTheDocument();
        expect(
            screen.getByText(
                'This link has expired or was already used. If you still see a recovery in progress, sign in to cancel it.'
            )
        ).toBeInTheDocument();

        const signInButton = screen.getByRole('button', { name: 'Sign In' });
        fireEvent.click(signInButton);
        expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('shows error state on 429 and allows retry', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: false,
            status: 429,
        });

        render(<CancelRecoveryPage />);

        fireEvent.click(screen.getByRole('button', { name: 'Cancel Recovery' }));

        expect(
            await screen.findByText('Too many attempts. Please wait a minute and try again.')
        ).toBeInTheDocument();

        const tryAgainButton = screen.getByRole('button', { name: 'Try Again' });
        expect(tryAgainButton).not.toBeDisabled();
    });

    it('shows error state on 500 and allows retry', async () => {
        fetchMock.mockResolvedValueOnce({
            ok: false,
            status: 500,
        });

        render(<CancelRecoveryPage />);

        fireEvent.click(screen.getByRole('button', { name: 'Cancel Recovery' }));

        expect(
            await screen.findByText('Something went wrong. Please try again.')
        ).toBeInTheDocument();

        const tryAgainButton = screen.getByRole('button', { name: 'Try Again' });
        expect(tryAgainButton).not.toBeDisabled();
    });

    it('shows network error state on TypeError and allows retry', async () => {
        fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

        render(<CancelRecoveryPage />);

        fireEvent.click(screen.getByRole('button', { name: 'Cancel Recovery' }));

        expect(
            await screen.findByText('Connection issue. Please check your internet and try again.')
        ).toBeInTheDocument();

        const tryAgainButton = screen.getByRole('button', { name: 'Try Again' });
        expect(tryAgainButton).not.toBeDisabled();
    });
});

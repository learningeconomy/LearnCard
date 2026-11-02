import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ShareWriteRejectedError } from '@learncard/sss-key-manager';
import { SecureAccountFlow, SecureAccountSessionError } from './SecureAccountFlow';

vi.mock('learn-card-base', () => ({
    Overlay: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const pastePin = (pin: string) =>
    fireEvent.paste(screen.getAllByLabelText(/PIN digit/)[0], {
        clipboardData: { getData: () => pin },
    });

const renderFlow = (props: Partial<React.ComponentProps<typeof SecureAccountFlow>> = {}) => {
    const handlers = {
        onSecure: vi.fn().mockResolvedValue({ escrowEnrolled: true, pinKept: true }),
        onSetUpRecovery: vi.fn(),
        onClose: vi.fn(),
    };
    render(<SecureAccountFlow hasPin passkeyAvailable {...handlers} {...props} />);
    return { ...handlers, ...props };
};

describe('SecureAccountFlow', () => {
    it('explains plainly what securing does before changing anything', () => {
        const { onSecure } = renderFlow();

        expect(screen.getByRole('heading', { name: 'Secure your account' })).toBeInTheDocument();
        expect(
            screen.getByText('Stop your other devices and other logins from signing in again')
        ).toBeInTheDocument();
        // Honest about the limit: the revoke cannot evict a device that holds the key.
        expect(
            screen.getByText(/A device that is open right now may keep working/)
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                'Turn off your old recovery phrase, backup file, passkey and email recovery key'
            )
        ).toBeInTheDocument();
        expect(screen.getByText('Keep you signed in on this device')).toBeInTheDocument();
        expect(onSecure).not.toHaveBeenCalled();
    });

    it('keeps the PIN after it is entered and confirmed, then leads to a passkey', async () => {
        const { onSecure, onSetUpRecovery } = renderFlow();

        fireEvent.click(screen.getByRole('button', { name: 'Secure my account' }));
        expect(screen.getByRole('heading', { name: 'Keep a recovery PIN' })).toBeInTheDocument();
        pastePin('135790');
        expect(screen.getByRole('heading', { name: 'Confirm your PIN' })).toBeInTheDocument();
        pastePin('135790');

        expect(
            await screen.findByRole('heading', { name: 'Your account is secured' })
        ).toBeInTheDocument();
        expect(onSecure).toHaveBeenCalledWith('135790');
        expect(screen.getByText('Your recovery PIN is on.')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Set up a passkey' }));
        expect(onSetUpRecovery).toHaveBeenCalledWith('passkey');
    });

    it('offers a way out on the PIN and confirm steps that does not secure', () => {
        const { onSecure, onClose } = renderFlow();

        fireEvent.click(screen.getByRole('button', { name: 'Secure my account' }));
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(onClose).toHaveBeenCalledTimes(1);

        pastePin('135790');
        expect(screen.getByRole('heading', { name: 'Confirm your PIN' })).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(onClose).toHaveBeenCalledTimes(2);
        expect(onSecure).not.toHaveBeenCalled();
    });

    it('rejects a mismatched confirmation without securing', () => {
        const { onSecure } = renderFlow();

        fireEvent.click(screen.getByRole('button', { name: 'Secure my account' }));
        pastePin('135790');
        pastePin('246801');

        expect(screen.getByText("PINs don't match.")).toBeInTheDocument();
        expect(onSecure).not.toHaveBeenCalled();
    });

    it('can continue without a PIN', async () => {
        const onSecure = vi.fn().mockResolvedValue({ escrowEnrolled: true, pinKept: false });
        renderFlow({ onSecure });

        fireEvent.click(screen.getByRole('button', { name: 'Secure my account' }));
        fireEvent.click(screen.getByRole('button', { name: 'Continue without a PIN' }));

        expect(
            await screen.findByRole('heading', { name: 'Your account is secured' })
        ).toBeInTheDocument();
        expect(onSecure).toHaveBeenCalledWith(null);
        expect(screen.getByText(/Your recovery PIN is off/)).toBeInTheDocument();
    });

    it('skips the PIN step for accounts without a PIN', async () => {
        const { onSecure } = renderFlow({ hasPin: false, passkeyAvailable: false });

        fireEvent.click(screen.getByRole('button', { name: 'Secure my account' }));

        await screen.findByRole('heading', { name: 'Your account is secured' });
        expect(onSecure).toHaveBeenCalledWith(null);
        expect(screen.queryByText(/Your recovery PIN is/)).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Add a recovery method' })).toBeInTheDocument();
    });

    it('offers a retry after a conflict and asks for the PIN again', async () => {
        const onSecure = vi
            .fn()
            .mockRejectedValueOnce(
                new ShareWriteRejectedError(
                    'Key material changed; please retry (current version 4).'
                )
            )
            .mockResolvedValueOnce({ escrowEnrolled: true, pinKept: true });
        renderFlow({ onSecure });

        fireEvent.click(screen.getByRole('button', { name: 'Secure my account' }));
        pastePin('135790');
        pastePin('135790');

        expect(
            await screen.findByText(
                'Your account changed while we were securing it. Please try again.'
            )
        ).toBeInTheDocument();
        expect(screen.queryByText(/current version/)).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));
        // The PIN is not kept for the retry.
        expect(
            screen.getAllByLabelText(/PIN digit/).map(input => (input as HTMLInputElement).value)
        ).toEqual(['', '', '', '', '', '']);
    });

    it('asks to sign in again when the session cannot be restored', async () => {
        renderFlow({
            hasPin: false,
            onSecure: vi.fn().mockRejectedValue(new SecureAccountSessionError()),
        });

        fireEvent.click(screen.getByRole('button', { name: 'Secure my account' }));

        await waitFor(() =>
            expect(
                screen.getByText('Your session expired. Sign in again to secure your account.')
            ).toBeInTheDocument()
        );
    });

    it('never shows raw errors', async () => {
        renderFlow({
            hasPin: false,
            onSecure: vi.fn().mockRejectedValue(new Error('private server details')),
        });

        fireEvent.click(screen.getByRole('button', { name: 'Secure my account' }));

        expect(
            await screen.findByText("We couldn't finish securing your account. Please try again.")
        ).toBeInTheDocument();
        expect(screen.queryByText('private server details')).not.toBeInTheDocument();
    });
});

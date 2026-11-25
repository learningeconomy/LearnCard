import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EscrowPinSignIn, describePinSignInError } from './EscrowPinSignIn';

const named = (name: string, extra: Record<string, unknown> = {}) =>
    Object.assign(new Error('private server details'), { name, ...extra });

const pastePin = (pin = '135790') =>
    fireEvent.paste(screen.getAllByLabelText(/PIN digit/)[0], {
        clipboardData: { getData: () => pin },
    });

describe('EscrowPinSignIn', () => {
    it('submits the PIN once all digits are in', async () => {
        const onRecover = vi.fn().mockResolvedValue(undefined);
        render(<EscrowPinSignIn onRecover={onRecover} onBlocked={vi.fn()} />);

        pastePin();

        await waitFor(() => expect(onRecover).toHaveBeenCalledWith('135790'));
        expect(onRecover).toHaveBeenCalledOnce();
    });

    it('shows attempts left after a wrong PIN and clears the entry', async () => {
        const onRecover = vi
            .fn()
            .mockRejectedValue(named('EscrowPinMismatchError', { attemptsRemaining: 8 }));
        render(<EscrowPinSignIn onRecover={onRecover} onBlocked={vi.fn()} />);

        pastePin();

        expect(await screen.findByText('Incorrect PIN. 8 attempts left.')).toBeInTheDocument();
        expect(
            screen.getAllByLabelText(/PIN digit/).map(input => (input as HTMLInputElement).value)
        ).toEqual(['', '', '', '', '', '']);
    });

    it('uses the singular for the last attempt', () => {
        expect(
            describePinSignInError(named('EscrowPinMismatchError', { attemptsRemaining: 1 }))
                .message
        ).toBe('Incorrect PIN. 1 attempt left.');
    });

    it('keeps the PIN step after a temporary throttle without retrying', async () => {
        const onRecover = vi.fn().mockRejectedValue(named('EscrowPinThrottledError'));
        const onBlocked = vi.fn();
        render(<EscrowPinSignIn onRecover={onRecover} onBlocked={onBlocked} />);

        pastePin();

        expect(
            await screen.findByText('Too many attempts. Please try again later.')
        ).toBeInTheDocument();
        expect(screen.getAllByLabelText(/PIN digit/)).toHaveLength(6);
        expect(onRecover).toHaveBeenCalledOnce();
        expect(onBlocked).not.toHaveBeenCalled();
    });

    it('reports a locked PIN as blocked', async () => {
        const onBlocked = vi.fn();
        render(
            <EscrowPinSignIn
                onRecover={vi.fn().mockRejectedValue(named('EscrowPinLockedError'))}
                onBlocked={onBlocked}
            />
        );

        pastePin();

        await waitFor(() =>
            expect(onBlocked).toHaveBeenCalledWith(
                'Too many attempts. You can still recover by waiting 7 days.'
            )
        );
    });

    it.each([named('EscrowPinUnavailableError'), named('EscrowRequestError', { status: 403 })])(
        'reports an unavailable PIN as blocked without server details (%s)',
        async error => {
            const onBlocked = vi.fn();
            render(
                <EscrowPinSignIn
                    onRecover={vi.fn().mockRejectedValue(error)}
                    onBlocked={onBlocked}
                />
            );

            pastePin();

            await waitFor(() =>
                expect(onBlocked).toHaveBeenCalledWith(
                    "PIN sign-in isn't available for this account. Use another way to sign in."
                )
            );
            expect(screen.queryByText('private server details')).not.toBeInTheDocument();
        }
    );

    it('shows a generic retry message for anything else', async () => {
        render(
            <EscrowPinSignIn
                onRecover={vi.fn().mockRejectedValue(new Error('private server details'))}
                onBlocked={vi.fn()}
            />
        );

        pastePin();

        expect(
            await screen.findByText('Something went wrong. Please try again.')
        ).toBeInTheDocument();
        expect(screen.queryByText('private server details')).not.toBeInTheDocument();
    });

    it('reports busy while an attempt runs', async () => {
        let resolve!: () => void;
        const onBusyChange = vi.fn();
        render(
            <EscrowPinSignIn
                onRecover={() => new Promise<void>(r => (resolve = r))}
                onBlocked={vi.fn()}
                onBusyChange={onBusyChange}
            />
        );

        pastePin();

        expect(await screen.findByText('Checking your PIN...')).toBeInTheDocument();
        expect(onBusyChange).toHaveBeenLastCalledWith(true);
        resolve();
        await waitFor(() => expect(onBusyChange).toHaveBeenLastCalledWith(false));
    });
});

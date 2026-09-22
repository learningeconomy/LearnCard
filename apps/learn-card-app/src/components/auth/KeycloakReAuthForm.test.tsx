import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    send: vi.fn(),
    ticket: vi.fn(),
    signIn: vi.fn(),
    cancel: vi.fn(),
}));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false } }));
vi.mock('@ionic/react', () => ({ IonIcon: () => null }));
vi.mock('learn-card-base', () => ({
    authUserStore: {
        use: { currentUser: () => ({ id: 'same-user', email: 'person@example.com' }) },
    },
    currentUserStore: { use: { currentUser: () => null } },
    useSignInAdapter: () => ({ providerType: 'keycloak', signInWithCustomToken: mocks.signIn }),
}));
vi.mock('learn-card-base/react-query/mutations/firebase', () => ({
    useSendLoginVerificationCode: () => ({ mutateAsync: mocks.send }),
}));
vi.mock('../../auth/keycloakTickets', () => ({ requestEmailOtpTicket: mocks.ticket }));
import { KeycloakReAuthForm } from './KeycloakReAuthForm';
import { readKeycloakReauth } from '../../auth/keycloakReauth';

describe('Keycloak identity proof', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sessionStorage.clear();
        mocks.send.mockResolvedValue({ success: true });
        mocks.ticket.mockResolvedValue('ticket');
        mocks.signIn.mockResolvedValue({ id: 'same-user' });
        window.history.replaceState({}, '', '/wallet');
    });
    const enterCode = async (): Promise<void> => {
        render(<KeycloakReAuthForm action="account-recovery" onCancel={mocks.cancel} />);
        fireEvent.click(screen.getByRole('button', { name: 'Send Code' }));
        fireEvent.change(await screen.findByLabelText('Verification code'), {
            target: { value: '123456' },
        });
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: 'Verify Identity' }));
        });
    };
    it('persists the exact action before starting a forced ticket hop', async () => {
        mocks.signIn.mockImplementation(async () => {
            expect(readKeycloakReauth()).toMatchObject({
                userId: 'same-user',
                action: 'account-recovery',
                returnTo: '/wallet',
            });
            return { id: 'same-user' };
        });
        await enterCode();
        await waitFor(() =>
            expect(mocks.signIn).toHaveBeenCalledWith('ticket', { intent: 'reauthenticate' })
        );
        expect(mocks.ticket).toHaveBeenCalledWith('person@example.com', '123456');
    });
    it('keeps the user in-page with friendly feedback for a used code', async () => {
        mocks.ticket.mockRejectedValue(new Error('raw internal error'));
        await enterCode();
        expect((await screen.findByRole('alert')).textContent).toContain(
            'That code could not be verified'
        );
        expect(mocks.signIn).not.toHaveBeenCalled();
        expect(readKeycloakReauth()).toBeNull();
        expect(window.location.pathname).toBe('/wallet');
    });
    it('clears pending intent when navigation cannot start', async () => {
        mocks.signIn.mockRejectedValue(new Error('discovery unavailable'));
        await enterCode();
        await screen.findByRole('alert');
        expect(readKeycloakReauth()).toBeNull();
    });
    it('does not navigate when dismissed while the ticket request is pending', async () => {
        let finish: ((ticket: string) => void) | undefined;
        mocks.ticket.mockImplementation(
            () =>
                new Promise<string>(resolve => {
                    finish = resolve;
                })
        );
        const { unmount } = render(
            <KeycloakReAuthForm action="account-recovery" onCancel={mocks.cancel} />
        );
        fireEvent.click(screen.getByRole('button', { name: 'Send Code' }));
        fireEvent.change(await screen.findByLabelText('Verification code'), {
            target: { value: '123456' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Verify Identity' }));
        unmount();
        await act(async () => {
            finish?.('ticket');
        });
        expect(mocks.signIn).not.toHaveBeenCalled();
        expect(readKeycloakReauth()).toBeNull();
    });
});

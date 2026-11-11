import { beforeEach, describe, expect, it, vi } from 'vitest';

const requestTicket = vi.hoisted(() => vi.fn());
vi.mock('./keycloakTickets', () => ({ requestEmailOtpTicket: requestTicket }));
import { exchangeEmailCode } from './exchangeEmailCode';

describe('email code exchange', () => {
    const input = { email: 'dev-email@example.com', code: '123456' };
    beforeEach(() => vi.clearAllMocks());

    it('uses the ticket route for Keycloak, never consuming the code through Firebase', async () => {
        requestTicket.mockResolvedValue('ticket');
        const firebase = vi.fn();
        await expect(exchangeEmailCode('keycloak', input, firebase)).resolves.toEqual({
            success: true,
            token: 'ticket',
        });
        expect(requestTicket).toHaveBeenCalledWith(input.email, input.code);
        expect(firebase).not.toHaveBeenCalled();
    });

    it('preserves the Firebase custom-token exchange', async () => {
        const firebase = vi.fn().mockResolvedValue({ success: true, token: 'firebase-token' });
        await expect(exchangeEmailCode('firebase', input, firebase)).resolves.toEqual({
            success: true,
            token: 'firebase-token',
        });
        expect(firebase).toHaveBeenCalledWith(input);
        expect(requestTicket).not.toHaveBeenCalled();
    });

    it('does not fall back to Firebase if the ticket fails', async () => {
        requestTicket.mockRejectedValue(new Error('Sign-in expired. Please try again.'));
        const firebase = vi.fn();
        await expect(exchangeEmailCode('keycloak', input, firebase)).rejects.toThrow(
            'Sign-in expired'
        );
        expect(firebase).not.toHaveBeenCalled();
    });
});

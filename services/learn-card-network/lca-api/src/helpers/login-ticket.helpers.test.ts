import { afterEach, describe, expect, it, vi } from 'vitest';
import cache from '@cache';
import { issueLoginTicket } from '@cache/login-tickets';
import { storeAccessToken, storeAuthorizationCode } from './login-ticket.helpers';

vi.mock('@environment', () => ({ environment: {} }));

afterEach(() => vi.restoreAllMocks());

describe('authentication artifact persistence', () => {
    const writers = [
        {
            name: 'login ticket',
            write: () =>
                issueLoginTicket({ subject: 'subject', identityKey: 'email:test@example.com' }),
        },
        {
            name: 'authorization code',
            write: () =>
                storeAuthorizationCode({
                    subject: 'subject',
                    code: 'code',
                    scope: 'openid',
                    clientId: 'broker',
                    redirectUri: 'https://broker.test/callback',
                    createdAt: Date.now(),
                }),
        },
        {
            name: 'access token',
            write: () =>
                storeAccessToken('access-token', { subject: 'subject', createdAt: Date.now() }),
        },
    ];

    it.each(writers)('rejects a swallowed $name write failure', async ({ name, write }) => {
        vi.spyOn(cache, 'set').mockResolvedValueOnce(undefined);
        await expect(write()).rejects.toThrow(`Failed to persist ${name}`);
    });

    it.each(writers)('propagates a rejected $name write', async ({ write }) => {
        vi.spyOn(cache, 'set').mockRejectedValueOnce(new Error('Redis unavailable'));
        await expect(write()).rejects.toThrow('Redis unavailable');
    });
});

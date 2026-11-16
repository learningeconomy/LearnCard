import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ verifyIdToken: vi.fn() }));

vi.mock('@environment', () => ({ environment: { IS_E2E_TEST: false, IS_OFFLINE: false } }));
vi.mock('firebase-admin', () => ({
    default: { auth: () => ({ verifyIdToken: mocks.verifyIdToken }) },
}));

import { verifyAuthToken } from './auth.helpers';

describe('Firebase token revocation checks', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        mocks.verifyIdToken.mockResolvedValue({ uid: 'uid-1', email: 'a@example.com' });
    });

    it('does not check revocation by default', async () => {
        await verifyAuthToken('token', 'firebase');
        expect(mocks.verifyIdToken).toHaveBeenCalledWith('token', false);
    });

    it('checks revocation and disabled users when requested', async () => {
        await expect(
            verifyAuthToken('token', 'firebase', { checkRevoked: true })
        ).resolves.toMatchObject({
            id: 'uid-1',
        });
        expect(mocks.verifyIdToken).toHaveBeenCalledWith('token', true);
    });

    it.each(['auth/id-token-revoked', 'auth/user-disabled'])(
        'rejects %s as unauthorized',
        async code => {
            mocks.verifyIdToken.mockRejectedValueOnce(
                Object.assign(new Error('rejected'), { code })
            );
            await expect(
                verifyAuthToken('token', 'firebase', { checkRevoked: true })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        }
    );
});

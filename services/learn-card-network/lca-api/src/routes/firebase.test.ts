import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    environment: { IS_OFFLINE: true, IS_E2E_TEST: false },
    verifyIdToken: vi.fn(),
    getDidAuthVp: vi.fn(),
    consumeMatchingCode: vi.fn(),
    checkRateLimit: vi.fn(),
    clearRateLimit: vi.fn(),
    decrementRateLimit: vi.fn(),
    getUserByEmail: vi.fn(),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    createCustomToken: vi.fn(),
}));

vi.mock('@environment', () => ({ environment: mocks.environment }));
vi.mock('@firebase', () => ({
    default: {
        auth: () => ({
            getUserByEmail: mocks.getUserByEmail,
            createUser: mocks.createUser,
            updateUser: mocks.updateUser,
            createCustomToken: mocks.createCustomToken,
        }),
    },
}));
vi.mock('firebase-admin', () => ({
    default: { auth: () => ({ verifyIdToken: mocks.verifyIdToken }) },
}));
vi.mock('@routes', async () => {
    const { initTRPC } = await import('@trpc/server');
    const t = initTRPC.create();
    return { t, openRoute: t.procedure, authorizedDidRoute: t.procedure };
});
vi.mock('@helpers/learnCard.helpers', () => ({
    getDidWebLearnCard: async () => ({ invoke: { getDidAuthVp: mocks.getDidAuthVp } }),
    getEmptyLearnCard: vi.fn(),
}));
vi.mock('@cache', () => ({ default: {} }));
vi.mock('@cache/getDel', () => ({ consumeMatchingCode: mocks.consumeMatchingCode }));
vi.mock('@helpers/rateLimit.helpers', () => ({
    checkRateLimit: mocks.checkRateLimit,
    clearRateLimit: mocks.clearRateLimit,
    decrementRateLimit: mocks.decrementRateLimit,
}));
vi.mock('../services/delivery', () => ({ getDeliveryService: vi.fn(), getFrom: vi.fn() }));
vi.mock('../helpers/locale.helpers', () => ({ resolveLocaleByEmail: vi.fn() }));
vi.mock('@helpers/dids.helpers', () => ({ isAuthorizedDID: vi.fn() }));

import { firebaseRouter } from './firebase';

const tokenFor = (claims: Record<string, string | boolean>): string =>
    `e30.${Buffer.from(JSON.stringify({ sub: 'local-user', ...claims })).toString('base64url')}.test`;
const caller = firebaseRouter.createCaller({} as never);

describe('getProofOfLoginVp', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.clearAllMocks();
        mocks.environment.IS_OFFLINE = true;
        mocks.environment.IS_E2E_TEST = false;
        mocks.getDidAuthVp.mockResolvedValue('signed-proof');
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('includes the login email without Firebase Admin credentials in local dev', async () => {
        await expect(
            caller.getProofOfLoginVp({
                token: tokenFor({ email: 'billy@example.com', email_verified: true }),
            })
        ).resolves.toEqual({ success: true, vp: 'signed-proof' });
        expect(mocks.getDidAuthVp).toHaveBeenCalledWith({
            proofFormat: 'jwt',
            challenge: 'proof-of-login:email:billy@example.com',
        });
        expect(mocks.verifyIdToken).not.toHaveBeenCalled();
    });

    it('supports the e2e token path and Firebase phone_number claim', async () => {
        mocks.environment.IS_OFFLINE = false;
        mocks.environment.IS_E2E_TEST = true;
        await caller.getProofOfLoginVp({ token: tokenFor({ phone_number: '+15555550123' }) });
        expect(mocks.getDidAuthVp).toHaveBeenCalledWith({
            proofFormat: 'jwt',
            challenge: 'proof-of-login:phone:+15555550123',
        });
    });

    it('does not sign a proof when the token has no contact method', async () => {
        expect(await caller.getProofOfLoginVp({ token: tokenFor({}) })).toMatchObject({
            success: false,
        });
        expect(mocks.getDidAuthVp).not.toHaveBeenCalled();
    });

    it('requires Firebase verification outside local and e2e environments', async () => {
        mocks.environment.IS_OFFLINE = false;
        mocks.verifyIdToken.mockRejectedValueOnce(new Error('Invalid signature'));
        expect(
            await caller.getProofOfLoginVp({ token: tokenFor({ email: 'forged@example.com' }) })
        ).toMatchObject({ success: false });
        expect(mocks.verifyIdToken).toHaveBeenCalledOnce();
        expect(mocks.getDidAuthVp).not.toHaveBeenCalled();
    });

    it('uses verified claims in production', async () => {
        mocks.environment.IS_OFFLINE = false;
        mocks.verifyIdToken.mockResolvedValueOnce({
            uid: 'real-user',
            email: 'verified@example.com',
            email_verified: true,
        });
        await caller.getProofOfLoginVp({ token: 'firebase-token' });
        expect(mocks.getDidAuthVp).toHaveBeenCalledWith({
            proofFormat: 'jwt',
            challenge: 'proof-of-login:email:verified@example.com',
        });
    });

    it.each([false, undefined])(
        'refuses a signed email claim when email_verified is %s',
        async emailVerified => {
            mocks.environment.IS_OFFLINE = false;
            mocks.verifyIdToken.mockResolvedValueOnce({
                uid: 'real-user',
                email: 'unverified@example.com',
                email_verified: emailVerified,
            });

            expect(await caller.getProofOfLoginVp({ token: 'firebase-token' })).toMatchObject({
                success: false,
            });
            expect(mocks.getDidAuthVp).not.toHaveBeenCalled();
        }
    );

    it('uses the verified phone rather than an unverified email', async () => {
        mocks.environment.IS_OFFLINE = false;
        mocks.verifyIdToken.mockResolvedValueOnce({
            uid: 'real-user',
            email: 'unverified@example.com',
            email_verified: false,
            phone_number: '+15555550123',
        });

        await expect(caller.getProofOfLoginVp({ token: 'firebase-token' })).resolves.toEqual({
            success: true,
            vp: 'signed-proof',
        });
        expect(mocks.getDidAuthVp).toHaveBeenCalledWith({
            proofFormat: 'jwt',
            challenge: 'proof-of-login:phone:+15555550123',
        });
    });

    it('also requires a verified email claim for the explicit offline test path', async () => {
        expect(
            await caller.getProofOfLoginVp({ token: tokenFor({ email: 'unverified@example.com' }) })
        ).toMatchObject({ success: false });
        expect(mocks.getDidAuthVp).not.toHaveBeenCalled();
    });

    it('accepts a fresh address-bound OTP proof from a verified Firebase custom sign-in token', async () => {
        mocks.environment.IS_OFFLINE = false;
        mocks.verifyIdToken.mockResolvedValueOnce({
            uid: 'real-user',
            iss: 'https://securetoken.google.com/learncard',
            aud: 'learncard',
            email: 'Existing@Example.com',
            email_verified: false,
            firebase: { sign_in_provider: 'custom' },
            lc_otp_verified_email: 'existing@example.com',
            lc_otp_verified_at: Math.floor(Date.now() / 1000),
        });

        await expect(caller.getProofOfLoginVp({ token: 'firebase-token' })).resolves.toEqual({
            success: true,
            vp: 'signed-proof',
        });
        expect(mocks.getDidAuthVp).toHaveBeenCalledWith({
            proofFormat: 'jwt',
            challenge: 'proof-of-login:email:existing@example.com',
        });
    });

    it.each([
        ['different address', { lc_otp_verified_email: 'other@example.com' }],
        ['stale proof', { lc_otp_verified_at: Math.floor(Date.now() / 1000) - 3700 }],
        ['future proof', { lc_otp_verified_at: Math.floor(Date.now() / 1000) + 300 }],
        ['wrong provider', { firebase: { sign_in_provider: 'password' } }],
        ['wrong issuer', { iss: 'https://example.com/learncard' }],
        ['wrong audience', { aud: 'other-project' }],
        ['missing proof', { lc_otp_verified_email: undefined }],
    ])('does not issue a proof for %s', async (_label, overrides) => {
        mocks.environment.IS_OFFLINE = false;
        mocks.verifyIdToken.mockResolvedValueOnce({
            uid: 'real-user',
            iss: 'https://securetoken.google.com/learncard',
            aud: 'learncard',
            email: 'existing@example.com',
            email_verified: false,
            firebase: { sign_in_provider: 'custom' },
            lc_otp_verified_email: 'existing@example.com',
            lc_otp_verified_at: Math.floor(Date.now() / 1000),
            ...overrides,
        });

        await expect(caller.getProofOfLoginVp({ token: 'firebase-token' })).resolves.toMatchObject({
            success: false,
        });
        expect(mocks.getDidAuthVp).not.toHaveBeenCalled();
    });
});

describe('verifyLoginCode', () => {
    const input = { email: 'Example@Example.com', code: '123456' };
    const normalizedEmail = 'example@example.com';
    const callerWithIp = firebaseRouter.createCaller({ clientIp: '127.0.0.1' } as never);

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
        mocks.checkRateLimit.mockResolvedValue(true);
        mocks.consumeMatchingCode.mockResolvedValue(true);
        mocks.clearRateLimit.mockResolvedValue(undefined);
        mocks.decrementRateLimit.mockResolvedValue(undefined);
        mocks.createCustomToken.mockResolvedValue('custom-token');
    });

    it('creates a verified Firebase email only after consuming the matching code', async () => {
        mocks.getUserByEmail.mockRejectedValue({ code: 'auth/user-not-found' });
        mocks.createUser.mockResolvedValue({
            uid: 'new-user',
            email: normalizedEmail,
            emailVerified: true,
        });

        await expect(callerWithIp.verifyLoginCode(input)).resolves.toEqual({
            success: true,
            token: 'custom-token',
        });
        expect(mocks.consumeMatchingCode).toHaveBeenCalledWith(
            'login-code:Example@Example.com',
            input.code
        );
        expect(mocks.getUserByEmail).toHaveBeenCalledWith(normalizedEmail);
        expect(mocks.createUser).toHaveBeenCalledWith({
            email: normalizedEmail,
            emailVerified: true,
        });
        expect(mocks.createCustomToken).toHaveBeenCalledWith('new-user');
        expect(mocks.consumeMatchingCode.mock.invocationCallOrder[0]).toBeLessThan(
            mocks.createUser.mock.invocationCallOrder[0]!
        );
    });

    it('issues a bounded OTP proof for the matching existing unverified user without updating the account', async () => {
        mocks.getUserByEmail.mockResolvedValue({
            uid: 'existing',
            email: normalizedEmail,
            emailVerified: false,
        });
        const before = Math.floor(Date.now() / 1000);
        await expect(callerWithIp.verifyLoginCode(input)).resolves.toMatchObject({ success: true });
        const after = Math.floor(Date.now() / 1000);
        expect(mocks.updateUser).not.toHaveBeenCalled();
        expect(mocks.createCustomToken).toHaveBeenCalledWith('existing', {
            lc_otp_verified_email: normalizedEmail,
            lc_otp_verified_at: expect.any(Number),
        });
        const claims = mocks.createCustomToken.mock.calls[0]![1];
        expect(claims.lc_otp_verified_at).toBeGreaterThanOrEqual(before);
        expect(claims.lc_otp_verified_at).toBeLessThanOrEqual(after);
        expect(mocks.createUser).not.toHaveBeenCalled();
    });

    it('accepts the same email with different casing without rewriting it', async () => {
        const storedEmail = 'Example@Example.com';
        mocks.getUserByEmail.mockResolvedValue({
            uid: 'existing',
            email: storedEmail,
            emailVerified: false,
        });
        await expect(callerWithIp.verifyLoginCode(input)).resolves.toMatchObject({ success: true });
        expect(mocks.updateUser).not.toHaveBeenCalled();
        expect(mocks.createCustomToken).toHaveBeenCalledWith(
            'existing',
            expect.objectContaining({ lc_otp_verified_email: normalizedEmail })
        );
    });

    it('does not update an already verified matching user', async () => {
        mocks.getUserByEmail.mockResolvedValue({
            uid: 'verified',
            email: normalizedEmail,
            emailVerified: true,
        });

        await expect(callerWithIp.verifyLoginCode(input)).resolves.toMatchObject({ success: true });
        expect(mocks.updateUser).not.toHaveBeenCalled();
        expect(mocks.createCustomToken).toHaveBeenCalledWith('verified');
    });

    it('does not look up, create, verify, or issue a token for a wrong, expired, or consumed code', async () => {
        mocks.consumeMatchingCode.mockResolvedValue(false);

        await expect(callerWithIp.verifyLoginCode(input)).resolves.toEqual({
            success: false,
            error: 'Invalid or expired code.',
        });
        expect(mocks.getUserByEmail).not.toHaveBeenCalled();
        expect(mocks.createUser).not.toHaveBeenCalled();
        expect(mocks.updateUser).not.toHaveBeenCalled();
        expect(mocks.createCustomToken).not.toHaveBeenCalled();
    });

    it('does not verify a different user returned by the provider', async () => {
        mocks.getUserByEmail.mockResolvedValue({
            uid: 'wrong',
            email: 'other@example.com',
            emailVerified: false,
        });

        await expect(callerWithIp.verifyLoginCode(input)).resolves.toMatchObject({
            success: false,
        });
        expect(mocks.updateUser).not.toHaveBeenCalled();
        expect(mocks.createCustomToken).not.toHaveBeenCalled();
    });

    it('does not create an account or issue a token on provider lookup failures', async () => {
        mocks.getUserByEmail.mockRejectedValue({ code: 'auth/internal-error' });

        await expect(callerWithIp.verifyLoginCode(input)).resolves.toMatchObject({
            success: false,
        });
        expect(mocks.createUser).not.toHaveBeenCalled();
        expect(mocks.createCustomToken).not.toHaveBeenCalled();
    });

    it('does not issue a token if newly created user is not marked verified', async () => {
        mocks.getUserByEmail.mockRejectedValue({ code: 'auth/user-not-found' });
        mocks.createUser.mockResolvedValue({
            uid: 'new-user',
            email: normalizedEmail,
            emailVerified: false,
        });

        await expect(callerWithIp.verifyLoginCode(input)).resolves.toMatchObject({
            success: false,
        });
        expect(mocks.createCustomToken).not.toHaveBeenCalled();
    });

    it('fails closed if Firebase cannot issue the custom token', async () => {
        mocks.getUserByEmail.mockResolvedValue({
            uid: 'existing',
            email: normalizedEmail,
            emailVerified: false,
        });
        mocks.createCustomToken.mockRejectedValue(new Error('provider unavailable'));

        await expect(callerWithIp.verifyLoginCode(input)).resolves.toMatchObject({
            success: false,
        });
        expect(mocks.updateUser).not.toHaveBeenCalled();
    });
});

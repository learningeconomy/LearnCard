import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    environment: { IS_OFFLINE: true, IS_E2E_TEST: false },
    verifyIdToken: vi.fn(),
    getDidAuthVp: vi.fn(),
}));

vi.mock('@environment', () => ({ environment: mocks.environment }));
vi.mock('@firebase', () => ({ default: undefined }));
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
vi.mock('../services/delivery', () => ({ getDeliveryService: vi.fn(), getFrom: vi.fn() }));
vi.mock('../helpers/locale.helpers', () => ({ resolveLocaleByEmail: vi.fn() }));
vi.mock('@helpers/dids.helpers', () => ({ isAuthorizedDID: vi.fn() }));

import { firebaseRouter } from './firebase';

const tokenFor = (claims: Record<string, string>): string =>
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
            caller.getProofOfLoginVp({ token: tokenFor({ email: 'billy@example.com' }) })
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
        });
        await caller.getProofOfLoginVp({ token: 'firebase-token' });
        expect(mocks.getDidAuthVp).toHaveBeenCalledWith({
            proofFormat: 'jwt',
            challenge: 'proof-of-login:email:verified@example.com',
        });
    });
});

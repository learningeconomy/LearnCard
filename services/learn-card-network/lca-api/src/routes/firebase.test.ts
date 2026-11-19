import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    environment: { IS_OFFLINE: true, IS_E2E_TEST: false },
    verifyIdToken: vi.fn(),
    getDidAuthVp: vi.fn(),
    resolveOrCreate: vi.fn(),
    cache: { get: vi.fn(), set: vi.fn(), delete: vi.fn() },
    verifyPresentation: vi.fn(),
    isAuthorizedDID: vi.fn(),
    adminAuth: {
        getUser: vi.fn(),
        getUserByEmail: vi.fn(),
        createUser: vi.fn(),
        updateUser: vi.fn(),
        deleteUser: vi.fn(),
        createCustomToken: vi.fn(async (uid: string) => `token-${uid}`),
    },
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
    getEmptyLearnCard: async () => ({
        invoke: { verifyPresentation: mocks.verifyPresentation },
    }),
}));
vi.mock('@cache', () => ({ default: mocks.cache }));
vi.mock('@helpers/rateLimit.helpers', () => ({
    checkRateLimit: vi.fn(async () => true),
    clearRateLimit: vi.fn(),
    decrementRateLimit: vi.fn(),
}));
vi.mock('@helpers/classlinkPrimaryEmail.helpers', () => ({
    resolveOrCreateFirebaseUserByEmail: mocks.resolveOrCreate,
}));
vi.mock('@helpers/firebaseAdminAuth.helpers', () => ({ getAdminAuth: () => mocks.adminAuth }));
vi.mock('jwt-decode', () => ({
    default: () => ({
        vp: { holder: 'did:web:network.example' },
        nonce: 'handoff:contact_method_session:email:Student@Example.EDU',
    }),
}));
vi.mock('../services/delivery', () => ({ getDeliveryService: vi.fn(), getFrom: vi.fn() }));
vi.mock('../helpers/locale.helpers', () => ({ resolveLocaleByEmail: vi.fn() }));
vi.mock('@helpers/dids.helpers', () => ({ isAuthorizedDID: mocks.isAuthorizedDID }));

import { firebaseRouter } from './firebase';
import { createFirebaseTokenForKeycloakUser } from '@helpers/firebase.helpers';

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

describe('email sign-in resolution (LC-2409)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.cache.get.mockResolvedValue('123456');
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('verifyLoginCode resolves the lowercased email through the alias-aware helper', async () => {
        mocks.resolveOrCreate.mockResolvedValue({ status: 'alias', uid: 'classlink-t' });
        await expect(
            caller.verifyLoginCode({ email: 'Student@Example.EDU', code: '123456' })
        ).resolves.toEqual({ success: true, token: 'token-classlink-t' });
        expect(mocks.resolveOrCreate).toHaveBeenCalledWith(mocks.adminAuth, 'student@example.edu', {
            allowCreate: true,
        });
    });

    it.each(['moved', 'blocked'] as const)(
        'a %s account gets the generic error and no token',
        async status => {
            mocks.resolveOrCreate.mockResolvedValue({ status });
            await expect(
                caller.verifyLoginCode({ email: 'student@example.edu', code: '123456' })
            ).resolves.toEqual({ success: false, error: 'Unable to find or create user.' });
            expect(mocks.adminAuth.createCustomToken).not.toHaveBeenCalled();
            expect(mocks.adminAuth.createUser).not.toHaveBeenCalled();
        }
    );

    it('network hand-off uses the same resolution (alias included)', async () => {
        mocks.verifyPresentation.mockResolvedValue({ warnings: [], errors: [], checks: ['JWS'] });
        mocks.isAuthorizedDID.mockReturnValue(true);
        mocks.resolveOrCreate.mockResolvedValue({ status: 'alias', uid: 'classlink-t' });
        await expect(caller.verifyNetworkHandoffToken({ token: 'jwt' })).resolves.toEqual({
            success: true,
            token: 'token-classlink-t',
        });
        expect(mocks.resolveOrCreate).toHaveBeenCalledWith(mocks.adminAuth, 'student@example.edu', {
            allowCreate: true,
        });
        mocks.resolveOrCreate.mockResolvedValue({ status: 'moved' });
        await expect(caller.verifyNetworkHandoffToken({ token: 'jwt' })).resolves.toMatchObject({
            success: false,
        });
    });
});

describe('Keycloak bridge (LC-2409)', () => {
    const auth = mocks.adminAuth;
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('does not map an unverified Keycloak email onto an existing user', async () => {
        auth.getUser.mockRejectedValue({ code: 'auth/user-not-found' });
        await createFirebaseTokenForKeycloakUser(
            { sub: 'kc-sub', email: 'Taken@Example.com', email_verified: false },
            auth as never
        );
        expect(mocks.resolveOrCreate).not.toHaveBeenCalled();
        expect(auth.createUser).toHaveBeenCalledWith(
            expect.objectContaining({ uid: 'kc-sub', emailVerified: false })
        );
        expect(auth.updateUser).not.toHaveBeenCalled();
        expect(auth.createCustomToken).toHaveBeenCalledWith('kc-sub', expect.anything());
    });

    it('maps a verified email through the alias and never rewrites the aliased user', async () => {
        mocks.resolveOrCreate.mockResolvedValue({ status: 'alias', uid: 'classlink-t' });
        await createFirebaseTokenForKeycloakUser(
            { sub: 'kc-sub', email: 'Student@Example.EDU', email_verified: true },
            auth as never
        );
        expect(mocks.resolveOrCreate).toHaveBeenCalledWith(
            auth,
            'student@example.edu',
            expect.objectContaining({ allowCreate: true })
        );
        expect(auth.updateUser).not.toHaveBeenCalled();
        expect(auth.createCustomToken).toHaveBeenCalledWith('classlink-t', expect.anything());
    });

    it('refuses a moved or orphaned account', async () => {
        mocks.resolveOrCreate.mockResolvedValue({ status: 'blocked' });
        await expect(
            createFirebaseTokenForKeycloakUser(
                { sub: 'kc-sub', email: 'student@example.edu', email_verified: true },
                auth as never
            )
        ).rejects.toThrow('Firebase user creation or lookup failed');
        expect(auth.createCustomToken).not.toHaveBeenCalled();
    });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    currentUser: null as null | { getIdTokenResult: ReturnType<typeof vi.fn> },
    typeOfLogin: null as string | null,
    authStateReady: vi.fn(async () => undefined),
    log: { warn: vi.fn(), error: vi.fn() },
}));

vi.mock('learn-card-base', () => ({
    authStore: { get: { typeOfLogin: () => mocks.typeOfLogin } },
    getLogger: () => mocks.log,
    SocialLoginTypes: { classlink: 'classlink' },
}));
vi.mock('../../firebase/firebase', () => ({
    auth: () => ({
        get currentUser() {
            return mocks.currentUser;
        },
        authStateReady: mocks.authStateReady,
    }),
}));

import {
    applyClassLinkPrivateProfile,
    AUTH_RESTORE_TIMEOUT_MS,
    CLASSLINK_PRIVATE_PROFILE,
    getClassLinkProfileDefaults,
    getClassLinkSession,
    isClassLinkStudentSession,
} from './classlinkProfileDefaults';

const withClaims = (...results: Array<Record<string, unknown> | Error>): void => {
    const fn = vi.fn();
    for (const result of results) {
        if (result instanceof Error) fn.mockRejectedValueOnce(result);
        else fn.mockResolvedValueOnce({ claims: result });
    }
    mocks.currentUser = { getIdTokenResult: fn };
};

describe('getClassLinkProfileDefaults', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.currentUser = null;
        mocks.typeOfLogin = null;
    });

    it('returns private defaults for a ClassLink account', async () => {
        withClaims({ classlink: true });
        await expect(getClassLinkProfileDefaults()).resolves.toEqual(CLASSLINK_PRIVATE_PROFILE);
    });

    it('returns no overrides for other accounts', async () => {
        withClaims({});
        await expect(getClassLinkProfileDefaults()).resolves.toEqual({});
    });

    it('retries once with a forced refresh when the claims cannot be read', async () => {
        withClaims(new Error('network'), { classlink: true });
        await expect(getClassLinkProfileDefaults()).resolves.toEqual(CLASSLINK_PRIVATE_PROFILE);
        expect(mocks.currentUser?.getIdTokenResult).toHaveBeenLastCalledWith(true);
    });

    it('keeps a ClassLink login private and logs when the claims stay unavailable', async () => {
        withClaims(new Error('network'), new Error('network'));
        mocks.typeOfLogin = 'classlink';
        await expect(getClassLinkProfileDefaults()).resolves.toEqual(CLASSLINK_PRIVATE_PROFILE);
        expect(mocks.log.error).toHaveBeenCalled();
    });

    it('keeps a ClassLink login private when there is no Firebase user', async () => {
        mocks.typeOfLogin = 'classlink';
        await expect(getClassLinkProfileDefaults()).resolves.toEqual(CLASSLINK_PRIVATE_PROFILE);
    });

    it('returns no overrides when signed out of a non-ClassLink login', async () => {
        await expect(getClassLinkProfileDefaults()).resolves.toEqual({});
    });

    it('waits for Firebase to restore the session before reading claims', async () => {
        mocks.authStateReady.mockImplementationOnce(async () => {
            withClaims({ classlink: true });
        });
        await expect(getClassLinkProfileDefaults()).resolves.toEqual(CLASSLINK_PRIVATE_PROFILE);
        expect(mocks.authStateReady).toHaveBeenCalled();
    });

    it('stops waiting for session restore after the timeout', async () => {
        vi.useFakeTimers();
        try {
            mocks.typeOfLogin = 'classlink';
            mocks.authStateReady.mockImplementationOnce(() => new Promise<undefined>(() => {}));
            const result = getClassLinkProfileDefaults();
            await vi.advanceTimersByTimeAsync(AUTH_RESTORE_TIMEOUT_MS);
            await expect(result).resolves.toEqual(CLASSLINK_PRIVATE_PROFILE);
        } finally {
            vi.useRealTimers();
        }
    });

    it('logs (does not silently drop) a failure for non-ClassLink logins', async () => {
        withClaims(new Error('network'), new Error('network'));
        await expect(getClassLinkProfileDefaults()).resolves.toEqual({});
        expect(mocks.log.error).toHaveBeenCalled();
    });
});

describe('getClassLinkSession', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.typeOfLogin = null;
    });

    it('reads the classlink and classlinkStudent claims', async () => {
        withClaims({ classlink: true, classlinkStudent: true });
        await expect(getClassLinkSession()).resolves.toEqual({ classlink: true, student: true });
    });

    it('fails closed to student for a ClassLink login whose claims cannot be read', async () => {
        withClaims(new Error('x'), new Error('x'));
        mocks.typeOfLogin = 'classlink';
        await expect(getClassLinkSession()).resolves.toEqual({ classlink: true, student: true });
    });

    it('fails closed to student for a ClassLink login with no Firebase user', async () => {
        mocks.currentUser = null;
        mocks.typeOfLogin = 'classlink';
        await expect(getClassLinkSession()).resolves.toEqual({ classlink: true, student: true });
    });

    it('reports no ClassLink session when signed out of another login', async () => {
        mocks.currentUser = null;
        await expect(getClassLinkSession()).resolves.toEqual({ classlink: false, student: false });
    });
});

describe('isClassLinkStudentSession', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.currentUser = null;
        mocks.typeOfLogin = null;
    });

    it('reads the classlinkStudent claim', async () => {
        withClaims({ classlinkStudent: true });
        await expect(isClassLinkStudentSession()).resolves.toBe(true);
    });

    it('fails closed for a ClassLink login with no Firebase user', async () => {
        mocks.typeOfLogin = 'classlink';
        await expect(isClassLinkStudentSession()).resolves.toBe(true);
    });

    it('is false when signed out of another login', async () => {
        await expect(isClassLinkStudentSession()).resolves.toBe(false);
    });
});

describe('applyClassLinkPrivateProfile', () => {
    const wallet = (updates: Array<boolean | Error>, profileId: string | null = 'p1') => {
        const updateProfile = vi.fn();
        for (const update of updates) {
            if (update instanceof Error) updateProfile.mockRejectedValueOnce(update);
            else updateProfile.mockResolvedValueOnce(update);
        }
        return {
            invoke: {
                getProfile: vi.fn(async () => (profileId ? { profileId } : undefined)),
                updateProfile,
            },
        };
    };

    beforeEach(() => vi.clearAllMocks());

    it('makes an existing profile private', async () => {
        const w = wallet([true]);
        await expect(applyClassLinkPrivateProfile(w)).resolves.toBe(true);
        expect(w.invoke.updateProfile).toHaveBeenCalledWith(CLASSLINK_PRIVATE_PROFILE);
    });

    it('retries once, then logs and reports failure', async () => {
        const w = wallet([new Error('a'), false]);
        await expect(applyClassLinkPrivateProfile(w)).resolves.toBe(false);
        expect(w.invoke.updateProfile).toHaveBeenCalledTimes(2);
        expect(mocks.log.error).toHaveBeenCalledWith(
            'classlink.profile.private.failed',
            expect.any(Error)
        );
    });

    it('succeeds on the retry', async () => {
        const w = wallet([new Error('a'), true]);
        await expect(applyClassLinkPrivateProfile(w)).resolves.toBe(true);
        expect(mocks.log.error).not.toHaveBeenCalled();
    });

    it('does nothing when there is no network profile yet', async () => {
        const w = wallet([], null);
        await expect(applyClassLinkPrivateProfile(w)).resolves.toBe(true);
        expect(w.invoke.updateProfile).not.toHaveBeenCalled();
    });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    enabled: vi.fn(),
    release: vi.fn(),
    exhausted: vi.fn(),
    released: vi.fn(),
    find: vi.fn(),
    findDid: vi.fn(),
    activate: vi.fn(),
    verify: vi.fn(),
    rate: vi.fn(),
}));
vi.mock('@helpers/legacyKeyArchive.helpers', () => ({
    isLegacyKeyArchiveEnabled: mocks.enabled,
    releaseArchivedKey: mocks.release,
    markArchivedKeyExhausted: mocks.exhausted,
    markArchivedKeyReleased: mocks.released,
}));
vi.mock('@routes', async () => {
    const { initTRPC } = await import('@trpc/server');
    const t = initTRPC.context<{ user: { did: string }; clientIp: string }>().create();
    return { t, openRoute: t.procedure, didRoute: t.procedure, didAndChallengeRoute: t.procedure };
});
vi.mock('@models', async () => {
    const { z } = await import('zod');
    return {
        findUserKeyByAuthProvider: mocks.find,
        findUserKeyByDid: mocks.findDid,
        activateUserKeyByAuthProvider: mocks.activate,
        hasActivatableRecoveryMethod: () => true,
        ServerEncryptedShareValidator: z.object({}),
        EscrowPinStatusValidator: z.object({}),
        EncryptedShareValidator: z.object({}),
    };
});
vi.mock('@helpers/auth.helpers', () => ({
    verifyAuthToken: mocks.verify,
    getContactMethodFromUser: () => ({ type: 'email', value: 'fixture@example.com' }),
}));
vi.mock('@helpers/rateLimit.helpers', () => ({
    checkRateLimit: mocks.rate,
    clearRateLimit: vi.fn(),
}));
vi.mock('@helpers/shareEncryption.helpers', () => ({
    encryptAuthShare: vi.fn(),
    decryptAuthShare: vi.fn(),
}));
vi.mock('@cache', () => ({ default: {} }));
vi.mock('@cache/challenges', () => ({ setValidChallengeForDid: vi.fn() }));
vi.mock('@cache/recoverySessions', () => ({ MAX_RECOVERY_OTP_ATTEMPTS: 5 }));
vi.mock('../services/delivery', () => ({ getDeliveryService: vi.fn(), getFrom: vi.fn() }));
vi.mock('../services/escrow-enclave', () => ({
    getEscrowBlobStaleReason: vi.fn(),
    notifyEscrowHoldEvent: vi.fn(),
}));
vi.mock('../services/escrow-enclave/cancellation', () => ({ cancelHoldInEnclave: vi.fn() }));

import { keysRouter } from './keys';

const uid = 'verified-user';
const did = 'did:key:zFixture';
const input = { authToken: 'verified-token', providerType: 'firebase' as const };
const caller = keysRouter.createCaller({
    domain: 'localhost',
    tenant: { id: 'learncard', emailBranding: {}, resolvedVia: 'default' },
    user: { did, isChallengeValid: true },
    clientIp: '127.0.0.1',
});

beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    mocks.enabled.mockReturnValue(true);
    mocks.verify.mockResolvedValue({ id: uid });
    mocks.rate.mockResolvedValue(true);
    mocks.find.mockResolvedValue(null);
    mocks.findDid.mockResolvedValue(null);
    mocks.release.mockResolvedValue({ privateKey: 'a'.repeat(64), did });
    mocks.activate.mockResolvedValue(true);
    mocks.exhausted.mockResolvedValue(undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('getArchivedKey', () => {
    it('returns unavailable when disabled without verifying or accessing storage', async () => {
        mocks.enabled.mockReturnValue(false);
        expect(await caller.getArchivedKey(input)).toEqual({ available: false });
        expect(mocks.verify).not.toHaveBeenCalled();
        expect(mocks.release).not.toHaveBeenCalled();
    });
    it.each(['oidc', 'keycloak', 'supertokens'] as const)(
        'returns unavailable for %s',
        async providerType => {
            expect(await caller.getArchivedKey({ ...input, providerType })).toEqual({
                available: false,
            });
            expect(mocks.release).not.toHaveBeenCalled();
        }
    );
    it.each([{ keyProvider: 'sss', sssActivationState: 'active' }, { keyProvider: 'sss' }])(
        'rejects active SSS records %j',
        async record => {
            mocks.find.mockResolvedValue(record);
            expect(await caller.getArchivedKey(input)).toEqual({ available: false });
            expect(mocks.release).not.toHaveBeenCalled();
        }
    );
    it.each([
        null,
        { keyProvider: 'web3auth', primaryDid: did },
        { keyProvider: 'sss', sssActivationState: 'provisional', primaryDid: did },
        { keyProvider: null, primaryDid: did },
        { primaryDid: did },
    ])('releases eligible records %j using only the verified uid', async record => {
        mocks.find.mockResolvedValue(record);
        expect(await caller.getArchivedKey(input)).toEqual({
            available: true,
            privateKey: 'a'.repeat(64),
            did,
        });
        expect(mocks.verify).toHaveBeenCalledWith(input.authToken, 'firebase');
        expect(mocks.find).toHaveBeenCalledWith('firebase', uid);
        expect(mocks.release).toHaveBeenCalledWith(uid, record?.primaryDid);
        expect(mocks.released).toHaveBeenCalledWith(uid);
        expect(mocks.rate).toHaveBeenCalledWith(`archived-key:uid:${uid}`, 20, 3600);
        expect(mocks.rate).toHaveBeenCalledWith('archived-key:ip:127.0.0.1', 200, 3600);
    });
    it('returns unavailable for missing archive material', async () => {
        mocks.release.mockResolvedValue(null);
        expect(await caller.getArchivedKey(input)).toEqual({ available: false });
        expect(mocks.released).not.toHaveBeenCalled();
    });
    it.each([
        {
            keyProvider: 'sss',
            sssActivationState: 'active',
            authProviders: [{ type: 'firebase', id: uid }],
        },
        {
            keyProvider: 'sss',
            sssActivationState: 'provisional',
            authProviders: [{ type: 'firebase', id: 'replacement' }],
        },
    ])(
        'denies an upgraded or rebound identity even when the login lookup has no record',
        async identity => {
            mocks.findDid.mockResolvedValue(identity);
            expect(await caller.getArchivedKey(input)).toEqual({ available: false });
            expect(mocks.findDid).toHaveBeenCalledWith(did);
            expect(mocks.released).not.toHaveBeenCalled();
        }
    );
    it('permits an eligible identity still bound to the verified login', async () => {
        mocks.findDid.mockResolvedValue({
            keyProvider: 'web3auth',
            authProviders: [{ type: 'firebase', id: uid }],
        });
        expect(await caller.getArchivedKey(input)).toMatchObject({ available: true });
    });
    it.each([0, 1])('enforces rate limit %s before accessing storage', async blockedIndex => {
        mocks.rate
            .mockResolvedValueOnce(blockedIndex !== 0)
            .mockResolvedValueOnce(blockedIndex !== 1);
        await expect(caller.getArchivedKey(input)).rejects.toMatchObject({
            code: 'TOO_MANY_REQUESTS',
        });
        expect(mocks.release).not.toHaveBeenCalled();
    });
    it('does not release on invalid authentication', async () => {
        mocks.verify.mockRejectedValueOnce(new Error('Invalid authentication'));
        await expect(caller.getArchivedKey(input)).rejects.toThrow();
        expect(mocks.release).not.toHaveBeenCalled();
    });
});

describe('activate archive exhaustion', () => {
    beforeEach(() =>
        mocks.find.mockResolvedValue({
            keyProvider: 'sss',
            sssActivationState: 'provisional',
            primaryDid: did,
            shareVersion: 1,
        })
    );
    it('tags only after successful activation', async () => {
        expect(await caller.activate(input)).toEqual({ success: true });
        expect(mocks.exhausted).toHaveBeenCalledWith(uid);
        expect(mocks.activate.mock.invocationCallOrder[0]).toBeLessThan(
            mocks.exhausted.mock.invocationCallOrder[0]!
        );
    });
    it('preserves success when tagging throws', async () => {
        mocks.exhausted.mockRejectedValueOnce(new Error('sensitive failure'));
        expect(await caller.activate(input)).toEqual({ success: true });
        expect(console.warn).toHaveBeenCalledWith({
            event: 'archived_key_exhaustion_failed',
            uidHash: expect.stringMatching(/^[a-f0-9]{16}$/),
        });
    });
    it('does not tag a failed activation', async () => {
        mocks.activate.mockResolvedValue(false);
        await expect(caller.activate(input)).rejects.toMatchObject({ code: 'CONFLICT' });
        expect(mocks.exhausted).not.toHaveBeenCalled();
    });
    it('does not tag when disabled or for another provider', async () => {
        mocks.enabled.mockReturnValue(false);
        await caller.activate(input);
        mocks.enabled.mockReturnValue(true);
        await caller.activate({ ...input, providerType: 'oidc' });
        expect(mocks.exhausted).not.toHaveBeenCalled();
    });
});

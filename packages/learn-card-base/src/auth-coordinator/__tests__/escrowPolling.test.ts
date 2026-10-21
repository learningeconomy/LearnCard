import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthCoordinator } from '../AuthCoordinator';
import type { KeyDerivationStrategy } from '../types';

const setup = () => {
    const document = Object.assign(new EventTarget(), { visibilityState: 'visible' });
    vi.stubGlobal('document', document);
    vi.useFakeTimers();
    const getEscrowRecoveryStatus = vi
        .fn<NonNullable<KeyDerivationStrategy['getEscrowRecoveryStatus']>>()
        .mockResolvedValue(null);
    const ensureEscrowEnrollment = vi.fn().mockResolvedValue({ enrolled: true, changed: false });
    const keyDerivation: KeyDerivationStrategy = {
        name: 'test',
        capabilities: {
            recovery: false,
            deviceLinking: false,
            localKeyPersistence: true,
            contactMethodUpgrade: false,
        },
        hasLocalKey: async () => true,
        getLocalKey: async () => 'local',
        storeLocalKey: async () => {},
        clearLocalKeys: async () => {},
        splitKey: async () => ({ localKey: 'local', remoteKey: 'remote' }),
        reconstructKey: async () => 'private',
        fetchServerKeyStatus: async () => ({
            exists: true,
            needsMigration: false,
            primaryDid: 'did:key:test',
            recoveryMethods: [],
            authShare: 'remote',
            shareVersion: 1,
        }),
        storeAuthShare: async () => {},
        executeRecovery: async () => ({ privateKey: 'private', did: 'did:key:test' }),
        ensureEscrowEnrollment,
        getEscrowRecoveryStatus,
    };
    const coordinator = new AuthCoordinator({
        keyDerivation,
        authProvider: {
            getCurrentUser: async () => ({ id: 'user', providerType: 'firebase' }),
            getIdToken: async () => 'token',
            getProviderType: () => 'firebase',
            signOut: async () => {},
        },
        getCachedPrivateKey: async () => 'private',
        didFromPrivateKey: async () => 'did:key:test',
        signDidAuthVp: async () => 'proof',
    });
    return { coordinator, document, getEscrowRecoveryStatus, ensureEscrowEnrollment };
};

afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

describe('ready escrow status polling', () => {
    it('discovers and clears holds periodically and on visibility without enrolling again', async () => {
        const { coordinator, document, getEscrowRecoveryStatus, ensureEscrowEnrollment } = setup();
        await coordinator.initialize();
        await vi.advanceTimersByTimeAsync(0);
        expect(ensureEscrowEnrollment).toHaveBeenCalledTimes(1);
        getEscrowRecoveryStatus.mockResolvedValue({
            holdId: 'hold',
            releasePolicy: 'hold',
            status: 'pending',
            requestedAt: '2026-09-14',
            releaseAfter: '2026-09-21',
        });
        await vi.advanceTimersByTimeAsync(AuthCoordinator.ESCROW_STATUS_REFRESH_MS);
        expect(coordinator.getState()).toMatchObject({ pendingEscrowHold: { holdId: 'hold' } });
        document.visibilityState = 'hidden';
        const calls = getEscrowRecoveryStatus.mock.calls.length;
        document.dispatchEvent(new Event('visibilitychange'));
        await vi.advanceTimersByTimeAsync(AuthCoordinator.ESCROW_STATUS_REFRESH_MS);
        expect(getEscrowRecoveryStatus).toHaveBeenCalledTimes(calls);
        getEscrowRecoveryStatus.mockResolvedValue(null);
        document.visibilityState = 'visible';
        document.dispatchEvent(new Event('visibilitychange'));
        await vi.advanceTimersByTimeAsync(0);
        expect(coordinator.getState()).toMatchObject({ pendingEscrowHold: undefined });
        expect(ensureEscrowEnrollment).toHaveBeenCalledTimes(1);
        coordinator.destroy();
        expect(vi.getTimerCount()).toBe(0);
    });

    it.each(['logout', 'destroy'] as const)('removes observers on %s', async action => {
        const { coordinator, document, getEscrowRecoveryStatus } = setup();
        await coordinator.initialize();
        await vi.advanceTimersByTimeAsync(0);
        await coordinator[action]();
        getEscrowRecoveryStatus.mockClear();
        document.dispatchEvent(new Event('visibilitychange'));
        await vi.advanceTimersByTimeAsync(AuthCoordinator.ESCROW_STATUS_REFRESH_MS);
        expect(getEscrowRecoveryStatus).not.toHaveBeenCalled();
        expect(vi.getTimerCount()).toBe(0);
    });
});

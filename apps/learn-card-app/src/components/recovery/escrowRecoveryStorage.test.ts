import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    clearPendingEscrowRecovery,
    loadPendingEscrowRecovery,
    savePendingEscrowRecovery,
} from './escrowRecoveryStorage';

const storage = vi.hoisted(() => ({
    getDeviceShare: vi.fn(),
    storeDeviceShare: vi.fn(),
    clearAllShares: vi.fn(),
}));
vi.mock('@learncard/sss-key-manager', () => ({
    createAdaptiveStorage: () => storage,
    isPublicComputerMode: () => false,
}));

describe('pending escrow recovery storage', () => {
    const record = {
        holdId: 'hold',
        resumeToken: 'resume',
        clientEphemeralPrivateKey: 'ephemeral',
        releaseAfter: '2026-09-08',
    };
    beforeEach(() => {
        vi.resetAllMocks();
        let queue = Promise.resolve();
        vi.stubGlobal('navigator', {
            locks: {
                request: (_key: string, update: () => Promise<void>) => {
                    const pending = queue.then(update);
                    queue = pending.catch(() => {});
                    return pending;
                },
            },
        });
        let raw: string | undefined;
        storage.getDeviceShare.mockImplementation(async () => raw);
        storage.storeDeviceShare.mockImplementation(async (value: string) => {
            raw = value;
        });
        storage.clearAllShares.mockImplementation(async () => {
            raw = undefined;
        });
    });
    afterEach(() => vi.unstubAllGlobals());

    it('serializes concurrent account writes with the shared browser lock', async () => {
        await Promise.all([
            savePendingEscrowRecovery(record, 'a'),
            savePendingEscrowRecovery({ ...record, holdId: 'other' }, 'b'),
        ]);
        expect(await loadPendingEscrowRecovery('a')).toEqual(record);
        expect(await loadPendingEscrowRecovery('b')).toEqual({ ...record, holdId: 'other' });
    });

    it('preserves requests for other accounts when saving and clearing', async () => {
        await savePendingEscrowRecovery(record, 'account-a');
        await savePendingEscrowRecovery({ ...record, holdId: 'other' }, 'account-b');
        expect(await loadPendingEscrowRecovery('account-a')).toEqual(record);
        expect(await loadPendingEscrowRecovery('unknown')).toBeUndefined();
        await clearPendingEscrowRecovery('other', 'account-a');
        expect(await loadPendingEscrowRecovery('account-a')).toEqual(record);
        await clearPendingEscrowRecovery('hold', 'account-a');
        expect(await loadPendingEscrowRecovery('account-b')).toEqual({
            ...record,
            holdId: 'other',
        });
        await clearPendingEscrowRecovery('other', 'account-b');
        expect(storage.clearAllShares).toHaveBeenCalledWith('escrow-recovery-pending');
    });

    it('rejects corrupt storage without overwriting it', async () => {
        storage.getDeviceShare.mockResolvedValue('{broken');
        await expect(loadPendingEscrowRecovery()).rejects.toThrow();
        await expect(savePendingEscrowRecovery(record)).rejects.toThrow();
        expect(storage.storeDeviceShare).not.toHaveBeenCalled();
    });
});

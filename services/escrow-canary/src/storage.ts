import type { SSSStorageFunctions } from '@learncard/sss-key-manager';
import type { AccountSecret } from './secrets';

/** Preserve every SDK storage ID, including pending rotation candidates. No IndexedDB. */
export const memoryStorage = (
    initial?: AccountSecret['deviceState']
): {
    storage: SSSStorageFunctions;
    snapshot: () => AccountSecret['deviceState'];
} => {
    const state = structuredClone(initial ?? { shares: {}, versions: {} });
    const remove = async (id = 'sss-device-share'): Promise<void> => {
        delete state.shares[id];
        delete state.versions[id];
    };
    return {
        snapshot: () => structuredClone(state),
        storage: {
            storeDeviceShare: async (share, id = 'sss-device-share') => {
                state.shares[id] = share;
            },
            getDeviceShare: async (id = 'sss-device-share') => state.shares[id] ?? null,
            hasDeviceShare: async (id = 'sss-device-share') => id in state.shares,
            deleteDeviceShare: remove,
            clearAllShares: remove,
            storeShareVersion: async (version, id = 'sss-device-share') => {
                state.versions[id] = version;
            },
            getShareVersion: async (id = 'sss-device-share') => state.versions[id] ?? null,
        },
    };
};

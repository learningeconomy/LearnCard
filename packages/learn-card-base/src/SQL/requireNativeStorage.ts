import { Capacitor } from '@capacitor/core';
import { sqliteStore } from '../stores/sqliteStore';
import { waitForSQLiteReady } from './sqliteReady';

/** Account operations must not treat unavailable native storage as an empty account. */
export const requireNativeStorage = async (): Promise<void> => {
    if (Capacitor.getPlatform() === 'web') return;
    await waitForSQLiteReady();
    if (!sqliteStore.get.db()) {
        throw new Error('Account storage is unavailable. Please try again.');
    }
};

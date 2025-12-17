import { createStore } from '@udecode/zustood';

export type SyncProgressPhase = 'idle' | 'scanning' | 'syncing' | 'done' | 'error';

export interface SyncProgressState {
    isActive: boolean;
    phase: SyncProgressPhase;

    pagesProcessed: number;
    recordsScanned: number;
    categoriesFound: number;

    totalContracts: number;
    contractsCompleted: number;
    currentContract: string | null;

    lastError: string | null;
    startedAt: number | null;
    finishedAt: number | null;
}

export const initialSyncProgressState: SyncProgressState = {
    isActive: false,
    phase: 'idle',

    pagesProcessed: 0,
    recordsScanned: 0,
    categoriesFound: 0,

    totalContracts: 0,
    contractsCompleted: 0,
    currentContract: null,

    lastError: null,
    startedAt: null,
    finishedAt: null,
};

export const syncProgressStore = createStore('syncProgressStore')<SyncProgressState>(
    initialSyncProgressState,
    { persist: { name: 'syncProgressStore', enabled: true } }
);

export const resetSyncProgress = (): void => {
    syncProgressStore.set.isActive(false);
    syncProgressStore.set.phase('idle');

    syncProgressStore.set.pagesProcessed(0);
    syncProgressStore.set.recordsScanned(0);
    syncProgressStore.set.categoriesFound(0);

    syncProgressStore.set.totalContracts(0);
    syncProgressStore.set.contractsCompleted(0);
    syncProgressStore.set.currentContract(null);

    syncProgressStore.set.lastError(null);
    syncProgressStore.set.startedAt(null);
    syncProgressStore.set.finishedAt(null);
};

export const useSyncPhase = syncProgressStore.use.phase;
export const useSyncIsActive = syncProgressStore.use.isActive;
export const useSyncPagesProcessed = syncProgressStore.use.pagesProcessed;
export const useSyncRecordsScanned = syncProgressStore.use.recordsScanned;
export const useSyncCategoriesFound = syncProgressStore.use.categoriesFound;
export const useSyncTotalContracts = syncProgressStore.use.totalContracts;
export const useSyncContractsCompleted = syncProgressStore.use.contractsCompleted;
export const useSyncCurrentContract = syncProgressStore.use.currentContract;
export const useSyncLastError = syncProgressStore.use.lastError;

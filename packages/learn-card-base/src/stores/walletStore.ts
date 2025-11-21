import { createStore } from '@udecode/zustood';
import { BespokeLearnCard } from 'learn-card-base/types/learn-card';

export enum WalletSyncState {
    Syncing,
    NotSyncing,
    Completed,
}

export const walletStore = createStore('walletStore')<{
    wallet: BespokeLearnCard | null;
    isMigrating: boolean;
    syncState: { status: WalletSyncState; text?: string | null };
}>({
    wallet: null,
    isMigrating: false,
    syncState: { status: WalletSyncState.NotSyncing, text: null },
}).extendActions(set => ({
    setIsSyncing: (syncing: WalletSyncState, credentialCount?: number) => {
        switch (syncing) {
            case WalletSyncState.Syncing:
                set.syncState({ status: WalletSyncState.Syncing, text: 'Syncing...' });

                break;
            case WalletSyncState.Completed:
                set.syncState({
                    status: WalletSyncState.Completed,
                    text: `+${credentialCount} Items`,
                });

                setTimeout(() => {
                    set.syncState({ status: WalletSyncState.NotSyncing, text: null });
                }, 3000);

                break;
            case WalletSyncState.NotSyncing:
                set.syncState({ status: WalletSyncState.NotSyncing, text: null });
                break;
        }
    },
}));

export const switchedProfileStore = createStore('switchedProfileStore')<{
    switchedDid: string | undefined;
    profileType: 'service' | 'parent' | 'child' | null;
}>(
    { switchedDid: undefined, profileType: null },
    { persist: { name: 'switchedProfileStore', enabled: true } }
).extendSelectors(state => ({ isSwitchedProfile: () => Boolean(state.switchedDid) }));

import { useSyncExternalStore } from 'react';
import { currentUserStore } from 'learn-card-base/stores/currentUserStore';
import { switchedProfileStore, walletStore } from 'learn-card-base/stores/walletStore';
import type { HistoryContext, HistoryWallet } from './history';

let accountRevision = 0;
let selectedAccountRevision = 0;
const listeners = new Set<() => void>();
const invalidate = () => {
    accountRevision++;
    listeners.forEach(listener => listener());
};
currentUserStore.store.subscribe((state, previous) => {
    if (
        state.currentUser?.uid !== previous.currentUser?.uid ||
        state.currentUser?.privateKey !== previous.currentUser?.privateKey ||
        state.currentUserPK !== previous.currentUserPK
    ) {
        selectedAccountRevision++;
        invalidate();
    }
});
switchedProfileStore.store.subscribe((state, previous) => {
    if (state.switchedDid !== previous.switchedDid || state.profileType !== previous.profileType) {
        selectedAccountRevision++;
        invalidate();
    }
});
walletStore.store.subscribe((state, previous) => {
    if (state.wallet?.id.did() !== previous.wallet?.id.did()) invalidate();
});
export const useHistoryAccountRevision = () =>
    useSyncExternalStore(
        listener => {
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
            };
        },
        () => accountRevision,
        () => 0
    );
/** The generation also invalidates a late result after switching away and back. */
export const captureHistoryContext = (
    wallet: HistoryWallet,
    eligible: boolean | (() => boolean) = true
): HistoryContext => {
    const revision = accountRevision;
    const did = wallet.id.did();
    return {
        wallet,
        get eligible() {
            return isHistoryAccountEligible(typeof eligible === 'function' ? eligible() : eligible);
        },
        isCurrent: () =>
            accountRevision === revision &&
            !!currentUserStore.get.currentUser() &&
            (walletStore.get.wallet()?.id.did() ?? did) === did,
    };
};

export const captureHistoryAccount = (): (() => boolean) => {
    const revision = selectedAccountRevision;
    return () => revision === selectedAccountRevision && !!currentUserStore.get.currentUser();
};
export const getHistoryAccountRevision = () => accountRevision;

export const isHistoryAccountEligible = (eligible = true): boolean =>
    eligible &&
    !switchedProfileStore.get.switchedDid() &&
    switchedProfileStore.get.profileType() !== 'child' &&
    switchedProfileStore.get.profileType() !== 'service';

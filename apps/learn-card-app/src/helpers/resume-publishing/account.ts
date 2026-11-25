import { useSyncExternalStore } from 'react';
import { currentUserStore } from 'learn-card-base/stores/currentUserStore';
import { switchedProfileStore, walletStore } from 'learn-card-base/stores/walletStore';

let revision = 0;
const listeners = new Set<() => void>();
const invalidate = () => {
    revision++;
    listeners.forEach(listener => listener());
};
currentUserStore.store.subscribe((state, previous) => {
    if (
        state.currentUser?.uid !== previous.currentUser?.uid ||
        state.currentUser?.privateKey !== previous.currentUser?.privateKey ||
        state.currentUserPK !== previous.currentUserPK
    )
        invalidate();
});
switchedProfileStore.store.subscribe((state, previous) => {
    if (state.switchedDid !== previous.switchedDid || state.profileType !== previous.profileType)
        invalidate();
});
walletStore.store.subscribe((state, previous) => {
    const previousDid = previous.wallet?.id.did();
    // First initialization is expected after capture; replacing a previously selected owner is not.
    if (previousDid && state.wallet?.id.did() !== previousDid) invalidate();
});
export const useResumeAccountRevision = () =>
    useSyncExternalStore(
        listener => {
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
            };
        },
        () => revision,
        () => 0
    );
/** Rejects late results even after an away-and-back profile switch. Capture before initWallet. */
export const captureResumeAccount = (): (() => boolean) => {
    const captured = revision;
    return () => captured === revision && !!currentUserStore.get.currentUser();
};

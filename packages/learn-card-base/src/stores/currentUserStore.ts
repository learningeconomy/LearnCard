import { useSyncExternalStore } from 'react';
import { UserInfo } from '@web3auth/base';
import { createStore } from '@udecode/zustood';

export type CurrentUser = Partial<UserInfo> & {
    uid: string;
    email: string;
    phoneNumber: string;
    name: string;
    profileImage: string;
    privateKey: string | null | undefined;
    baseColor: string;
};

export const currentUserStore = createStore('currentUserStore')<{
    currentUser: CurrentUser | null;
    currentUserPK: string | null;
    currentUserBaseColor: string | null;
    currentUserIsLoggedIn: boolean;
    parentUser: CurrentUser | null;
    parentUserDid: string | null;
    parentLDFlags: any | undefined;
}>(
    {
        currentUser: null,
        currentUserPK: null,
        currentUserBaseColor: null,
        currentUserIsLoggedIn: false,
        parentUser: null,
        parentUserDid: null,
        parentLDFlags: undefined,
    },
    {
        persist: {
            name: 'currentUser',
            enabled: true,
            // Do not persist privateKey or currentUserPK
            partialize: state => ({
                ...state,
                currentUser: state.currentUser
                    ? { ...state.currentUser, privateKey: undefined }
                    : null,
                currentUserPK: null,
            }),
        },
    }
)
    .extendSelectors((state, _get) => ({
        // Must read the tracked `state`, NOT `get.*()`. Reading via `get` makes
        // react-tracked record zero deps, so `useIsLoggedIn()` won't re-render
        // when `currentUser` is set after first mount (breaks native auth boot).
        currentUserIsLoggedIn: () => !!state.currentUser,
        parentUserProfileId: () => state.parentUserDid?.split(':').at(-1),
    }))
    .extendActions((set, get) => ({
        updateCurrentUserNameAndImage: (name: string, profileImage: string) => {
            const current = get.currentUser();
            if (current) {
                // Only update if values actually changed to prevent infinite loops
                if (current.name !== name || current.profileImage !== profileImage) {
                    // Use direct setter to ensure Zustood subscriptions trigger
                    set.currentUser({
                        ...current,
                        name,
                        profileImage,
                    });
                }
            }
        },
    }));

export const useIsLoggedIn = currentUserStore.useTracked.currentUserIsLoggedIn;

// zustood's bundled types don't model zustand v3 persist's `.persist` runtime API
// (hasHydrated/onFinishHydration), so we bridge it through a narrow local type
// instead of `as any`. This is real, documented zustand behavior — see
// `zustand/middleware`'s `StorePersist` — just not reflected in zustood's types.
type PersistCapableApi = {
    persist?: {
        hasHydrated: () => boolean;
        onFinishHydration: (listener: () => void) => () => void;
    };
};

const persistApi = (currentUserStore.store as PersistCapableApi).persist;

let hasCurrentUserHydrated = persistApi ? persistApi.hasHydrated() : true;
const hydrationListeners = new Set<() => void>();

persistApi?.onFinishHydration(() => {
    hasCurrentUserHydrated = true;
    hydrationListeners.forEach(listener => listener());
});

const getHasCurrentUserHydrated = (): boolean => hasCurrentUserHydrated;

const subscribeToHydration = (listener: () => void): (() => void) => {
    hydrationListeners.add(listener);
    return () => {
        hydrationListeners.delete(listener);
    };
};

/**
 * Whether the persisted `currentUserStore` slice has finished rehydrating from
 * storage. Storage reads are synchronous for `localStorage`, but this stays
 * correct if the backing storage ever becomes async. Gate any effect that reads
 * `currentUser` on mount behind this so it doesn't act on stale/partial state
 * before rehydration (and the async privateKey backfill it triggers) settles.
 */
export const useHasCurrentUserHydrated = (): boolean =>
    useSyncExternalStore(subscribeToHydration, getHasCurrentUserHydrated);

export default currentUserStore;

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
    .extendSelectors((_state, get) => ({
        currentUserIsLoggedIn: () => !!get.currentUser(),
        parentUserProfileId: () => get.parentUserDid()?.split(':').at(-1),
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

export default currentUserStore;

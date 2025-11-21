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
    .extendActions(set => ({
        updateCurrentUserNameAndImage: (name: string, profileImage: string) => {
            set.state(state => {
                if (state.currentUser) {
                    state.currentUser.name = name;
                    state.currentUser.profileImage = profileImage;
                }
            });
        },
    }));

export const useIsLoggedIn = currentUserStore.useTracked.currentUserIsLoggedIn;

export default currentUserStore;

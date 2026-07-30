import { createStore } from '@udecode/zustood';

type UserProfileSetupStore = {
    autoPrompted: boolean;
};

const initialState: UserProfileSetupStore = {
    autoPrompted: false,
};

export const userProfileSetupStore = createStore('userProfileSetupStore')<UserProfileSetupStore>(
    initialState
).extendActions(set => ({
    markAutoPrompted: () => set.autoPrompted(true),
    clearAutoPrompted: () => set.autoPrompted(false),
}));

export default userProfileSetupStore;

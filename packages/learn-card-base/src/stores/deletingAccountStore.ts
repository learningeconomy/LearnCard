import { createStore } from '@udecode/zustood';

export const deletingAccountStore = createStore('deletingAccountStore')<{
    deletingAccount: boolean;
}>({
    deletingAccount: false,
});

export default deletingAccountStore;

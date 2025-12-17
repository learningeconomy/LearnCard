import { createStore } from '@udecode/zustood';

export const confirmationStore = createStore('confirmationStore')<{
    showConfirmation: boolean;
}>(
    { showConfirmation: false },
    { persist: { name: 'confirmationStore', enabled: true } }
);

export const useShowConfirmation = confirmationStore.use.showConfirmation;

export default confirmationStore;
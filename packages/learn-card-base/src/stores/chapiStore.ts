import { createStore } from '@udecode/zustood';

export const chapiStore = createStore('chapiStore')<{
    isChapiInteraction: boolean | null;
}>({ isChapiInteraction: null }, { persist: { name: 'chapiStore', enabled: true } });

export const useIsChapiInteraction = chapiStore.use.isChapiInteraction;

export default chapiStore;
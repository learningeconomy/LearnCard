import { createStore } from '@udecode/zustood';

export const aiLoadingStore = createStore('aiLoadingStore')<{
    isFinishingAssessment: boolean;
}>(
    {
        isFinishingAssessment: false,
    },
    { persist: { name: 'aiLoadingStore', enabled: true } }
);

export const useIsFinishingAssessment = aiLoadingStore.use.isFinishingAssessment;

export default aiLoadingStore;

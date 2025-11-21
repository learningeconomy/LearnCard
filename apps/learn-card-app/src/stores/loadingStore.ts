import { useId, useEffect } from 'react';
import { produce } from 'immer';
import { createStore } from '@udecode/zustood';

export const loadingStore = createStore('loadingStore')<{
    loadingStates: { id: string; loading: boolean }[];
}>({ loadingStates: [] }).extendSelectors((_set, get) => ({
    loading: () => get.loadingStates().some(state => state.loading),
}));

export const useLoadingLine = (loadingState: boolean) => {
    const id = useId();

    useEffect(() => {
        // Add or update the loading state when the component mounts or loadingState changes
        loadingStore.set.loadingStates(
            produce(loadingStore.get.loadingStates(), draft => {
                const index = draft.findIndex(state => state.id === id);

                if (index > -1) {
                    draft[index].loading = loadingState;
                } else {
                    draft.push({ id, loading: loadingState });
                }
            })
        );

        // Remove the loading state when the component unmounts
        return () => {
            loadingStore.set.loadingStates(
                loadingStore.get.loadingStates().filter(state => state.id !== id)
            );
        };
    }, [id, loadingState]);
};

export default loadingStore;
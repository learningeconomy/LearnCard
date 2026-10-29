import { createStore } from '@udecode/zustood';

export const credentialSearchStore = createStore('credentialSearchStore')<{
    searchString: string;
    isSearchActive: boolean;
}>({
    searchString: '',
    isSearchActive: false,
}).extendActions((set, get) => ({
    toggleIsSearchActive: () => {
        const isSearchActive = get.isSearchActive();

        // reset search string if we're turning off search
        if (isSearchActive) set.searchString('');

        set.isSearchActive(!isSearchActive);
    },
    reset: () => {
        set.searchString('');
        set.isSearchActive(false);
    },
    closeSearchBar: (event: React.MouseEvent<HTMLButtonElement>) => {
        const isClickInsideButton = event.target.closest('button');
        const isSearchActive = get.isSearchActive();
        const searchString = get.searchString();

        if (
            isSearchActive &&
            !searchString &&
            !(event.target instanceof HTMLInputElement) &&
            !isClickInsideButton
        ) {
            credentialSearchStore.set.toggleIsSearchActive();
        }
    },
}));

export default credentialSearchStore;

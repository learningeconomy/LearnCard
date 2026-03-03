import { createStore } from '@udecode/zustood';

export const credentialSearchStore = createStore('credentialSearchStore')<{
    searchString: string;
    isSearchActive: boolean;
    matches: string[]; // includes all (displayed) credentials if no search
}>({
    searchString: '',
    isSearchActive: false,
    matches: [],
})
    .extendActions((set, get) => ({
        toggleIsSearchActive: () => {
            const isSearchActive = get.isSearchActive();

            // reset search string if we're turning off search
            if (isSearchActive) set.searchString('');

            set.isSearchActive(!isSearchActive);
        },
        addMatch: (title: string) => {
            const matches = get.matches();
            if (matches.includes(title)) return;

            set.matches([...matches, title]);
        },
        searchStringWithMatch: (newSearchString: string) => {
            set.searchString(newSearchString);

            const newMatches = get.matches().filter(m => m.toLowerCase().includes(newSearchString));
            set.matches(newMatches);
        },
        reset: () => {
            set.searchString('');
            set.isSearchActive(false);
            set.matches([]);
        },
        closeSearchBar: (event: React.MouseEvent<HTMLButtonElement>) => {
            const isClickInsideButton = event.target.closest('button');
            const isSearchActive = get.isSearchActive();
            const searchString = get.searchString();

            if (
                isSearchActive && 
                !searchString && 
                !(event.target instanceof HTMLInputElement) 
                && !isClickInsideButton
            ) {
                credentialSearchStore.set.toggleIsSearchActive();
            };
        }
    }))
    .extendSelectors(state => ({
        isSearchWithNoResults: () => {
            const { isSearchActive, searchString, matches } = state;

            return isSearchActive && !!searchString && matches.length === 0;
        },
    }));

export default credentialSearchStore;

import create from 'zustand';

import type { DataSharingSharedLinksViewModel } from '../../DataSharingCenter.types';

type SharedLinksStoreState = {
    vm: DataSharingSharedLinksViewModel | null;
    setVm: (vm: DataSharingSharedLinksViewModel | null) => void;
};

/**
 * Modal content is a static ReactNode snapshot, so sheets opened with `newModal`
 * read the latest shared-links view model from here instead of from props.
 * `SharedLinksSection` is the only writer.
 */
export const useSharedLinksStore = create<SharedLinksStoreState>(set => ({
    vm: null,
    setVm: vm => set({ vm }),
}));

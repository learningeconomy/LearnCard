import { createStore } from '@udecode/zustood';

export enum BoostPreviewTabsEnum {
    Details = 'details',
    Endorsements = 'endorsements',
}

export const boostPreviewStore = createStore('boostPreviewStore')<{
    selectedTab: BoostPreviewTabsEnum;
}>(
    {
        selectedTab: BoostPreviewTabsEnum.Details,
    },
    { persist: { name: 'boostPreviewStore', enabled: false } }
).extendActions(set => ({
    updateSelectedTab: (tab: BoostPreviewTabsEnum) => {
        set.state(state => {
            state.selectedTab = tab;
        });
    },
}));

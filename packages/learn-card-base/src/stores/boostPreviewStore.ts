import { createStore } from '@udecode/zustood';

export enum BoostPreviewTabsEnum {
    Details = 'details',
    Endorsements = 'endorsements',
}

export enum BoostPreviewDisplayViewEnum {
    Default = 'default',
    Issuer = 'issuer',
}

export const boostPreviewStore = createStore('boostPreviewStore')<{
    selectedTab: BoostPreviewTabsEnum;
    selectedDisplayView: BoostPreviewDisplayViewEnum;
}>(
    {
        selectedTab: BoostPreviewTabsEnum.Details,
        selectedDisplayView: BoostPreviewDisplayViewEnum.Default,
    },
    { persist: { name: 'boostPreviewStore', enabled: false } }
).extendActions(set => ({
    updateSelectedTab: (tab: BoostPreviewTabsEnum) => {
        set.state(state => {
            state.selectedTab = tab;
        });
    },
    updateSelectedDisplayView: (view: BoostPreviewDisplayViewEnum) => {
        set.state(state => {
            state.selectedDisplayView = view;
        });
    },
}));

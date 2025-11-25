import { createStore } from '@udecode/zustood';

import { BoostPageViewModeType, BoostPageViewMode } from 'learn-card-base';

export enum PassportPageViewMode {
    grid,
    list,
}

export const passportPageStore = createStore('passportPageStore')<{
    viewMode: PassportPageViewMode;
    credentialViewMode: BoostPageViewModeType;
}>(
    {
        viewMode: PassportPageViewMode.grid,
        credentialViewMode: BoostPageViewMode.Card,
    },
    { persist: { name: 'passportPageStore', enabled: true } }
).extendActions(set => ({
    setViewMode: (viewMode: PassportPageViewMode) => {
        set.viewMode(viewMode);
        if (viewMode === PassportPageViewMode.grid) {
            set.credentialViewMode(BoostPageViewMode.Card);
        } else {
            set.credentialViewMode(BoostPageViewMode.List);
        }
    },
    setCredentialViewMode: (credentialViewMode: BoostPageViewModeType) => {
        set.credentialViewMode(credentialViewMode);

        if (credentialViewMode === BoostPageViewMode.Card) {
            set.viewMode(PassportPageViewMode.grid);
        } else {
            set.viewMode(PassportPageViewMode.list);
        }
    },
}));

export default passportPageStore;

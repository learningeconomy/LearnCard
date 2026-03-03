import { createStore } from '@udecode/zustood';
import { JobRegistryEntry } from 'learn-card-base/types/sync-my-school';
import { CredentialRecord } from '@learncard/types';

export const sharedCredsListStore = createStore('sharedCredsListStore')<{
    listings: JobRegistryEntry[] | null;
    sharedCredsIndex: CredentialRecord[] | null;
}>({ listings: null, sharedCredsIndex: null })
.extendActions((set, get, api) => ({
    reset: () => {
        set.listings(null);
        set.sharedCredsIndex(null);
    },
}))
.extendActions((set, get, api) => ({
    setJobIndex: (indexPayload: CredentialRecord[]) => {
        set.sharedCredsIndex(indexPayload);
    },
}));

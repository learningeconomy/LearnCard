import { createStore } from '@udecode/zustood';
import { JobRegistryEntry } from 'learn-card-base/types/sync-my-school';
import { CredentialRecord } from '@learncard/types';

export const jobListStore = createStore('jobListStore')<{
    listings: JobRegistryEntry[] | null;
    jobIndex: CredentialRecord[] | null;
}>({ listings: null, jobIndex: null })
.extendActions((set, get, api) => ({
    reset: () => {
        set.listings(null);
        set.jobIndex(null);
    },
}))
.extendActions((set, get, api) => ({
    setJobIndex: (jobIndexPayload: CredentialRecord[]) => {
        set.jobIndex(jobIndexPayload);
    },
}));

import { createStore } from '@udecode/zustood';
import { getScoutsRole } from '../helpers/troop.helpers';
import type { VC } from '@learncard/types';

type BoostSearchStore = {
    contextCredential: VC | undefined;
    boostUri: string | undefined;
};

const initialState: BoostSearchStore = {
    contextCredential: undefined,
    boostUri: undefined,
};

export const boostSearchStore = createStore('boostSearchStore')<BoostSearchStore>(initialState)
    .extendSelectors((set, get) => ({
        role: () => {
            const credential = get.contextCredential();
            if (!credential) return undefined;
            return getScoutsRole(credential);
        },
    }))
    .extendActions(set => ({
        reset: () => set.mergeState({ contextCredential: undefined, boostUri: undefined }),
    }));

export default boostSearchStore;

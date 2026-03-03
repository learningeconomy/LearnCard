import { createStore } from '@udecode/zustood';

import {
    EndorsementState,
    initialEndorsementState,
} from '../components/boost-endorsements/EndorsementForm/endorsement-state.helpers';

export const endorsementsRequestStore = createStore('endorsementsRequestStore')<{
    endorsementRequest: EndorsementState;
    credentialInfo:
        | {
              uri: string;
              seed: string;
              pin: string;
          }
        | undefined;
}>(
    {
        endorsementRequest: initialEndorsementState,
        credentialInfo: undefined,
    },
    { persist: { name: 'endorsementsRequestStore', enabled: true } }
).extendActions(set => ({
    setEndorsementRequest: (endorsementRequest: EndorsementState) => {
        set.endorsementRequest(endorsementRequest);
    },
    resetEndorsementRequest: () => {
        set.endorsementRequest(initialEndorsementState);
    },
}));

export default endorsementsRequestStore;

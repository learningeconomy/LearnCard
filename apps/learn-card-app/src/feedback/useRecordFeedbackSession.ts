import { useEffect } from 'react';

import { feedbackGovernorStore } from './feedbackGovernor';

let recordedThisRuntime = false;

/**
 * Increments the session counter that gates advocacy asks. Guarded at module
 * scope rather than by a ref so remounts (route changes, Strict Mode double
 * effects) can't inflate the count within one app session.
 */
export const useRecordFeedbackSession = () => {
    useEffect(() => {
        if (recordedThisRuntime) return;

        recordedThisRuntime = true;
        feedbackGovernorStore.set.recordSession();
    }, []);
};

export default useRecordFeedbackSession;

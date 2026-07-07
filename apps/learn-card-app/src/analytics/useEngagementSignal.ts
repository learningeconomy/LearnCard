import { useCallback, useRef } from 'react';

import { useAnalytics } from './context';
import { AnalyticsEvents } from './events';
import { useProfileSnapshot } from './useProfileSnapshot';

/** sessionStorage prefix for the per-session engagement-fired flag. */
const ENGAGEMENT_SESSION_PREFIX = 'lc_engagement_';

export type EngagementSignalType = 'ai_chat' | 'ai_insights' | 'ai_pathway' | 'returning_session';

/**
 * Fire `ENGAGEMENT_SIGNAL` at most once per signal per session.
 *
 * Q4 of LC-1853 (activation threshold for AI features) wants to count
 * *unique sessions* where a user engaged with each AI feature, not raw
 * tab switches or list-item clicks. This helper gates each signal type
 * with sessionStorage so consumers can call it freely on every view/click;
 * only the first fires.
 *
 * Returns a `fire(signal)` function. The current profile snapshot is read
 * at fire time (which, since engagement signals don't mutate the wallet,
 * doesn't need the pre-mutation discipline of `useProfileSnapshotCapture`).
 */
export const useEngagementSignal = () => {
    const { track } = useAnalytics();
    const snapshot = useProfileSnapshot();
    const snapshotRef = useRef(snapshot);
    // Engagement signals are read-only (no wallet mutation), so updating
    // the ref each render is safe — there is no post-mutation reinvalidation
    // to race against. Consumers get the freshest profile state at fire time.
    snapshotRef.current = snapshot;

    return useCallback(
        (signal: EngagementSignalType) => {
            const key = `${ENGAGEMENT_SESSION_PREFIX}${signal}`;
            try {
                if (sessionStorage.getItem(key) === '1') return;
                sessionStorage.setItem(key, '1');
            } catch (_) {
                // sessionStorage unavailable (private browsing in some envs).
                // Fall through and let the event fire — duplicates are
                // preferable to data loss.
            }

            track(AnalyticsEvents.ENGAGEMENT_SIGNAL, {
                signal,
                profileSnapshot: snapshotRef.current,
            });
        },
        [track]
    );
};

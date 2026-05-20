import { useEffect, useRef } from 'react';

import { useAnalytics, AnalyticsEvents, useProfileSnapshot, ACCOUNT_CREATED_AT_KEY } from './index';

const ACCOUNT_CREATED_TRACKED_KEY = 'lc_account_created_tracked';
const SESSION_START_KEY = 'lc_session_start_ms';
const LAST_SESSION_KEY = 'lc_last_session_ms';

/**
 * Fires `account_created` once per user (localStorage gate) and
 * `engagement_signal { signal: 'returning_session' }` when the user
 * returns after >24h. Call once at the app root alongside
 * `useSetAnalyticsUserId`.
 *
 * Mirrors the `lc_recovery_banner_dismissed` localStorage pattern
 * from RecoveryBanner.tsx.
 */
export const useAccountCreatedAndReturningSession = (
    /** A stable user identifier — non-null means "user is logged in". */
    userId: string | undefined | null
): void => {
    const { track, isReady } = useAnalytics();
    const snapshot = useProfileSnapshot();
    const firedRef = useRef(false);

    useEffect(() => {
        if (!userId || !isReady || firedRef.current) return;
        firedRef.current = true;

        const now = Date.now();

        // Set session timestamps
        const lastSession = Number(localStorage.getItem(LAST_SESSION_KEY) ?? 0);
        localStorage.setItem(SESSION_START_KEY, String(now));
        localStorage.setItem(LAST_SESSION_KEY, String(now));

        // Store account creation timestamp on first seen login
        if (!localStorage.getItem(ACCOUNT_CREATED_AT_KEY)) {
            localStorage.setItem(ACCOUNT_CREATED_AT_KEY, String(now));
        }

        // Fire account_created once per device
        if (localStorage.getItem(ACCOUNT_CREATED_TRACKED_KEY) !== 'true') {
            track(AnalyticsEvents.ACCOUNT_CREATED, {
                method: 'returning_user', // All users going through this code path already have an account
                // signupSource could be populated from URL state in future iterations
            });
            localStorage.setItem(ACCOUNT_CREATED_TRACKED_KEY, 'true');
        }

        // Fire returning_session engagement signal if last session was >24h ago
        if (lastSession && now - lastSession > 24 * 60 * 60 * 1000) {
            track(AnalyticsEvents.ENGAGEMENT_SIGNAL, {
                signal: 'returning_session',
                profileSnapshot: snapshot,
            });
        }
    }, [userId, isReady, track, snapshot]);
};

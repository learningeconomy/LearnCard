import { useEffect, useRef } from 'react';

import { useAnalytics } from './context';
import { AnalyticsEvents } from './events';
import {
    ACCOUNT_CREATED_AT_KEY,
    ACCOUNT_CREATED_KEY,
    LAST_SESSION_KEY,
    NEW_SIGNUP_FLAG_KEY,
    SESSION_START_KEY,
} from './useProfileSnapshot';
import { useEngagementSignal } from './useEngagementSignal';

/**
 * Fires `ACCOUNT_CREATED` once per user (localStorage gate) and
 * `ENGAGEMENT_SIGNAL { signal: 'returning_session' }` when the user
 * returns after >24h. Call once at the app root alongside
 * `useSetAnalyticsUserId`.
 *
 * **Signup detection (LC-1853 review #4):**
 * The `method` distinguishes the first-ever fire after a fresh signup
 * (`'new_signup'`) from any first-fire on a new device for an existing
 * account (`'returning_user'`). Detection looks for the
 * `NEW_SIGNUP_FLAG_KEY` localStorage flag, which `OnboardingFlow`
 * sets immediately after `wallet.invoke.createProfile()` succeeds.
 * The flag is consume-on-read.
 *
 * Mirrors the `lc_recovery_banner_dismissed` localStorage pattern
 * from RecoveryBanner.tsx.
 */
export const useAccountCreatedAndReturningSession = (
    /**
     * Truthy when a user is logged in. Accepts the `CurrentUser` object
     * directly (callers commonly pass `useCurrentUser()`) — internals
     * only use truthiness, so the precise shape doesn't matter.
     */
    user: unknown
): void => {
    const { track, isReady } = useAnalytics();
    const fireEngagement = useEngagementSignal();
    const firedRef = useRef(false);

    useEffect(() => {
        if (!user || !isReady || firedRef.current) return;
        firedRef.current = true;

        const now = Date.now();

        // Refresh session timestamps. SESSION_START_KEY tracks when the
        // current session began (consumed by msSinceSessionStart props on
        // PROFILE_ITEM_ADDED events); LAST_SESSION_KEY persists across
        // sessions to detect >24h gaps for the returning_session signal.
        const lastSession = Number(localStorage.getItem(LAST_SESSION_KEY) ?? 0);
        localStorage.setItem(SESSION_START_KEY, String(now));
        localStorage.setItem(LAST_SESSION_KEY, String(now));

        // Store account-creation timestamp the first time we see this user
        // on this device. Used by ProfileSnapshot.daysSinceSignup +
        // msSinceAccountCreated.
        if (!localStorage.getItem(ACCOUNT_CREATED_AT_KEY)) {
            localStorage.setItem(ACCOUNT_CREATED_AT_KEY, String(now));
        }

        // Fire ACCOUNT_CREATED once per user lifetime (per device).
        if (localStorage.getItem(ACCOUNT_CREATED_KEY) !== 'true') {
            // LC-1853 (review #4): consume the new-signup flag set by
            // OnboardingFlow post-createProfile. Without the flag,
            // we're seeing this user's first login on a fresh device for
            // an account that already existed elsewhere → 'returning_user'.
            const isNewSignup = localStorage.getItem(NEW_SIGNUP_FLAG_KEY) === '1';
            if (isNewSignup) localStorage.removeItem(NEW_SIGNUP_FLAG_KEY);

            track(AnalyticsEvents.ACCOUNT_CREATED, {
                method: isNewSignup ? 'new_signup' : 'returning_user',
                // signupSource could be populated from URL state / document.referrer
                // in a future iteration.
            });
            localStorage.setItem(ACCOUNT_CREATED_KEY, 'true');
        }

        // Fire returning_session engagement signal if last session was >24h ago.
        // Per-session gate inside `fireEngagement` ensures this only fires once
        // per session even if AppRouter remounts.
        if (lastSession && now - lastSession > 24 * 60 * 60 * 1000) {
            fireEngagement('returning_session');
        }
    }, [user, isReady, track, fireEngagement]);
};

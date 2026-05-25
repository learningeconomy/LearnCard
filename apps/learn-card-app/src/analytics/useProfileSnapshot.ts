import { useCallback, useMemo, useRef } from 'react';
import { useGetCredentialCount } from 'learn-card-base';
import { useSkillsCount } from '../hooks/useSkillsCount';

import type { ProfileSnapshot } from './events';

/**
 * LC-1853 analytics localStorage keys.
 *
 * Centralized here to avoid drift across the ~8 call sites that reference
 * them. Import from `@analytics` rather than re-typing the string literals.
 */
export const ACCOUNT_CREATED_AT_KEY = 'lc_account_created_at_ms';
export const ACCOUNT_CREATED_KEY = 'lc_account_created_tracked';
export const SESSION_START_KEY = 'lc_session_start_ms';
export const LAST_SESSION_KEY = 'lc_last_session_ms';
/** Set by OnboardingNetworkForm post-createProfile; consumed once by ACCOUNT_CREATED. */
export const NEW_SIGNUP_FLAG_KEY = 'lc_is_new_signup';
/** Set at earliest onboarding screen so ONBOARDING_COMPLETED reports time-in-flow, not time-on-final-form. */
export const ONBOARDING_STARTED_AT_KEY = 'lc_onboarding_started_at_ms';
/**
 * Running counter of how many `profile_data` items the user has added across
 * sessions (Skills Profile Steps 1-4). Used as `totalItemsAfter` for the
 * `profile_data` itemType, where neither `credentialCount` nor `skillsCount`
 * is the right counter.
 */
export const PROFILE_DATA_COUNT_KEY = 'lc_profile_data_count';

/**
 * Returns a synchronous snapshot of the user's current profile state.
 *
 * **Critical for LC-1853:** prefer `useProfileSnapshotCapture()` below.
 * If you must use this hook directly, do NOT assign to a ref in render —
 * that gets overwritten when React Query invalidates post-mutation and
 * inflates `totalItemsAfter`. Capture into a local variable or ref at the
 * top of your mutation handler instead, before triggering the mutation.
 */
export const useProfileSnapshot = (): ProfileSnapshot => {
    const { data: credentialCount } = useGetCredentialCount(undefined, true);
    const { total: skillsCount } = useSkillsCount();

    return useMemo(() => {
        const now = Date.now();
        const accountCreatedAt = Number(localStorage.getItem(ACCOUNT_CREATED_AT_KEY) ?? 0);

        return {
            credentialCount: Number(credentialCount ?? 0),
            hasSkillsProfile: skillsCount > 0,
            skillsCount: skillsCount ?? 0,
            daysSinceSignup: accountCreatedAt
                ? (now - accountCreatedAt) / 86_400_000
                : 0,
        };
    }, [credentialCount, skillsCount]);
};

/**
 * Snapshot-capture helper that enforces the LC-1853 pre-mutation discipline.
 *
 * Returns:
 *   - `capture()` — call this *inside* a mutation handler, *before* the
 *     mutation fires. Freezes the latest snapshot into `snapshotRef` and
 *     returns it.
 *   - `snapshotRef` — read `snapshotRef.current` in the analytics call
 *     after the mutation succeeds.
 *
 * Why a helper? The naive pattern (`profileSnapshotRef.current = snapshot`
 * in the render body) gets overwritten on the post-mutation re-render
 * triggered by React Query invalidation, so `totalItemsAfter` ends up
 * computed from the post-mutation count and overshoots. This helper keeps
 * the consumer-visible ref frozen until the consumer explicitly captures.
 *
 * Example:
 * ```tsx
 * const { capture, snapshotRef } = useProfileSnapshotCapture();
 *
 * const handleClaim = async () => {
 *   capture();                            // freeze pre-mutation snapshot
 *   await doMutation();
 *   track(AnalyticsEvents.PROFILE_ITEM_ADDED, {
 *     totalItemsAfter: snapshotRef.current.credentialCount + 1,
 *     msSinceAccountCreated: Date.now() - Number(localStorage.getItem(ACCOUNT_CREATED_AT_KEY) ?? 0),
 *     msSinceSessionStart: Date.now() - Number(localStorage.getItem(SESSION_START_KEY) ?? 0),
 *     // ...
 *   });
 * };
 * ```
 */
export const useProfileSnapshotCapture = () => {
    const snapshot = useProfileSnapshot();

    // Internal "live" ref tracking the latest snapshot each render. NOT
    // exposed to consumers — it is only read by `capture()`.
    const liveRef = useRef(snapshot);
    liveRef.current = snapshot;

    // The consumer-visible ref. Only mutated by `capture()`, never by render.
    const snapshotRef = useRef(snapshot);

    const capture = useCallback((): ProfileSnapshot => {
        snapshotRef.current = liveRef.current;
        return snapshotRef.current;
    }, []);

    return { capture, snapshotRef };
};

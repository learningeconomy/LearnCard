import { useEffect, useRef, useCallback } from 'react';
import { useAnalytics, AnalyticsEvents } from '@analytics';

const SKILL_PROFILE_STARTED_AT_KEY = 'lc_skill_profile_started_at';

/**
 * Shared hook for Skills Profile step funnel tracking.
 * Fires STEP_STARTED on mount, STEP_COMPLETED on explicit call,
 * and STEP_ABANDONED on unmount if not completed.
 *
 * @param step The step number (1-5)
 * @param getFieldsCompleted A function returning the names of completed form fields
 */
export const useSkillProfileStepFunnel = (
    step: 1 | 2 | 3 | 4 | 5,
    getFieldsCompleted: () => string[]
) => {
    const { track } = useAnalytics();
    const stepStartedAt = useRef(Date.now());
    const completedRef = useRef(false);

    // LC-1853 (review #5): `track` identity changes once at boot when the
    // analytics provider swaps from Noop → PostHog. If we depended on
    // `[step, track]` here, that transition would re-run the effect,
    // firing a spurious STEP_ABANDONED for the active step. Route
    // `track` through a ref instead so the started/abandoned pair are
    // tied strictly to mount/unmount (and explicit step changes — though
    // each SkillProfileStep N component receives a hard-coded step).
    const trackRef = useRef(track);
    trackRef.current = track;

    // Fire STEP_STARTED on mount
    useEffect(() => {
        // Store first-step timestamp for overall duration
        if (step === 1) {
            localStorage.setItem(SKILL_PROFILE_STARTED_AT_KEY, String(Date.now()));
        }

        stepStartedAt.current = Date.now();
        trackRef.current(AnalyticsEvents.SKILL_PROFILE_STEP_STARTED, { step });

        return () => {
            // Fire ABANDONED on unmount if step was not completed
            if (!completedRef.current) {
                const durationMs = Date.now() - stepStartedAt.current;
                trackRef.current(AnalyticsEvents.SKILL_PROFILE_ABANDONED, {
                    step,
                    stepDurationMs: durationMs,
                });
            }
        };
    }, [step]);

    const markStepCompleted = useCallback(() => {
        if (completedRef.current) return;
        completedRef.current = true;

        const durationMs = Date.now() - stepStartedAt.current;
        const fieldsCompleted = getFieldsCompleted();

        trackRef.current(AnalyticsEvents.SKILL_PROFILE_STEP_COMPLETED, {
            step,
            stepDurationMs: durationMs,
            fieldsCompleted,
        });
    }, [step, getFieldsCompleted]);

    return { markStepCompleted };
};

/**
 * Fire SKILL_PROFILE_COMPLETED after the last step.
 * Reads the first-step start time from localStorage.
 */
export const trackSkillProfileCompleted = (track: ReturnType<typeof useAnalytics>['track']) => {
    const firstStepStartedAt = Number(localStorage.getItem(SKILL_PROFILE_STARTED_AT_KEY) ?? Date.now());
    track(AnalyticsEvents.SKILL_PROFILE_COMPLETED, {
        totalDurationMs: Date.now() - firstStepStartedAt,
    });
};

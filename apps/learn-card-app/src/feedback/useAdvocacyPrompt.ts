import { useCallback, useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';

import { getLogger, useTenantConfig } from 'learn-card-base';

import { useAnalytics, AnalyticsEvents, type FeedbackSurface } from '@analytics';
import { feedbackGovernorStore, readRequestLog, resolveAdvocacyDecision } from './feedbackGovernor';
import { useFeedbackPrivacyEligibility } from './useFeedbackEligibility';

const log = getLogger('advocacy-prompt');

export const LEARNCARD_GITHUB_URL = 'https://github.com/learningeconomy/LearnCard';

/** Lets the success animation land before the OS prompt covers it. */
const NATIVE_PROMPT_DELAY_MS = 1800;

/** How long the card must stay mounted before it counts as presented. */
const CARD_COMMIT_DELAY_MS = 1000;

/**
 * Advocacy ask for users who have earned it (see `resolveAdvocacyDecision`).
 *
 * Native: fires the OS review prompt directly — no UI, no question, no
 * call-to-action, which is what keeps this inside Apple 5.6.1 and Google's
 * "don't ask questions before or while presenting" rule. We record the
 * attempt because neither platform tells us whether a dialog appeared.
 *
 * Web: returns `showGitHubCard` so the caller can render a dismissible
 * "star us" card. Web is not governed by store policy, so an explicit
 * call-to-action is fine there.
 */
export const useAdvocacyPrompt = (surface: FeedbackSurface) => {
    const privacyEligible = useFeedbackPrivacyEligibility();
    const { track } = useAnalytics();
    const tenantConfig = useTenantConfig();

    const [showGitHubCard, setShowGitHubCard] = useState(false);
    const [advocacyActive, setAdvocacyActive] = useState(false);
    const firedRef = useRef(false);
    const cardCommittedRef = useRef(false);
    const timerRef = useRef<ReturnType<typeof setTimeout>>();

    const isNative = Capacitor.isNativePlatform();
    const isLearnCardTenant = tenantConfig.tenantId === 'learncard';

    /**
     * `track` changes identity when the analytics provider swaps from Noop to
     * the real one, so it must not sit in the effect's dependency array: a
     * re-run mid-delay would clear the pending timer, then bail on `firedRef`
     * without re-arming it, losing the ask entirely.
     */
    const trackRef = useRef(track);
    trackRef.current = track;

    /**
     * Spends the yearly advocacy budget for the card. Deliberately fires on
     * "presented or acted on" rather than only on click/dismiss: a card the
     * user ignores must still consume the ask, otherwise they'd be shown it
     * again every session. Navigating away before it renders long enough to
     * be seen leaves the budget untouched.
     */
    const commitCardAsk = useCallback(() => {
        if (cardCommittedRef.current) return;

        cardCommittedRef.current = true;
        feedbackGovernorStore.set.recordAdvocacyRequested();
        void trackRef.current(AnalyticsEvents.GITHUB_STAR_CARD_SHOWN, { trigger: surface });
    }, [surface]);

    useEffect(() => {
        if (firedRef.current || !privacyEligible) return;
        if (resolveAdvocacyDecision() !== 'eligible') return;

        firedRef.current = true;
        feedbackGovernorStore.set.consumeSessionPrompt();

        if (isNative) {
            const platform = Capacitor.getPlatform() as 'ios' | 'android';

            setAdvocacyActive(true);

            timerRef.current = setTimeout(() => {
                void (async () => {
                    try {
                        const { InAppReview } = await import('@capacitor-community/in-app-review');

                        await InAppReview.requestReview();

                        feedbackGovernorStore.set.recordAdvocacyRequested();

                        void trackRef.current(AnalyticsEvents.STORE_REVIEW_REQUESTED, {
                            platform,
                            trigger: surface,
                            asksThisYear: readRequestLog(feedbackGovernorStore.get.review()).length,
                        });
                    } catch (e) {
                        // No dialog appeared, so hand the screen back to the
                        // sentiment strip instead of leaving the user with
                        // neither ask.
                        log.debug('store review unavailable', e);
                        setAdvocacyActive(false);
                    }
                })();
            }, NATIVE_PROMPT_DELAY_MS);

            return;
        }

        if (!isLearnCardTenant) return;

        setShowGitHubCard(true);
        setAdvocacyActive(true);

        timerRef.current = setTimeout(commitCardAsk, CARD_COMMIT_DELAY_MS);
    }, [privacyEligible, isNative, isLearnCardTenant, surface, commitCardAsk]);

    useEffect(() => () => clearTimeout(timerRef.current), []);

    const handleGitHubClick = useCallback(() => {
        commitCardAsk();
        void track(AnalyticsEvents.GITHUB_STAR_CARD_CLICKED, { trigger: surface });
        window.open(LEARNCARD_GITHUB_URL, '_blank', 'noopener,noreferrer');
        setShowGitHubCard(false);
    }, [commitCardAsk, surface, track]);

    const handleGitHubDismiss = useCallback(() => {
        commitCardAsk();
        void track(AnalyticsEvents.GITHUB_STAR_CARD_DISMISSED, { trigger: surface });
        setShowGitHubCard(false);
    }, [commitCardAsk, surface, track]);

    return { showGitHubCard, advocacyActive, handleGitHubClick, handleGitHubDismiss };
};

export default useAdvocacyPrompt;

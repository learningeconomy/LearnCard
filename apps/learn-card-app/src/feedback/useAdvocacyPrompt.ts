import { useCallback, useEffect, useRef, useState } from 'react';
import { useIonViewWillLeave } from '@ionic/react';
import { Capacitor } from '@capacitor/core';

import { getLogger, useTenantConfig } from 'learn-card-base';

import { useAnalytics, AnalyticsEvents, type FeedbackSurface } from '@analytics';
import { feedbackGovernorStore, readRequestLog, resolveAdvocacyDecision } from './feedbackGovernor';
import { useFeedbackPrivacyEligibility } from './useFeedbackEligibility';

const log = getLogger('advocacy-prompt');

export const LEARNCARD_GITHUB_URL = 'https://github.com/learningeconomy/LearnCard';

/**
 * Long enough to clear the success celebration — confetti runs to roughly
 * 2050ms (250ms stagger + a 1300-1800ms fall) and the card reveal takes 700ms.
 * Landing an OS modal mid-animation reads as hijacking the reward, and because
 * the platforms never report whether the dialog appeared we would have no way
 * to know we had wasted one of only two asks a year.
 */
const NATIVE_PROMPT_DELAY_MS = 2400;

/** How long the card must stay mounted before it counts as presented. */
const CARD_COMMIT_DELAY_MS = 1000;

/**
 * Ionic keeps visited pages mounted in the router outlet, so two cached success
 * screens can both hold an armed prompt. A module-scope latch keeps only the
 * first one live; it is released whenever that prompt is cancelled or fires.
 */
let advocacyArmed = false;

/**
 * Advocacy ask for users who have earned it (see `resolveAdvocacyDecision`).
 *
 * Native: fires the OS review prompt directly — no UI, no question, no
 * call-to-action, which is what keeps this inside Apple 5.6.1 and Google's
 * "don't ask questions before or while presenting" rule. We record the
 * attempt because neither platform tells us whether a dialog appeared.
 *
 * Because the ask is an interruptive OS modal we only fire it from a verified
 * idle point: the celebration has finished, the page is still the one on screen,
 * the app is foregrounded, and the user has not moved on. Anything else cancels
 * without spending the ask.
 *
 * Web: returns `showGitHubCard` so the caller can render a dismissible
 * "star us" card. Web is not governed by store policy, so an explicit
 * call-to-action is fine there.
 */
export const useAdvocacyPrompt = (surface: FeedbackSurface, allowAdvocacy = true) => {
    const privacyEligible = useFeedbackPrivacyEligibility();
    const { track } = useAnalytics();
    const tenantConfig = useTenantConfig();

    const [showGitHubCard, setShowGitHubCard] = useState(false);
    const [advocacyActive, setAdvocacyActive] = useState(false);
    const firedRef = useRef(false);
    const cardCommittedRef = useRef(false);
    const timerRef = useRef<ReturnType<typeof setTimeout>>();
    const ownsLatchRef = useRef(false);

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
     * Abandons a prompt that was armed but never presented, and puts the user
     * back where they were. Nothing is recorded, so the ask stays available for
     * a future success screen.
     */
    const cancelPending = useCallback(() => {
        if (!firedRef.current || cardCommittedRef.current) return;

        clearTimeout(timerRef.current);
        timerRef.current = undefined;
        firedRef.current = false;

        if (ownsLatchRef.current) {
            advocacyArmed = false;
            ownsLatchRef.current = false;
        }

        setAdvocacyActive(false);
        setShowGitHubCard(false);
    }, []);

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
        if (!allowAdvocacy || firedRef.current || advocacyArmed || !privacyEligible) return;
        if (resolveAdvocacyDecision() !== 'eligible') return;

        firedRef.current = true;
        advocacyArmed = true;
        ownsLatchRef.current = true;
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
                    } finally {
                        advocacyArmed = false;
                        ownsLatchRef.current = false;
                    }
                })();
            }, NATIVE_PROMPT_DELAY_MS);

            return;
        }

        if (!isLearnCardTenant) return;

        setShowGitHubCard(true);
        setAdvocacyActive(true);

        timerRef.current = setTimeout(commitCardAsk, CARD_COMMIT_DELAY_MS);
    }, [allowAdvocacy, privacyEligible, isNative, isLearnCardTenant, surface, commitCardAsk]);

    // Ionic caches visited pages, so leaving the view does not unmount this
    // hook — without this the OS modal would surface over whatever page the
    // user navigated to. See the same note in `useHeaderScrollSync`.
    useIonViewWillLeave(cancelPending);

    useEffect(() => {
        if (!isNative) return;

        const listener = (async () => {
            try {
                const { App } = await import('@capacitor/app');

                return await App.addListener('appStateChange', ({ isActive }) => {
                    if (!isActive) cancelPending();
                });
            } catch (e) {
                log.debug('app state listener unavailable', e);

                return undefined;
            }
        })();

        return () => {
            void listener.then(handle => handle?.remove());
        };
    }, [isNative, cancelPending]);

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

import { useCallback, useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';

import { getLogger, useTenantConfig } from 'learn-card-base';

import { useAnalytics, AnalyticsEvents, type FeedbackSurface } from '@analytics';
import { feedbackGovernorStore, resolveAdvocacyDecision } from './feedbackGovernor';
import { useFeedbackPrivacyEligibility } from './useFeedbackEligibility';

const log = getLogger('advocacy-prompt');

export const LEARNCARD_GITHUB_URL = 'https://github.com/learningeconomy/LearnCard';

/** Lets the success animation land before the OS prompt covers it. */
const NATIVE_PROMPT_DELAY_MS = 1800;

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

    const isNative = Capacitor.isNativePlatform();
    const isLearnCardTenant = tenantConfig?.tenantId === 'learncard';

    useEffect(() => {
        if (firedRef.current || !privacyEligible) return;
        if (resolveAdvocacyDecision() !== 'eligible') return;

        firedRef.current = true;

        if (isNative) {
            const platform = Capacitor.getPlatform() as 'ios' | 'android';

            setAdvocacyActive(true);

            const timer = setTimeout(() => {
                void (async () => {
                    try {
                        const { InAppReview } = await import('@capacitor-community/in-app-review');

                        await InAppReview.requestReview();

                        feedbackGovernorStore.set.recordAdvocacyRequested();

                        void track(AnalyticsEvents.STORE_REVIEW_REQUESTED, {
                            platform,
                            trigger: surface,
                            asksThisYear:
                                feedbackGovernorStore.get.review().requestLog?.length ?? 1,
                        });
                    } catch (e) {
                        log.debug('store review unavailable', e);
                    }
                })();
            }, NATIVE_PROMPT_DELAY_MS);

            return () => clearTimeout(timer);
        }

        if (!isLearnCardTenant) return undefined;

        feedbackGovernorStore.set.recordAdvocacyRequested();
        setShowGitHubCard(true);
        setAdvocacyActive(true);
        void track(AnalyticsEvents.GITHUB_STAR_CARD_SHOWN, { trigger: surface });

        return undefined;
    }, [privacyEligible, isNative, isLearnCardTenant, surface, track]);

    const handleGitHubClick = useCallback(() => {
        void track(AnalyticsEvents.GITHUB_STAR_CARD_CLICKED, { trigger: surface });
        window.open(LEARNCARD_GITHUB_URL, '_blank', 'noopener,noreferrer');
        setShowGitHubCard(false);
    }, [surface, track]);

    const handleGitHubDismiss = useCallback(() => {
        void track(AnalyticsEvents.GITHUB_STAR_CARD_DISMISSED, { trigger: surface });
        setShowGitHubCard(false);
    }, [surface, track]);

    return { showGitHubCard, advocacyActive, handleGitHubClick, handleGitHubDismiss };
};

export default useAdvocacyPrompt;

/**
 * OnboardRoute — cold-start / first-mile flow (docs § 6).
 *
 * Stepper: DiscoverStart → CredentialScan → SuggestionGrid.
 *
 * `DiscoverStart` is the new front door: a peer-level chooser between
 * picking a curated showcase journey (instant-load, short-circuits the
 * stepper and lands the learner on `/pathways/today`) and describing
 * their own goal (forwards into the existing scan/suggestions flow,
 * which is unchanged).
 *
 * Picking a suggestion still instantiates the template, sets it as the
 * active pathway, and redirects to Today. The whole flow continues to
 * work with an empty wallet and without network — the "cold-start
 * always renders" invariant is preserved.
 */

import React, { useMemo, useState } from 'react';

import { useHistory } from 'react-router-dom';

import { AnalyticsEvents, useAnalytics } from '../../../analytics';
import { pathwayStore } from '../../../stores/pathways';
import { useLearnerDid } from '../hooks/useLearnerDid';

import { classifyAltitude } from './classifyAltitude';
import CredentialScan from './CredentialScan';
import DiscoverStart from './DiscoverStart';
import SuggestionGrid from './SuggestionGrid';
import { instantiateTemplate } from './templates';
import {
    suggestPathways,
    type PathwaySuggestion,
    type WalletSignal,
} from './suggestPathways';

// `discover` replaces the legacy `goal`-only entry: a peer-level
// chooser between curated showcases and the free-text goal
// capture. The downstream `scan` and `suggestions` steps are
// unchanged so anyone deep-linking into them continues to work.
type Step = 'discover' | 'scan' | 'suggestions';

const OnboardRoute: React.FC = () => {
    const history = useHistory();
    const analytics = useAnalytics();
    const learnerDid = useLearnerDid();

    const [step, setStep] = useState<Step>('discover');
    const [goalText, setGoalText] = useState('');
    const [wallet, setWallet] = useState<WalletSignal>({ tags: [] });
    const [renderStartedAt, setRenderStartedAt] = useState<number | null>(null);

    // Run the altitude classifier once per goal-text change. Pure, fast,
    // deterministic — no point memoizing against anything else.
    const classification = useMemo(() => classifyAltitude(goalText), [goalText]);

    // Only pass the classifier's altitude through to ranking when it's
    // meaningfully confident. For empty or shapeless input the classifier
    // falls back to 'aspiration' at low confidence; piping that in would
    // over-penalize the non-aspiration templates we want on the default
    // cold-start grid.
    const rankingAltitude = useMemo(() => {
        if (goalText.trim().length === 0) return undefined;
        if (classification.confidence === 'low') return undefined;

        return classification.altitude;
    }, [goalText, classification]);

    const suggestions = useMemo(
        () => suggestPathways({ goalText, wallet, altitude: rankingAltitude }),
        [goalText, wallet, rankingAltitude],
    );

    const goToScan = (text: string) => {
        setGoalText(text);
        analytics.track(AnalyticsEvents.PATHWAYS_ONBOARD_STARTED, {
            hasWallet: false,
            goalMode: text.length > 0 ? 'free-text' : 'skipped',
        });
        setStep('scan');
    };

    const goToSuggestions = (signal: WalletSignal) => {
        setWallet(signal);
        setRenderStartedAt(Date.now());
        setStep('suggestions');
    };

    // Fire "suggestionsRendered" once, the first time the grid paints.
    React.useEffect(() => {
        if (step !== 'suggestions' || renderStartedAt === null) return;

        analytics.track(AnalyticsEvents.PATHWAYS_ONBOARD_SUGGESTIONS_RENDERED, {
            latencyMs: Date.now() - renderStartedAt,
            vectorOnly: true,
            suggestionCount: suggestions.length,
        });

        // Only emit once per render cycle.
        setRenderStartedAt(null);
    }, [step, renderStartedAt, suggestions.length, analytics]);

    const handlePick = (suggestion: PathwaySuggestion, position: number) => {
        const now = new Date().toISOString();

        // Persist the classifier's altitude on the created pathway so
        // the Today-tab banner can render altitude-appropriate phrasing
        // without re-running the classifier on every mount. Undefined
        // when the learner skipped → instantiate falls back to the
        // template's own altitude.
        const pathway = instantiateTemplate(suggestion.template, {
            ownerDid: learnerDid,
            now,
            learnerGoalText: goalText,
            intentAltitude: rankingAltitude,
        });

        pathwayStore.set.upsertPathway(pathway);
        pathwayStore.set.setActivePathway(pathway.id);

        analytics.track(AnalyticsEvents.PATHWAYS_ONBOARD_SUGGESTION_ACCEPTED, {
            suggestionId: suggestion.template.id,
            position,
        });

        history.replace('/pathways/today');
    };

    switch (step) {
        case 'discover':
            return (
                <DiscoverStart
                    initialGoal={goalText}
                    onContinueWithGoal={goToScan}
                    onSkip={() => goToScan('')}
                />
            );

        case 'scan':
            return (
                <CredentialScan
                    onContinue={goToSuggestions}
                    onBack={() => setStep('discover')}
                />
            );

        case 'suggestions':
            return (
                <SuggestionGrid
                    suggestions={suggestions}
                    goalText={goalText}
                    onPick={(s) => {
                        const position = suggestions.findIndex(
                            x => x.template.id === s.template.id,
                        );
                        handlePick(s, position);
                    }}
                    onBack={() => setStep('scan')}
                />
            );
    }
};

export default OnboardRoute;

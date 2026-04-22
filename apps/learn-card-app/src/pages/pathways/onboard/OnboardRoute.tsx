/**
 * OnboardRoute — cold-start / first-mile flow (docs § 6).
 *
 * Three-step stepper: GoalCapture → CredentialScan → SuggestionGrid.
 * Picking a suggestion instantiates the template, sets it as the active
 * pathway, and redirects to Today. The whole flow works with an empty
 * wallet and without network — the "cold-start always renders" invariant.
 */

import React, { useMemo, useState } from 'react';

import { useHistory } from 'react-router-dom';

import { AnalyticsEvents, useAnalytics } from '../../../analytics';
import { pathwayStore } from '../../../stores/pathways';
import { useLearnerDid } from '../hooks/useLearnerDid';

import { classifyAltitude } from './classifyAltitude';
import CredentialScan from './CredentialScan';
import GoalCapture from './GoalCapture';
import SuggestionGrid from './SuggestionGrid';
import { instantiateTemplate } from './templates';
import {
    suggestPathways,
    type PathwaySuggestion,
    type WalletSignal,
} from './suggestPathways';

type Step = 'goal' | 'scan' | 'suggestions';

const OnboardRoute: React.FC = () => {
    const history = useHistory();
    const analytics = useAnalytics();
    const learnerDid = useLearnerDid();

    const [step, setStep] = useState<Step>('goal');
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
        case 'goal':
            return (
                <GoalCapture
                    initial={goalText}
                    onContinue={goToScan}
                    onSkip={() => goToScan('')}
                />
            );

        case 'scan':
            return (
                <CredentialScan
                    onContinue={goToSuggestions}
                    onBack={() => setStep('goal')}
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

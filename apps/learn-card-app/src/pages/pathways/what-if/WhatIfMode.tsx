/**
 * WhatIfMode — simulate alternative pathways with explicit tradeoffs.
 *
 * Phase 4 surface (docs § 5, § 17). Shows the learner two things:
 *
 *   1. The **baseline** summary — how their current pathway plays
 *      out from where they are right now (ETA, remaining step count,
 *      destination).
 *   2. A small set of honest **scenarios** — alternative shapes of
 *      the same pathway (fast-track, deep practice, external-light)
 *      with their ETA deltas and explicit tradeoffs across the
 *      shared `{time | cost | effort | difficulty |
 *      external-dependency}` vocabulary.
 *
 * All the simulation work is pure and lives in `./simulator.ts` and
 * `./generators.ts`; this component is a renderer only. No network,
 * no mutation — What-If is a "look, don't touch" surface so the
 * learner can reason about alternatives without committing to one.
 * A future Phase 4+ extension will let a learner accept a scenario
 * and produce a `Proposal` they can commit through the existing
 * proposals pipeline, but that mutation seam is explicitly out of
 * scope for v1.
 *
 * ## Empty states
 *
 *   - No active pathway → gentle prompt back to onboard/today.
 *   - No destination / unroutable → honest "can't simulate this
 *     yet" message. Reaching the destination is a structural
 *     precondition for comparing ETAs.
 *   - No non-trivial scenarios → "your path is already lean"
 *     affirmation. Not every pathway has review / external /
 *     practice-multipliable shape, and saying so is more useful
 *     than fabricating options.
 *
 * ## Visual language
 *
 * Mirrors Today/Map: page-wide emerald top gradient, cards on a
 * neutral surface, rounded-[20px] pill shapes for interactive
 * elements. Tradeoff directions render as small colored arrows
 * (better=emerald, worse=amber, neutral=grayscale) — we
 * deliberately avoid red for "worse" because the point of What-If
 * is honesty without scaremongering.
 */

import React, { useMemo, useState } from 'react';

import { IonIcon } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
    arrowDownOutline,
    arrowForwardOutline,
    arrowUpOutline,
    barbellOutline,
    cashOutline,
    compassOutline,
    flashOutline,
    layersOutline,
    linkOutline,
    removeOutline,
    timeOutline,
} from 'ionicons/icons';

import { AnalyticsEvents, useAnalytics } from '../../../analytics';
import { pathwayStore, proposalStore } from '../../../stores/pathways';
import { seedChosenRoute } from '../core/chosenRoute';
import { useLearnerDid } from '../hooks/useLearnerDid';
import { formatEta } from '../map/route';
import RouteDiffSummary from '../proposals/RouteDiffSummary';
import type { Pathway, Proposal, Tradeoff } from '../types';

import { generateScenarios } from './generators';
import { simulateAll, simulateBaseline } from './simulator';
import {
    buildProposalFromScenario,
    classifyScenarioForProposal,
    computeTargetRoute,
    type ToProposalReason,
} from './toProposal';
import type { ScenarioResult, SimulationSummary } from './types';

// -----------------------------------------------------------------
// Tradeoff glyph + label
// -----------------------------------------------------------------

const DIMENSION_ICON: Record<Tradeoff['dimension'], string> = {
    time: timeOutline,
    cost: cashOutline,
    effort: flashOutline,
    difficulty: barbellOutline,
    'external-dependency': linkOutline,
};

const DIMENSION_LABEL: Record<Tradeoff['dimension'], string> = {
    time: 'Time',
    cost: 'Cost',
    effort: 'Effort',
    difficulty: 'Difficulty',
    'external-dependency': 'External modules',
};

/**
 * Color tokens per tradeoff direction. Kept as Tailwind class
 * fragments rather than inline styles so they tree-shake and
 * obey the tenant theme when the palette evolves.
 */
const DIRECTION_CLASSES: Record<
    Tradeoff['direction'],
    { chip: string; icon: string; label: string }
> = {
    better: {
        chip: 'bg-emerald-50 border-emerald-100',
        icon: 'text-emerald-600',
        label: 'text-emerald-700',
    },
    worse: {
        chip: 'bg-amber-50 border-amber-100',
        icon: 'text-amber-600',
        label: 'text-amber-700',
    },
    neutral: {
        chip: 'bg-grayscale-100 border-grayscale-200',
        icon: 'text-grayscale-500',
        label: 'text-grayscale-700',
    },
};

const DIRECTION_ICON: Record<Tradeoff['direction'], string> = {
    better: arrowDownOutline,
    worse: arrowUpOutline,
    neutral: removeOutline,
};

const TradeoffRow: React.FC<{ tradeoff: Tradeoff }> = ({ tradeoff }) => {
    const tone = DIRECTION_CLASSES[tradeoff.direction];

    return (
        <li
            className={`flex items-start gap-3 rounded-2xl border px-3 py-2.5 ${tone.chip}`}
        >
            <IonIcon
                icon={DIMENSION_ICON[tradeoff.dimension]}
                className={`text-base mt-0.5 shrink-0 ${tone.icon}`}
            />

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <p className="text-xs font-medium uppercase tracking-wide text-grayscale-500">
                        {DIMENSION_LABEL[tradeoff.dimension]}
                    </p>

                    <IonIcon
                        icon={DIRECTION_ICON[tradeoff.direction]}
                        className={`text-[10px] ${tone.icon}`}
                    />
                </div>

                <p className={`text-sm leading-snug ${tone.label}`}>
                    {tradeoff.deltaDescription}
                </p>
            </div>
        </li>
    );
};

// -----------------------------------------------------------------
// Delta chips
// -----------------------------------------------------------------

const DeltaChip: React.FC<{
    label: string;
    value: string;
    tone: 'better' | 'worse' | 'neutral';
}> = ({ label, value, tone }) => {
    const classes = DIRECTION_CLASSES[tone];

    return (
        <div
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${classes.chip}`}
        >
            <IonIcon
                icon={DIRECTION_ICON[tone]}
                className={`text-xs ${classes.icon}`}
            />

            <span className={`text-xs font-medium ${classes.label}`}>
                {value} {label}
            </span>
        </div>
    );
};

/**
 * Pick a tone for a numeric delta. Negative deltas lean "better"
 * for ETA and step-count (less is usually good); zero is neutral;
 * positive is "worse". Tradeoffs carry their own directions and
 * don't pass through this helper.
 */
const toneForDelta = (delta: number): 'better' | 'worse' | 'neutral' => {
    if (delta < 0) return 'better';
    if (delta > 0) return 'worse';
    return 'neutral';
};

const formatMinutesDelta = (minutes: number): string => {
    const abs = Math.abs(minutes);
    if (abs < 60) return `${Math.round(abs)}m`;
    const hours = Math.round((abs / 60) * 10) / 10;
    return `${hours}h`;
};

// -----------------------------------------------------------------
// Baseline + scenario cards
// -----------------------------------------------------------------

const BaselineCard: React.FC<{
    goal: string;
    baseline: SimulationSummary;
}> = ({ goal, baseline }) => (
    <section className="p-5 rounded-[20px] bg-white border border-grayscale-200 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden />

            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-700">
                Your path today
            </p>
        </div>

        <h2 className="text-lg font-semibold text-grayscale-900 leading-snug">
            {goal}
        </h2>

        <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1.5 rounded-full border border-grayscale-200 bg-grayscale-10 px-3 py-1">
                <IonIcon
                    icon={timeOutline}
                    className="text-sm text-grayscale-500"
                />
                <span className="text-xs font-medium text-grayscale-700">
                    {baseline.etaMinutes !== null
                        ? formatEta(baseline.etaMinutes)
                        : 'No ETA yet'}
                </span>
            </div>

            <div className="flex items-center gap-1.5 rounded-full border border-grayscale-200 bg-grayscale-10 px-3 py-1">
                <IonIcon
                    icon={layersOutline}
                    className="text-sm text-grayscale-500"
                />
                <span className="text-xs font-medium text-grayscale-700">
                    {baseline.remainingSteps !== null
                        ? `${baseline.remainingSteps} ${baseline.remainingSteps === 1 ? 'step' : 'steps'} left`
                        : 'No route yet'}
                </span>
            </div>
        </div>

        <p className="text-xs text-grayscale-500 leading-relaxed">
            Everything below is compared against this baseline. Scenarios never
            change your real pathway — this is a look, not a commitment.
        </p>
    </section>
);

interface ScenarioCardProps {
    result: ScenarioResult;
    /**
     * Live classification of the scenario's convertibility. The
     * parent computes this (so a pathway change re-memoizes both
     * baseline and classifications in one pass) and passes it in.
     * `null` means "no opinion yet" — renders as a non-actionable card.
     */
    convertibility: ToProposalReason | null;
    /**
     * The active pathway — used to resolve node ids to titles when
     * rendering the route-diff preview. Nullable so the card
     * degrades to a no-preview view when the pathway isn't loaded.
     */
    pathway: Pathway | null;
    /**
     * The proposed route the scenario would swap to, if accepted.
     * Computed via `computeTargetRoute` by the parent so the UI can
     * memoize both `convertibility` and the route diff in one pass.
     * `null` when the scenario isn't convertible or has no route-
     * level effect.
     */
    targetRoute: readonly string[] | null;
    /** Invoked when the learner asks to turn the scenario into a proposal. */
    onAccept?: () => void;
    /** Disables the accept button while a sibling card is being processed. */
    busy?: boolean;
    /**
     * Whether the card is currently selected for side-by-side
     * comparison. Selected cards get an indigo border; a check
     * toggles selection. `null` means comparison mode isn't active.
     */
    comparisonSelected?: boolean;
    /** Tap handler for the comparison checkbox, when comparison mode is on. */
    onToggleComparison?: () => void;
}

const ScenarioCard: React.FC<ScenarioCardProps> = ({
    result,
    convertibility,
    pathway,
    targetRoute,
    onAccept,
    busy = false,
    comparisonSelected = false,
    onToggleComparison,
}) => {
    const { scenario, simulation, deltas, tradeoffs } = result;

    const etaChip =
        deltas.etaMinutes !== null && deltas.etaMinutes !== 0 ? (
            <DeltaChip
                label={deltas.etaMinutes < 0 ? 'less time' : 'more time'}
                value={formatMinutesDelta(deltas.etaMinutes)}
                tone={toneForDelta(deltas.etaMinutes)}
            />
        ) : null;

    const stepsChip =
        deltas.steps !== null && deltas.steps !== 0 ? (
            <DeltaChip
                label={Math.abs(deltas.steps) === 1 ? 'step' : 'steps'}
                value={`${deltas.steps < 0 ? '\u2212' : '+'}${Math.abs(deltas.steps)}`}
                tone={toneForDelta(deltas.steps)}
            />
        ) : null;

    const canAccept = convertibility?.kind === 'ok';
    const preview = convertibility && convertibility.kind !== 'ok';

    // Show the route-diff strip whenever the scenario has a route-level
    // effect. A scenario with `targetRoute === null` either has no
    // overlap with the current walk or isn't convertible; in either
    // case a diff strip would be a lie.
    const currentRoute = pathway?.chosenRoute;
    const showRouteDiff = targetRoute !== null && targetRoute.length >= 2;

    return (
        <article
            className={`relative p-5 rounded-[20px] bg-white shadow-sm space-y-4 border transition-colors ${
                comparisonSelected
                    ? 'border-indigo-300 ring-2 ring-indigo-100'
                    : 'border-grayscale-200'
            }`}
        >
            <header className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                    <h3 className="text-base font-semibold text-grayscale-900 leading-snug">
                        {scenario.title}
                    </h3>

                    <p className="text-sm text-grayscale-600 leading-relaxed">
                        {scenario.subtitle}
                    </p>
                </div>

                {/*
                    Comparison checkbox — only rendered when the parent
                    has enabled comparison mode. Tapping toggles this
                    card in/out of the comparison set; selected cards
                    get an indigo ring (above) so the selection state
                    reads at a glance.
                */}
                {onToggleComparison && canAccept && (
                    <button
                        type="button"
                        onClick={onToggleComparison}
                        aria-pressed={comparisonSelected}
                        aria-label={
                            comparisonSelected
                                ? 'Remove from comparison'
                                : 'Add to comparison'
                        }
                        className={`shrink-0 w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${
                            comparisonSelected
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'bg-white border-grayscale-300 hover:border-indigo-400 text-transparent'
                        }`}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-4 h-4"
                            aria-hidden
                        >
                            <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </button>
                )}
            </header>

            {(etaChip || stepsChip || simulation.etaMinutes !== null) && (
                <div className="flex flex-wrap gap-2">
                    {simulation.etaMinutes !== null && (
                        <div className="flex items-center gap-1.5 rounded-full border border-grayscale-200 bg-grayscale-10 px-3 py-1">
                            <IonIcon
                                icon={timeOutline}
                                className="text-sm text-grayscale-500"
                            />
                            <span className="text-xs font-medium text-grayscale-700">
                                {formatEta(simulation.etaMinutes)} total
                            </span>
                        </div>
                    )}
                    {etaChip}
                    {stepsChip}
                </div>
            )}

            {tradeoffs.length > 0 && (
                <ul className="space-y-2">
                    {tradeoffs.map((t, i) => (
                        <TradeoffRow key={`${t.dimension}-${i}`} tradeoff={t} />
                    ))}
                </ul>
            )}

            {/*
                Route-diff preview — the heart of the "compare your
                route to the scenario's route" story. RouteDiffSummary
                renders the proposed walk as a strip of step pills,
                with kept steps in emerald, dropped steps in a muted
                "falling off your walk" footer, and any new steps
                in indigo. Hidden when the scenario has no route-
                level effect (pure effort-multiplier scenarios) or
                when there's no committed walk to compare against.
            */}
            {showRouteDiff && (
                <div className="p-3 rounded-2xl bg-grayscale-10 border border-grayscale-100">
                    <RouteDiffSummary
                        current={currentRoute}
                        proposed={targetRoute ?? undefined}
                        pathway={pathway}
                    />
                </div>
            )}

            {/*
                Commit seam — the Accept button routes through
                `buildProposalFromScenario` and lands in the existing
                proposals queue. We deliberately keep the action on
                the card (not a top-level "pick a scenario" wizard)
                because the tradeoff context the learner just read is
                the reason they're committing; hiding the commit
                affordance behind another click would separate
                decision from action.

                When the scenario isn't convertible today (effort-
                multiplier-only, no-effect against the live pathway),
                we surface a one-line reason instead of the button.
                That's the honest degradation — no placeholder
                button, no "coming soon" toast.
            */}
            {canAccept && onAccept && (
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <button
                        type="button"
                        onClick={onAccept}
                        disabled={busy}
                        className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-[20px] bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Try this path
                        <IonIcon icon={arrowForwardOutline} className="text-base" />
                    </button>

                    <p className="text-xs text-grayscale-500 leading-relaxed sm:self-center">
                        Sends a proposal to your queue — you choose whether to commit
                        from there.
                    </p>
                </div>
            )}

            {preview && (
                <p className="text-xs text-grayscale-500 leading-relaxed italic pt-1">
                    {convertibility!.message}
                </p>
            )}
        </article>
    );
};

// -----------------------------------------------------------------
// Revert-to-original-walk card
// -----------------------------------------------------------------

/**
 * Special-cased "return to the original walk" card. Sits above the
 * scenario list when the pathway's committed route has drifted from
 * the entry→destination seed that `seedChosenRoute` produces from
 * the graph. Tapping "Restore original" emits a route-swap proposal
 * with the seeded ids.
 *
 * Not a real `ScenarioResult` because it isn't a *scenario* — it's a
 * reset, not an alternative. Rendering it inline keeps the "return"
 * affordance near the scenario list without polluting the scenarios
 * array with synthetic entries.
 */
const RevertWalkCard: React.FC<{
    pathway: Pathway;
    originalWalk: readonly string[];
    busy: boolean;
    onAccept: () => void;
}> = ({ pathway, originalWalk, busy, onAccept }) => (
    <section className="p-5 rounded-[20px] bg-white border border-indigo-200 shadow-sm space-y-4">
        <header className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-1.5">
                    <span
                        className="w-1.5 h-1.5 rounded-full bg-indigo-500"
                        aria-hidden
                    />
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-indigo-700">
                        Return to original walk
                    </p>
                </div>

                <h3 className="text-base font-semibold text-grayscale-900 leading-snug">
                    Swap back to the pathway’s seeded route
                </h3>

                <p className="text-sm text-grayscale-600 leading-relaxed">
                    Your committed walk drifted from the default. Go
                    back to the entry→destination path that matches
                    how the pathway was authored.
                </p>
            </div>
        </header>

        <div className="p-3 rounded-2xl bg-grayscale-10 border border-grayscale-100">
            <RouteDiffSummary
                current={pathway.chosenRoute}
                proposed={originalWalk}
                pathway={pathway}
            />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
                type="button"
                onClick={onAccept}
                disabled={busy}
                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-[20px] bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
                Restore original
                <IonIcon icon={arrowForwardOutline} className="text-base" />
            </button>

            <p className="text-xs text-grayscale-500 leading-relaxed sm:self-center">
                Sends a proposal to your queue — commit from there to
                lock the swap in.
            </p>
        </div>
    </section>
);

// -----------------------------------------------------------------
// Comparison overlay — two routes side by side
// -----------------------------------------------------------------

/**
 * Lightweight Phase C compare-two-scenarios surface. When the
 * learner has two scenarios selected in compare mode, this renders
 * as a full-screen overlay with both route diffs stacked against the
 * current walk. Tapping the backdrop or the close button dismisses.
 *
 * The overlay intentionally *doesn't* commit anything on its own —
 * it's a preview. The learner still accepts via the individual
 * scenario cards behind it. Keeping accept on the cards means the
 * comparison view can stay ephemeral (no proposal lifecycle) while
 * still providing the route-vs-route clarity the user asked for.
 */
const ComparisonOverlay: React.FC<{
    pathway: Pathway;
    scenarioA: ScenarioResult | undefined;
    scenarioB: ScenarioResult | undefined;
    routeA: readonly string[] | null;
    routeB: readonly string[] | null;
    onClose: () => void;
}> = ({ pathway, scenarioA, scenarioB, routeA, routeB, onClose }) => {
    // Defensive: if either scenario lookup failed (stale selection
    // after the pathway changed), close silently so the overlay
    // doesn't render an empty frame.
    if (!scenarioA || !scenarioB) return null;

    return (
        <div
            className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-grayscale-900/40 backdrop-blur-sm font-poppins"
            role="dialog"
            aria-label="Compare two scenarios"
            onClick={e => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-[24px] shadow-2xl p-6 space-y-5">
                <header className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-indigo-700">
                            Side by side
                        </p>
                        <h2 className="text-lg font-semibold text-grayscale-900 leading-snug">
                            Compare two paths
                        </h2>
                        <p className="text-xs text-grayscale-600 leading-relaxed">
                            Both walks are compared against your current
                            route. Accept one from its card.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close comparison"
                        className="shrink-0 w-8 h-8 rounded-full bg-grayscale-100 text-grayscale-600 hover:bg-grayscale-200 hover:text-grayscale-900 flex items-center justify-center transition-colors"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-4 h-4"
                            aria-hidden
                        >
                            <path
                                fillRule="evenodd"
                                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </button>
                </header>

                <ComparisonColumn
                    label="Path A"
                    title={scenarioA.scenario.title}
                    subtitle={scenarioA.scenario.subtitle}
                    pathway={pathway}
                    currentRoute={pathway.chosenRoute}
                    proposedRoute={routeA}
                    etaDelta={scenarioA.deltas.etaMinutes}
                    stepsDelta={scenarioA.deltas.steps}
                />

                <ComparisonColumn
                    label="Path B"
                    title={scenarioB.scenario.title}
                    subtitle={scenarioB.scenario.subtitle}
                    pathway={pathway}
                    currentRoute={pathway.chosenRoute}
                    proposedRoute={routeB}
                    etaDelta={scenarioB.deltas.etaMinutes}
                    stepsDelta={scenarioB.deltas.steps}
                />
            </div>
        </div>
    );
};

const ComparisonColumn: React.FC<{
    label: string;
    title: string;
    subtitle: string;
    pathway: Pathway;
    currentRoute: readonly string[] | undefined;
    proposedRoute: readonly string[] | null;
    etaDelta: number | null;
    stepsDelta: number | null;
}> = ({
    label,
    title,
    subtitle,
    pathway,
    currentRoute,
    proposedRoute,
    etaDelta,
    stepsDelta,
}) => (
    <section className="p-4 rounded-2xl border border-grayscale-200 space-y-3">
        <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-indigo-600">
                    {label}
                </p>
                <h3 className="text-sm font-semibold text-grayscale-900 leading-snug">
                    {title}
                </h3>
                <p className="text-xs text-grayscale-600 leading-relaxed mt-0.5">
                    {subtitle}
                </p>
            </div>

            <div className="flex flex-wrap gap-1.5 justify-end shrink-0">
                {etaDelta !== null && etaDelta !== 0 && (
                    <DeltaChip
                        label={etaDelta < 0 ? 'less time' : 'more time'}
                        value={formatMinutesDelta(etaDelta)}
                        tone={toneForDelta(etaDelta)}
                    />
                )}
                {stepsDelta !== null && stepsDelta !== 0 && (
                    <DeltaChip
                        label={Math.abs(stepsDelta) === 1 ? 'step' : 'steps'}
                        value={`${stepsDelta < 0 ? '\u2212' : '+'}${Math.abs(stepsDelta)}`}
                        tone={toneForDelta(stepsDelta)}
                    />
                )}
            </div>
        </div>

        {proposedRoute && proposedRoute.length >= 2 ? (
            <div className="p-3 rounded-xl bg-grayscale-10 border border-grayscale-100">
                <RouteDiffSummary
                    current={currentRoute}
                    proposed={proposedRoute}
                    pathway={pathway}
                />
            </div>
        ) : (
            <p className="text-xs text-grayscale-500 italic">
                This path can’t be previewed as a route swap today.
            </p>
        )}
    </section>
);

// -----------------------------------------------------------------
// Empty states
// -----------------------------------------------------------------

const EmptyFrame: React.FC<{
    title: string;
    body: string;
    ctaLabel?: string;
    onCta?: () => void;
}> = ({ title, body, ctaLabel, onCta }) => (
    <div className="p-8 rounded-[20px] bg-grayscale-10 border border-grayscale-200 text-center space-y-3">
        <div className="inline-flex w-11 h-11 items-center justify-center rounded-full bg-white border border-grayscale-200">
            <IonIcon icon={compassOutline} className="text-xl text-grayscale-500" />
        </div>

        <h2 className="text-lg font-semibold text-grayscale-900">{title}</h2>

        <p className="text-sm text-grayscale-600 leading-relaxed max-w-sm mx-auto">
            {body}
        </p>

        {ctaLabel && onCta && (
            <button
                type="button"
                onClick={onCta}
                className="inline-flex mt-1 py-2.5 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity"
            >
                {ctaLabel}
            </button>
        )}
    </div>
);

// -----------------------------------------------------------------
// WhatIfMode
// -----------------------------------------------------------------

const WhatIfMode: React.FC = () => {
    const activePathway = pathwayStore.use.activePathway();
    const history = useHistory();
    const analytics = useAnalytics();
    const learnerDid = useLearnerDid();

    // Set while a scenario is being turned into a proposal. Single-
    // flight so two rapid clicks don't produce two proposals with
    // the same diff. Keyed by scenario id to disable just the card
    // being processed.
    const [acceptingId, setAcceptingId] = useState<string | null>(null);
    const [acceptError, setAcceptError] = useState<string | null>(null);

    // All the heavy lifting is pure and synchronous — safe to memoize
    // on the pathway reference. Node-status changes already bump
    // `updatedAt`, which is part of the pathway identity the store
    // returns, so memo invalidation lines up with real state change.
    const baseline = useMemo(
        () => (activePathway ? simulateBaseline(activePathway) : null),
        [activePathway],
    );

    const results = useMemo<ScenarioResult[]>(() => {
        if (!activePathway) return [];

        const scenarios = generateScenarios(activePathway);
        return simulateAll(activePathway, scenarios);
    }, [activePathway]);

    // Convertibility per scenario — computed alongside results so
    // the UI doesn't need to re-classify on every render, and so
    // "no-effect" / "multiplier-unsupported" messages reflect the
    // *current* pathway state (a scenario that was convertible
    // yesterday may not be today once its target nodes are
    // completed).
    const convertibilityByScenarioId = useMemo(() => {
        if (!activePathway) return new Map<string, ToProposalReason>();

        const map = new Map<string, ToProposalReason>();
        for (const r of results) {
            map.set(
                r.scenario.id,
                classifyScenarioForProposal(activePathway, r.scenario),
            );
        }
        return map;
    }, [activePathway, results]);

    // Target route per scenario — "what would your walk look like if
    // you accepted this?" Computed once per (pathway, scenarios)
    // change so the RouteDiffSummary doesn't re-run the route
    // computation on every card render. `null` when the scenario
    // has no route-level effect (returns from `computeTargetRoute`).
    const targetRouteByScenarioId = useMemo(() => {
        if (!activePathway)
            return new Map<string, readonly string[] | null>();

        const map = new Map<string, readonly string[] | null>();
        for (const r of results) {
            map.set(r.scenario.id, computeTargetRoute(activePathway, r.scenario));
        }
        return map;
    }, [activePathway, results]);

    // ------------------------------------------------------------------
    // "Return to original walk" card.
    //
    // Shown when the pathway's committed route has drifted from the
    // default `seedChosenRoute` — i.e. the learner previously
    // accepted a What-If scenario (or otherwise took an alternate
    // walk) and the current route differs from the entry→destination
    // seed. Accepting this card swaps back to the seeded walk, which
    // matches Google Maps' "return to original route" affordance
    // after the learner explores a detour.
    //
    // We compute the original-walk seed eagerly; the "show?" decision
    // then compares it to the live chosenRoute. If either is empty,
    // or they're already identical, we hide the card.
    // ------------------------------------------------------------------
    const originalWalk = useMemo(
        () => (activePathway ? seedChosenRoute(activePathway) : []),
        [activePathway],
    );

    const showRevertCard = useMemo(() => {
        if (!activePathway) return false;
        if (originalWalk.length < 2) return false;
        const current = activePathway.chosenRoute ?? [];
        if (current.length < 2) return false;
        if (current.length !== originalWalk.length) return true;
        // Different ordering or ids → drifted.
        return current.some((id, i) => id !== originalWalk[i]);
    }, [activePathway, originalWalk]);

    // ------------------------------------------------------------------
    // Compare-two-scenarios overlay.
    //
    // The learner can tap "Compare" on up to two scenario cards; the
    // overlay then renders both route-diff previews stacked with a
    // shared header. This is the lightweight Phase C compare view —
    // two routes side by side with their diffs against the current
    // walk. A future revision could overlay both proposed routes on
    // top of the Map's Explore layout in contrasting colors.
    // ------------------------------------------------------------------
    const [comparisonIds, setComparisonIds] = useState<string[]>([]);
    const [comparisonMode, setComparisonMode] = useState(false);

    // Reset comparison whenever the pathway switches — stale selection
    // across pathways would let the overlay point at scenarios that
    // no longer apply.
    React.useEffect(() => {
        setComparisonIds([]);
        setComparisonMode(false);
    }, [activePathway?.id]);

    const toggleComparison = (scenarioId: string) => {
        setComparisonIds(prev => {
            if (prev.includes(scenarioId)) {
                return prev.filter(id => id !== scenarioId);
            }

            // Cap at two — selecting a third replaces the oldest so
            // the overlay always shows a manageable pair.
            if (prev.length >= 2) return [prev[1]!, scenarioId];

            return [...prev, scenarioId];
        });
    };

    /**
     * Shared proposal-emit path. Both scenario acceptance and the
     * revert-to-original card route through here so the telemetry,
     * navigation, and error-handling story is identical. Accepts a
     * pre-built `Proposal` and a unique `busyKey` that drives the
     * per-card spinner (`result.scenario.id` for scenarios, a
     * fixed key for the revert card).
     */
    const emitProposal = (
        pathway: Pathway,
        proposal: Proposal | null,
        busyKey: string,
    ) => {
        if (acceptingId) return;

        setAcceptingId(busyKey);
        setAcceptError(null);

        try {
            if (!proposal) {
                throw new Error(
                    'This action can\u2019t be committed as a proposal right now.',
                );
            }

            proposalStore.set.addProposal(proposal);

            analytics.track(AnalyticsEvents.PATHWAYS_PROPOSAL_CREATED, {
                agent: proposal.agent,
                pathwayId: proposal.pathwayId,
                latencyMs: 0,
                costCents: 0,
            });

            history.push('/pathways/proposals');
        } catch (err) {
            setAcceptError(
                err instanceof Error
                    ? err.message
                    : 'Something went wrong. Please try again.',
            );
            setAcceptingId(null);
        }
    };

    /**
     * Revert-to-original-walk acceptance. Builds a route-swap
     * proposal whose `setChosenRoute` equals the seeded walk, then
     * routes through the shared `emitProposal`. No authored
     * tradeoffs — reverting is a neutral swap; the live time delta
     * (if any) will show up via the normal route-math in the
     * proposals queue.
     */
    const handleRevertToOriginal = (pathway: Pathway) => {
        const id =
            typeof crypto !== 'undefined' && 'randomUUID' in crypto
                ? crypto.randomUUID()
                : `revert-${Date.now()}`;

        const proposal: Proposal = {
            id,
            agent: 'router',
            capability: 'routing',
            pathwayId: pathway.id,
            ownerDid: learnerDid,
            reason: 'Return to the original entry\u2192destination walk.',
            diff: {
                addNodes: [],
                updateNodes: [],
                removeNodeIds: [],
                addEdges: [],
                removeEdgeIds: [],
                setChosenRoute: [...originalWalk],
            },
            tradeoffs: [],
            status: 'open',
            createdAt: new Date().toISOString(),
            expiresAt: new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000,
            ).toISOString(),
        };

        emitProposal(pathway, proposal, 'revert-to-original');
    };

    const handleAccept = (pathway: Pathway, result: ScenarioResult) => {
        if (acceptingId) return;

        setAcceptingId(result.scenario.id);
        setAcceptError(null);

        try {
            // Pipe the simulator-computed tradeoffs through so the
            // proposal shows the live time delta, not just the
            // scenario's authored defaults.
            const proposal = buildProposalFromScenario(
                pathway,
                result.scenario,
                result.tradeoffs,
                { ownerDid: learnerDid },
            );

            if (!proposal) {
                throw new Error(
                    'This scenario can\u2019t be committed as a proposal right now.',
                );
            }

            proposalStore.set.addProposal(proposal);

            // `PATHWAYS_PROPOSAL_CREATED` is shared with the agent
            // pipeline, which surfaces invocation latency + cost.
            // What-If proposals are client-side and synchronous, so
            // we record 0s honestly — the event still attributes the
            // proposal to the `router` agent for telemetry roll-ups.
            analytics.track(AnalyticsEvents.PATHWAYS_PROPOSAL_CREATED, {
                agent: proposal.agent,
                pathwayId: proposal.pathwayId,
                latencyMs: 0,
                costCents: 0,
            });

            history.push('/pathways/proposals');
        } catch (err) {
            setAcceptError(
                err instanceof Error
                    ? err.message
                    : 'Something went wrong. Please try again.',
            );
            setAcceptingId(null);
        }
    };

    if (!activePathway) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-8 font-poppins">
                <EmptyFrame
                    title="Pick a pathway first"
                    body="What-if compares alternative shapes against your current pathway. Start or choose one and come back."
                    ctaLabel="Start a pathway"
                    onCta={() => history.push('/pathways/onboard')}
                />
            </div>
        );
    }

    const routable = baseline !== null && baseline.etaMinutes !== null;

    return (
        <div
            className="relative min-h-full"
            style={{
                background:
                    'linear-gradient(180deg, rgba(236, 253, 245, 0.4) 0%, rgba(251, 251, 252, 1) 40%, rgba(251, 251, 252, 1) 100%)',
            }}
        >
            <div className="max-w-2xl mx-auto px-4 py-8 font-poppins space-y-5">
                <header className="space-y-1">
                    <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide">
                        What-if
                    </p>
                    <h1 className="text-xl font-semibold text-grayscale-900">
                        See other ways this could go
                    </h1>
                    <p className="text-sm text-grayscale-600 leading-relaxed">
                        Honest alternatives to your path today — with the costs
                        spelled out.
                    </p>
                </header>

                {baseline && (
                    <BaselineCard goal={activePathway.goal} baseline={baseline} />
                )}

                {/*
                    "Return to original walk" card — only shown when
                    the committed route has drifted from the default
                    entry→destination seed. Non-structural swap back
                    to the seeded walk; see `showRevertCard` above for
                    the gating logic.
                */}
                {showRevertCard && (
                    <RevertWalkCard
                        pathway={activePathway}
                        originalWalk={originalWalk}
                        busy={acceptingId !== null}
                        onAccept={() => handleRevertToOriginal(activePathway)}
                    />
                )}

                {!routable ? (
                    <EmptyFrame
                        title="Can't simulate this pathway yet"
                        body="Scenarios compare routes to a destination. Set a destination in Build, then come back here to see alternatives."
                        ctaLabel="Open Build"
                        onCta={() => history.push('/pathways/build')}
                    />
                ) : results.length === 0 ? (
                    <EmptyFrame
                        title="Your path is already lean"
                        body="There are no review, practice, or external steps here that a scenario could reshape. That's often a good thing."
                    />
                ) : (
                    <section className="space-y-3">
                        <div className="flex items-center justify-between gap-3 px-1">
                            <h2 className="text-sm font-semibold text-grayscale-700">
                                Other paths
                            </h2>

                            {/*
                                Compare toggle — entering comparison
                                mode renders a checkbox on each
                                convertible card. Tapping two
                                checkboxes opens the side-by-side
                                overlay. This is lightweight Phase C
                                compare: two routes stacked with
                                their diffs against the current walk.
                            */}
                            <button
                                type="button"
                                onClick={() => {
                                    setComparisonMode(m => !m);
                                    if (comparisonMode) setComparisonIds([]);
                                }}
                                className={`text-xs font-medium py-1.5 px-3 rounded-full border transition-colors ${
                                    comparisonMode
                                        ? 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700'
                                        : 'bg-white border-grayscale-300 text-grayscale-700 hover:border-indigo-400 hover:text-indigo-700'
                                }`}
                                aria-pressed={comparisonMode}
                            >
                                {comparisonMode ? 'Done comparing' : 'Compare'}
                            </button>
                        </div>

                        {acceptError && (
                            <div className="p-3 rounded-2xl bg-red-50 border border-red-100 text-xs text-red-700 leading-relaxed">
                                {acceptError}
                            </div>
                        )}

                        <div className="space-y-3">
                            {results.map(r => (
                                <ScenarioCard
                                    key={r.scenario.id}
                                    result={r}
                                    convertibility={
                                        convertibilityByScenarioId.get(r.scenario.id) ?? null
                                    }
                                    pathway={activePathway}
                                    targetRoute={
                                        targetRouteByScenarioId.get(r.scenario.id) ?? null
                                    }
                                    busy={acceptingId !== null}
                                    onAccept={() => handleAccept(activePathway, r)}
                                    comparisonSelected={comparisonIds.includes(r.scenario.id)}
                                    onToggleComparison={
                                        comparisonMode
                                            ? () => toggleComparison(r.scenario.id)
                                            : undefined
                                    }
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/*
                    Compare overlay — renders only when the learner
                    has selected two scenarios while in comparison
                    mode. Two route-diff strips stacked with a
                    shared baseline reminder at top and each strip's
                    ETA delta at a glance. A future revision could
                    render both proposed routes on top of the Map's
                    Explore layout in contrasting indigo/purple.
                */}
                {comparisonMode && comparisonIds.length === 2 && (
                    <ComparisonOverlay
                        pathway={activePathway}
                        scenarioA={results.find(
                            r => r.scenario.id === comparisonIds[0],
                        )}
                        scenarioB={results.find(
                            r => r.scenario.id === comparisonIds[1],
                        )}
                        routeA={
                            targetRouteByScenarioId.get(comparisonIds[0]!) ?? null
                        }
                        routeB={
                            targetRouteByScenarioId.get(comparisonIds[1]!) ?? null
                        }
                        onClose={() => setComparisonIds([])}
                    />
                )}

                <p className="text-xs text-grayscale-400 leading-relaxed text-center pt-2">
                    Scenarios are generated from the shape of your pathway — nothing
                    here is committed or shared.
                </p>
            </div>
        </div>
    );
};

export default WhatIfMode;

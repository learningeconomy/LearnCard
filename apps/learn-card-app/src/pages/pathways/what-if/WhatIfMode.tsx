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
import { pathwayStore } from '../../../stores/pathways';
import { seedChosenRoute } from '../core/chosenRoute';
import { formatEta } from '../map/route';
import RouteDiffSummary from '../proposals/RouteDiffSummary';
import type { Pathway, Tradeoff } from '../types';

import { generateScenarios } from './generators';
import { simulateAll, simulateBaseline } from './simulator';
import {
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

/**
 * Compact one-line chip: dimension icon + dimension label +
 * direction arrow. Trades full prose for scannability — the long
 * `deltaDescription` is parked behind a "Why these tradeoffs?"
 * expansion on the parent card. With 3+ tradeoffs per scenario,
 * full-text rows produced a wall of micro-cards; chips let the
 * learner read the *shape* of a scenario at a glance and dive
 * in only when they want to.
 */
const TradeoffChip: React.FC<{ tradeoff: Tradeoff }> = ({ tradeoff }) => {
    const tone = DIRECTION_CLASSES[tradeoff.direction];

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${tone.chip}`}
        >
            <IonIcon
                icon={DIMENSION_ICON[tradeoff.dimension]}
                className={`text-xs ${tone.icon}`}
            />

            <span className={`text-[11px] font-medium ${tone.label}`}>
                {DIMENSION_LABEL[tradeoff.dimension]}
            </span>

            <IonIcon
                icon={DIRECTION_ICON[tradeoff.direction]}
                className={`text-[10px] ${tone.icon}`}
            />
        </span>
    );
};

/**
 * Expanded-detail row used inside the "Why these tradeoffs?"
 * disclosure. Same content as the old TradeoffRow but only
 * rendered after the learner asks for it. Keeps the default
 * scan dense while still surfacing the prose for anyone who
 * wants to dig in.
 */
const TradeoffDetailRow: React.FC<{ tradeoff: Tradeoff }> = ({ tradeoff }) => {
    const tone = DIRECTION_CLASSES[tradeoff.direction];

    return (
        <li className="flex items-start gap-2.5">
            <IonIcon
                icon={DIMENSION_ICON[tradeoff.dimension]}
                className={`text-base mt-0.5 shrink-0 ${tone.icon}`}
            />

            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-grayscale-500">
                    {DIMENSION_LABEL[tradeoff.dimension]}
                </p>

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
            Everything below is compared against this baseline. Pick one to
            commit — your previous walk stays one tap away.
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
    /**
     * Optional standout label shown above the title — e.g. "Best
     * for less time". Drawn from `pickStandoutLabels` in the
     * parent; `null` for unlabeled scenarios.
     */
    standoutLabel: string | null;
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
    standoutLabel,
    onAccept,
    busy = false,
    comparisonSelected = false,
    onToggleComparison,
}) => {
    const { scenario, simulation, deltas, tradeoffs } = result;

    // Local "Why these tradeoffs?" disclosure. Default closed —
    // most learners only need the chip-strip to decide. The
    // expansion holds the full prose for anyone who wants to
    // dig in. Per-card state (not lifted) because each card's
    // disclosure is independent.
    const [detailsOpen, setDetailsOpen] = useState(false);

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
            className={`relative p-4 sm:p-5 rounded-[20px] bg-white shadow-sm space-y-3 border transition-colors ${
                comparisonSelected
                    ? 'border-indigo-300 ring-2 ring-indigo-100'
                    : standoutLabel
                        ? 'border-emerald-200'
                        : 'border-grayscale-200'
            }`}
        >
            <header className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                    {standoutLabel && (
                        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-700">
                            ✨ {standoutLabel}
                        </p>
                    )}

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

            {/*
                Single chip strip — eta total + numeric deltas +
                tradeoff chips on one wrapping row. Replaces the
                previous three-stacked layout (deltas row + total
                row + tradeoff list) which made every card a wall.
            */}
            {(etaChip ||
                stepsChip ||
                simulation.etaMinutes !== null ||
                tradeoffs.length > 0) && (
                <div className="flex flex-wrap items-center gap-1.5">
                    {simulation.etaMinutes !== null && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-grayscale-200 bg-grayscale-10 px-2 py-0.5">
                            <IonIcon
                                icon={timeOutline}
                                className="text-xs text-grayscale-500"
                            />
                            <span className="text-[11px] font-medium text-grayscale-700">
                                {formatEta(simulation.etaMinutes)}
                            </span>
                        </span>
                    )}
                    {etaChip}
                    {stepsChip}
                    {tradeoffs.map((t, i) => (
                        <TradeoffChip key={`${t.dimension}-${i}`} tradeoff={t} />
                    ))}
                </div>
            )}

            {/*
                Why these tradeoffs? — disclosure with the full
                prose. Default closed; opening it reveals the
                authored `deltaDescription` for every tradeoff so
                the learner can read the *reason* a chip is amber
                or emerald without us baking 3 paragraphs into the
                default scan.
            */}
            {tradeoffs.length > 0 && (
                <div>
                    <button
                        type="button"
                        onClick={() => setDetailsOpen(o => !o)}
                        aria-expanded={detailsOpen}
                        className="text-xs text-grayscale-500 hover:text-grayscale-700 underline underline-offset-2"
                    >
                        {detailsOpen ? 'Hide details' : 'Why these tradeoffs?'}
                    </button>

                    {detailsOpen && (
                        <ul className="mt-2 space-y-2">
                            {tradeoffs.map((t, i) => (
                                <TradeoffDetailRow
                                    key={`${t.dimension}-${i}`}
                                    tradeoff={t}
                                />
                            ))}
                        </ul>
                    )}
                </div>
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
                Direct-commit CTA. Lands the learner on Map with the
                new walk live and an undo banner — no proposals-queue
                round trip. The tradeoff context the learner just
                read is the reason they're committing; the previous
                "send to queue, then accept from queue" double-confirm
                added friction without adding meaning for self-
                generated alternatives. Agent proposals still go
                through the queue, where the review step matters.
            */}
            {canAccept && onAccept && (
                <div className="pt-1">
                    <button
                        type="button"
                        onClick={onAccept}
                        disabled={busy}
                        className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-[20px] bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Take this path
                        <IonIcon icon={arrowForwardOutline} className="text-base" />
                    </button>
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
// Standout-label heuristic
// -----------------------------------------------------------------

/**
 * Pick a single "Best for X" label per scenario set. Reduces
 * decision fatigue: the learner gets one obvious-fit option
 * highlighted instead of having to read every card to compare.
 *
 * Heuristic, ordered by priority:
 *
 *   1. **Best for less time** — the scenario with the most
 *      negative ETA delta (saves the most time), if the
 *      saving is meaningful (≥ 10 minutes). Most common
 *      "obvious choice" for a learner skimming alternatives.
 *   2. **Best for fewer external modules** — the scenario that
 *      drops the most external nodes, if there's a non-trivial
 *      drop. Captures `external-light` scenarios that don't
 *      necessarily save time but reduce dependency exposure.
 *   3. **Best for deeper practice** — the scenario with the
 *      most positive `effort` direction:'worse' tradeoff
 *      (more reps), if any.
 *
 * Each label is awarded to at most one scenario (the most
 * extreme on its dimension); ties are broken by scenario order
 * so the result is deterministic. Returns a Map for O(1)
 * per-card lookup at render time.
 */
const pickStandoutLabels = (
    results: readonly ScenarioResult[],
): Map<string, string> => {
    const labels = new Map<string, string>();

    // Best for less time — only meaningful saves count.
    const fastest = [...results]
        .filter(
            r => r.deltas.etaMinutes !== null && r.deltas.etaMinutes <= -10,
        )
        .sort((a, b) => (a.deltas.etaMinutes ?? 0) - (b.deltas.etaMinutes ?? 0))[0];

    if (fastest) labels.set(fastest.scenario.id, 'Best for less time');

    // Best for fewer external modules — scenarios that drop
    // ≥1 step relative to baseline, attributed to the
    // external-light shape. We can't introspect the selector
    // from the result, so we look at the `external-dependency`
    // tradeoff with `direction:'better'` — that's the authored
    // signal for "this reshapes external dependencies."
    const externalDrop = results.find(
        r =>
            !labels.has(r.scenario.id) &&
            r.tradeoffs.some(
                t =>
                    t.dimension === 'external-dependency' &&
                    t.direction === 'better',
            ),
    );

    if (externalDrop)
        labels.set(externalDrop.scenario.id, 'Best for fewer dependencies');

    // Best for deeper practice — `effort:'worse'` is the
    // authored signal for "more reps / heavier lift" in
    // deep-practice scenarios.
    const deeperPractice = results.find(
        r =>
            !labels.has(r.scenario.id) &&
            r.tradeoffs.some(
                t => t.dimension === 'effort' && t.direction === 'worse',
            ),
    );

    if (deeperPractice)
        labels.set(deeperPractice.scenario.id, 'Best for deeper practice');

    return labels;
};

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
     * Direct-commit a scenario. By the time the learner taps
     * "Take this path" they've read the tradeoffs, seen the route
     * diff, and decided — routing through the proposals queue
     * would just add a confirmation step they've already given.
     * `pathwayStore.set.applyRouteSwap` snapshots the previous
     * route so the Map's RouteSwapBanner can offer one-tap undo.
     *
     * No-op if the scenario isn't convertible to a route swap;
     * the card hides its CTA in that case so this guard is
     * defensive only.
     */
    const handleAccept = (pathway: Pathway, result: ScenarioResult) => {
        if (acceptingId) return;

        const target = targetRouteByScenarioId.get(result.scenario.id) ?? null;

        if (!target || target.length < 2) {
            setAcceptError(
                'This path can\u2019t be committed as a route swap right now.',
            );

            return;
        }

        setAcceptingId(result.scenario.id);
        setAcceptError(null);

        try {
            pathwayStore.set.applyRouteSwap(
                pathway.id,
                target,
                result.scenario.title,
            );

            // Telemetry: still attribute the swap to the `router`
            // agent (route-swap proposals — even direct-commit ones
            // — are routing decisions). Latency/cost zeroed because
            // What-If is synchronous client-side simulation.
            analytics.track(AnalyticsEvents.PATHWAYS_PROPOSAL_CREATED, {
                agent: 'router',
                pathwayId: pathway.id,
                latencyMs: 0,
                costCents: 0,
            });

            history.push('/pathways/map');
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
     * Restore the pathway's seeded entry→destination walk. Same
     * direct-commit + Map-landing pattern as `handleAccept`, with
     * a fixed scenario title so the undo banner reads
     * "Switched to Original walk — Undo".
     */
    const handleRevertToOriginal = (pathway: Pathway) => {
        if (acceptingId) return;
        if (originalWalk.length < 2) return;

        setAcceptingId('revert-to-original');
        setAcceptError(null);

        try {
            pathwayStore.set.applyRouteSwap(
                pathway.id,
                originalWalk,
                'Original walk',
            );

            analytics.track(AnalyticsEvents.PATHWAYS_PROPOSAL_CREATED, {
                agent: 'router',
                pathwayId: pathway.id,
                latencyMs: 0,
                costCents: 0,
            });

            history.push('/pathways/map');
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

    // Standout-label map — runs once per (pathway, results) change.
    // Cheap (linear in results.length, max ~5), and pulling it out of
    // render keeps each ScenarioCard pure on its props.
    const standoutLabels = useMemo(
        () => pickStandoutLabels(results),
        [results],
    );

    // Compare entry-point gating: only show when at least two
    // scenarios are convertible (otherwise there's nothing meaningful
    // to compare against). Counted from `convertibilityByScenarioId`
    // so the rule reflects the *live* pathway, not the static set.
    const convertibleCount = useMemo(() => {
        let n = 0;
        for (const r of results) {
            if (convertibilityByScenarioId.get(r.scenario.id)?.kind === 'ok') {
                n += 1;
            }
        }
        return n;
    }, [results, convertibilityByScenarioId]);

    return (
        <div
            className="relative min-h-full"
            style={{
                background:
                    'linear-gradient(180deg, rgba(236, 253, 245, 0.4) 0%, rgba(251, 251, 252, 1) 40%, rgba(251, 251, 252, 1) 100%)',
            }}
        >
            <div className="max-w-2xl mx-auto px-4 py-8 font-poppins space-y-5">
                {/*
                    Single-line invitational header. The previous
                    layout had an eyebrow + headline + subtitle that
                    all said the same thing three times. A question
                    sets the frame more concisely than any prose
                    description and lets the page get to the actual
                    content faster.
                */}
                <header>
                    <h1 className="text-xl font-semibold text-grayscale-900 leading-snug">
                        What if you took a different path?
                    </h1>
                </header>

                {baseline && (
                    <BaselineCard goal={activePathway.goal} baseline={baseline} />
                )}

                {/*
                    "Return to original walk" affordance — only shown
                    when the committed route has drifted from the
                    default entry→destination seed. Demoted from a
                    full card to a single inline link so the visual
                    rhythm of the page isn't broken by an indigo
                    detour. The link itself is one tap; the swap
                    commits directly and lands the learner on Map
                    with an undo banner just like a scenario commit.
                */}
                {showRevertCard && (
                    <button
                        type="button"
                        onClick={() => handleRevertToOriginal(activePathway)}
                        disabled={acceptingId !== null}
                        className="group flex items-center gap-2 text-xs text-grayscale-600 hover:text-grayscale-900 transition-colors disabled:opacity-40 px-1"
                    >
                        <span>Drifted from the original walk?</span>
                        <span className="font-semibold underline underline-offset-2 group-hover:text-emerald-700">
                            Restore it
                        </span>
                    </button>
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
                        <h2 className="text-sm font-semibold text-grayscale-700 px-1">
                            Other paths
                        </h2>

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
                                    standoutLabel={
                                        standoutLabels.get(r.scenario.id) ?? null
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

                        {/*
                            Compare entry — demoted from a prominent
                            top-right pill button to a subtle text
                            link beneath the scenario list. Hidden
                            entirely when fewer than two scenarios
                            are convertible (nothing meaningful to
                            compare). Toggles into "Done comparing"
                            once active so the learner can exit
                            without hunting for the same control.
                        */}
                        {convertibleCount >= 2 && (
                            <div className="pt-1 px-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setComparisonMode(m => !m);
                                        if (comparisonMode) setComparisonIds([]);
                                    }}
                                    aria-pressed={comparisonMode}
                                    className="text-xs text-grayscale-500 hover:text-grayscale-900 underline underline-offset-2 transition-colors"
                                >
                                    {comparisonMode
                                        ? 'Done comparing'
                                        : 'Compare two paths →'}
                                </button>
                            </div>
                        )}
                    </section>
                )}

                {/*
                    Compare overlay — renders only when the learner
                    has selected two scenarios while in comparison
                    mode. Two route-diff strips stacked with a
                    shared baseline reminder at top and each strip's
                    ETA delta at a glance.
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
            </div>
        </div>
    );
};

export default WhatIfMode;

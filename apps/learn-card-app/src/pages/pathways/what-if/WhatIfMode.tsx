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
import { useLearnerDid } from '../hooks/useLearnerDid';
import { formatEta } from '../map/route';
import type { Pathway, Tradeoff } from '../types';

import { generateScenarios } from './generators';
import { simulateAll, simulateBaseline } from './simulator';
import {
    buildProposalFromScenario,
    classifyScenarioForProposal,
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
    /** Invoked when the learner asks to turn the scenario into a proposal. */
    onAccept?: () => void;
    /** Disables the accept button while a sibling card is being processed. */
    busy?: boolean;
}

const ScenarioCard: React.FC<ScenarioCardProps> = ({
    result,
    convertibility,
    onAccept,
    busy = false,
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

    return (
        <article className="p-5 rounded-[20px] bg-white border border-grayscale-200 shadow-sm space-y-4">
            <header className="space-y-1">
                <h3 className="text-base font-semibold text-grayscale-900 leading-snug">
                    {scenario.title}
                </h3>

                <p className="text-sm text-grayscale-600 leading-relaxed">
                    {scenario.subtitle}
                </p>
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
                                    busy={acceptingId !== null}
                                    onAccept={() => handleAccept(activePathway, r)}
                                />
                            ))}
                        </div>
                    </section>
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

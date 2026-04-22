/**
 * ProposalCard — one open proposal with accept / reject / modify
 * affordances (docs § 7).
 *
 * The card's framing adapts to what kind of change the proposal
 * carries (see `proposalKind`):
 *
 *   - **Route swaps** are framed as "alternate routes" — the diff
 *     body shows a route-diff strip (kept / added / dropped steps),
 *     action buttons read "Take this route" / "Keep current route."
 *     Modify is suppressed because route swaps are a pick-from-
 *     alternatives decision, not an editable draft.
 *   - **Pathway edits** keep the existing structural-diff framing —
 *     "Suggested revision," full `ProposalDiff`, Apply / Modify /
 *     Dismiss.
 *   - **Mixed** (structural + route) leans pathway-edit since the
 *     structural change is the more consequential piece, but also
 *     shows the route-diff underneath so the route consequence is
 *     visible.
 *   - **New-pathway** proposals (cross-pathway, no target) get a
 *     title + goal preview and "Add to my pathways" framing.
 *
 * All three actions still route through `proposalActions`, which
 * owns the accept/reject/telemetry story.
 */

import React, { useState } from 'react';

import { useHistory } from 'react-router-dom';

import { useAnalytics } from '../../../analytics';
import { pathwayStore } from '../../../stores/pathways';
import { useLearnerDid } from '../hooks/useLearnerDid';
import type { Capability, Proposal } from '../types';

import ProposalDiff from './ProposalDiff';
import RouteDiffSummary from './RouteDiffSummary';
import { computePathwayDiffRouteImpact } from './pathwayDiffImpact';
import {
    ProposalActionError,
    acceptProposal,
    rejectProposal,
} from './proposalActions';
import { PROPOSAL_KIND_FRAMING, proposalKind } from './proposalKind';

interface ProposalCardProps {
    proposal: Proposal;
}

const CAPABILITY_LABELS: Record<Capability, string> = {
    planning: 'Planner',
    interpretation: 'Recorder',
    nudging: 'Coach',
    routing: 'Router',
    matching: 'Matcher',
};

const ProposalCard: React.FC<ProposalCardProps> = ({ proposal }) => {
    const history = useHistory();
    const analytics = useAnalytics();
    const learnerDid = useLearnerDid();
    const pathway = proposal.pathwayId
        ? pathwayStore.use.pathways()[proposal.pathwayId] ?? null
        : null;

    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAccept = () => {
        if (busy) return;
        setBusy(true);
        setError(null);

        try {
            acceptProposal(proposal, {
                ownerDid: learnerDid,
                track: analytics.track,
            });

            // Land the learner somewhere useful. Cross-pathway acceptance
            // set a new active pathway → Today. In-pathway → Today too.
            history.push('/pathways/today');
        } catch (err) {
            setBusy(false);
            setError(
                err instanceof ProposalActionError
                    ? err.message
                    : 'Something went wrong. Please try again.',
            );
        }
    };

    const handleReject = () => {
        if (busy) return;

        rejectProposal(proposal, { track: analytics.track });
    };

    const handleModify = () => {
        // "Modify" applies the diff optimistically, then lands in Build
        // so the learner can counter-edit. This matches docs § 7:
        // > "Modify opens Build mode pre-filled with the proposed diff
        // >  applied, so the learner can counter-edit."
        if (busy) return;
        setBusy(true);
        setError(null);

        try {
            acceptProposal(proposal, {
                ownerDid: learnerDid,
                track: analytics.track,
            });
            history.push('/pathways/build');
        } catch (err) {
            setBusy(false);
            setError(
                err instanceof ProposalActionError
                    ? err.message
                    : 'Something went wrong. Please try again.',
            );
        }
    };

    const kind = proposalKind(proposal.diff);
    const framing = PROPOSAL_KIND_FRAMING[kind];

    // Route-impact summary for pathway-edit / mixed proposals — the
    // "what does this do to my walk?" read. Route-swap proposals
    // already render RouteDiffSummary which is a richer, more visual
    // answer to the same question, so we skip this section for them.
    // Computed every render because diffs are small and the pathway
    // is already in memo-land from the store.
    const routeImpact =
        pathway && (kind === 'pathway-edit' || kind === 'mixed')
            ? computePathwayDiffRouteImpact(proposal.diff, pathway)
            : null;

    const showRouteImpact =
        routeImpact !== null && routeImpact.hasImpact;

    // Whether the diff's route swap should also show the underlying
    // structural diff. Pure route-swap proposals keep the card tight
    // (RouteDiffSummary only); mixed proposals render both so the
    // learner sees the structural change and the route consequence.
    const showStructuralDiff = kind !== 'route-swap' && kind !== 'empty';

    // Route diff is shown whenever the proposal sets a chosenRoute —
    // route-swap or mixed.
    const showRouteDiff =
        kind === 'route-swap' ||
        kind === 'mixed' ||
        // New-pathway proposals may also seed a route; skip for now
        // (the "new pathway" framing is about title/goal, not walk
        // details) and revisit in Phase D if authors want to preview
        // the seeded route.
        false;

    // Kind-specific accent color for the eyebrow row. Route-swap
    // leans indigo to foreshadow Navigate mode's wayfinding palette;
    // pathway-edit and mixed keep the existing emerald framing
    // because the action space is structural. new-pathway uses
    // emerald too — the act of *adding* a pathway is a positive
    // affirmation, so green reads right.
    const eyebrowColor =
        kind === 'route-swap'
            ? 'text-indigo-700'
            : 'text-emerald-700';

    return (
        <article className="p-5 rounded-[24px] border border-grayscale-200 bg-white shadow-sm space-y-4 font-poppins">
            <header className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                    <p
                        className={`text-[10px] font-semibold uppercase tracking-wide ${eyebrowColor}`}
                    >
                        {framing.eyebrow} · {CAPABILITY_LABELS[proposal.capability]}
                    </p>

                    <p className="text-sm text-grayscale-800 leading-relaxed">
                        {proposal.reason}
                    </p>
                </div>

                {proposal.expiresAt && (
                    <span className="shrink-0 text-[10px] text-grayscale-500">
                        exp {new Date(proposal.expiresAt).toLocaleDateString()}
                    </span>
                )}
            </header>

            {showRouteDiff && (
                <div className="p-3 rounded-2xl bg-grayscale-10 border border-grayscale-100">
                    <RouteDiffSummary
                        current={pathway?.chosenRoute}
                        proposed={proposal.diff.setChosenRoute}
                        pathway={pathway}
                    />
                </div>
            )}

            {showStructuralDiff && (
                <div className="p-3 rounded-2xl bg-grayscale-10 border border-grayscale-100">
                    <ProposalDiff diff={proposal.diff} pathway={pathway} />
                </div>
            )}

            {/*
                Route impact — calls out how the structural change
                affects the learner's committed walk. Only rendered
                for pathway-edit / mixed proposals (route-swap
                proposals have RouteDiffSummary above which already
                answers the same question more visually).
            */}
            {showRouteImpact && routeImpact && pathway && (
                <div
                    className={`p-3 rounded-2xl border ${
                        routeImpact.destinationRemoved
                            ? 'bg-amber-50/70 border-amber-100'
                            : 'bg-indigo-50/60 border-indigo-100'
                    }`}
                >
                    <p
                        className={`text-[10px] font-semibold uppercase tracking-wide mb-1.5 ${
                            routeImpact.destinationRemoved
                                ? 'text-amber-700'
                                : 'text-indigo-700'
                        }`}
                    >
                        Route impact
                    </p>

                    {routeImpact.destinationRemoved ? (
                        <p className="text-xs text-amber-800 leading-relaxed">
                            Your destination would be removed. The Map
                            will drop to Explore until a new walk is
                            seeded.
                        </p>
                    ) : (
                        <p className="text-xs text-indigo-800 leading-relaxed">
                            {routeImpact.routeNodesRemoved.length > 0 ? (
                                <>
                                    Drops{' '}
                                    <span className="font-semibold">
                                        {routeImpact.routeNodesRemoved.length}{' '}
                                        {routeImpact.routeNodesRemoved.length === 1
                                            ? 'step'
                                            : 'steps'}
                                    </span>{' '}
                                    from your committed walk; {routeImpact.remainingRouteSteps}{' '}
                                    {routeImpact.remainingRouteSteps === 1
                                        ? 'step remains'
                                        : 'steps remain'}
                                    .
                                </>
                            ) : (
                                <>
                                    This revision updates your walk. See the
                                    route preview above for the before/after
                                    shape.
                                </>
                            )}
                        </p>
                    )}

                    {routeImpact.routeNodesRemoved.length > 0 && (
                        <ul className="mt-2 space-y-0.5">
                            {routeImpact.routeNodesRemoved.map(id => {
                                const n = pathway.nodes.find(x => x.id === id);
                                return (
                                    <li
                                        key={id}
                                        className="text-[11px] text-indigo-700 leading-relaxed"
                                    >
                                        <span
                                            aria-hidden
                                            className="text-indigo-400 mr-1"
                                        >
                                            −
                                        </span>
                                        {n?.title ?? id}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            )}

            {proposal.tradeoffs && proposal.tradeoffs.length > 0 && (
                <section className="space-y-1.5">
                    <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide">
                        Tradeoffs
                    </p>

                    <ul className="space-y-1">
                        {proposal.tradeoffs.map((t, i) => (
                            <li
                                key={i}
                                className="text-xs text-grayscale-600 flex items-start gap-2"
                            >
                                <span
                                    className={`shrink-0 w-1.5 h-1.5 rounded-full mt-1.5 ${
                                        t.direction === 'better'
                                            ? 'bg-emerald-600'
                                            : t.direction === 'worse'
                                                ? 'bg-amber-500'
                                                : 'bg-grayscale-400'
                                    }`}
                                />
                                <span>
                                    <span className="font-medium capitalize">{t.dimension}:</span>{' '}
                                    {t.deltaDescription}
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {error && (
                <p className="p-3 rounded-xl bg-red-50 border border-red-100 text-xs text-red-700 leading-relaxed">
                    {error}
                </p>
            )}

            <div className="flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={handleAccept}
                    disabled={busy}
                    className={`flex-1 py-3 px-4 rounded-[20px] text-white font-medium text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-w-[120px] ${
                        kind === 'route-swap'
                            ? 'bg-indigo-600 hover:bg-indigo-700'
                            : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                >
                    {framing.accept}
                </button>

                {/* Modify only applies to diffs that have structural
                    content an author might want to counter-edit. Route
                    swaps are a pick-from-alternatives decision, so we
                    suppress Modify for them; the learner can always
                    propose a different walk via What-If. */}
                {kind !== 'route-swap' && kind !== 'empty' && (
                    <button
                        type="button"
                        onClick={handleModify}
                        disabled={busy}
                        className="flex-1 py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-w-[120px]"
                    >
                        Modify
                    </button>
                )}

                <button
                    type="button"
                    onClick={handleReject}
                    disabled={busy}
                    className="py-3 px-4 rounded-[20px] text-grayscale-600 font-medium text-sm hover:text-grayscale-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {framing.reject}
                </button>
            </div>
        </article>
    );
};

export default ProposalCard;

/**
 * ProposalCard — one open proposal with accept / reject / modify
 * affordances (docs § 7).
 *
 * All three actions route through `proposalActions`, which owns the
 * accept/reject/telemetry story.
 */

import React, { useState } from 'react';

import { useHistory } from 'react-router-dom';

import { useAnalytics } from '../../../analytics';
import { pathwayStore } from '../../../stores/pathways';
import { useLearnerDid } from '../hooks/useLearnerDid';
import type { Capability, Proposal } from '../types';

import ProposalDiff from './ProposalDiff';
import {
    ProposalActionError,
    acceptProposal,
    rejectProposal,
} from './proposalActions';

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

    return (
        <article className="p-5 rounded-[24px] border border-grayscale-200 bg-white shadow-sm space-y-4 font-poppins">
            <header className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                        {CAPABILITY_LABELS[proposal.capability]} · {proposal.capability}
                    </p>

                    <p className="text-sm text-grayscale-800 leading-relaxed mt-1">
                        {proposal.reason}
                    </p>
                </div>

                {proposal.expiresAt && (
                    <span className="shrink-0 text-[10px] text-grayscale-500">
                        exp {new Date(proposal.expiresAt).toLocaleDateString()}
                    </span>
                )}
            </header>

            <div className="p-3 rounded-2xl bg-grayscale-10 border border-grayscale-100">
                <ProposalDiff diff={proposal.diff} pathway={pathway} />
            </div>

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
                    className="flex-1 py-3 px-4 rounded-[20px] bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-w-[120px]"
                >
                    Accept
                </button>

                <button
                    type="button"
                    onClick={handleModify}
                    disabled={busy}
                    className="flex-1 py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-w-[120px]"
                >
                    Modify
                </button>

                <button
                    type="button"
                    onClick={handleReject}
                    disabled={busy}
                    className="py-3 px-4 rounded-[20px] text-grayscale-600 font-medium text-sm hover:text-grayscale-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Reject
                </button>
            </div>
        </article>
    );
};

export default ProposalCard;

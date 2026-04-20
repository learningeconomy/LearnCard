/**
 * EndorsementPanel — list existing endorsements + inline request flow.
 *
 * Docs § 5: "the social trust layer is load-bearing; endorsements show
 * up on the node they're tied to, not hidden in a profile."
 *
 * Phase 2 scope: list, plus a compact request form that emits
 * `pathways.endorsement.requested` telemetry and records a pending
 * endorsement locally. Full integration with the boost-endorsements
 * flow and real delivery (email / DM / shareable link) is Phase 5 per
 * the roadmap.
 */

import React, { useState } from 'react';

import { v4 as uuid } from 'uuid';

import { AnalyticsEvents, useAnalytics } from '../../../analytics';
import type { EndorsementRef } from '../types';

const RELATIONSHIP_OPTIONS: Array<{
    value: EndorsementRef['endorserRelationship'];
    label: string;
}> = [
    { value: 'mentor', label: 'Mentor' },
    { value: 'peer', label: 'Peer' },
    { value: 'guardian', label: 'Guardian' },
    { value: 'institution', label: 'Institution' },
];

const TRUST_TIER_BY_RELATIONSHIP: Record<
    EndorsementRef['endorserRelationship'],
    NonNullable<EndorsementRef['trustTier']>
> = {
    mentor: 'trusted',
    institution: 'institution',
    peer: 'peer',
    guardian: 'trusted',
};

interface EndorsementPanelProps {
    nodeId: string;
    endorsements: readonly EndorsementRef[];
    onRequested: (pending: EndorsementRef) => void;
}

const EndorsementPanel: React.FC<EndorsementPanelProps> = ({
    nodeId,
    endorsements,
    onRequested,
}) => {
    const analytics = useAnalytics();

    const [open, setOpen] = useState(false);
    const [relationship, setRelationship] = useState<
        EndorsementRef['endorserRelationship']
    >('mentor');
    const [contact, setContact] = useState('');

    const canSubmit = contact.trim().length > 0;

    const handleSubmit = () => {
        if (!canSubmit) return;

        const pending: EndorsementRef = {
            endorsementId: `pending-${uuid()}`,
            endorserDid: `did:pending:${contact.trim()}`,
            endorserRelationship: relationship,
            trustTier: TRUST_TIER_BY_RELATIONSHIP[relationship],
        };

        analytics.track(AnalyticsEvents.PATHWAYS_ENDORSEMENT_REQUESTED, {
            nodeId,
            endorserRelationship: relationship,
        });

        onRequested(pending);

        setContact('');
        setOpen(false);
    };

    return (
        <section className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide">
                    Endorsements
                </p>

                {!open && (
                    <button
                        type="button"
                        onClick={() => setOpen(true)}
                        className="text-xs font-medium text-emerald-700 hover:text-emerald-800 transition-colors"
                    >
                        Request one
                    </button>
                )}
            </div>

            {endorsements.length === 0 ? (
                <p className="text-sm text-grayscale-500 leading-relaxed">
                    No endorsements yet. A mentor, peer, or institution can vouch for this work.
                </p>
            ) : (
                <ul className="space-y-2">
                    {endorsements.map(e => {
                        const isPending = e.endorsementId.startsWith('pending-');

                        return (
                            <li
                                key={e.endorsementId}
                                className="p-3 rounded-xl border border-grayscale-200 bg-white flex items-start gap-3"
                            >
                                <span
                                    className={`shrink-0 w-2 h-2 mt-1.5 rounded-full ${
                                        isPending ? 'bg-amber-500' : 'bg-emerald-600'
                                    }`}
                                />

                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-grayscale-800 capitalize">
                                        {e.endorserRelationship}
                                        {e.trustTier && e.trustTier !== 'peer' && (
                                            <span className="ml-2 text-xs text-grayscale-500">
                                                · {e.trustTier}
                                            </span>
                                        )}
                                    </p>

                                    <p className="text-xs text-grayscale-500 truncate">
                                        {isPending ? 'Waiting on response' : e.endorserDid}
                                    </p>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            {open && (
                <div className="p-4 rounded-2xl border border-grayscale-200 bg-grayscale-10 space-y-3">
                    <div className="space-y-1.5">
                        <label
                            htmlFor="endorsement-relationship"
                            className="text-xs font-medium text-grayscale-700"
                        >
                            Who are you asking?
                        </label>

                        <select
                            id="endorsement-relationship"
                            value={relationship}
                            onChange={e =>
                                setRelationship(
                                    e.target.value as EndorsementRef['endorserRelationship'],
                                )
                            }
                            className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm
                                       text-grayscale-900 bg-white focus:outline-none focus:ring-2
                                       focus:ring-emerald-500 focus:border-transparent font-poppins"
                        >
                            {RELATIONSHIP_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label
                            htmlFor="endorsement-contact"
                            className="text-xs font-medium text-grayscale-700"
                        >
                            Contact (email or handle)
                        </label>

                        <input
                            id="endorsement-contact"
                            type="text"
                            value={contact}
                            onChange={e => setContact(e.target.value)}
                            placeholder="alex@example.com"
                            className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm
                                       text-grayscale-900 placeholder:text-grayscale-400 bg-white
                                       focus:outline-none focus:ring-2 focus:ring-emerald-500
                                       focus:border-transparent font-poppins"
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                            className="flex-1 py-3 px-4 rounded-[20px] bg-emerald-600 text-white
                                       font-medium text-sm hover:bg-emerald-700 transition-colors
                                       disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            Send request
                        </button>

                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="py-3 px-4 rounded-[20px] border border-grayscale-300
                                       text-grayscale-700 font-medium text-sm
                                       hover:bg-grayscale-10 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
};

export default EndorsementPanel;

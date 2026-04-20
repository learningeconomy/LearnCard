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

import { AnimatePresence, motion } from 'motion/react';
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

    const hasAny = endorsements.length > 0;

    return (
        <section className="space-y-2">
            {/*
                Demoted from a full labeled section to a compact chip
                list + footer line. Most nodes don't need endorsements
                to be satisfied; keeping this quiet lets the evidence
                flow stay the primary act.
            */}
            {hasAny && (
                <ul className="space-y-1.5">
                    {endorsements.map(e => {
                        const isPending = e.endorsementId.startsWith('pending-');

                        return (
                            <li
                                key={e.endorsementId}
                                className="flex items-center gap-2.5 py-1.5 px-3 rounded-xl
                                           bg-white/80 border border-grayscale-200"
                            >
                                <span
                                    aria-hidden
                                    className={`shrink-0 w-1.5 h-1.5 rounded-full ${
                                        isPending ? 'bg-amber-500' : 'bg-emerald-600'
                                    }`}
                                />

                                <span className="text-sm text-grayscale-800 capitalize truncate">
                                    {e.endorserRelationship}
                                </span>

                                <span className="ml-auto text-[11px] text-grayscale-500 truncate">
                                    {isPending ? 'Waiting…' : e.endorserDid}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            )}

            <AnimatePresence mode="wait" initial={false}>
                {open ? (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="p-4 rounded-2xl border border-grayscale-200 bg-grayscale-10 space-y-3"
                    >
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
                                Email or handle
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
                            <motion.button
                                type="button"
                                onClick={handleSubmit}
                                disabled={!canSubmit}
                                whileTap={{ scale: 0.97 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                className="flex-1 py-3 px-4 rounded-[20px] bg-emerald-600 text-white
                                           font-medium text-sm hover:bg-emerald-700 transition-colors
                                           disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Send request
                            </motion.button>

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
                    </motion.div>
                ) : (
                    <motion.div
                        key="prompt"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center justify-between gap-3"
                    >
                        <p className="text-xs text-grayscale-500 leading-relaxed">
                            {hasAny
                                ? 'Want another vouch?'
                                : 'Want a vouch? A mentor, peer, or institution can back this up.'}
                        </p>

                        <button
                            type="button"
                            onClick={() => setOpen(true)}
                            className="shrink-0 text-xs font-semibold text-emerald-700
                                       hover:text-emerald-800 transition-colors"
                        >
                            {hasAny ? 'Request another' : 'Request'}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};

export default EndorsementPanel;

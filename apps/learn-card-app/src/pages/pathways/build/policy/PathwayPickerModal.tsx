/**
 * PathwayPickerModal — searchable picker for the "nested pathway"
 * reference in a composite policy.
 *
 * Replaces the bare `<select>` with UUIDs that previously lived in
 * `CompositeSpec`. Authors now see each candidate with its title,
 * step count, destination, and provenance (imported / authored),
 * searchable by query.
 *
 * Cycle detection runs against the live pathway map — candidates
 * that would introduce a cycle (or that are the parent itself) are
 * simply omitted from the list. We intentionally do NOT show them
 * as "disabled" — that would leak the cycle concept into user copy
 * for zero benefit. "This list is the set of pathways you can
 * nest" is all an author needs to know.
 *
 * Shell patterns (motion, backdrop, rounded glass card) mirror
 * `ImportCtdlModal` so both modals feel like siblings, not
 * strangers.
 */

import React, { useEffect, useMemo, useState } from 'react';

import { IonIcon } from '@ionic/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    addCircleOutline,
    checkmarkCircleOutline,
    closeOutline,
    flagOutline,
    layersOutline,
    searchOutline,
    sparklesOutline,
} from 'ionicons/icons';

import { wouldCreateCycle, type PathwayMap } from '../../core/composition';
import type { Pathway } from '../../types';

interface PathwayPickerModalProps {
    parentPathwayId: string;
    allPathways: PathwayMap;
    /** Current pathwayRef (if any) — highlights the matching row. */
    currentRef?: string;
    onPick: (pathway: Pathway) => void;

    /**
     * "Create a brand-new empty pathway here" handler.
     *
     * When supplied, the modal renders a prominent create action at
     * the top — and when there are no existing pathways to pick, a
     * single full-width create button replaces the old dead-end empty
     * copy. Omit this prop only when the caller can't create pathways
     * on the learner's behalf (e.g. read-only review surfaces).
     */
    onCreateNew?: () => void;
    onClose: () => void;
}

const PathwayPickerModal: React.FC<PathwayPickerModalProps> = ({
    parentPathwayId,
    allPathways,
    currentRef,
    onPick,
    onCreateNew,
    onClose,
}) => {
    const [query, setQuery] = useState('');

    // Escape-to-close. Captured at the document level so the input
    // focus doesn't eat it.
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    // Candidate set: all other pathways that wouldn't create a cycle.
    // Memoised on the identity of allPathways since cycle walks can
    // touch the whole ref graph.
    const candidates = useMemo(() => {
        return Object.values(allPathways).filter(p => {
            if (p.id === parentPathwayId) return false;
            if (wouldCreateCycle(allPathways, parentPathwayId, p.id)) return false;
            return true;
        });
    }, [allPathways, parentPathwayId]);

    // Query filter. Case-insensitive, matches title or goal.
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return candidates;

        return candidates.filter(p => {
            if (p.title.toLowerCase().includes(q)) return true;
            if (p.goal.toLowerCase().includes(q)) return true;
            return false;
        });
    }, [candidates, query]);

    // Friendly provenance label. `source` is an enum; we map the
    // values that read naturally to a short badge and hide the rest
    // (authored pathways don't need a "Self-made" badge).
    const sourceBadge = (p: Pathway): string | null => {
        switch (p.source) {
            case 'ctdl-imported':
                return 'Imported';
            case 'template':
                return 'From template';
            case 'generated':
                return 'AI-generated';
            default:
                return null;
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-grayscale-900/40 backdrop-blur-sm flex items-center justify-center p-4 font-poppins"
                onClick={onClose}
            >
                <motion.div
                    key="card"
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                    onClick={e => e.stopPropagation()}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Pick a nested pathway"
                    className="w-full max-w-lg max-h-[80vh] flex flex-col bg-white rounded-[20px] shadow-2xl overflow-hidden"
                >
                    {/* Header — sticky glass (matches the Section primitive). */}
                    <header className="px-5 py-4 border-b border-grayscale-200/60 backdrop-blur-md bg-white/80 flex items-center gap-3">
                        <IonIcon
                            icon={layersOutline}
                            aria-hidden
                            className="text-grayscale-700 text-lg"
                        />

                        <div className="min-w-0 flex-1">
                            <h2 className="text-sm font-semibold text-grayscale-900">
                                Pick a nested pathway
                            </h2>

                            <p className="text-xs text-grayscale-500">
                                The learner will complete its destination to finish this
                                step.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close"
                            className="shrink-0 w-8 h-8 inline-flex items-center justify-center rounded-full text-grayscale-500 hover:bg-grayscale-100 hover:text-grayscale-800 transition-colors"
                        >
                            <IonIcon icon={closeOutline} aria-hidden className="text-lg" />
                        </button>
                    </header>

                    {/* Search input — only useful once there's
                        something to search through. Hidden in the
                        zero-candidate case (create-new is the only
                        meaningful affordance there). */}
                    {candidates.length > 0 && (
                        <div className="px-5 py-3 border-b border-grayscale-200">
                            <div className="relative">
                                <IonIcon
                                    icon={searchOutline}
                                    aria-hidden
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-grayscale-400 text-base pointer-events-none"
                                />

                                <input
                                    type="search"
                                    autoFocus
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    placeholder="Search pathways…"
                                    className="w-full pl-9 pr-3 py-2.5 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    )}

                    {/* Body — scrollable list + actions. */}
                    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
                        {/*
                            Create-new action. Always rendered when
                            the handler is supplied — at the top of
                            the list when candidates exist, or as the
                            sole affordance when the pool is empty.
                            Before M5 the empty state dead-ended with
                            "import one from the Registry or author
                            another pathway, then come back" — a
                            real UX cul-de-sac. Now the author
                            creates the nested pathway in place.
                        */}
                        {onCreateNew && <CreateNewRow onCreateNew={onCreateNew} />}

                        {candidates.length === 0 ? (
                            // Still informative when onCreateNew is
                            // absent; with it, the create button
                            // above is the whole UI and this is just
                            // a short hint.
                            <EmptyState
                                title={onCreateNew ? 'Or pick an existing one' : 'No other pathways yet'}
                                blurb={
                                    onCreateNew
                                        ? "You don't have any other pathways yet — create one above."
                                        : 'Start another pathway from Today, then come back here.'
                                }
                            />
                        ) : filtered.length === 0 ? (
                            <EmptyState
                                title="No matches"
                                blurb={`Nothing matches "${query}". Try fewer words or clear the search.`}
                            />
                        ) : (
                            <ul className="space-y-1.5">
                                {filtered.map(p => (
                                    <li key={p.id}>
                                        <PickerRow
                                            pathway={p}
                                            isCurrent={p.id === currentRef}
                                            badge={sourceBadge(p)}
                                            onPick={() => onPick(p)}
                                        />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// ---------------------------------------------------------------------------
// PickerRow — one pathway card inside the modal.
// ---------------------------------------------------------------------------

const PickerRow: React.FC<{
    pathway: Pathway;
    isCurrent: boolean;
    badge: string | null;
    onPick: () => void;
}> = ({ pathway, isCurrent, badge, onPick }) => {
    const stepCount = pathway.nodes.length;
    const destination = pathway.destinationNodeId
        ? pathway.nodes.find(n => n.id === pathway.destinationNodeId)
        : null;

    return (
        <button
            type="button"
            onClick={onPick}
            aria-current={isCurrent ? 'true' : undefined}
            className={`
                w-full text-left p-3 rounded-xl border transition-colors
                ${
                    isCurrent
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-grayscale-200 bg-white hover:bg-grayscale-10'
                }
            `}
        >
            <div className="flex items-start gap-3">
                <span
                    className={`
                        shrink-0 inline-flex items-center justify-center
                        w-9 h-9 rounded-lg text-base
                        ${
                            isCurrent
                                ? 'bg-emerald-600 text-white'
                                : 'bg-grayscale-100 text-grayscale-600'
                        }
                    `}
                >
                    <IonIcon
                        icon={isCurrent ? checkmarkCircleOutline : sparklesOutline}
                        aria-hidden
                    />
                </span>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <span className="block text-sm font-semibold text-grayscale-900 truncate">
                            {pathway.title}
                        </span>

                        {badge && (
                            <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-grayscale-500 bg-grayscale-100 rounded-full px-2 py-0.5">
                                {badge}
                            </span>
                        )}
                    </div>

                    {pathway.goal && (
                        <span className="block text-xs text-grayscale-600 leading-snug mt-0.5 line-clamp-2">
                            {pathway.goal}
                        </span>
                    )}

                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-grayscale-500">
                        <span>
                            {stepCount} {stepCount === 1 ? 'step' : 'steps'}
                        </span>

                        {destination && (
                            <span className="inline-flex items-center gap-1">
                                <IonIcon
                                    icon={flagOutline}
                                    aria-hidden
                                    className="text-[11px]"
                                />

                                <span className="truncate max-w-[200px]">
                                    {destination.title}
                                </span>
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </button>
    );
};

// ---------------------------------------------------------------------------
// CreateNewRow — the "Create a new pathway here" primary action.
//
// Rendered at the top of the body when `onCreateNew` is supplied.
// Distinct from PickerRow both visually (dashed border, emerald
// accent) and structurally (a plus icon, no step count / no
// destination — there's nothing to describe yet).
// ---------------------------------------------------------------------------

const CreateNewRow: React.FC<{ onCreateNew: () => void }> = ({ onCreateNew }) => (
    <button
        type="button"
        onClick={onCreateNew}
        className="
            w-full text-left p-3 rounded-xl
            border border-dashed border-emerald-300
            bg-emerald-50/40
            hover:bg-emerald-50 hover:border-emerald-400
            transition-colors
        "
    >
        <div className="flex items-center gap-3">
            <span className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-600 text-white text-base">
                <IonIcon icon={addCircleOutline} aria-hidden />
            </span>

            <div className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-emerald-900">
                    Create a new pathway
                </span>

                <span className="block text-xs text-emerald-700/80 leading-snug mt-0.5">
                    Start a blank one right here and edit it next.
                </span>
            </div>
        </div>
    </button>
);

// ---------------------------------------------------------------------------
// EmptyState — shared by "no candidates" and "no results".
// ---------------------------------------------------------------------------

const EmptyState: React.FC<{ title: string; blurb: string }> = ({ title, blurb }) => (
    <div className="py-12 px-6 text-center">
        <p className="text-sm font-semibold text-grayscale-900 mb-1">{title}</p>
        <p className="text-xs text-grayscale-500 leading-relaxed">{blurb}</p>
    </div>
);

export default PathwayPickerModal;

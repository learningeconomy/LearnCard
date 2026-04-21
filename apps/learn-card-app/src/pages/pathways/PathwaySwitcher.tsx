/**
 * PathwaySwitcher — compact dropdown for moving between subscribed
 * pathways.
 *
 * ### Mental model
 *
 * A learner "walks" exactly one pathway at a time — the rest are
 * paused but alive. The switcher is the affordance for swapping
 * which story you're telling yourself today. It's intentionally
 * cheap: the data model already supports many pathways
 * (`pathwayStore.pathways` is keyed by id; `activePathwayId` just
 * picks the focus), so the switcher is purely a chooser.
 *
 * ### UX rules
 *
 *   - The trigger is always a grey pill showing the active title.
 *     Single-pathway learners still see it (as a static label) so
 *     the mental model is consistent as they add more.
 *   - Each row shows the pathway title, a tiny progress fraction,
 *     and a remove action. Progress is rolled up once per render
 *     via `computePathwayProgress`.
 *   - Selecting a pathway switches the active id AND navigates to
 *     `/pathways/today`. The learner's first instinct after
 *     switching is "show me what to do next", which Today is for.
 *   - We fire `PATHWAYS_PATHWAY_SWITCHED` telemetry so we can
 *     measure multi-pathway behavior downstream.
 *
 * Designed to slot into `PathwaysHeader`'s top row next to the
 * Proposals chip.
 */

import React, { useEffect, useRef, useState } from 'react';

import { IonIcon } from '@ionic/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    addOutline,
    chevronDownOutline,
    checkmarkOutline,
    trashOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';

import { AnalyticsEvents, useAnalytics } from '../../analytics';
import { pathwayStore } from '../../stores/pathways';

import { computePathwayProgress } from './core/composition';

// ---------------------------------------------------------------------------
// Presentation-only progress badge
// ---------------------------------------------------------------------------

const ProgressBadge: React.FC<{ completed: number; total: number }> = ({
    completed,
    total,
}) => {
    if (total === 0) {
        return (
            <span className="text-[11px] text-grayscale-500">No steps yet</span>
        );
    }

    return (
        <span className="text-[11px] text-grayscale-500 tabular-nums">
            {completed} / {total}
        </span>
    );
};

// ---------------------------------------------------------------------------
// Main switcher
// ---------------------------------------------------------------------------

const PathwaySwitcher: React.FC = () => {
    const history = useHistory();
    const analytics = useAnalytics();

    const pathways = pathwayStore.use.pathways();
    const activePathway = pathwayStore.use.activePathway();
    const activeId = pathwayStore.use.activePathwayId();

    const [open, setOpen] = useState(false);

    const containerRef = useRef<HTMLDivElement | null>(null);

    // Sorted list: active first, then alphabetical by title. Stable so
    // the dropdown doesn't jump around as pathways update.
    const ordered = Object.values(pathways).sort((a, b) => {
        if (a.id === activeId) return -1;
        if (b.id === activeId) return 1;

        return a.title.localeCompare(b.title);
    });

    // Dismiss the dropdown on outside click / Escape. `useRef` + a
    // single window listener is cheaper than a backdrop element and
    // doesn't steal focus from other header affordances.
    useEffect(() => {
        if (!open) return;

        const onClick = (e: MouseEvent) => {
            if (!containerRef.current) return;

            if (!containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };

        window.addEventListener('mousedown', onClick);
        window.addEventListener('keydown', onKey);

        return () => {
            window.removeEventListener('mousedown', onClick);
            window.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const handleSwitch = (pathwayId: string) => {
        if (pathwayId === activeId) {
            setOpen(false);
            return;
        }

        pathwayStore.set.setActivePathway(pathwayId);

        analytics.track(AnalyticsEvents.PATHWAYS_PATHWAY_SWITCHED, {
            fromPathwayId: activeId,
            toPathwayId: pathwayId,
            subscribedCount: ordered.length,
        });

        setOpen(false);
        history.push('/pathways/today');
    };

    const handleRemove = (pathwayId: string, title: string) => {
        const ok =
            typeof window !== 'undefined'
                ? window.confirm(
                      `Remove "${title}" from your pathways? You can re-add it later.`,
                  )
                : true;

        if (!ok) return;

        pathwayStore.set.removePathway(pathwayId);

        analytics.track(AnalyticsEvents.PATHWAYS_PATHWAY_REMOVED, {
            pathwayId,
            remainingCount: ordered.length - 1,
        });
    };

    const handleAdd = () => {
        setOpen(false);
        history.push('/pathways/onboard');
    };

    // Single-pathway learners get a calm, non-interactive pill. Keeps
    // the layout identical so adding a second pathway doesn't change
    // where the eye lands.
    if (ordered.length <= 1) {
        return (
            <button
                type="button"
                onClick={handleAdd}
                className="shrink-0 inline-flex items-center gap-1.5 py-2 px-3
                           rounded-full text-xs font-medium
                           bg-grayscale-100 text-grayscale-700 hover:bg-grayscale-200
                           transition-colors max-w-[200px]"
                title="Add another pathway"
            >
                <span className="truncate">
                    {activePathway?.title ?? 'No pathways yet'}
                </span>

                <IonIcon icon={addOutline} className="text-sm shrink-0" aria-hidden />
            </button>
        );
    }

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                aria-expanded={open}
                aria-haspopup="listbox"
                className="shrink-0 inline-flex items-center gap-1.5 py-2 px-3
                           rounded-full text-xs font-medium
                           bg-grayscale-100 text-grayscale-700 hover:bg-grayscale-200
                           transition-colors max-w-[240px]"
            >
                <span className="truncate">
                    {activePathway?.title ?? 'Pathways'}
                </span>

                <IonIcon
                    icon={chevronDownOutline}
                    className={`text-xs shrink-0 transition-transform ${
                        open ? 'rotate-180' : ''
                    }`}
                    aria-hidden
                />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        role="listbox"
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                        transition={{ duration: 0.16, ease: 'easeOut' }}
                        className="absolute z-30 top-full right-0 mt-2 w-[320px]
                                   rounded-[20px] bg-white border border-grayscale-200
                                   shadow-xl shadow-grayscale-900/10 overflow-hidden"
                    >
                        <div className="px-3 py-2 border-b border-grayscale-200">
                            <div className="text-[10px] font-semibold text-grayscale-500 uppercase tracking-wide">
                                My pathways · {ordered.length}
                            </div>
                        </div>

                        <ul className="max-h-[320px] overflow-y-auto py-1">
                            {ordered.map(p => {
                                const isActive = p.id === activeId;
                                const progress = computePathwayProgress(p);

                                return (
                                    <li
                                        key={p.id}
                                        className="group flex items-stretch"
                                    >
                                        <button
                                            type="button"
                                            role="option"
                                            aria-selected={isActive}
                                            onClick={() => handleSwitch(p.id)}
                                            className={`flex-1 min-w-0 text-left px-3 py-2.5
                                                        flex items-start gap-2
                                                        transition-colors ${
                                                            isActive
                                                                ? 'bg-emerald-50 hover:bg-emerald-100'
                                                                : 'hover:bg-grayscale-10'
                                                        }`}
                                        >
                                            <span
                                                className={`shrink-0 w-4 h-4 mt-0.5 rounded-full flex items-center justify-center ${
                                                    isActive
                                                        ? 'bg-emerald-600 text-white'
                                                        : 'border border-grayscale-300'
                                                }`}
                                                aria-hidden
                                            >
                                                {isActive && (
                                                    <IonIcon
                                                        icon={checkmarkOutline}
                                                        className="text-[10px]"
                                                    />
                                                )}
                                            </span>

                                            <span className="min-w-0 flex-1">
                                                <span
                                                    className={`block text-sm truncate ${
                                                        isActive
                                                            ? 'font-medium text-grayscale-900'
                                                            : 'text-grayscale-800'
                                                    }`}
                                                >
                                                    {p.title}
                                                </span>

                                                <span className="block mt-0.5">
                                                    <ProgressBadge
                                                        completed={progress.completed}
                                                        total={progress.total}
                                                    />
                                                </span>
                                            </span>
                                        </button>

                                        <button
                                            type="button"
                                            aria-label={`Remove ${p.title}`}
                                            onClick={e => {
                                                e.stopPropagation();
                                                handleRemove(p.id, p.title);
                                            }}
                                            className="shrink-0 px-3 text-grayscale-400 hover:text-red-700
                                                       hover:bg-red-50 transition-colors
                                                       opacity-0 group-hover:opacity-100 focus:opacity-100"
                                        >
                                            <IonIcon icon={trashOutline} className="text-sm" />
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>

                        <button
                            type="button"
                            onClick={handleAdd}
                            className="w-full px-3 py-2.5 border-t border-grayscale-200
                                       flex items-center gap-2
                                       text-sm text-grayscale-700 hover:bg-grayscale-10
                                       transition-colors"
                        >
                            <IonIcon
                                icon={addOutline}
                                className="text-base text-grayscale-500"
                                aria-hidden
                            />

                            Add another pathway
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PathwaySwitcher;

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

/**
 * Visual variants for the switcher.
 *
 * - `chip` (default) — the original compact grey pill. Still used on
 *   surfaces outside the header where we want a calm secondary
 *   affordance (e.g. the dev seed panel).
 * - `title` — the switcher *is* the header's h1. Renders as a large
 *   tappable title with a chevron suffix; dropdown opens on click.
 *   Matches the Linear / Notion / Slack / GitHub pattern where the
 *   workspace / org title is both the identity and the switcher.
 *   Used by `PathwaysHeader` so the pathway title is read *once*
 *   per page rather than twice (h1 and chip).
 */
type SwitcherVariant = 'chip' | 'title';

interface PathwaySwitcherProps {
    variant?: SwitcherVariant;
}

const PathwaySwitcher: React.FC<PathwaySwitcherProps> = ({
    variant = 'chip',
}) => {
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

    // Variant-dependent class tokens.
    // ────────────────────────────────────────────────────────────────
    // `chip` — the legacy grey pill (xs font, px-3 py-2, bg-grayscale-100).
    //          Used outside the header as a calm secondary affordance.
    // `title` — a tappable h1. Larger (lg/xl font, semibold, grayscale-900),
    //          no pill background, with a subtle chevron suffix. Hover
    //          deepens to grayscale-900 so the button affordance reads,
    //          but at rest it looks like plain text so it feels like
    //          the page title it actually is. Mirrors Linear / Notion /
    //          GitHub / Slack's "workspace title is the switcher" idiom.
    const isTitle = variant === 'title';

    const triggerClass = isTitle
        ? `shrink min-w-0 inline-flex items-center gap-1.5 -ml-1 py-1 px-1
           rounded-lg
           text-lg sm:text-xl font-semibold text-grayscale-900
           hover:bg-grayscale-10 transition-colors
           max-w-full`
        : `shrink-0 inline-flex items-center gap-1.5 py-2 px-3
           rounded-full text-xs font-medium
           bg-grayscale-100 text-grayscale-700 hover:bg-grayscale-200
           transition-colors max-w-[240px]`;

    const chevronSizeClass = isTitle ? 'text-sm' : 'text-xs';
    const addIconColorClass = isTitle
        ? 'text-grayscale-400'
        : '';

    // Dropdown anchors differently per variant: the title variant sits
    // on the left edge of the header, so the popover opens flush-left
    // (title's left edge ≈ popover's left edge). The chip variant
    // lives top-right, so the popover opens flush-right. Width is
    // unchanged so the list layout is identical in either anchor.
    const popoverAnchorClass = isTitle
        ? 'absolute z-30 top-full left-0 mt-2 w-[320px] max-w-[calc(100vw-2rem)]'
        : 'absolute z-30 top-full right-0 mt-2 w-[320px]';

    // Single-pathway learners get a calm affordance that's read as
    // identity first. In `chip` variant this is a grey pill; in
    // `title` variant it's the h1 itself. In both cases clicking
    // jumps to onboarding (the one affordance that still makes sense
    // when there's nothing to switch *between*).
    if (ordered.length <= 1) {
        return (
            <button
                type="button"
                onClick={handleAdd}
                className={triggerClass}
                title="Add another pathway"
            >
                <span className="truncate">
                    {activePathway?.title ?? 'No pathways yet'}
                </span>

                <IonIcon
                    icon={addOutline}
                    className={`text-sm shrink-0 ${addIconColorClass}`}
                    aria-hidden
                />
            </button>
        );
    }

    return (
        <div className={isTitle ? 'relative min-w-0' : 'relative'} ref={containerRef}>
            <button
                type="button"
                onClick={() => setOpen(v => !v)}
                aria-expanded={open}
                aria-haspopup="listbox"
                className={triggerClass}
            >
                <span className="truncate">
                    {activePathway?.title ?? 'Pathways'}
                </span>

                <IonIcon
                    icon={chevronDownOutline}
                    className={`${chevronSizeClass} shrink-0 transition-transform ${
                        isTitle ? 'text-grayscale-400' : ''
                    } ${open ? 'rotate-180' : ''}`}
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
                        className={`${popoverAnchorClass}
                                   rounded-[20px] bg-white border border-grayscale-200
                                   shadow-xl shadow-grayscale-900/10 overflow-hidden`}
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

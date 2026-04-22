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
 *   - The trigger is always the active-pathway title. Clicking it
 *     opens the dropdown *even when there's only one subscribed
 *     pathway* — the switcher is the single canonical affordance for
 *     "act on pathways" (open the current one, pick a different one,
 *     add a new one). A plus-only button on single-pathway learners
 *     hid the "click into this pathway" gesture behind nothing at
 *     all; shipping one popover for all counts keeps the mental
 *     model uniform as the learner grows into a multi-pathway user.
 *   - Each row shows the pathway title, a tiny progress fraction,
 *     and a remove action. Progress is rolled up once per render
 *     via `computePathwayProgress`.
 *   - Selecting any pathway (including the *active* one) switches
 *     the active id AND navigates to `/pathways/map`. The Map is
 *     the spatial home; tapping a pathway expresses "show me this
 *     pathway," and the Map answers with the terrain plus a focused
 *     next step.
 *   - Sub-pathways (composite references inside a parent pathway)
 *     render **nested** under their root, with an indent and a
 *     `└` tree glyph, so a single journey with 3 children reads as
 *     one journey with 3 sub-steps rather than 4 peer pathways.
 *     Derived from `findParentPathway` — no schema change needed.
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

import {
    computePathwayProgress,
    findParentPathway,
} from './core/composition';

import type { Pathway } from './types';

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
// List row — one per pathway in the popover
// ---------------------------------------------------------------------------

/**
 * A single row in the switcher's popover list. Lives alongside the
 * main component so it can read `depth` and render the sub-pathway
 * tree affordance consistently.
 *
 * ## Depth semantics
 *
 *   - **Depth 0 (root)** — a pathway the learner actively subscribed
 *     to. Full-weight title, no indent, remove-on-hover action.
 *   - **Depth 1 (child)** — a pathway referenced via a composite
 *     node inside a root pathway. Rendered indented with a `└`
 *     tree glyph so the parent-child relationship is read at a
 *     glance. Slightly lighter typography to reinforce "this is
 *     a part of the root above, not a peer." Removal is still
 *     offered but labeled so the author knows the parent's
 *     composite ref will dangle.
 *
 * `isLastChildInGroup` is kept for API completeness — on depth 1
 * we currently render the same `└` glyph regardless. If we later
 * add connector lines between siblings, the last-child flag flips
 * the glyph to `└` and interior children to `├`; until then it's a
 * no-op but cheap to thread through.
 */
interface PathwayRowProps {
    pathway: Pathway;
    depth: 0 | 1;
    isLastChildInGroup: boolean;
    isActive: boolean;
    onSwitch: (pathwayId: string) => void;
    onRemove: (pathwayId: string, title: string) => void;
}

const PathwayRow: React.FC<PathwayRowProps> = ({
    pathway,
    depth,
    isLastChildInGroup: _isLastChildInGroup,
    isActive,
    onSwitch,
    onRemove,
}) => {
    const progress = computePathwayProgress(pathway);
    const isChild = depth === 1;

    return (
        <li className="group flex items-stretch">
            <button
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => onSwitch(pathway.id)}
                className={`flex-1 min-w-0 text-left py-2.5
                            flex items-start gap-2
                            transition-colors ${
                                isActive
                                    ? 'bg-emerald-50 hover:bg-emerald-100'
                                    : 'hover:bg-grayscale-10'
                            } ${isChild ? 'pl-2 pr-3' : 'px-3'}`}
            >
                {/*
                    Tree glyph column — only rendered for children.
                    The `└` sits in its own fixed-width slot so the
                    following status dot + title line up across all
                    children of the same parent. On mobile this
                    column is 20 px, enough for the glyph + a hair
                    of breathing room.
                */}
                {isChild && (
                    <span
                        aria-hidden
                        className="shrink-0 w-5 mt-0.5 text-grayscale-300 font-mono text-xs leading-[1.2] text-center"
                    >
                        └
                    </span>
                )}

                {/*
                    Status dot — same size/shape across depths so the
                    "this is the active one" signal reads identically
                    whether the active pathway is a root or a child.
                */}
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
                                : isChild
                                    ? 'text-grayscale-700'
                                    : 'text-grayscale-800'
                        }`}
                    >
                        {pathway.title}
                    </span>

                    <span className="block mt-0.5 flex items-center gap-1.5">
                        <ProgressBadge
                            completed={progress.completed}
                            total={progress.total}
                        />

                        {isChild && (
                            <>
                                <span
                                    aria-hidden
                                    className="text-grayscale-300 text-[10px]"
                                >
                                    ·
                                </span>

                                <span className="text-[10px] uppercase tracking-wide text-grayscale-400">
                                    Sub-pathway
                                </span>
                            </>
                        )}
                    </span>
                </span>
            </button>

            <button
                type="button"
                aria-label={`Remove ${pathway.title}`}
                onClick={e => {
                    e.stopPropagation();
                    onRemove(pathway.id, pathway.title);
                }}
                className="shrink-0 px-3 text-grayscale-400 hover:text-red-700
                           hover:bg-red-50 transition-colors
                           opacity-0 group-hover:opacity-100 focus:opacity-100"
            >
                <IonIcon icon={trashOutline} className="text-sm" />
            </button>
        </li>
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

    // Build a roots-with-children tree over the flat `pathways` map.
    // ────────────────────────────────────────────────────────────────
    // A pathway is a **child** when some other pathway embeds it as a
    // composite reference (node's `policy.kind === 'composite'`,
    // detected via `findParentPathway`). A child is conceptually *part
    // of* its parent's journey, not a peer destination — rendering it
    // indented under the parent is what matches the learner's mental
    // model.
    //
    // Pathways without a parent (or whose parent isn't loaded) are
    // **roots** and anchor the list. Each root lists its direct
    // children below it; we don't recurse beyond depth 1 because:
    //   - Nested composite references beyond one level are vanishingly
    //     rare in practice (templates rarely author grandchild
    //     pathways).
    //   - A tree of depth 2+ in a 320 px popover column starts
    //     eating too much horizontal space for useful titles.
    //
    // The root count is the "My pathways · N" number shown in the
    // header of the popover — so a learner with one journey that
    // happens to have three sub-pathways reads as "1", not "4".
    const { roots, childrenByParentId } = React.useMemo(() => {
        const list = Object.values(pathways);
        const rootList: Pathway[] = [];
        const byParent = new Map<string, Pathway[]>();

        for (const p of list) {
            const parent = findParentPathway(pathways, p.id);

            if (parent) {
                const arr = byParent.get(parent.id) ?? [];
                arr.push(p);
                byParent.set(parent.id, arr);
            } else {
                rootList.push(p);
            }
        }

        // Sort roots: the one containing the active pathway
        // (either it IS active, or one of its children is) floats
        // to the top so the learner sees their current journey
        // first; everything else is alphabetical for stability.
        rootList.sort((a, b) => {
            const aHasActive =
                a.id === activeId ||
                (byParent.get(a.id) ?? []).some(c => c.id === activeId);
            const bHasActive =
                b.id === activeId ||
                (byParent.get(b.id) ?? []).some(c => c.id === activeId);

            if (aHasActive && !bHasActive) return -1;
            if (bHasActive && !aHasActive) return 1;

            return a.title.localeCompare(b.title);
        });

        // Children within a parent: alphabetical. Author order would
        // also be defensible but the parent pathway doesn't carry
        // one for its composite refs at the pathway-level, and
        // alphabetical is stable and predictable.
        for (const [parentId, kids] of byParent.entries()) {
            byParent.set(
                parentId,
                [...kids].sort((a, b) => a.title.localeCompare(b.title)),
            );
        }

        return { roots: rootList, childrenByParentId: byParent };
    }, [pathways, activeId]);

    // Total subscribed count — used for telemetry + internal checks
    // only. The popover header shows roots.length so the headline
    // number matches the *journey* count, not the node-instance count.
    const totalCount = Object.keys(pathways).length;

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
        // Closing the popover + landing on Map happens regardless
        // of whether the id actually changed: tapping a pathway is
        // a "show me this pathway" gesture, not strictly a swap.
        // If the user taps the already-active row we still take
        // them to the Map surface (they probably had the popover
        // open from another route like What-If / Build / Proposals
        // and want to land home).
        setOpen(false);

        if (pathwayId !== activeId) {
            pathwayStore.set.setActivePathway(pathwayId);

            analytics.track(AnalyticsEvents.PATHWAYS_PATHWAY_SWITCHED, {
                fromPathwayId: activeId,
                toPathwayId: pathwayId,
                subscribedCount: totalCount,
            });
        }

        history.push('/pathways/map');
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
            remainingCount: totalCount - 1,
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

    // **Zero-pathway learners** get a direct onboard shortcut — no
    // dropdown, because there's nothing to pick and the dropdown
    // would render a single "Add another pathway" row that's weaker
    // than a full-button CTA. `activePathway` is null here so the
    // label reads "No pathways yet."
    //
    // Learners with ≥ 1 subscribed pathway always get the dropdown
    // (even at count 1), so the gesture "tap the title → act on
    // pathways" is uniform as they grow into a multi-pathway user.
    if (totalCount === 0) {
        return (
            <button
                type="button"
                onClick={handleAdd}
                className={triggerClass}
                title="Add a pathway to get started"
            >
                <span className="truncate">No pathways yet</span>

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
                                My pathways · {roots.length}
                            </div>
                        </div>

                        <ul className="max-h-[360px] overflow-y-auto py-1">
                            {roots.map(root => {
                                const children =
                                    childrenByParentId.get(root.id) ?? [];

                                return (
                                    <React.Fragment key={root.id}>
                                        <PathwayRow
                                            pathway={root}
                                            depth={0}
                                            isLastChildInGroup={false}
                                            isActive={root.id === activeId}
                                            onSwitch={handleSwitch}
                                            onRemove={handleRemove}
                                        />

                                        {children.map((child, idx) => (
                                            <PathwayRow
                                                key={child.id}
                                                pathway={child}
                                                depth={1}
                                                isLastChildInGroup={
                                                    idx === children.length - 1
                                                }
                                                isActive={child.id === activeId}
                                                onSwitch={handleSwitch}
                                                onRemove={handleRemove}
                                            />
                                        ))}
                                    </React.Fragment>
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

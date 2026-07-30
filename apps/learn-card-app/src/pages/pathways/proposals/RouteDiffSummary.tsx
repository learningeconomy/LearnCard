/**
 * RouteDiffSummary — visualize a `setChosenRoute` route swap.
 *
 * Renders the proposed route as a horizontal strip of step pills,
 * with each pill tagged as `kept` (emerald), `added` (soft indigo),
 * or `removed` (muted, strike-through, in a trailing "dropped"
 * section). Node ids resolve to titles when a `pathway` is provided.
 *
 * This is the Phase A visual — compact, readable at the card scale,
 * works in proposal lists. Phase C reuses the same component on
 * What-If scenario cards so "here's what swapping to this scenario
 * does to your walk" reads the same way in both places.
 *
 * Design notes:
 *
 *   - Uses emerald for kept (matches our existing completion /
 *     chosen-route palette) and a soft indigo wash for added steps.
 *     This gives us a direction cue without committing to Navigate
 *     mode's full wayfinding palette (Phase B handles that).
 *   - Removed steps are shown in a clearly separate "Dropping from
 *     your walk" subsection rather than inline strikethroughs. Inline
 *     strikethrough reads as "still there but crossed out," which
 *     fights the truth that the whole point is removal from the walk.
 *   - When the current route is absent (the proposal introduces a
 *     walk where none existed), we render a simple "New route"
 *     label so the frame isn't "what you're losing."
 */

import React from 'react';

import type { Pathway } from '../types';

import { diffRoutes, type RouteDiffResult } from './routeDiff';

interface RouteDiffSummaryProps {
    /** The current chosenRoute on the pathway (may be undefined). */
    current: readonly string[] | undefined;
    /** The proposed route (the `setChosenRoute` value on the diff). */
    proposed: readonly string[] | undefined;
    /**
     * The pathway — used to resolve ids to titles. Optional, but
     * strongly recommended: without it the strip shows raw uuids,
     * which is useless for a learner.
     */
    pathway?: Pathway | null;
}

const titleOf = (pathway: Pathway | null | undefined, id: string): string =>
    pathway?.nodes.find(n => n.id === id)?.title ?? `${id.slice(0, 6)}…`;

const RouteStep: React.FC<{
    title: string;
    status: 'kept' | 'added' | 'removed';
    position?: number;
    total?: number;
}> = ({ title, status, position, total }) => {
    const base =
        'inline-flex items-center gap-1.5 py-1.5 px-2.5 rounded-full text-xs font-medium leading-none whitespace-nowrap';

    const palette = {
        kept: 'bg-emerald-50 text-emerald-800 border border-emerald-100',
        added: 'bg-indigo-50 text-indigo-800 border border-indigo-100',
        removed:
            'bg-grayscale-100 text-grayscale-500 border border-grayscale-200 line-through',
    }[status];

    return (
        <span className={`${base} ${palette}`}>
            {position != null && total != null && (
                <span className="text-[10px] text-grayscale-500 font-normal">
                    {position}/{total}
                </span>
            )}
            <span className="truncate max-w-[9rem]">{title}</span>
        </span>
    );
};

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <p className="text-[10px] font-semibold uppercase tracking-wide text-grayscale-500">
        {children}
    </p>
);

const StepStrip: React.FC<{
    steps: RouteDiffResult['steps'];
    total: number;
    pathway: Pathway | null | undefined;
    variant: 'proposed' | 'removed';
}> = ({ steps, total, pathway, variant }) => {
    const visible = steps.filter(s =>
        variant === 'proposed' ? s.status !== 'removed' : s.status === 'removed',
    );

    if (visible.length === 0) return null;

    return (
        <div className="flex flex-wrap items-center gap-1.5">
            {visible.map((step, i) => (
                <React.Fragment key={`${step.status}-${step.id}-${i}`}>
                    <RouteStep
                        title={titleOf(pathway, step.id)}
                        status={step.status}
                        position={
                            variant === 'proposed' ? step.index + 1 : undefined
                        }
                        total={variant === 'proposed' ? total : undefined}
                    />

                    {i < visible.length - 1 && (
                        <span
                            className={`text-xs ${
                                variant === 'proposed'
                                    ? 'text-grayscale-400'
                                    : 'text-grayscale-300'
                            }`}
                            aria-hidden
                        >
                            →
                        </span>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

const RouteDiffSummary: React.FC<RouteDiffSummaryProps> = ({
    current,
    proposed,
    pathway,
}) => {
    const diff = diffRoutes(current, proposed);

    if (!diff.hasChanges && (proposed?.length ?? 0) === 0) {
        return (
            <p className="text-xs text-grayscale-500 italic">
                This proposal clears your route.
            </p>
        );
    }

    if (!diff.hasChanges) {
        return (
            <p className="text-xs text-grayscale-500 italic">
                No route changes.
            </p>
        );
    }

    const proposedCount =
        diff.kept.length + diff.added.length ||
        (proposed?.length ?? 0);

    const isBrandNewRoute = (current?.length ?? 0) === 0;

    return (
        <div className="space-y-3">
            <section className="space-y-1.5">
                <SectionLabel>
                    {isBrandNewRoute
                        ? 'New route'
                        : `New walk · ${proposedCount} step${proposedCount === 1 ? '' : 's'}`}
                </SectionLabel>

                <StepStrip
                    steps={diff.steps}
                    total={proposedCount}
                    pathway={pathway}
                    variant="proposed"
                />
            </section>

            {diff.removed.length > 0 && (
                <section className="space-y-1.5">
                    <SectionLabel>
                        Dropping from your walk · {diff.removed.length} step
                        {diff.removed.length === 1 ? '' : 's'}
                    </SectionLabel>

                    <StepStrip
                        steps={diff.steps}
                        total={proposedCount}
                        pathway={pathway}
                        variant="removed"
                    />

                    <p className="text-[11px] text-grayscale-500 leading-relaxed">
                        These steps stay in your pathway, but fall off your
                        committed walk.
                    </p>
                </section>
            )}
        </div>
    );
};

export default RouteDiffSummary;

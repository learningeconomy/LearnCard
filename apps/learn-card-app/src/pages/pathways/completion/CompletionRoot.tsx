/**
 * CompletionRoot — shell-level mount point for the pathway and
 * sub-pathway completion ceremonies.
 *
 * Reads `pathwayStore.recentCelebration` and dispatches the
 * right ceremony component. Lives at the shell level (not
 * inside any specific mode) so a learner who completes a node
 * via NodeDetail and gets navigated back to Today / Map sees
 * the ceremony regardless of which mode is mounted underneath.
 *
 * Returns `null` when there's nothing to celebrate — no overlay,
 * no DOM weight, no z-index reservation. The `AnimatePresence`
 * wrapper lets the dismiss animation play out before the node
 * unmounts.
 *
 * Coalescing rule (handled in the store): if both a sub-pathway
 * and its parent newly completed in the same mutation, the
 * store emits only the parent's `kind: 'pathway'` celebration —
 * so this dispatcher never has to render a Tier 1 followed by a
 * Tier 2 back-to-back.
 *
 * Defensive read: if `recentCelebration` references a pathway
 * that's no longer in the store (removed mid-celebration, e.g.
 * by the cascade-removal flow), we silently dismiss rather than
 * crash. Same for a `sub-pathway` whose parent was removed.
 */

import React from 'react';

import { AnimatePresence } from 'motion/react';

import { pathwayStore } from '../../../stores/pathways';
import { findParentPathway, referencedPathwayIds } from '../core/composition';

import PathwayCeremony from './PathwayCeremony';
import SubPathwayCeremony from './SubPathwayCeremony';

const CompletionRoot: React.FC = () => {
    const celebration = pathwayStore.use.recentCelebration();
    const pathways = pathwayStore.use.pathways();

    // Resolve the pathway every render rather than caching:
    // pathway-store updates are cheap to read, and the
    // ceremonies need to read the *current* sub-pathway list /
    // reflection / etc. as the learner edits them.
    const renderable = (() => {
        if (!celebration) return null;

        const target = pathways[celebration.pathwayId];

        if (!target) return null;

        if (celebration.kind === 'sub-pathway') {
            // Use the celebration's recorded parent first; fall
            // back to a fresh `findParentPathway` lookup in case
            // the parent id was renamed/restructured between
            // emission and render. Either way: if no parent is
            // resolvable, dismiss — a sub-pathway without a
            // parent can't render the chain-effect line that
            // makes Tier 1 worth showing.
            const parent =
                pathways[celebration.parentPathwayId]
                ?? findParentPathway(pathways, celebration.pathwayId);

            if (!parent) return null;

            return (
                <SubPathwayCeremony
                    key={`sub-${celebration.pathwayId}-${celebration.completedAt}`}
                    subPathway={target}
                    parent={parent}
                    completedAt={celebration.completedAt}
                />
            );
        }

        // Tier 2 — collect direct sub-pathways for the receipt's
        // "X chapters" beat. Indirect (depth ≥ 2) descendants
        // aren't rolled in: the receipt is meant to read as a
        // single dignified line, not an exhaustive accounting.
        const directSubIds = referencedPathwayIds(target);

        const subPathways = directSubIds
            .map(id => pathways[id])
            .filter((p): p is NonNullable<typeof p> => !!p);

        return (
            <PathwayCeremony
                key={`pathway-${celebration.pathwayId}-${celebration.completedAt}`}
                pathway={target}
                subPathways={subPathways}
                completedAt={celebration.completedAt}
            />
        );
    })();

    return <AnimatePresence>{renderable}</AnimatePresence>;
};

export default CompletionRoot;

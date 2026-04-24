/**
 * pathwayStore — the active pathway graph.
 *
 * Phase 0: stubbed with mock data. Learner-initiated mutations are direct;
 * agent-initiated changes go through `proposalStore` → `applyProposal` (docs § 7).
 */

import { createStore } from '@udecode/zustood';

import { rollupCompositeProgress } from '../../pages/pathways/core/composition';
import type { Evidence, Pathway, PathwayNode } from '../../pages/pathways/types';

interface RecentCompletion {
    nodeId: string;
    pathwayId: string;
    title: string;
    /** ISO timestamp of when the node flipped to `completed`. */
    completedAt: string;
}

interface PathwayStoreState {
    pathways: Record<string, Pathway>;
    activePathwayId: string | null;
    /**
     * Fire-and-forget signal set by `completeTermination` and read by
     * Today's completion banner. Kept on the store (not component state)
     * because NodeDetail navigates away, unmounting Today — so we need a
     * survive-navigation record of "a node just completed".
     */
    recentCompletion: RecentCompletion | null;
}

const initialState: PathwayStoreState = {
    pathways: {},
    activePathwayId: null,
    recentCompletion: null,
};

/**
 * Composite progress rollup — re-run after every mutation that can
 * affect node completion. The helper is idempotent and returns the
 * same identity when no composite flip is needed, so calling it
 * unconditionally is cheap in the common case (no composite nodes,
 * or no nested pathway just finished).
 *
 * It's wired into `upsertPathway`, `editNode`, and
 * `completeTermination` because those are the only actions that can
 * either (a) change a node's completion status or (b) introduce a
 * new composite node whose nested pathway is already complete.
 * `removePathway` / `setActivePathway` / `clearRecentCompletion`
 * can't affect rollup and are left untouched.
 *
 * Inlined into each action's `set.state` callback so observers see
 * the primary mutation and the rollup as a single committed state,
 * never an interstitial "parent not yet rolled up" flash.
 */
const rollupInDraft = (draft: PathwayStoreState): void => {
    const rolled = rollupCompositeProgress(draft.pathways);

    // Identity-preserving fast path: when nothing flipped, skip the
    // assignment so Immer doesn't allocate a new pathways record.
    if (rolled === draft.pathways) return;

    draft.pathways = rolled;
};

export const pathwayStore = createStore('pathwayStore')<PathwayStoreState>(
    initialState,
    // Persistence enabled so pathway graph + progress survive navigation
    // away from the app (e.g. learner taps a claim link and bounces
    // through an external issuer page). Without this, every round-trip
    // wipes the in-memory pathway state, and the reactor's
    // `credential-ingested` dispatch on return fires against an empty
    // store — silent no-op, no CTA modal, no node completion.
    //
    // Storage is zustood's default (localStorage) keyed by the `name`.
    // That's fine: the shape is small, pathways are per-tenant, and
    // the sync helpers already tolerate stale cached entries via
    // `proposalStore.invalidateStale` on reconnect.
    { persist: { name: 'pathwayStore', enabled: true } },
).extendActions(set => ({
    setActivePathway: (pathwayId: string | null) => {
        set.activePathwayId(pathwayId);
    },

    upsertPathway: (pathway: Pathway) => {
        set.state(draft => {
            draft.pathways[pathway.id] = pathway;

            if (draft.activePathwayId === null) {
                draft.activePathwayId = pathway.id;
            }

            // Composite rollup: if this upsert introduces a composite
            // node whose nested pathway is already complete, flip the
            // parent to completed so dependents can unblock.
            rollupInDraft(draft);
        });
    },

    removePathway: (pathwayId: string) => {
        set.state(draft => {
            delete draft.pathways[pathwayId];

            if (draft.activePathwayId === pathwayId) {
                draft.activePathwayId = null;
            }
        });
    },

    /**
     * Learner-initiated edit. Agent edits must go through `applyProposal`.
     *
     * Bumps `pathway.revision` and `pathway.updatedAt` together — every
     * mutation path must participate in the CAS hinge the future
     * server-side optimistic-concurrency write will key off of. `?? 0`
     * tolerates legacy shapes that pre-date the field.
     */
    editNode: (pathwayId: string, nodeId: string, patch: Partial<PathwayNode>) => {
        set.state(draft => {
            const pathway = draft.pathways[pathwayId];

            if (!pathway) return;

            const node = pathway.nodes.find(n => n.id === nodeId);

            if (!node) return;

            const now = new Date().toISOString();

            Object.assign(node, patch, { updatedAt: now });
            pathway.updatedAt = now;
            pathway.revision = (pathway.revision ?? 0) + 1;

            // Edits can flip progress.status directly; re-roll.
            rollupInDraft(draft);
        });
    },

    completeTermination: (pathwayId: string, nodeId: string, evidence: Evidence[]) => {
        set.state(draft => {
            const pathway = draft.pathways[pathwayId];

            if (!pathway) return;

            const node = pathway.nodes.find(n => n.id === nodeId);

            if (!node) return;

            const wasAlreadyCompleted = node.progress.status === 'completed';
            const now = new Date().toISOString();

            node.progress.status = 'completed';
            node.progress.artifacts = [...node.progress.artifacts, ...evidence];
            node.progress.completedAt = now;
            node.updatedAt = now;
            pathway.updatedAt = now;
            // Completion is a mutation; bump revision so server-side
            // CAS writes see the change. Skipping the bump when the
            // node was already completed would be a nice purity win
            // but complicates the UX contract — the evidence array
            // still grew, so the revision should move.
            pathway.revision = (pathway.revision ?? 0) + 1;

            // Only emit the completion signal on the real transition —
            // re-calls on an already-completed node shouldn't retrigger
            // Today's banner.
            if (!wasAlreadyCompleted) {
                draft.recentCompletion = {
                    nodeId: node.id,
                    pathwayId: pathway.id,
                    title: node.title,
                    completedAt: now,
                };
            }

            // Completing a destination node can cascade up through one
            // or more composite references in other pathways.
            rollupInDraft(draft);
        });
    },

    clearRecentCompletion: () => {
        set.recentCompletion(null);
    },
})).extendSelectors((state, get) => ({
    activePathway: (): Pathway | null => {
        const id = get.activePathwayId();

        return id ? get.pathways()[id] ?? null : null;
    },

    getNode: (pathwayId: string, nodeId: string): PathwayNode | null => {
        const pathway = get.pathways()[pathwayId];

        return pathway?.nodes.find(n => n.id === nodeId) ?? null;
    },
}));

export default pathwayStore;

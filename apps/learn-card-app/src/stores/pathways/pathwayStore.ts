/**
 * pathwayStore — the active pathway graph.
 *
 * Phase 0: stubbed with mock data. Learner-initiated mutations are direct;
 * agent-initiated changes go through `proposalStore` → `applyProposal` (docs § 7).
 */

import { createStore } from '@udecode/zustood';

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

export const pathwayStore = createStore('pathwayStore')<PathwayStoreState>(
    initialState,
    { persist: { name: 'pathwayStore', enabled: false } },
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
     */
    editNode: (pathwayId: string, nodeId: string, patch: Partial<PathwayNode>) => {
        set.state(draft => {
            const pathway = draft.pathways[pathwayId];

            if (!pathway) return;

            const node = pathway.nodes.find(n => n.id === nodeId);

            if (!node) return;

            Object.assign(node, patch, { updatedAt: new Date().toISOString() });
            pathway.updatedAt = new Date().toISOString();
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

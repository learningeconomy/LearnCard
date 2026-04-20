/**
 * offlineQueueStore — queued mutations when the device is offline or the
 * LLM proxy is unreachable. Each entry tags its conflict strategy at enqueue
 * time; `reconcileOnReconnect()` applies the right resolution per docs § 11.
 *
 * Phase 0: store + types only. The reconcile pipeline lands in Phase 1.
 */

import { createStore } from '@udecode/zustood';

import type { Evidence, PathwayNode } from '../../pages/pathways/types';

export type ConflictStrategy =
    | 'client-wins'
    | 'client-wins-with-reconcile'
    | 'last-write-wins'
    | 'server-wins';

export type QueuedMutation =
    | {
          kind: 'evidence-upload';
          pathwayId: string;
          nodeId: string;
          evidence: Evidence;
          conflictStrategy: 'client-wins';
          enqueuedAt: string;
      }
    | {
          kind: 'complete-termination';
          pathwayId: string;
          nodeId: string;
          evidence: Evidence[];
          conflictStrategy: 'client-wins-with-reconcile';
          enqueuedAt: string;
      }
    | {
          kind: 'edit-node';
          pathwayId: string;
          nodeId: string;
          patch: Partial<PathwayNode>;
          conflictStrategy: 'last-write-wins';
          enqueuedAt: string;
      }
    | {
          kind: 'commit-proposal';
          proposalId: string;
          conflictStrategy: 'server-wins';
          enqueuedAt: string;
      }
    | {
          kind: 'archive-pathway';
          pathwayId: string;
          conflictStrategy: 'server-wins';
          enqueuedAt: string;
      };

interface OfflineQueueState {
    queue: QueuedMutation[];
    isOnline: boolean;
}

const initialState: OfflineQueueState = {
    queue: [],
    isOnline: true,
};

export const offlineQueueStore = createStore('offlineQueueStore')<OfflineQueueState>(
    initialState,
    { persist: { name: 'pathwaysOfflineQueue', enabled: true } },
).extendActions(set => ({
    enqueue: (mutation: QueuedMutation) => {
        set.state(draft => {
            draft.queue.push(mutation);
        });
    },

    drain: () => {
        set.queue([]);
    },

    setOnline: (online: boolean) => {
        set.isOnline(online);
    },
})).extendSelectors((state, get) => ({
    size: (): number => get.queue().length,
    byPathway: (pathwayId: string): QueuedMutation[] =>
        get
            .queue()
            .filter(m => 'pathwayId' in m && m.pathwayId === pathwayId),
}));

export default offlineQueueStore;

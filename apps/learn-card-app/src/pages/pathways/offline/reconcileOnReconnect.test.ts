import { describe, expect, it } from 'vitest';

import type { QueuedMutation } from '../../../stores/pathways';

import {
    reconcileOnReconnect,
    type ServerSnapshot,
} from './reconcileOnReconnect';

const NOW = '2026-04-20T12:00:00.000Z';

const emptySnapshot = (overrides: Partial<ServerSnapshot> = {}): ServerSnapshot => ({
    pathwayNodes: {},
    pathwayStatuses: {},
    proposalStatuses: {},
    ...overrides,
});

describe('reconcileOnReconnect — mutation-type coverage (docs § 11)', () => {
    it('evidence uploads always client-wins (additive)', () => {
        const mutation: QueuedMutation = {
            kind: 'evidence-upload',
            pathwayId: 'p1',
            nodeId: 'n1',
            evidence: {
                id: 'ev-1',
                artifactType: 'text',
                submittedAt: NOW,
            },
            conflictStrategy: 'client-wins',
            enqueuedAt: NOW,
        };

        const plan = reconcileOnReconnect([mutation], emptySnapshot());

        expect(plan.replay).toHaveLength(1);
        expect(plan.replay[0].resolution).toBe('client-wins');
        expect(plan.prompt).toHaveLength(0);
        expect(plan.discard).toHaveLength(0);
    });

    it('completeTermination client-wins when the node is still active server-side', () => {
        const mutation: QueuedMutation = {
            kind: 'complete-termination',
            pathwayId: 'p1',
            nodeId: 'n1',
            evidence: [],
            conflictStrategy: 'client-wins-with-reconcile',
            enqueuedAt: NOW,
        };

        const plan = reconcileOnReconnect(
            [mutation],
            emptySnapshot({
                pathwayNodes: { p1: { n1: { status: 'active', serverUpdatedAt: NOW } } },
            }),
        );

        expect(plan.replay).toHaveLength(1);
        expect(plan.replay[0].resolution).toBe('client-wins');
    });

    it('completeTermination surfaces learner-prompt when the node was archived server-side', () => {
        const mutation: QueuedMutation = {
            kind: 'complete-termination',
            pathwayId: 'p1',
            nodeId: 'n1',
            evidence: [],
            conflictStrategy: 'client-wins-with-reconcile',
            enqueuedAt: NOW,
        };

        const plan = reconcileOnReconnect(
            [mutation],
            emptySnapshot({
                pathwayNodes: { p1: { n1: { status: 'archived', serverUpdatedAt: NOW } } },
            }),
        );

        expect(plan.prompt).toHaveLength(1);
        expect(plan.prompt[0].resolution).toBe('learner-prompt');
        expect(plan.replay).toHaveLength(0);
    });

    it('completeTermination surfaces learner-prompt when the whole pathway was archived', () => {
        const mutation: QueuedMutation = {
            kind: 'complete-termination',
            pathwayId: 'p1',
            nodeId: 'n1',
            evidence: [],
            conflictStrategy: 'client-wins-with-reconcile',
            enqueuedAt: NOW,
        };

        const plan = reconcileOnReconnect(
            [mutation],
            emptySnapshot({ pathwayStatuses: { p1: 'archived' } }),
        );

        expect(plan.prompt).toHaveLength(1);
    });

    it('edit-node resolves as last-write-wins', () => {
        const mutation: QueuedMutation = {
            kind: 'edit-node',
            pathwayId: 'p1',
            nodeId: 'n1',
            patch: { title: 'New title' },
            conflictStrategy: 'last-write-wins',
            enqueuedAt: NOW,
        };

        const plan = reconcileOnReconnect([mutation], emptySnapshot());

        expect(plan.replay).toHaveLength(1);
        expect(plan.replay[0].resolution).toBe('last-write-wins');
    });

    it('commit-proposal replays when the proposal is still open server-side', () => {
        const mutation: QueuedMutation = {
            kind: 'commit-proposal',
            proposalId: 'prop-1',
            conflictStrategy: 'server-wins',
            enqueuedAt: NOW,
        };

        const plan = reconcileOnReconnect(
            [mutation],
            emptySnapshot({ proposalStatuses: { 'prop-1': 'open' } }),
        );

        expect(plan.replay).toHaveLength(1);
        expect(plan.replay[0].resolution).toBe('client-wins');
    });

    it('commit-proposal discards when the proposal was already acted on elsewhere (cross-device stale)', () => {
        const mutation: QueuedMutation = {
            kind: 'commit-proposal',
            proposalId: 'prop-1',
            conflictStrategy: 'server-wins',
            enqueuedAt: NOW,
        };

        const plan = reconcileOnReconnect(
            [mutation],
            emptySnapshot({ proposalStatuses: { 'prop-1': 'accepted' } }),
        );

        expect(plan.discard).toHaveLength(1);
        expect(plan.discard[0].resolution).toBe('server-wins');
        expect(plan.replay).toHaveLength(0);
    });

    it('archive-pathway is always server-wins (avoids ghost revived nodes)', () => {
        const mutation: QueuedMutation = {
            kind: 'archive-pathway',
            pathwayId: 'p1',
            conflictStrategy: 'server-wins',
            enqueuedAt: NOW,
        };

        const plan = reconcileOnReconnect([mutation], emptySnapshot());

        expect(plan.discard).toHaveLength(1);
    });
});

describe('reconcileOnReconnect — cross-device proposal sync', () => {
    it('surfaces every server proposal status so the client can invalidate stale cache', () => {
        const plan = reconcileOnReconnect(
            [],
            emptySnapshot({
                proposalStatuses: {
                    'prop-a': 'accepted',
                    'prop-b': 'expired',
                    'prop-c': 'open',
                },
            }),
        );

        expect(plan.proposalStatusUpdates).toEqual({
            'prop-a': 'accepted',
            'prop-b': 'expired',
            'prop-c': 'open',
        });
    });
});

describe('reconcileOnReconnect — ordering and determinism', () => {
    it('preserves input order in the replay bucket', () => {
        const queue: QueuedMutation[] = [
            {
                kind: 'evidence-upload',
                pathwayId: 'p1',
                nodeId: 'n1',
                evidence: { id: 'a', artifactType: 'text', submittedAt: NOW },
                conflictStrategy: 'client-wins',
                enqueuedAt: NOW,
            },
            {
                kind: 'edit-node',
                pathwayId: 'p1',
                nodeId: 'n1',
                patch: { title: 't' },
                conflictStrategy: 'last-write-wins',
                enqueuedAt: NOW,
            },
            {
                kind: 'evidence-upload',
                pathwayId: 'p1',
                nodeId: 'n1',
                evidence: { id: 'b', artifactType: 'text', submittedAt: NOW },
                conflictStrategy: 'client-wins',
                enqueuedAt: NOW,
            },
        ];

        const plan = reconcileOnReconnect(queue, emptySnapshot());

        expect(plan.replay.map(d => d.mutation.kind)).toEqual([
            'evidence-upload',
            'edit-node',
            'evidence-upload',
        ]);
    });
});

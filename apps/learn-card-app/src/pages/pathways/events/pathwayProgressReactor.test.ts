import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { pathwayStore, proposalStore } from '../../../stores/pathways';
import type {
    CredentialIngestedEvent,
    Pathway,
    PathwayNode,
    Termination,
} from '../types';

import { createPathwayProgressReactor } from './pathwayProgressReactor';
import { createWalletEventBus } from './walletEventBus';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const OWNER = 'did:example:alice';
const NOW = '2026-04-22T00:00:00.000Z';

const PATHWAY_ID = '00000000-0000-4000-8000-aaaaaaaaaaaa';

let seq = 0;

const uid = (): string => {
    seq += 1;
    return `00000000-0000-4000-8000-${seq.toString(16).padStart(12, '0')}`;
};

const nodeWithTermination = (
    id: string,
    termination: Termination,
    overrides: Partial<PathwayNode> = {},
): PathwayNode => ({
    id,
    pathwayId: PATHWAY_ID,
    title: 'Node',
    stage: {
        initiation: [],
        policy: {
            kind: 'practice',
            cadence: { frequency: 'ad-hoc', perPeriod: 1 },
            artifactTypes: ['text'],
        },
        termination,
    },
    endorsements: [],
    progress: {
        status: 'not-started',
        artifacts: [],
        reviewsDue: 0,
        streak: { current: 0, longest: 0 },
    },
    createdBy: 'learner',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
});

const seedPathway = (nodes: PathwayNode[]): Pathway => {
    const pathway: Pathway = {
        id: PATHWAY_ID,
        ownerDid: OWNER,
        revision: 0,
        schemaVersion: 1,
        title: 'Test Pathway',
        goal: 'Goal',
        nodes: nodes.map(n => ({ ...n, pathwayId: PATHWAY_ID })),
        edges: [],
        status: 'active',
        visibility: { self: true, mentors: false, guardians: false, publicProfile: false },
        source: 'authored',
        createdAt: NOW,
        updatedAt: NOW,
    };

    pathwayStore.set.upsertPathway(pathway);
    pathwayStore.set.setActivePathway(pathway.id);

    return pathway;
};

const credentialEvent = (
    overrides: Partial<CredentialIngestedEvent> = {},
): CredentialIngestedEvent => ({
    kind: 'credential-ingested',
    eventId: uid(),
    credentialUri: `urn:uuid:vc-${seq}`,
    vc: {
        type: ['AWSCertifiedCloudPractitioner'],
        issuer: 'did:web:aws.example',
    },
    ingestedAt: NOW,
    source: 'claim-link',
    ...overrides,
});

// ---------------------------------------------------------------------------
// Test store reset
// ---------------------------------------------------------------------------

beforeEach(() => {
    seq = 0;

    // Zero the app-level stores so each test starts clean.
    pathwayStore.set.state(draft => {
        draft.pathways = {};
        draft.activePathwayId = null;
        draft.recentCompletion = null;
    });

    proposalStore.set.state(draft => {
        draft.proposals = {};
    });
});

afterEach(() => {
    pathwayStore.set.state(draft => {
        draft.pathways = {};
        draft.activePathwayId = null;
        draft.recentCompletion = null;
    });

    proposalStore.set.state(draft => {
        draft.proposals = {};
    });
});

// ---------------------------------------------------------------------------
// End-to-end: credential event → proposal → accept → progress flip
// ---------------------------------------------------------------------------

describe('pathwayProgressReactor — credential-ingested end-to-end', () => {
    it('auto-accepts the completion proposal and flips node progress to completed', () => {
        const node = nodeWithTermination(uid(), {
            kind: 'requirement-satisfied',
            requirement: {
                kind: 'credential-type',
                type: 'AWSCertifiedCloudPractitioner',
            },
            minTrustTier: 'trusted',
        });
        seedPathway([node]);

        const reactor = createPathwayProgressReactor({
            bus: createWalletEventBus({ validate: false }),
            now: () => NOW,
        });

        const record = reactor.processEvent(credentialEvent());

        expect(record).not.toBeNull();
        expect(record!.nodeCompletions).toHaveLength(1);
        expect(record!.nodeCompletions[0].accepted).toBe(true);

        // The proposal is in the store with status `accepted`.
        const proposals = Object.values(proposalStore.get.proposals());
        expect(proposals).toHaveLength(1);
        expect(proposals[0].status).toBe('accepted');

        // The node's progress flipped to completed.
        const pathway = pathwayStore.get.pathways()[PATHWAY_ID];
        const updated = pathway.nodes.find(n => n.id === node.id);
        expect(updated?.progress.status).toBe('completed');
        expect(updated?.progress.completedAt).toBe(NOW);
    });

    it('leaves the proposal open when auto-accept is disabled', () => {
        const node = nodeWithTermination(uid(), {
            kind: 'requirement-satisfied',
            requirement: {
                kind: 'credential-type',
                type: 'AWSCertifiedCloudPractitioner',
            },
            minTrustTier: 'trusted',
        });
        seedPathway([node]);

        const reactor = createPathwayProgressReactor({
            bus: createWalletEventBus({ validate: false }),
            autoAcceptCredential: false,
            autoAcceptOutcome: false,
            now: () => NOW,
        });

        const record = reactor.processEvent(credentialEvent());

        expect(record!.nodeCompletions[0].accepted).toBe(false);

        const proposals = Object.values(proposalStore.get.proposals());
        expect(proposals).toHaveLength(1);
        expect(proposals[0].status).toBe('open');

        // Node progress is still not-started — the proposal needs a
        // learner click to commit in this mode.
        const pathway = pathwayStore.get.pathways()[PATHWAY_ID];
        const updated = pathway.nodes.find(n => n.id === node.id);
        expect(updated?.progress.status).toBe('not-started');
    });

    it('short-circuits when no pathways are loaded', () => {
        // No seedPathway call.
        const reactor = createPathwayProgressReactor({
            bus: createWalletEventBus({ validate: false }),
            now: () => NOW,
        });

        const record = reactor.processEvent(credentialEvent());

        expect(record).toBeNull();
        expect(Object.values(proposalStore.get.proposals())).toEqual([]);
    });

    it('records dispatches in history for UX observers', () => {
        const node = nodeWithTermination(uid(), {
            kind: 'requirement-satisfied',
            requirement: {
                kind: 'credential-type',
                type: 'AWSCertifiedCloudPractitioner',
            },
            minTrustTier: 'trusted',
        });
        seedPathway([node]);

        const reactor = createPathwayProgressReactor({
            bus: createWalletEventBus({ validate: false }),
            now: () => NOW,
        });

        const event = credentialEvent();
        reactor.processEvent(event);

        const last = reactor.lastDispatch();
        expect(last?.eventId).toBe(event.eventId);
        expect(last?.nodeCompletions).toHaveLength(1);
    });
});

// ---------------------------------------------------------------------------
// Bus integration
// ---------------------------------------------------------------------------

describe('pathwayProgressReactor — bus subscription', () => {
    it('mount subscribes and processes events published to the bus', () => {
        const node = nodeWithTermination(uid(), {
            kind: 'requirement-satisfied',
            requirement: {
                kind: 'credential-type',
                type: 'AWSCertifiedCloudPractitioner',
            },
            minTrustTier: 'trusted',
        });
        seedPathway([node]);

        const bus = createWalletEventBus({ validate: false });
        const reactor = createPathwayProgressReactor({ bus, now: () => NOW });

        const stop = reactor.mount();

        bus.publish(credentialEvent());

        const pathway = pathwayStore.get.pathways()[PATHWAY_ID];
        const updated = pathway.nodes.find(n => n.id === node.id);
        expect(updated?.progress.status).toBe('completed');

        stop();
    });

    it('mount replays buffered events so pre-mount claims still dispatch', () => {
        const node = nodeWithTermination(uid(), {
            kind: 'requirement-satisfied',
            requirement: {
                kind: 'credential-type',
                type: 'AWSCertifiedCloudPractitioner',
            },
            minTrustTier: 'trusted',
        });
        seedPathway([node]);

        const bus = createWalletEventBus({ validate: false });

        // Publish BEFORE the reactor mounts.
        bus.publish(credentialEvent());

        const reactor = createPathwayProgressReactor({ bus, now: () => NOW });
        const stop = reactor.mount();

        const pathway = pathwayStore.get.pathways()[PATHWAY_ID];
        const updated = pathway.nodes.find(n => n.id === node.id);
        expect(updated?.progress.status).toBe('completed');

        stop();
    });
});

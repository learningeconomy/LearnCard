import { describe, expect, it } from 'vitest';

import type {
    AiSessionCompletedEvent,
    CredentialIngestedEvent,
    Pathway,
    PathwayNode,
    Termination,
} from '../types';

import { bindEventToNodes } from './nodeProgressBinder';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const OWNER = 'did:example:alice';
const NOW = '2026-04-22T00:00:00.000Z';

let seq = 0;

const resetIds = (): void => {
    seq = 0;
};

const makeId = (): string => {
    seq += 1;

    return `00000000-0000-4000-8000-${seq.toString(16).padStart(12, '0')}`;
};

const nodeWithTermination = (
    id: string,
    termination: Termination,
    overrides: Partial<PathwayNode> = {},
): PathwayNode => ({
    id,
    pathwayId: '00000000-0000-4000-8000-aaaaaaaaaaaa',
    title: 'Test node',
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

const pathwayWith = (nodes: PathwayNode[], id?: string): Pathway => ({
    id: id ?? '00000000-0000-4000-8000-aaaaaaaaaaaa',
    ownerDid: OWNER,
    revision: 0,
    schemaVersion: 1,
    title: 'Test Pathway',
    goal: 'Goal',
    nodes: nodes.map(n => ({ ...n, pathwayId: id ?? '00000000-0000-4000-8000-aaaaaaaaaaaa' })),
    edges: [],
    status: 'active',
    visibility: { self: true, mentors: false, guardians: false, publicProfile: false },
    source: 'authored',
    createdAt: NOW,
    updatedAt: NOW,
});

const credentialEvent = (
    overrides: Partial<CredentialIngestedEvent> = {},
): CredentialIngestedEvent => ({
    kind: 'credential-ingested',
    eventId: '00000000-0000-4000-8000-00000000e001',
    credentialUri: 'urn:uuid:vc-1',
    vc: {
        type: ['VerifiableCredential', 'AWSCertifiedCloudPractitioner'],
        issuer: 'did:web:aws.example',
    },
    ingestedAt: NOW,
    source: 'claim-link',
    ...overrides,
});

const sessionEvent = (
    overrides: Partial<AiSessionCompletedEvent> = {},
): AiSessionCompletedEvent => ({
    kind: 'ai-session-completed',
    eventId: '00000000-0000-4000-8000-00000000e002',
    threadId: 'thread-abc',
    topicUri: 'boost:aws-iam-deep-dive',
    endedAt: NOW,
    source: 'user-finish',
    ...overrides,
});

// ---------------------------------------------------------------------------
// credential-ingested + requirement-satisfied
// ---------------------------------------------------------------------------

describe('bindEventToNodes — credential-ingested × requirement-satisfied', () => {
    it('emits a completion proposal when the credential type matches and trust clears', () => {
        resetIds();

        const node = nodeWithTermination('00000000-0000-4000-8000-000000000001', {
            kind: 'requirement-satisfied',
            requirement: {
                kind: 'credential-type',
                type: 'AWSCertifiedCloudPractitioner',
            },
            minTrustTier: 'trusted',
        });

        const pathway = pathwayWith([node]);

        const { proposals, skipped } = bindEventToNodes({
            event: credentialEvent(),
            pathways: [pathway],
            ownerDid: OWNER,
            now: NOW,
            makeId,
        });

        expect(skipped).toEqual([]);
        expect(proposals).toHaveLength(1);

        const proposal = proposals[0];

        expect(proposal.pathwayId).toBe(pathway.id);
        expect(proposal.agent).toBe('recorder');
        expect(proposal.capability).toBe('interpretation');
        expect(proposal.status).toBe('open');

        const completion = proposal.diff.completeNodes?.[0];

        expect(completion).toMatchObject({
            nodeId: node.id,
            completedAt: NOW,
            evidence: {
                kind: 'credential',
                ref: 'urn:uuid:vc-1',
            },
        });
    });

    it('matches a boost-uri requirement via the provenance hint on the event', () => {
        resetIds();

        const node = nodeWithTermination('00000000-0000-4000-8000-000000000002', {
            kind: 'requirement-satisfied',
            requirement: {
                kind: 'boost-uri',
                uri: 'boost:aws-iam-deep-dive',
            },
            minTrustTier: 'trusted',
        });

        const { proposals } = bindEventToNodes({
            event: credentialEvent({ boostUri: 'boost:aws-iam-deep-dive' }),
            pathways: [pathwayWith([node])],
            ownerDid: OWNER,
            now: NOW,
            makeId,
        });

        expect(proposals).toHaveLength(1);
    });

    it('skips with `trust-too-low` when the issuer does not clear the termination tier', () => {
        resetIds();

        const node = nodeWithTermination('00000000-0000-4000-8000-000000000003', {
            kind: 'requirement-satisfied',
            requirement: {
                kind: 'credential-type',
                type: 'AWSCertifiedCloudPractitioner',
            },
            // `institution` requires the issuer to be in `institutionIssuers`;
            // the default classifier returns `trusted`, which does not
            // clear that bar.
            minTrustTier: 'institution',
        });

        const { proposals, skipped } = bindEventToNodes({
            event: credentialEvent(),
            pathways: [pathwayWith([node])],
            ownerDid: OWNER,
            now: NOW,
            makeId,
        });

        expect(proposals).toEqual([]);
        expect(skipped).toEqual([
            expect.objectContaining({
                nodeId: node.id,
                reason: 'trust-too-low',
            }),
        ]);
    });

    it('skips with `requirement-not-matched` when the predicate fails', () => {
        resetIds();

        const node = nodeWithTermination('00000000-0000-4000-8000-000000000004', {
            kind: 'requirement-satisfied',
            requirement: { kind: 'credential-type', type: 'SomethingElse' },
            minTrustTier: 'trusted',
        });

        const { proposals, skipped } = bindEventToNodes({
            event: credentialEvent(),
            pathways: [pathwayWith([node])],
            ownerDid: OWNER,
            now: NOW,
            makeId,
        });

        expect(proposals).toEqual([]);
        expect(skipped).toEqual([
            expect.objectContaining({
                nodeId: node.id,
                reason: 'requirement-not-matched',
            }),
        ]);
    });

    it('does not re-propose for a node already in progress.status === "completed"', () => {
        resetIds();

        const node = nodeWithTermination(
            '00000000-0000-4000-8000-000000000005',
            {
                kind: 'requirement-satisfied',
                requirement: { kind: 'credential-type', type: 'AWSCertifiedCloudPractitioner' },
                minTrustTier: 'trusted',
            },
            {
                progress: {
                    status: 'completed',
                    artifacts: [],
                    reviewsDue: 0,
                    streak: { current: 0, longest: 0 },
                    completedAt: '2026-01-01T00:00:00.000Z',
                },
            },
        );

        const { proposals, skipped } = bindEventToNodes({
            event: credentialEvent(),
            pathways: [pathwayWith([node])],
            ownerDid: OWNER,
            now: NOW,
            makeId,
        });

        expect(proposals).toEqual([]);
        expect(skipped).toEqual([
            expect.objectContaining({
                nodeId: node.id,
                reason: 'already-completed',
            }),
        ]);
    });

    it('does not record a skip for nodes with unrelated terminations', () => {
        // A pathway will usually have many nodes that don't care about
        // the event. The binder should quietly ignore them, not flood
        // the skip list with noise.
        resetIds();

        const relevant = nodeWithTermination(
            '00000000-0000-4000-8000-000000000006',
            {
                kind: 'requirement-satisfied',
                requirement: { kind: 'credential-type', type: 'AWSCertifiedCloudPractitioner' },
                minTrustTier: 'trusted',
            },
        );

        const unrelated = nodeWithTermination(
            '00000000-0000-4000-8000-000000000007',
            { kind: 'self-attest', prompt: 'I did it' },
        );

        const { proposals, skipped } = bindEventToNodes({
            event: credentialEvent(),
            pathways: [pathwayWith([relevant, unrelated])],
            ownerDid: OWNER,
            now: NOW,
            makeId,
        });

        expect(proposals).toHaveLength(1);
        expect(skipped).toEqual([]);
    });
});

// ---------------------------------------------------------------------------
// ai-session-completed + session-completed
// ---------------------------------------------------------------------------

describe('bindEventToNodes — ai-session-completed × session-completed', () => {
    it('emits a completion proposal when the topicUri matches', () => {
        resetIds();

        const node = nodeWithTermination('00000000-0000-4000-8000-000000000010', {
            kind: 'session-completed',
            topicUri: 'boost:aws-iam-deep-dive',
        });

        const { proposals } = bindEventToNodes({
            event: sessionEvent(),
            pathways: [pathwayWith([node])],
            ownerDid: OWNER,
            now: NOW,
            makeId,
        });

        expect(proposals).toHaveLength(1);

        const completion = proposals[0].diff.completeNodes?.[0];

        expect(completion).toMatchObject({
            nodeId: node.id,
            evidence: {
                kind: 'ai-session',
                ref: 'thread-abc',
            },
        });
    });

    it('skips with `topic-uri-mismatch` on a different topic', () => {
        resetIds();

        const node = nodeWithTermination('00000000-0000-4000-8000-000000000011', {
            kind: 'session-completed',
            topicUri: 'boost:aws-iam-deep-dive',
        });

        const { proposals, skipped } = bindEventToNodes({
            event: sessionEvent({ topicUri: 'boost:something-else' }),
            pathways: [pathwayWith([node])],
            ownerDid: OWNER,
            now: NOW,
            makeId,
        });

        expect(proposals).toEqual([]);
        expect(skipped[0].reason).toBe('topic-uri-mismatch');
    });

    it('skips with `session-too-short` when minDurationSec is set and not met', () => {
        resetIds();

        const node = nodeWithTermination('00000000-0000-4000-8000-000000000012', {
            kind: 'session-completed',
            topicUri: 'boost:aws-iam-deep-dive',
            minDurationSec: 300,
        });

        const { proposals, skipped } = bindEventToNodes({
            event: sessionEvent({ durationSec: 60 }),
            pathways: [pathwayWith([node])],
            ownerDid: OWNER,
            now: NOW,
            makeId,
        });

        expect(proposals).toEqual([]);
        expect(skipped[0].reason).toBe('session-too-short');
    });

    it('passes the duration floor when it is met', () => {
        resetIds();

        const node = nodeWithTermination('00000000-0000-4000-8000-000000000013', {
            kind: 'session-completed',
            topicUri: 'boost:aws-iam-deep-dive',
            minDurationSec: 300,
        });

        const { proposals } = bindEventToNodes({
            event: sessionEvent({ durationSec: 600 }),
            pathways: [pathwayWith([node])],
            ownerDid: OWNER,
            now: NOW,
            makeId,
        });

        expect(proposals).toHaveLength(1);
    });
});

// ---------------------------------------------------------------------------
// Cross-pathway scan
// ---------------------------------------------------------------------------

describe('bindEventToNodes — cross-pathway', () => {
    it('emits a proposal per matching node across pathways', () => {
        resetIds();

        const node1 = nodeWithTermination('00000000-0000-4000-8000-000000000020', {
            kind: 'requirement-satisfied',
            requirement: { kind: 'credential-type', type: 'AWSCertifiedCloudPractitioner' },
            minTrustTier: 'trusted',
        });

        const node2 = nodeWithTermination('00000000-0000-4000-8000-000000000021', {
            kind: 'requirement-satisfied',
            requirement: { kind: 'credential-type', type: 'AWSCertifiedCloudPractitioner' },
            minTrustTier: 'trusted',
        });

        const pathwayA = pathwayWith(
            [node1],
            '00000000-0000-4000-8000-aaaaaaaaaaa1',
        );
        const pathwayB = pathwayWith(
            [node2],
            '00000000-0000-4000-8000-bbbbbbbbbbb2',
        );

        const { proposals } = bindEventToNodes({
            event: credentialEvent(),
            pathways: [pathwayA, pathwayB],
            ownerDid: OWNER,
            now: NOW,
            makeId,
        });

        expect(proposals).toHaveLength(2);
        expect(proposals.map(p => p.pathwayId).sort()).toEqual(
            [pathwayA.id, pathwayB.id].sort(),
        );
    });
});

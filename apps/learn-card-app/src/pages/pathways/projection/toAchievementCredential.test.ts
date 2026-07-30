import { describe, expect, it } from 'vitest';

import type { PathwayNode } from '../types';

import {
    ProjectionError,
    canProject,
    toAchievementCredential,
} from './toAchievementCredential';

const NOW = '2026-04-20T12:00:00.000Z';
const LEARNER_DID = 'did:key:zlearner';

const projectableNode = (overrides: Partial<PathwayNode> = {}): PathwayNode => ({
    id: 'node-1',
    pathwayId: 'p1',
    title: 'Ship a first portfolio piece',
    description: 'Write, edit, and publish a short essay.',
    stage: {
        initiation: [],
        policy: { kind: 'artifact', prompt: 'Write 500 words', expectedArtifact: 'text' },
        termination: {
            kind: 'artifact-count',
            count: 1,
            artifactType: 'text',
        },
    },
    credentialProjection: {
        achievementType: 'portfolio-piece',
        criteria: 'Publish one written artifact and self-attest.',
        image: 'https://example.org/badge.png',
        alignment: [
            {
                targetName: 'Written communication',
                targetFramework: 'ESCO',
                targetCode: 'S1.3.2',
            },
        ],
    },
    endorsements: [],
    progress: {
        status: 'completed',
        artifacts: [
            {
                id: 'ev-1',
                artifactType: 'text',
                note: 'First draft shipped.',
                submittedAt: NOW,
            },
        ],
        reviewsDue: 0,
        streak: { current: 1, longest: 1 },
        completedAt: NOW,
    },
    createdBy: 'learner',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
});

describe('toAchievementCredential', () => {
    it('projects a completed node into an OBv3-shaped claim', () => {
        const claim = toAchievementCredential({
            node: projectableNode(),
            ownerDid: LEARNER_DID,
            now: NOW,
        });

        expect(claim['@context'][0]).toBe('https://www.w3.org/2018/credentials/v1');
        expect(claim.type).toContain('OpenBadgeCredential');
        expect(claim.type).toContain('AchievementCredential');
        expect(claim.issuanceDate).toBe(NOW);
        expect(claim.credentialSubject.id).toBe(LEARNER_DID);
        expect(claim.credentialSubject.achievement.name).toBe('Ship a first portfolio piece');
        expect(claim.credentialSubject.achievement.achievementType).toBe('portfolio-piece');
    });

    it('inlines evidence from node.progress.artifacts', () => {
        const claim = toAchievementCredential({
            node: projectableNode(),
            ownerDid: LEARNER_DID,
            now: NOW,
        });

        expect(claim.credentialSubject.evidence).toHaveLength(1);
        expect(claim.credentialSubject.evidence?.[0].narrative).toBe('First draft shipped.');
        expect(claim.credentialSubject.evidence?.[0].genre).toBe('text');
    });

    it('omits the evidence field when there are no artifacts', () => {
        const claim = toAchievementCredential({
            node: projectableNode({
                progress: {
                    status: 'completed',
                    artifacts: [],
                    reviewsDue: 0,
                    streak: { current: 0, longest: 0 },
                    completedAt: NOW,
                },
            }),
            ownerDid: LEARNER_DID,
            now: NOW,
        });

        expect(claim.credentialSubject.evidence).toBeUndefined();
    });

    it('projects alignments onto the achievement', () => {
        const claim = toAchievementCredential({
            node: projectableNode(),
            ownerDid: LEARNER_DID,
            now: NOW,
        });

        expect(claim.credentialSubject.achievement.alignment).toHaveLength(1);
        expect(claim.credentialSubject.achievement.alignment?.[0].targetFramework).toBe('ESCO');
    });

    it('projects endorsements as inline EndorsementCredential refs', () => {
        const node = projectableNode({
            endorsements: [
                {
                    endorsementId: 'end-1',
                    endorserDid: 'did:key:zmentor',
                    endorserRelationship: 'mentor',
                    trustTier: 'trusted',
                },
            ],
        });

        const claim = toAchievementCredential({
            node,
            ownerDid: LEARNER_DID,
            now: NOW,
        });

        expect(claim.credentialSubject.endorsement).toHaveLength(1);
        expect(claim.credentialSubject.endorsement?.[0].id).toBe('end-1');
        expect(claim.credentialSubject.endorsement?.[0].issuer).toBe('did:key:zmentor');
    });

    it('throws ProjectionError for a node with no credentialProjection', () => {
        const node = projectableNode({ credentialProjection: undefined });

        expect(() =>
            toAchievementCredential({ node, ownerDid: LEARNER_DID, now: NOW }),
        ).toThrow(ProjectionError);
    });
});

describe('canProject', () => {
    it('is true for completed nodes that carry a projection', () => {
        expect(canProject(projectableNode())).toBe(true);
    });

    it('is false for non-completed nodes even with a projection', () => {
        const node = projectableNode({
            progress: {
                status: 'in-progress',
                artifacts: [],
                reviewsDue: 0,
                streak: { current: 0, longest: 0 },
            },
        });

        expect(canProject(node)).toBe(false);
    });

    it('is false for nodes without a projection', () => {
        expect(canProject(projectableNode({ credentialProjection: undefined }))).toBe(false);
    });
});

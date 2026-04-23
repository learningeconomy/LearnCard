import { describe, expect, it } from 'vitest';

import type {
    CredentialReceivedSignal,
    OutcomeBinding,
    Pathway,
    ScoreThresholdSignal,
} from '../types';
import type { VcLike } from '../core/outcomeMatcher';

import { bindCredentialToOutcomes } from './credentialBinder';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const NOW = '2026-04-22T00:00:00.000Z';
const OWNER = 'did:example:alice';

let seq = 0;
const makeId = (): string => {
    seq += 1;

    return `00000000-0000-4000-8000-${seq.toString(16).padStart(12, '0')}`;
};

const resetIds = () => {
    seq = 0;
};

const satOutcome = (
    overrides: Partial<ScoreThresholdSignal> = {},
): ScoreThresholdSignal => ({
    id: '00000000-0000-4000-8000-0000000000a1',
    label: 'SAT ≥ 1400',
    kind: 'score-threshold',
    expectedCredentialType: 'CollegeBoardSATScore',
    field: 'score.total',
    op: '>=',
    value: 1400,
    minTrustTier: 'institution',
    ...overrides,
});

const awsOutcome = (
    overrides: Partial<CredentialReceivedSignal> = {},
): CredentialReceivedSignal => ({
    id: '00000000-0000-4000-8000-0000000000a2',
    label: 'AWS cert',
    kind: 'credential-received',
    expectedCredentialType: 'AWSCertifiedCloudPractitioner',
    minTrustTier: 'trusted',
    ...overrides,
});

const emptyPathway = (
    id: string,
    overrides: Partial<Pathway> = {},
): Pathway => ({
    id,
    ownerDid: OWNER,
    revision: 0,
    schemaVersion: 1,
    title: 'Test pathway',
    goal: 'Goal',
    nodes: [],
    edges: [],
    status: 'active',
    visibility: { self: true, mentors: false, guardians: false, publicProfile: false },
    source: 'authored',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
});

// ---------------------------------------------------------------------------
// Happy paths
// ---------------------------------------------------------------------------

describe('bindCredentialToOutcomes', () => {
    it('emits a proposal when a VC satisfies a score-threshold outcome', () => {
        resetIds();

        const pathway = emptyPathway('00000000-0000-4000-8000-00000000aaaa', {
            outcomes: [satOutcome()],
        });

        const vc: VcLike = {
            type: ['VerifiableCredential', 'CollegeBoardSATScore'],
            issuer: 'did:web:collegeboard.org',
            credentialSubject: { score: { total: 1450 } },
        };

        const { proposals, skipped } = bindCredentialToOutcomes({
            vc,
            credentialUri: 'urn:uuid:vc-1',
            pathways: [pathway],
            ownerDid: OWNER,
            trustRegistry: {
                institutionIssuers: new Set(['did:web:collegeboard.org']),
            },
            now: NOW,
            makeId,
        });

        expect(skipped).toEqual([]);
        expect(proposals).toHaveLength(1);

        const proposal = proposals[0];

        expect(proposal).toMatchObject({
            pathwayId: pathway.id,
            ownerDid: OWNER,
            agent: 'recorder',
            capability: 'interpretation',
            status: 'open',
            createdAt: NOW,
        });

        expect(proposal.diff.setOutcomeBindings).toHaveLength(1);
        const entry = proposal.diff.setOutcomeBindings![0];
        expect(entry.outcomeId).toBe(pathway.outcomes![0].id);

        const binding = entry.binding as OutcomeBinding;
        expect(binding).toMatchObject({
            credentialUri: 'urn:uuid:vc-1',
            boundAt: NOW,
            boundVia: 'auto',
            issuerTrustTier: 'institution',
            observedValue: 1450,
            outOfWindow: false,
        });
    });

    it('emits one proposal per matching outcome across pathways', () => {
        resetIds();

        const pathwayA = emptyPathway('00000000-0000-4000-8000-aaaaaaaaaaaa', {
            outcomes: [awsOutcome()],
        });
        const pathwayB = emptyPathway('00000000-0000-4000-8000-bbbbbbbbbbbb', {
            outcomes: [awsOutcome({ id: '00000000-0000-4000-8000-0000000000b2' })],
        });

        const vc: VcLike = {
            type: ['AWSCertifiedCloudPractitioner'],
            issuer: 'did:web:aws.example',
        };

        const { proposals } = bindCredentialToOutcomes({
            vc,
            credentialUri: 'urn:uuid:vc-aws',
            pathways: [pathwayA, pathwayB],
            ownerDid: OWNER,
            now: NOW,
            makeId,
        });

        expect(proposals).toHaveLength(2);
        expect(proposals.map(p => p.pathwayId).sort()).toEqual(
            [pathwayA.id, pathwayB.id].sort(),
        );

        // Each proposal carries exactly one outcome binding — the
        // learner accepts per-pathway, not per-bundle.
        for (const proposal of proposals) {
            expect(proposal.diff.setOutcomeBindings).toHaveLength(1);
        }
    });
});

// ---------------------------------------------------------------------------
// Skip paths — data match but policy says no
// ---------------------------------------------------------------------------

describe('bindCredentialToOutcomes — skips', () => {
    it('skips an outcome that is already bound', () => {
        resetIds();

        const existing: OutcomeBinding = {
            credentialUri: 'urn:uuid:vc-prior',
            boundAt: '2026-02-01T00:00:00Z',
            boundVia: 'auto',
            issuerTrustTier: 'institution',
            observedValue: 1500,
            outOfWindow: false,
        };

        const pathway = emptyPathway('00000000-0000-4000-8000-00000000cccc', {
            outcomes: [satOutcome({ binding: existing })],
        });

        const vc: VcLike = {
            type: ['CollegeBoardSATScore'],
            issuer: 'did:web:collegeboard.org',
            credentialSubject: { score: { total: 1450 } },
        };

        const { proposals, skipped } = bindCredentialToOutcomes({
            vc,
            credentialUri: 'urn:uuid:vc-new',
            pathways: [pathway],
            ownerDid: OWNER,
            trustRegistry: {
                institutionIssuers: new Set(['did:web:collegeboard.org']),
            },
            now: NOW,
            makeId,
        });

        expect(proposals).toEqual([]);
        expect(skipped).toEqual([
            {
                pathwayId: pathway.id,
                outcomeId: pathway.outcomes![0].id,
                reason: 'already-bound',
            },
        ]);
    });

    it('skips an outcome whose trust tier is too high for the issuer', () => {
        resetIds();

        const pathway = emptyPathway('00000000-0000-4000-8000-00000000dddd', {
            outcomes: [satOutcome({ minTrustTier: 'institution' })],
        });

        const vc: VcLike = {
            type: ['CollegeBoardSATScore'],
            issuer: 'did:web:randoissuer.example', // not in institutionIssuers
            credentialSubject: { score: { total: 1450 } },
        };

        const { proposals, skipped } = bindCredentialToOutcomes({
            vc,
            credentialUri: 'urn:uuid:vc-sat',
            pathways: [pathway],
            ownerDid: OWNER,
            // No trust registry — classifyIssuerTrust returns 'trusted' for
            // any signed DID, which does NOT clear `institution`.
            now: NOW,
            makeId,
        });

        expect(proposals).toEqual([]);
        expect(skipped).toEqual([
            {
                pathwayId: pathway.id,
                outcomeId: pathway.outcomes![0].id,
                reason: 'trust-too-low',
            },
        ]);
    });

    it('skips with the matcher reason when the VC does not match', () => {
        resetIds();

        const pathway = emptyPathway('00000000-0000-4000-8000-00000000eeee', {
            outcomes: [awsOutcome()],
        });

        const vc: VcLike = {
            type: ['OpenBadgeCredential'],
            issuer: 'did:web:other.example',
        };

        const { proposals, skipped } = bindCredentialToOutcomes({
            vc,
            credentialUri: 'urn:uuid:vc-ob',
            pathways: [pathway],
            ownerDid: OWNER,
            now: NOW,
            makeId,
        });

        expect(proposals).toEqual([]);
        expect(skipped[0].reason).toBe('type-mismatch');
    });

    it('flags out-of-window bindings but still emits a proposal', () => {
        resetIds();

        const outcome = satOutcome({
            window: { startFrom: 'pathway-created', durationDays: 7 },
        });

        const pathway = emptyPathway('00000000-0000-4000-8000-00000000ffff', {
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
            outcomes: [outcome],
        });

        const vc: VcLike = {
            type: ['CollegeBoardSATScore'],
            issuer: 'did:web:collegeboard.org',
            issuanceDate: '2026-03-01T00:00:00.000Z', // past the 7-day window
            credentialSubject: { score: { total: 1450 } },
        };

        const { proposals } = bindCredentialToOutcomes({
            vc,
            credentialUri: 'urn:uuid:vc-late',
            pathways: [pathway],
            ownerDid: OWNER,
            trustRegistry: {
                institutionIssuers: new Set(['did:web:collegeboard.org']),
            },
            now: NOW,
            makeId,
        });

        expect(proposals).toHaveLength(1);

        const binding = proposals[0].diff.setOutcomeBindings![0].binding;
        expect(binding).toMatchObject({ outOfWindow: true });
    });

    it('emits nothing for pathways with no outcomes declared', () => {
        resetIds();

        const pathway = emptyPathway('00000000-0000-4000-8000-00000000bbbb');

        const { proposals, skipped } = bindCredentialToOutcomes({
            vc: { type: ['AnythingAtAll'] },
            credentialUri: 'urn:uuid:any',
            pathways: [pathway],
            ownerDid: OWNER,
            now: NOW,
            makeId,
        });

        expect(proposals).toEqual([]);
        expect(skipped).toEqual([]);
    });
});

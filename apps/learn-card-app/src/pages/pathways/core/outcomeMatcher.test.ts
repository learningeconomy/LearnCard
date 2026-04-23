import { describe, expect, it } from 'vitest';

import type {
    CredentialReceivedSignal,
    EmploymentSignal,
    EnrollmentSignal,
    ScoreThresholdSignal,
    SelfReportedSignal,
    WageDeltaSignal,
} from '../types';

import {
    checkWindow,
    classifyIssuerTrust,
    matchVcAgainstOutcome,
    type VcLike,
} from './outcomeMatcher';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const OUTCOME_ID = '00000000-0000-4000-8000-00000000beef';

const credentialReceived = (
    overrides: Partial<CredentialReceivedSignal> = {},
): CredentialReceivedSignal => ({
    id: OUTCOME_ID,
    label: 'Got the cert',
    kind: 'credential-received',
    expectedCredentialType: 'AWSCertifiedCloudPractitioner',
    minTrustTier: 'trusted',
    ...overrides,
});

const scoreThreshold = (
    overrides: Partial<ScoreThresholdSignal> = {},
): ScoreThresholdSignal => ({
    id: OUTCOME_ID,
    label: 'Hit SAT target',
    kind: 'score-threshold',
    expectedCredentialType: 'CollegeBoardSATScore',
    field: 'credentialSubject.score.total',
    op: '>=',
    value: 1400,
    minTrustTier: 'institution',
    ...overrides,
});

// ---------------------------------------------------------------------------
// credential-received
// ---------------------------------------------------------------------------

describe('matchVcAgainstOutcome — credential-received', () => {
    it('matches a VC whose type array contains the expected type', () => {
        const vc: VcLike = {
            type: ['VerifiableCredential', 'AWSCertifiedCloudPractitioner'],
            issuer: 'did:web:aws.example',
            credentialSubject: { id: 'did:example:alice' },
        };

        const result = matchVcAgainstOutcome(credentialReceived(), vc);

        expect(result).toEqual({
            matched: true,
            confidence: 0.9,
            outOfWindow: false,
        });
    });

    it('accepts a bare `type: string` form', () => {
        const vc: VcLike = {
            type: 'AWSCertifiedCloudPractitioner',
            credentialSubject: {},
        };

        expect(matchVcAgainstOutcome(credentialReceived(), vc)).toMatchObject({ matched: true });
    });

    it('strips namespace prefixes on both sides', () => {
        const vc: VcLike = {
            type: ['VerifiableCredential', 'https://schema.example/AWSCertifiedCloudPractitioner'],
        };

        expect(matchVcAgainstOutcome(credentialReceived(), vc)).toMatchObject({ matched: true });
    });

    it('rejects a VC with no matching type', () => {
        const vc: VcLike = {
            type: ['VerifiableCredential', 'OpenBadgeCredential'],
        };

        expect(matchVcAgainstOutcome(credentialReceived(), vc)).toEqual({
            matched: false,
            reason: 'type-mismatch',
        });
    });

    it('enforces an expected issuer DID when set', () => {
        const signal = credentialReceived({ expectedIssuerDid: 'did:web:aws.example' });

        const wrong: VcLike = {
            type: ['AWSCertifiedCloudPractitioner'],
            issuer: 'did:web:other.example',
        };

        expect(matchVcAgainstOutcome(signal, wrong)).toEqual({
            matched: false,
            reason: 'issuer-mismatch',
        });

        const right: VcLike = {
            type: ['AWSCertifiedCloudPractitioner'],
            issuer: { id: 'did:web:aws.example' },
        };

        expect(matchVcAgainstOutcome(signal, right)).toMatchObject({ matched: true });
    });
});

// ---------------------------------------------------------------------------
// score-threshold
// ---------------------------------------------------------------------------

describe('matchVcAgainstOutcome — score-threshold', () => {
    it('matches when the numeric field meets the threshold', () => {
        const vc: VcLike = {
            type: ['CollegeBoardSATScore'],
            credentialSubject: {
                score: { total: 1450, math: 740, verbal: 710 },
            },
        };

        const result = matchVcAgainstOutcome(scoreThreshold(), vc);

        expect(result).toEqual({
            matched: true,
            confidence: 0.95,
            observedValue: 1450,
            outOfWindow: false,
        });
    });

    it('accepts dot-paths without a leading credentialSubject prefix', () => {
        const vc: VcLike = {
            type: ['CollegeBoardSATScore'],
            credentialSubject: { score: { total: 1500 } },
        };

        expect(
            matchVcAgainstOutcome(scoreThreshold({ field: 'score.total' }), vc),
        ).toMatchObject({ matched: true, observedValue: 1500 });
    });

    it('coerces numeric strings (common in JSON-LD output)', () => {
        const vc: VcLike = {
            type: ['CollegeBoardSATScore'],
            credentialSubject: { score: { total: '1450' } },
        };

        expect(matchVcAgainstOutcome(scoreThreshold(), vc)).toMatchObject({
            matched: true,
            observedValue: 1450,
        });
    });

    it('returns `field-missing` when the path does not resolve', () => {
        const vc: VcLike = {
            type: ['CollegeBoardSATScore'],
            credentialSubject: { score: { math: 740 } },
        };

        expect(matchVcAgainstOutcome(scoreThreshold(), vc)).toEqual({
            matched: false,
            reason: 'field-missing',
        });
    });

    it('returns `field-not-numeric` for a non-numeric value', () => {
        const vc: VcLike = {
            type: ['CollegeBoardSATScore'],
            credentialSubject: { score: { total: 'n/a' } },
        };

        expect(matchVcAgainstOutcome(scoreThreshold(), vc)).toEqual({
            matched: false,
            reason: 'field-not-numeric',
        });
    });

    it('returns `threshold-unmet` when the comparison fails', () => {
        const vc: VcLike = {
            type: ['CollegeBoardSATScore'],
            credentialSubject: { score: { total: 1200 } },
        };

        expect(matchVcAgainstOutcome(scoreThreshold(), vc)).toEqual({
            matched: false,
            reason: 'threshold-unmet',
        });
    });

    it('honors each comparison operator', () => {
        const vc: VcLike = {
            type: ['CollegeBoardSATScore'],
            credentialSubject: { score: { total: 1400 } },
        };

        expect(matchVcAgainstOutcome(scoreThreshold({ op: '>=' }), vc)).toMatchObject({
            matched: true,
        });
        expect(matchVcAgainstOutcome(scoreThreshold({ op: '>' }), vc)).toMatchObject({
            matched: false,
        });
        expect(matchVcAgainstOutcome(scoreThreshold({ op: '==' }), vc)).toMatchObject({
            matched: true,
        });
        expect(
            matchVcAgainstOutcome(scoreThreshold({ op: '<=' }), vc),
        ).toMatchObject({ matched: true });
        expect(matchVcAgainstOutcome(scoreThreshold({ op: '<' }), vc)).toMatchObject({
            matched: false,
        });
    });

    it('walks multi-subject VCs until it finds the field', () => {
        const vc: VcLike = {
            type: ['CollegeBoardSATScore'],
            credentialSubject: [
                { id: 'did:example:alice' },
                { score: { total: 1450 } },
            ],
        };

        expect(matchVcAgainstOutcome(scoreThreshold(), vc)).toMatchObject({
            matched: true,
            observedValue: 1450,
        });
    });
});

// ---------------------------------------------------------------------------
// enrollment / employment / wage-delta / self-reported
// ---------------------------------------------------------------------------

describe('matchVcAgainstOutcome — enrollment', () => {
    const signal: EnrollmentSignal = {
        id: OUTCOME_ID,
        label: 'Enrolled in college',
        kind: 'enrollment',
        minTrustTier: 'institution',
    };

    it('matches a recognised enrollment type', () => {
        const vc: VcLike = { type: ['VerifiableCredential', 'EnrollmentCredential'] };

        expect(matchVcAgainstOutcome(signal, vc)).toMatchObject({ matched: true });
    });

    it('rejects an unrelated credential', () => {
        const vc: VcLike = { type: ['OpenBadgeCredential'] };

        expect(matchVcAgainstOutcome(signal, vc)).toEqual({
            matched: false,
            reason: 'type-mismatch',
        });
    });
});

describe('matchVcAgainstOutcome — employment', () => {
    const signal: EmploymentSignal = {
        id: OUTCOME_ID,
        label: 'Got the job',
        kind: 'employment',
        minTrustTier: 'trusted',
    };

    it('matches a recognised employment type', () => {
        const vc: VcLike = { type: ['EmploymentVerification'] };

        expect(matchVcAgainstOutcome(signal, vc)).toMatchObject({ matched: true });
    });
});

describe('matchVcAgainstOutcome — wage-delta', () => {
    it('never matches in v0.5 (pending implementation)', () => {
        const signal: WageDeltaSignal = {
            id: OUTCOME_ID,
            label: 'Wage bump',
            kind: 'wage-delta',
            minDeltaPercent: 0.1,
            minTrustTier: 'institution',
        };

        expect(matchVcAgainstOutcome(signal, { type: ['PayrollCredential'] })).toEqual({
            matched: false,
            reason: 'pending-implementation',
        });
    });
});

describe('matchVcAgainstOutcome — self-reported', () => {
    it('never auto-matches (requires human confirmation)', () => {
        const signal: SelfReportedSignal = {
            id: OUTCOME_ID,
            label: 'Feels more confident',
            kind: 'self-reported',
            prompt: 'Do you feel more confident?',
            minTrustTier: 'self',
        };

        expect(matchVcAgainstOutcome(signal, { type: ['AnyCredential'] })).toEqual({
            matched: false,
            reason: 'kind-unsupported',
        });
    });
});

// ---------------------------------------------------------------------------
// checkWindow
// ---------------------------------------------------------------------------

describe('checkWindow', () => {
    const base = credentialReceived({
        window: { startFrom: 'pathway-created', durationDays: 30 },
    });

    it('passes when the VC has no issuance date', () => {
        expect(
            checkWindow(base, {}, { createdAt: '2026-01-01T00:00:00Z' }),
        ).toEqual({ inWindow: true });
    });

    it('marks in-window VCs correctly', () => {
        const vc: VcLike = { issuanceDate: '2026-01-15T00:00:00Z' };

        expect(
            checkWindow(base, vc, { createdAt: '2026-01-01T00:00:00Z' }),
        ).toEqual({ inWindow: true });
    });

    it('marks out-of-window VCs correctly', () => {
        const vc: VcLike = { issuanceDate: '2026-03-01T00:00:00Z' };

        expect(
            checkWindow(base, vc, { createdAt: '2026-01-01T00:00:00Z' }),
        ).toEqual({ inWindow: false });
    });

    it('measures from pathway-completed when configured', () => {
        const signal = credentialReceived({
            window: { startFrom: 'pathway-completed', durationDays: 7 },
        });

        const vc: VcLike = { issuanceDate: '2026-02-10T00:00:00Z' };

        expect(
            checkWindow(signal, vc, {
                createdAt: '2026-01-01T00:00:00Z',
                completedAt: '2026-02-05T00:00:00Z',
            }),
        ).toEqual({ inWindow: true });
    });

    it('treats durationDays=0 as unbounded from the start', () => {
        const signal = credentialReceived({
            window: { startFrom: 'pathway-created', durationDays: 0 },
        });

        const vc: VcLike = { issuanceDate: '2099-01-01T00:00:00Z' };

        expect(
            checkWindow(signal, vc, { createdAt: '2026-01-01T00:00:00Z' }),
        ).toEqual({ inWindow: true });
    });
});

// ---------------------------------------------------------------------------
// classifyIssuerTrust
// ---------------------------------------------------------------------------

describe('classifyIssuerTrust', () => {
    it('returns `self` for a null issuer', () => {
        expect(classifyIssuerTrust(null)).toBe('self');
    });

    it('promotes issuers in the institution set', () => {
        expect(
            classifyIssuerTrust('did:web:collegeboard.org', {
                institutionIssuers: new Set(['did:web:collegeboard.org']),
            }),
        ).toBe('institution');
    });

    it('falls back to `trusted` for any unknown signed issuer', () => {
        expect(classifyIssuerTrust('did:web:unknown.example')).toBe('trusted');
    });
});

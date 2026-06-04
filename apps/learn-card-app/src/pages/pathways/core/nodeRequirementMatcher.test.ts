import { describe, expect, it } from 'vitest';

import type { NodeRequirement } from '../types';

import {
    defaultRegistry,
    firstSatisfying,
    matchRequirement,
    registerRequirementMatcher,
} from './nodeRequirementMatcher';
import type { CredentialIdentity } from './credentialIdentity';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const baseIdentity = (
    overrides: Partial<CredentialIdentity> = {},
): CredentialIdentity => ({
    types: [],
    issuerDid: null,
    credentialId: null,
    raw: {},
    ...overrides,
});

// ---------------------------------------------------------------------------
// Leaf matchers
// ---------------------------------------------------------------------------

describe('matchRequirement — credential-type leaf', () => {
    it('matches case-insensitively and strips namespace prefixes', () => {
        const identity = baseIdentity({ types: ['ceterms:CertificationCredential'] });

        const verdict = matchRequirement(
            { kind: 'credential-type', type: 'CertificationCredential' },
            identity,
        );

        expect(verdict.matched).toBe(true);
    });

    it('fails with type-mismatch when no type lines up', () => {
        const verdict = matchRequirement(
            { kind: 'credential-type', type: 'OpenBadgeCredential' },
            baseIdentity({ types: ['CertificationCredential'] }),
        );

        expect(verdict).toEqual({
            matched: false,
            reason: 'type-mismatch',
        });
    });

    it('enforces the optional issuer guard when set', () => {
        const identity = baseIdentity({
            types: ['OpenBadgeCredential'],
            issuerDid: 'did:web:other.example',
        });

        expect(
            matchRequirement(
                {
                    kind: 'credential-type',
                    type: 'OpenBadgeCredential',
                    issuer: 'did:web:coursera.example',
                },
                identity,
            ),
        ).toEqual({ matched: false, reason: 'issuer-mismatch' });

        expect(
            matchRequirement(
                {
                    kind: 'credential-type',
                    type: 'OpenBadgeCredential',
                    issuer: 'did:web:other.example',
                },
                identity,
            ).matched,
        ).toBe(true);
    });
});

describe('matchRequirement — boost-uri leaf', () => {
    it('exact-matches the canonical wallet boostUri', () => {
        const identity = baseIdentity({ boostUri: 'boost:aws-iam-deep-dive' });

        expect(
            matchRequirement(
                { kind: 'boost-uri', uri: 'boost:aws-iam-deep-dive' },
                identity,
            ).matched,
        ).toBe(true);
    });

    it('fails with boost-uri-mismatch when the URI is absent or different', () => {
        expect(
            matchRequirement(
                { kind: 'boost-uri', uri: 'boost:vpc-essentials' },
                baseIdentity({ boostUri: 'boost:aws-iam-deep-dive' }),
            ),
        ).toEqual({ matched: false, reason: 'boost-uri-mismatch' });

        expect(
            matchRequirement(
                { kind: 'boost-uri', uri: 'boost:anything' },
                baseIdentity(),
            ),
        ).toEqual({ matched: false, reason: 'boost-uri-mismatch' });
    });
});

describe('matchRequirement — ctdl-ctid leaf', () => {
    const ctid = 'ce-abcdef01-2345-6789-abcd-ef0123456789';

    it('matches case-insensitively', () => {
        const identity = baseIdentity({ ctdlCtid: ctid });

        expect(
            matchRequirement(
                { kind: 'ctdl-ctid', ctid: ctid.toUpperCase() },
                identity,
            ).matched,
        ).toBe(true);
    });

    it('fails with ctid-mismatch when absent or different', () => {
        expect(
            matchRequirement(
                { kind: 'ctdl-ctid', ctid: 'ce-11111111-2222-3333-4444-555555555555' },
                baseIdentity({ ctdlCtid: ctid }),
            ).matched,
        ).toBe(false);
    });
});

describe('matchRequirement — issuer-credential-id leaf', () => {
    it('requires both issuer and credential id to match', () => {
        const identity = baseIdentity({
            issuerDid: 'did:web:issuer.example',
            credentialId: 'urn:uuid:vc-1',
        });

        expect(
            matchRequirement(
                {
                    kind: 'issuer-credential-id',
                    issuerDid: 'did:web:issuer.example',
                    credentialId: 'urn:uuid:vc-1',
                },
                identity,
            ).matched,
        ).toBe(true);

        expect(
            matchRequirement(
                {
                    kind: 'issuer-credential-id',
                    issuerDid: 'did:web:issuer.example',
                    credentialId: 'urn:uuid:vc-different',
                },
                identity,
            ),
        ).toEqual({ matched: false, reason: 'credential-id-mismatch' });
    });
});

describe('matchRequirement — ob-achievement leaf', () => {
    it('matches when the achievement id is identical', () => {
        const identity = baseIdentity({
            obAchievementId: 'https://badges.example/ach/aws-clf',
        });

        expect(
            matchRequirement(
                {
                    kind: 'ob-achievement',
                    achievementId: 'https://badges.example/ach/aws-clf',
                },
                identity,
            ).matched,
        ).toBe(true);
    });

    it('fails with ob-achievement-mismatch on difference or absence', () => {
        expect(
            matchRequirement(
                {
                    kind: 'ob-achievement',
                    achievementId: 'https://badges.example/ach/aws-sap',
                },
                baseIdentity({ obAchievementId: 'https://badges.example/ach/aws-clf' }),
            ).matched,
        ).toBe(false);
    });
});

describe('matchRequirement — ob-alignment leaf', () => {
    it('matches when any alignment targetUrl equals the requirement', () => {
        const identity = baseIdentity({
            obAlignments: ['https://rsd.example/vpc', 'https://rsd.example/iam'],
        });

        expect(
            matchRequirement(
                { kind: 'ob-alignment', targetUrl: 'https://rsd.example/iam' },
                identity,
            ).matched,
        ).toBe(true);
    });

    it('fails with ob-alignment-mismatch when no target URL lines up', () => {
        expect(
            matchRequirement(
                { kind: 'ob-alignment', targetUrl: 'https://rsd.example/ec2' },
                baseIdentity({
                    obAlignments: ['https://rsd.example/iam'],
                }),
            ).matched,
        ).toBe(false);
    });
});

describe('matchRequirement — skill-tag leaf', () => {
    it('matches exact first, case-insensitive fallback second', () => {
        const identity = baseIdentity({
            skillTags: ['Cross-Account', 'IAM'],
        });

        const exact = matchRequirement(
            { kind: 'skill-tag', tag: 'IAM' },
            identity,
        );
        const caseFold = matchRequirement(
            { kind: 'skill-tag', tag: 'cross-account' },
            identity,
        );

        expect(exact.matched).toBe(true);
        expect(caseFold.matched).toBe(true);
        if (exact.matched && caseFold.matched) {
            // Exact match produces higher confidence than case-fold.
            expect(exact.confidence).toBeGreaterThan(caseFold.confidence);
        }
    });

    it('fails with skill-tag-mismatch when no tag matches', () => {
        expect(
            matchRequirement(
                { kind: 'skill-tag', tag: 'vpc' },
                baseIdentity({ skillTags: ['iam'] }),
            ).matched,
        ).toBe(false);
    });
});

describe('matchRequirement — score-threshold leaf', () => {
    const baseVcLike = (subject: Record<string, unknown>) =>
        baseIdentity({
            types: ['CollegeBoardSATScore'],
            raw: {
                type: ['CollegeBoardSATScore'],
                credentialSubject: subject,
            },
        });

    it('reads a dot path and returns the observed value on success', () => {
        const identity = baseVcLike({ score: { total: 1450 } });

        const verdict = matchRequirement(
            {
                kind: 'score-threshold',
                type: 'CollegeBoardSATScore',
                field: 'score.total',
                op: '>=',
                value: 1400,
            },
            identity,
        );

        expect(verdict.matched).toBe(true);
        if (verdict.matched) expect(verdict.observedValue).toBe(1450);
    });

    it('accepts the `credentialSubject.` prefix on the field path', () => {
        const identity = baseVcLike({ score: { total: 1450 } });

        const verdict = matchRequirement(
            {
                kind: 'score-threshold',
                type: 'CollegeBoardSATScore',
                field: 'credentialSubject.score.total',
                op: '>=',
                value: 1400,
            },
            identity,
        );

        expect(verdict.matched).toBe(true);
    });

    it('reports field-missing when the path does not resolve', () => {
        const identity = baseVcLike({ score: {} });

        expect(
            matchRequirement(
                {
                    kind: 'score-threshold',
                    type: 'CollegeBoardSATScore',
                    field: 'score.total',
                    op: '>=',
                    value: 1400,
                },
                identity,
            ).matched,
        ).toBe(false);
    });

    it('reports field-not-numeric when the field is a non-numeric string', () => {
        const identity = baseVcLike({ score: { total: 'not-a-number' } });

        expect(
            matchRequirement(
                {
                    kind: 'score-threshold',
                    type: 'CollegeBoardSATScore',
                    field: 'score.total',
                    op: '>=',
                    value: 1400,
                },
                identity,
            ),
        ).toEqual({ matched: false, reason: 'field-not-numeric' });
    });

    it('reports threshold-unmet when numeric comparison fails', () => {
        const identity = baseVcLike({ score: { total: 1200 } });

        expect(
            matchRequirement(
                {
                    kind: 'score-threshold',
                    type: 'CollegeBoardSATScore',
                    field: 'score.total',
                    op: '>=',
                    value: 1400,
                },
                identity,
            ),
        ).toEqual({ matched: false, reason: 'threshold-unmet' });
    });
});

// ---------------------------------------------------------------------------
// Composites
// ---------------------------------------------------------------------------

describe('matchRequirement — any-of composition', () => {
    const identity = baseIdentity({ types: ['OpenBadgeCredential'] });

    it('succeeds when at least one branch matches, tagging which indices satisfied', () => {
        const verdict = matchRequirement(
            {
                kind: 'any-of',
                of: [
                    { kind: 'credential-type', type: 'CertificationCredential' },
                    { kind: 'credential-type', type: 'OpenBadgeCredential' },
                    { kind: 'credential-type', type: 'CourseraCredential' },
                ],
            },
            identity,
        );

        expect(verdict.matched).toBe(true);
        if (verdict.matched && 'satisfiedBy' in verdict) {
            expect(verdict.satisfiedBy).toEqual([1]);
        }
    });

    it('fails with composite-any-all-failed when every branch fails', () => {
        const verdict = matchRequirement(
            {
                kind: 'any-of',
                of: [
                    { kind: 'credential-type', type: 'CertificationCredential' },
                    { kind: 'boost-uri', uri: 'boost:not-present' },
                ],
            },
            identity,
        );

        expect(verdict.matched).toBe(false);
        if (!verdict.matched) {
            expect(verdict.reason).toBe('composite-any-all-failed');
            expect(verdict.childVerdicts).toHaveLength(2);
        }
    });
});

describe('matchRequirement — all-of composition', () => {
    const identity = baseIdentity({
        types: ['OpenBadgeCredential'],
        boostUri: 'boost:aws-iam-deep-dive',
    });

    it('succeeds only when every branch matches', () => {
        expect(
            matchRequirement(
                {
                    kind: 'all-of',
                    of: [
                        { kind: 'credential-type', type: 'OpenBadgeCredential' },
                        { kind: 'boost-uri', uri: 'boost:aws-iam-deep-dive' },
                    ],
                },
                identity,
            ).matched,
        ).toBe(true);
    });

    it('fails with composite-all-one-failed on the first missing branch', () => {
        const verdict = matchRequirement(
            {
                kind: 'all-of',
                of: [
                    { kind: 'credential-type', type: 'OpenBadgeCredential' },
                    { kind: 'boost-uri', uri: 'boost:something-else' },
                ],
            },
            identity,
        );

        expect(verdict.matched).toBe(false);
        if (!verdict.matched) expect(verdict.reason).toBe('composite-all-one-failed');
    });
});

// ---------------------------------------------------------------------------
// Registry + firstSatisfying
// ---------------------------------------------------------------------------

describe('matchRequirement — registry extension', () => {
    it('allows a caller to clone the default registry and override a matcher', () => {
        const registry = defaultRegistry();

        // Replace the boost-uri matcher with one that always fails to
        // prove the clone is isolated from the module-level default.
        registerRequirementMatcher(
            'boost-uri',
            () => ({ matched: false, reason: 'boost-uri-mismatch' }),
            registry,
        );

        const verdict = matchRequirement(
            { kind: 'boost-uri', uri: 'boost:whatever' },
            baseIdentity({ boostUri: 'boost:whatever' }),
            registry,
        );

        expect(verdict.matched).toBe(false);

        // The default module-level registry still works normally.
        expect(
            matchRequirement(
                { kind: 'boost-uri', uri: 'boost:whatever' },
                baseIdentity({ boostUri: 'boost:whatever' }),
            ).matched,
        ).toBe(true);
    });
});

describe('firstSatisfying', () => {
    it('returns the first matching requirement index, or -1', () => {
        const identity = baseIdentity({ types: ['OpenBadgeCredential'] });

        const requirements: NodeRequirement[] = [
            { kind: 'credential-type', type: 'CertificationCredential' },
            { kind: 'credential-type', type: 'OpenBadgeCredential' },
            { kind: 'credential-type', type: 'CourseraCredential' },
        ];

        expect(firstSatisfying(requirements, identity)).toBe(1);

        expect(
            firstSatisfying(
                [{ kind: 'credential-type', type: 'DoesNotExist' }],
                identity,
            ),
        ).toBe(-1);
    });
});

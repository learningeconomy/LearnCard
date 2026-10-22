import { describe, expect, it } from 'vitest';

import {
    BINDING_CONSENT_REQUIREMENTS,
    BindingConsentPreflightValidator,
    EducationOsConsentGrantValidator,
    type BindingConsentPreflight,
    type EducationOsConsentGrant,
} from './consent-preflight';
import { CapabilityEnum, ConsentTierEnum } from './education-os';

const grant: EducationOsConsentGrant = {
    apiVersion: 'lc.consent-grant/v1',
    grants: [
        {
            capability: 'roster-source',
            operation: 'read',
            scopes: ['roster:read'],
            tiers: ['roster'],
            purpose: 'Synthetic governance readiness test; not learner consent.',
        },
    ],
};

const snapshot: BindingConsentPreflight = {
    preflightId: 'preflight-test',
    bindingId: 'binding-test',
    bindingRevision: 0,
    ecosystemId: 'ecosystem-test',
    capability: 'registry-adapter',
    evaluatedAt: '2026-10-20T00:00:00.000Z',
    requirements: { scopes: [], tiers: [], plans: [] },
    evidence: {},
    supportedTiers: [],
    collectionPath: { kind: 'none', implemented: true },
    satisfied: true,
    missing: [],
    hash: '0'.repeat(64),
};

describe('EducationOS consent grant wire contract', () => {
    it('accepts the versioned governance mapping', () => {
        expect(EducationOsConsentGrantValidator.parse(grant)).toEqual(grant);
    });

    it.each(['registry-adapter', 'unknown'])('rejects capability %s', capability => {
        expect(
            EducationOsConsentGrantValidator.safeParse({
                ...grant,
                grants: [{ ...grant.grants[0], capability }],
            }).success
        ).toBe(false);
    });

    it.each(ConsentTierEnum.options)('recognizes ADR-011 tier %s', tier => {
        expect(
            EducationOsConsentGrantValidator.safeParse({
                ...grant,
                grants: [{ ...grant.grants[0], tiers: [tier] }],
            }).success
        ).toBe(true);
    });

    it.each([
        { operation: 'delete' },
        { tiers: ['all'] },
        { tiers: [] },
        { scopes: [] },
        { scopes: ['*'] },
        { purpose: '' },
        { fields: [] },
        { selectors: {} },
        { selectors: { profileIds: ['*'] } },
        { selectors: { ecosystemIds: ['$installEcosystemId'] } },
        { selectors: { query: 'MATCH (p) RETURN p' } },
        {
            selectors: {
                profileIds: Array.from({ length: 101 }, (_, index) => `profile-${index}`),
            },
        },
        { consentActive: true },
    ])('rejects invalid or unbounded grant %j', invalid => {
        expect(
            EducationOsConsentGrantValidator.safeParse({
                ...grant,
                grants: [{ ...grant.grants[0], ...invalid }],
            }).success
        ).toBe(false);
    });

    it('accepts bounded resolved selectors and explicit field requirements', () => {
        expect(
            EducationOsConsentGrantValidator.safeParse({
                ...grant,
                grants: [
                    {
                        ...grant.grants[0],
                        selectors: { ecosystemIds: ['ecosystem-test'] },
                        fields: ['name'],
                        permissionRequirements: ['roster:read'],
                    },
                ],
            }).success
        ).toBe(true);
    });

    it('rejects unknown top-level fields and versions', () => {
        expect(
            EducationOsConsentGrantValidator.safeParse({ ...grant, consentActive: true }).success
        ).toBe(false);
        expect(
            EducationOsConsentGrantValidator.safeParse({ ...grant, apiVersion: 'v2' }).success
        ).toBe(false);
    });
});

describe('binding readiness snapshot wire contract', () => {
    it('allows reference-only readiness with no subject evidence', () => {
        expect(BindingConsentPreflightValidator.parse(snapshot)).toEqual(snapshot);
    });

    it.each(['consentActive', 'subjectConsent', 'consentActiveAtDecision'])(
        'rejects a subject-consent assertion in %s',
        field => {
            expect(
                BindingConsentPreflightValidator.safeParse({ ...snapshot, [field]: true }).success
            ).toBe(false);
            expect(
                BindingConsentPreflightValidator.safeParse({
                    ...snapshot,
                    evidence: { [field]: true },
                }).success
            ).toBe(false);
        }
    );

    it('records actionable missing governance evidence without fictitious references', () => {
        const missing = [
            {
                code: 'NO_GOVERNANCE_CONTRACT',
                message: 'No governed contract found.',
                howToSatisfy: 'An ecosystem administrator must govern an appropriate contract.',
            },
        ];
        expect(
            BindingConsentPreflightValidator.parse({
                ...snapshot,
                capability: 'roster-source',
                satisfied: false,
                missing,
            }).evidence
        ).toEqual({});
    });

    it('requires a lowercase SHA-256 digest and nonnegative revision', () => {
        expect(
            BindingConsentPreflightValidator.safeParse({ ...snapshot, hash: 'invalid' }).success
        ).toBe(false);
        expect(
            BindingConsentPreflightValidator.safeParse({ ...snapshot, bindingRevision: -1 }).success
        ).toBe(false);
    });

    it('covers every capability with a separate governance requirement', () => {
        expect(Object.keys(BINDING_CONSENT_REQUIREMENTS).sort()).toEqual(
            [...CapabilityEnum.options].sort()
        );
        expect(BINDING_CONSENT_REQUIREMENTS['registry-adapter'].agreement).toBe('none');
        expect(BINDING_CONSENT_REQUIREMENTS['wallet-claim'].collectionPath).toBe(
            'wallet-claim-choice'
        );
        expect(BINDING_CONSENT_REQUIREMENTS['credential-issuer'].requiresInstitutionProfile).toBe(
            true
        );
        expect(BINDING_CONSENT_REQUIREMENTS['record-provisioning'].resolvePlanTiers).toBe(true);
    });
});

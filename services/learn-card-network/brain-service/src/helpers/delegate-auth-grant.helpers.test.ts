import { describe, expect, it } from 'vitest';

import {
    evaluateDelegateAuthGrant,
    type DelegateGrantRequest,
} from './delegate-auth-grant.helpers';

const grant = {
    id: 'grant-1',
    name: 'Issuance delegate',
    challenge: 'auth-grant:opaque-challenge',
    status: 'active',
    scope: 'inbox:write',
    createdAt: '2026-01-01T00:00:00.000Z',
    expiresAt: '2026-01-02T00:00:00.000Z',
    delegateDid: 'did:key:z6Mkg49NtQR2LyYRDCQFK4w1VVHqhypZSSRo7HsyuN7SV7v5',
    ownerProfileId: 'issuer',
    effectiveProfileId: 'issuer',
    audience: 'https://network.example',
    createdBy: 'did:key:z6MkOwner',
};
const request: DelegateGrantRequest = {
    signerDid: grant.delegateDid,
    issuerDid: grant.delegateDid,
    holderDid: grant.delegateDid,
    audience: grant.audience,
    expectedAudience: grant.audience,
    challenge: grant.challenge,
    requiredScope: 'inbox:write',
    now: Date.parse('2026-01-01T12:00:00.000Z'),
};

describe('delegate grant policy (not HTTP authentication)', () => {
    it('returns separate actor and effective-owner identity', () => {
        expect(evaluateDelegateAuthGrant(grant, request)).toEqual({
            allowed: true,
            actorDid: grant.delegateDid,
            effectiveProfileId: 'issuer',
            ownerProfileId: 'issuer',
            grantId: grant.id,
            scope: 'inbox:write',
        });
    });

    it('accepts an explicit matching target', () => {
        expect(
            evaluateDelegateAuthGrant(grant, { ...request, requestedProfileId: 'issuer' }).allowed
        ).toBe(true);
    });

    it.each<Partial<DelegateGrantRequest>>([
        { signerDid: 'did:key:z6MkOther' },
        { issuerDid: 'did:key:z6MkOther' },
        { holderDid: 'did:key:z6MkOther' },
        {
            signerDid: 'did:key:z6MkOther',
            issuerDid: 'did:key:z6MkOther',
            holderDid: 'did:key:z6MkOther',
        },
        { audience: 'https://other.example' },
        { expectedAudience: 'https://other.example' },
        { challenge: 'auth-grant:another-challenge' },
        { requestedProfileId: 'other' },
        { requestedProfileId: '*' },
        { requestedProfileId: '' },
        { requiredScope: 'contracts-data:write' },
        { requiredScope: 'authGrants:write' },
        { requiredScope: '*:*' },
        { requiredScope: '' },
        { now: Number.NaN },
        { now: Number.POSITIVE_INFINITY },
        { now: Date.parse(grant.createdAt) - 1 },
        { now: Date.parse(grant.expiresAt) },
        { now: Date.parse(grant.expiresAt) + 1 },
    ])('rejects invalid request binding: %j', override => {
        expect(evaluateDelegateAuthGrant(grant, { ...request, ...override })).toEqual({
            allowed: false,
        });
    });

    it('accepts the last millisecond before expiry', () => {
        expect(
            evaluateDelegateAuthGrant(grant, { ...request, now: Date.parse(grant.expiresAt) - 1 })
                .allowed
        ).toBe(true);
    });

    it('rejects revoked state on the next policy evaluation without cached success', () => {
        expect(evaluateDelegateAuthGrant(grant, request).allowed).toBe(true);
        expect(evaluateDelegateAuthGrant({ ...grant, status: 'revoked' }, request)).toEqual({
            allowed: false,
        });
    });

    it.each([
        null,
        undefined,
        {},
        { ...grant, delegateDid: undefined },
        { ...grant, expiresAt: null },
    ])('fails closed for a missing, malformed, or legacy record: %j', record =>
        expect(evaluateDelegateAuthGrant(record, request)).toEqual({ allowed: false })
    );
});

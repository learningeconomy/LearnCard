import { AuthGrantValidator } from '@learncard/types';
import { describe, expect, it } from 'vitest';

import { DelegateAuthGrantValidator } from './delegate-auth-grant.schema';

const grant = {
    id: 'grant-1',
    name: 'Issuance delegate',
    challenge: 'delegate-grant:opaque-challenge',
    status: 'active',
    scope: 'inbox:write contracts-data:write',
    createdAt: '2026-01-01T00:00:00.000Z',
    expiresAt: '2026-01-02T00:00:00.000Z',
    delegateDid: 'did:key:z6Mkg49NtQR2LyYRDCQFK4w1VVHqhypZSSRo7HsyuN7SV7v5',
    ownerProfileId: 'issuer',
    effectiveProfileId: 'issuer',
    audience: 'https://network.example',
    createdBy: 'did:key:z6MkOwner',
};
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

describe('delegate auth grant schema', () => {
    it('accepts a finite, fixed-owner issuance grant', () => {
        expect(DelegateAuthGrantValidator.parse(grant)).toEqual(grant);
    });

    it.each(['inbox:write', 'contracts-data:write'])(
        'accepts the single least-privilege scope %s',
        scope =>
            expect(DelegateAuthGrantValidator.safeParse({ ...grant, scope }).success).toBe(true)
    );

    it.each([
        { delegateDid: 'did:web:delegate.example' },
        { delegateDid: 'did:key:z6MkDelegate#key' },
        { delegateDid: '' },
        { ownerProfileId: '*' },
        { effectiveProfileId: 'another-issuer' },
        { effectiveProfileId: 'issuer,other' },
        { audience: '' },
        { createdBy: '' },
        { expiresAt: null },
        { expiresAt: undefined },
        { expiresAt: 'invalid' },
        { expiresAt: grant.createdAt },
        { expiresAt: '2025-01-01T00:00:00.000Z' },
        { actAs: '*' },
        { actAs: 'issuer' },
        { scope: '*:*' },
        { scope: 'inbox:*' },
        { scope: 'authGrants:write' },
        { scope: 'inbox:write authGrants:write' },
        { scope: 'inbox:write inbox:write' },
        { scope: 'inbox:write\tcontracts-data:write' },
        { scope: '' },
    ])('rejects an unsafe binding: %j', override => {
        expect(DelegateAuthGrantValidator.safeParse({ ...grant, ...override }).success).toBe(false);
    });

    it('rejects a challenge with the legacy auth-grant: prefix', () => {
        expect(
            DelegateAuthGrantValidator.safeParse({
                ...grant,
                challenge: 'auth-grant:opaque-challenge',
            }).success
        ).toBe(false);
    });

    it('rejects a challenge that contains auth-grant: anywhere', () => {
        expect(
            DelegateAuthGrantValidator.safeParse({
                ...grant,
                challenge: 'delegate-grant:auth-grant:x',
            }).success
        ).toBe(false);
    });

    it('rejects a challenge that is only the prefix', () => {
        expect(
            DelegateAuthGrantValidator.safeParse({ ...grant, challenge: 'delegate-grant:' }).success
        ).toBe(false);
    });

    it('accepts a lifetime of exactly 90 days', () => {
        const expiresAt = new Date(Date.parse(grant.createdAt) + NINETY_DAYS_MS).toISOString();
        expect(DelegateAuthGrantValidator.safeParse({ ...grant, expiresAt }).success).toBe(true);
    });

    it('rejects a lifetime of 90 days plus one millisecond', () => {
        const expiresAt = new Date(Date.parse(grant.createdAt) + NINETY_DAYS_MS + 1).toISOString();
        expect(DelegateAuthGrantValidator.safeParse({ ...grant, expiresAt }).success).toBe(false);
    });

    it('leaves legacy unbounded self-grants unchanged', () => {
        const legacy = {
            id: grant.id,
            name: grant.name,
            challenge: 'auth-grant:opaque-challenge',
            status: grant.status,
            createdAt: grant.createdAt,
            expiresAt: null,
            scope: '*:*',
            actAs: '*',
        };
        expect(AuthGrantValidator.parse(legacy)).toEqual(legacy);
        expect(DelegateAuthGrantValidator.safeParse(legacy).success).toBe(false);
    });
});

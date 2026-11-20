import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UnsignedVC } from '@learncard/types';

const mocks = vi.hoisted(() => ({
    verify: vi.fn(),
    registry: vi.fn(),
    details: vi.fn(),
    writers: vi.fn(),
    authorities: vi.fn(),
    profile: vi.fn(),
}));
vi.mock('./readable-delivery-verifier.helpers', () => ({ verifyDeliveryCredential: mocks.verify }));
vi.mock('../services/registry/registry.factory', () => ({
    getRegistryService: () => ({ getIssuer: mocks.registry }),
}));
vi.mock('@accesslayer/consentflowcontract/relationships/read', () => ({
    getContractDetailsById: mocks.details,
    getWritersForContract: mocks.writers,
}));
vi.mock('@accesslayer/signing-authority/relationships/read', () => ({
    getSigningAuthoritiesForUser: mocks.authorities,
}));
vi.mock('@accesslayer/profile/read', () => ({ getProfileByDid: mocks.profile }));
import { getDeliveryTrustContext, verifyDeliveryOutcome } from './readable-delivery-trust.helpers';

const credential: UnsignedVC = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential'],
    issuer: 'did:key:issuer',
    issuanceDate: '2026-01-01T00:00:00Z',
    credentialSubject: { id: 'did:key:learner' },
};
const context = {
    expectedIssuers: new Set(['did:key:issuer']),
    learnerDids: new Set(['did:key:learner', 'did:web:network.example:users:learner']),
};
const valid = { proof: 'valid', status: 'not_applicable', dates: 'valid' };
beforeEach(() => {
    vi.resetAllMocks();
    mocks.verify.mockResolvedValue(valid);
    mocks.registry.mockResolvedValue({ matchingIssuers: [], uncheckedRegistries: [] });
});

describe('readable outcome trust labels', () => {
    it('verifies an expected issuer without requiring registry recognition', async () => {
        expect(await verifyDeliveryOutcome(credential, context)).toEqual({
            ...valid,
            label: 'verified',
        });
        mocks.registry.mockRejectedValue(new Error('Unavailable'));
        expect((await verifyDeliveryOutcome(credential, context)).label).toBe('verified');
    });
    it('includes registry names for expected issuers without changing their contract label', async () => {
        mocks.registry.mockResolvedValue({
            matchingIssuers: [
                { issuer: { federation_entity: { organization_name: 'Example College' } } },
            ],
            uncheckedRegistries: [],
        });
        expect(await verifyDeliveryOutcome(credential, context)).toMatchObject({
            label: 'verified',
            issuerName: 'Example College',
        });
    });
    it('distinguishes recognized from unknown signers outside the contract', async () => {
        const unrelated = { ...credential, issuer: 'did:key:other' };
        expect((await verifyDeliveryOutcome(unrelated, context)).label).toBe(
            'signed_unknown_issuer'
        );
        mocks.registry.mockResolvedValue({
            matchingIssuers: [
                { issuer: { federation_entity: { organization_name: 'Example College' } } },
            ],
            uncheckedRegistries: [],
        });
        expect(await verifyDeliveryOutcome(unrelated, context)).toMatchObject({
            label: 'recognized_issuer',
            issuerName: 'Example College',
        });
    });
    it.each([...context.learnerDids])(
        'never looks up or names learner-signed outcome from %s',
        async issuer => {
            mocks.registry.mockResolvedValue({
                matchingIssuers: [
                    { issuer: { federation_entity: { organization_name: 'Learner Issuer' } } },
                ],
                uncheckedRegistries: [],
            });
            const result = await verifyDeliveryOutcome(
                { ...credential, issuer },
                { ...context, expectedIssuers: new Set([issuer]) }
            );
            expect(result).toMatchObject({ label: 'self_reported' });
            expect(result).not.toHaveProperty('issuerName');
            expect(mocks.registry).not.toHaveBeenCalled();
        }
    );
    it('preserves a recognized issuer name when authenticated status checks fail', async () => {
        mocks.registry.mockResolvedValue({
            matchingIssuers: [
                { issuer: { federation_entity: { organization_name: 'Example College' } } },
            ],
            uncheckedRegistries: [],
        });
        mocks.verify.mockResolvedValue({ ...valid, status: 'invalid' });
        expect(
            await verifyDeliveryOutcome({ ...credential, issuer: 'did:key:other' }, context)
        ).toMatchObject({
            label: 'unverified',
            issuerName: 'Example College',
        });
    });
    it.each(['invalid', 'unavailable'])(
        'does not look up or name an issuer with %s proof',
        async proof => {
            mocks.verify.mockResolvedValue({ ...valid, proof });
            const result = await verifyDeliveryOutcome(credential, context);
            expect(result.label).toBe(proof === 'invalid' ? 'self_reported' : 'unverified');
            expect(result).not.toHaveProperty('issuerName');
            expect(mocks.registry).not.toHaveBeenCalled();
        }
    );
    it.each([
        [{ id: 'did:key:foreign' }, 'unverified'],
        [{}, 'unverified'],
        [[{ id: 'did:key:foreign' }, { id: 'did:key:learner' }], 'verified'],
        [[{ id: 'did:key:foreign' }, {}], 'unverified'],
    ])('binds subjects %j to the learner', async (credentialSubject, label) => {
        const result = await verifyDeliveryOutcome(
            { ...credential, credentialSubject } as UnsignedVC,
            context
        );
        expect(result.label).toBe(label);
    });
    it.each([
        { proof: 'unavailable' },
        { status: 'invalid' },
        { status: 'unavailable' },
        { dates: 'invalid' },
    ])('never labels failed or incomplete checks verified: %j', async failure => {
        mocks.verify.mockResolvedValue({ ...valid, ...failure });
        expect((await verifyDeliveryOutcome(credential, context)).label).toBe('unverified');
    });
    it.each([null, { matchingIssuers: [], uncheckedRegistries: ['offline'] }])(
        'does not call an unchecked registry result an unknown issuer',
        async registry => {
            mocks.registry.mockResolvedValue(registry);
            expect(
                (await verifyDeliveryOutcome({ ...credential, issuer: 'did:key:other' }, context))
                    .label
            ).toBe('unverified');
        }
    );
    it('derives expected identities from the owner, writers and their registered signing authorities', async () => {
        mocks.details.mockResolvedValue({
            contract: { id: 'test', contract: { expectedIssuers: ['did:key:delegate'] } },
            contractOwner: { profileId: 'owner', did: 'did:key:owner' },
        });
        mocks.writers.mockResolvedValue([{ profileId: 'writer', did: 'did:key:writer' }]);
        mocks.authorities.mockImplementation(async profile => [
            { relationship: { did: `did:key:${profile.profileId}-signer` } },
        ]);
        mocks.profile.mockResolvedValue({ profileId: 'learner', did: 'did:key:learner' });
        const result = await getDeliveryTrustContext(
            'lc:network:network.example/trpc:contract:test',
            'did:key:learner',
            'network.example'
        );
        expect([...result.expectedIssuers].sort()).toEqual(
            [
                'did:key:delegate',
                'did:key:owner',
                'did:key:owner-signer',
                'did:key:writer',
                'did:key:writer-signer',
                'did:web:network.example:users:owner',
                'did:web:network.example:users:writer',
            ].sort()
        );
        expect(result.learnerDids).toEqual(context.learnerDids);
    });
});

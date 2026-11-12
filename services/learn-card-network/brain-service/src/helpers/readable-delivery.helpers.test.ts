import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConsentFlowContractDataForDidValidator } from '@learncard/types';

const mocks = vi.hoisted(() => ({
    delivery: vi.fn(),
    provision: vi.fn(),
    create: vi.fn(),
    disable: vi.fn(),
    audit: vi.fn(),
    profile: vi.fn(),
    managers: vi.fn(),
    grants: vi.fn(),
    read: vi.fn(),
    encryptKey: vi.fn(),
    generateKey: vi.fn(),
    decryptKey: vi.fn(),
    decrypt: vi.fn(),
    verify: vi.fn(),
    environment: {
        READABLE_DELIVERY_ENABLED: true,
        IS_OFFLINE: true,
        NODE_ENV: 'test',
        NEO4J_URI: 'bolt://localhost:7687',
        NEO4J_USERNAME: 'neo4j',
        NEO4J_PASSWORD: 'synthetic',
    },
}));
vi.mock('@environment', async importOriginal => {
    const defaults = (await importOriginal<typeof import('@environment')>()).environment;
    return {
        get environment() {
            return { ...defaults, ...mocks.environment };
        },
    };
});
vi.mock('@accesslayer/readable-delivery', () => ({
    getDeliveryRecord: mocks.delivery,
    getDeliveryProvision: mocks.provision,
    createDeliveryRecipient: mocks.create,
    disableDeliveryRecipient: mocks.disable,
    auditDeliveryRead: mocks.audit,
}));
vi.mock('@accesslayer/profile/read', () => ({
    getProfileByDid: mocks.profile,
    getProfileByProfileId: mocks.profile,
}));
vi.mock('@accesslayer/profile/relationships/read', () => ({
    getProfilesThatManageAProfile: mocks.managers,
}));
vi.mock('@accesslayer/consentflowcontract/relationships/read', () => ({
    getConsentedDataBetweenProfiles: mocks.grants,
}));
vi.mock('@helpers/readable-delivery-storage.helpers', () => ({
    readDeliveryCiphertext: mocks.read,
}));
vi.mock('@helpers/readable-delivery-keys.helpers', () => ({
    createDeliveryKeyCustody: () => ({ decrypt: mocks.decryptKey, encrypt: mocks.encryptKey }),
}));
vi.mock('@helpers/uri.helpers', () => ({
    getUriParts: (uri: string) => {
        const parts = uri.split(':');
        return { domain: parts[2], type: parts[3], id: parts[4] };
    },
}));
vi.mock('@cache/did-docs', () => ({ deleteDidDocForProfile: vi.fn() }));
vi.mock('@helpers/learnCard.helpers', () => ({
    getEmptyLearnCard: async () => ({
        invoke: {
            keyToDid: () => 'did:key:agent',
            generateEd25519KeyFromBytes: mocks.generateKey,
            decryptDagJwe: mocks.decrypt,
            verifyCredential: mocks.verify,
        },
    }),
}));
vi.mock('@helpers/rateLimit.helpers', () => ({ enforceRateLimits: vi.fn() }));

import {
    readReadableDelivery,
    isDeliveryConsentReadable,
    provisionReadableDelivery,
} from './readable-delivery.helpers';
import { readableDeliveryRouter } from '@routes/readable-delivery';

const domain = 'network.example';
const input = {
    contractUri: `lc:network:${domain}/trpc:contract:contract`,
    did: 'did:key:learner',
    limit: 1,
};
const item = { category: 'Achievement', uri: `lc:network:${domain}/trpc:credential:one` };
const grant = ConsentFlowContractDataForDidValidator.parse({
    credentials: [item, { ...item, uri: item.uri.replace('one', 'two') }],
    personal: {},
    date: '2026-11-12',
    contractUpdatedAt: '2026-11-12',
    contractUri: input.contractUri,
    termsUri: 'terms',
    status: 'live',
    guardian: { required: false, approved: false },
    terms: {},
});
const vc = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential'],
    issuer: 'did:key:issuer',
    issuanceDate: '2026-01-01T00:00:00Z',
    credentialSubject: { id: 'did:key:learner', privateField: 'not-in-summary' },
    name: 'Synthetic outcome',
    proof: {
        created: '2026-01-01T00:00:00Z',
        type: 'Ed25519Signature2020',
        verificationMethod: 'did:key:issuer#key',
        proofPurpose: 'assertionMethod',
        proofValue: 'test',
    },
};

beforeEach(() => {
    vi.resetAllMocks();
    mocks.environment.READABLE_DELIVERY_ENABLED = true;
    mocks.generateKey.mockReturnValue({ kty: 'OKP', crv: 'Ed25519', x: 'public', d: 'private' });
    mocks.encryptKey.mockResolvedValue({ provider: 'local-v1', ciphertext: 'encrypted-key' });
    mocks.delivery.mockResolvedValue({
        enabled: true,
        agentProfileId: 'agent',
        agentDid: 'did:key:agent',
    });
    mocks.managers.mockResolvedValue([{ profileId: 'agent', did: 'did:key:agent' }]);
    mocks.profile.mockResolvedValue({ profileId: 'learner', did: input.did });
    mocks.grants.mockResolvedValue({ records: [structuredClone(grant)] });
    mocks.decryptKey.mockResolvedValue(
        JSON.stringify({ kty: 'OKP', crv: 'Ed25519', x: 'public', d: 'private' })
    );
    mocks.read.mockResolvedValue({ ciphertext: 'encrypted' });
    mocks.decrypt.mockResolvedValue(vc);
    mocks.verify.mockResolvedValue({ errors: [], warnings: [], checks: ['proof'] });
    mocks.audit.mockResolvedValue(undefined);
});

describe('readable delivery authorization and projection', () => {
    it('fails closed while the feature is disabled', async () => {
        mocks.environment.READABLE_DELIVERY_ENABLED = false;
        await expect(readReadableDelivery('recipient', domain, input)).rejects.toMatchObject({
            code: 'PRECONDITION_FAILED',
        });
        expect(mocks.decryptKey).not.toHaveBeenCalled();
    });
    it('rejects a malformed local DID that resolves to a different profile', async () => {
        await expect(
            readReadableDelivery('recipient', domain, {
                ...input,
                did: `did:web:${domain}:users:wrong:learner`,
            })
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });
        expect(mocks.decryptKey).not.toHaveBeenCalled();
    });

    it('returns a bounded projection, rechecks consent, and paginates', async () => {
        const result = await readReadableDelivery('recipient', domain, input);
        expect(result).toMatchObject({
            hasMore: true,
            cursor: '1',
            records: [
                {
                    status: 'readable',
                    credential: {
                        name: 'Synthetic outcome',
                        verification: { proof: 'valid', status: 'not_checked' },
                    },
                },
            ],
        });
        expect(JSON.stringify(result)).not.toContain('not-in-summary');
        expect(mocks.grants).toHaveBeenCalledTimes(2);
        expect(mocks.decrypt).toHaveBeenCalledTimes(1);
    });
    it.each(['withdrawn', 'suspended', 'needs_reconsent', 'denied'])(
        'does not unwrap a key for %s consent',
        async status => {
            mocks.grants.mockResolvedValue({ records: [{ ...grant, status }] });
            await expect(readReadableDelivery('recipient', domain, input)).rejects.toMatchObject({
                code: 'FORBIDDEN',
            });
            expect(mocks.decryptKey).not.toHaveBeenCalled();
        }
    );
    it('rejects missing consent or guardian approval before fetching ciphertext', async () => {
        mocks.grants.mockResolvedValue({ records: [] });
        await expect(readReadableDelivery('recipient', domain, input)).rejects.toMatchObject({
            code: 'FORBIDDEN',
        });
        expect(
            isDeliveryConsentReadable({ ...grant, guardian: { required: true, approved: false } })
        ).toBe(false);
        expect(mocks.read).not.toHaveBeenCalled();
    });
    it('rejects withdrawal or disablement occurring during decryption', async () => {
        mocks.grants
            .mockResolvedValueOnce({ records: [grant] })
            .mockResolvedValueOnce({ records: [] });
        await expect(readReadableDelivery('recipient', domain, input)).rejects.toMatchObject({
            code: 'FORBIDDEN',
        });
        mocks.grants.mockResolvedValue({ records: [grant] });
        mocks.delivery
            .mockResolvedValueOnce({
                enabled: true,
                agentProfileId: 'agent',
                agentDid: 'did:key:agent',
            })
            .mockResolvedValueOnce({ enabled: false });
        await expect(readReadableDelivery('recipient', domain, input)).rejects.toMatchObject({
            code: 'FORBIDDEN',
        });
    });
    it('reports old-key ciphertext as unreadable without substituting plaintext', async () => {
        mocks.decrypt.mockResolvedValue(undefined);
        expect((await readReadableDelivery('recipient', domain, input)).records).toEqual([
            { ...item, status: 'unreadable' },
        ]);
        expect(mocks.verify).not.toHaveBeenCalled();
    });
    it('does not resolve arbitrary issuer/proof URLs while verifying', async () => {
        mocks.decrypt.mockResolvedValue({ ...vc, issuer: 'did:web:private.internal' });
        expect(
            (await readReadableDelivery('recipient', domain, input)).records[0]?.credential
                ?.verification.proof
        ).toBe('not_checked');
        expect(mocks.verify).not.toHaveBeenCalled();
    });
    it('rejects foreign network references and foreign did:web identifiers', async () => {
        await expect(
            readReadableDelivery('recipient', domain, {
                ...input,
                contractUri: input.contractUri.replace(domain, 'elsewhere'),
            })
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });
        await expect(
            readReadableDelivery('recipient', domain, {
                ...input,
                did: 'did:web:elsewhere:users:learner',
            })
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });
        expect(mocks.decryptKey).not.toHaveBeenCalled();
    });
});

describe('readable API permission and audit boundary', () => {
    it('audits a permitted read before releasing the projection', async () => {
        const caller = readableDeliveryRouter.createCaller({
            domain,
            user: {
                did: 'did:key:caller',
                isChallengeValid: true,
                scope: 'contracts-data:read contracts-data:decrypt',
            },
        } as Parameters<typeof readableDeliveryRouter.createCaller>[0]);
        expect((await caller.read(input)).records[0]?.status).toBe('readable');
        expect(mocks.audit.mock.calls).toEqual([
            ['learner', 'learner', 'started'],
            ['learner', 'learner', 'allowed', 1],
        ]);
        mocks.audit.mockImplementation(async (_actor, _recipient, result) => {
            if (result === 'allowed') throw new Error('private audit detail');
        });
        await expect(caller.read(input)).rejects.toMatchObject({
            message: 'Readable delivery is temporarily unavailable.',
        });
    });

    it.each(['contracts-data:read', 'contracts-data:decrypt', '*:read', ''])(
        'requires both permissions for scope %s',
        async scope => {
            const caller = readableDeliveryRouter.createCaller({
                domain,
                user: { did: 'did:key:caller', isChallengeValid: true, scope },
            } as Parameters<typeof readableDeliveryRouter.createCaller>[0]);
            await expect(caller.read(input)).rejects.toMatchObject({ code: 'FORBIDDEN' });
            expect(mocks.audit).toHaveBeenCalledWith('learner', 'learner', 'denied');
            expect(mocks.decryptKey).not.toHaveBeenCalled();
        }
    );
    it('fails closed when the audit store is unavailable', async () => {
        mocks.audit.mockRejectedValue(new Error('audit unavailable'));
        const caller = readableDeliveryRouter.createCaller({
            domain,
            user: { did: 'did:key:caller', isChallengeValid: true, scope: '*:*' },
        } as Parameters<typeof readableDeliveryRouter.createCaller>[0]);
        await expect(caller.read(input)).rejects.toThrow();
        expect(mocks.decryptKey).not.toHaveBeenCalled();
    });
});

describe('readable recipient provisioning', () => {
    const request = {
        requestId: '12345678-1234-4234-8234-123456789012',
        displayName: 'Example Organization',
        acceptDelegatedAuthority: true as const,
        disclosureVersion: '1' as const,
    };
    it('stores only an encrypted envelope and creates a fresh recipient', async () => {
        const result = await provisionReadableDelivery('owner', domain, request);
        expect(result.profileId).toMatch(/^readable-/);
        expect(mocks.create).toHaveBeenCalledOnce();
        const stored = mocks.create.mock.calls[0]?.[0];
        expect(stored).toMatchObject({
            ownerProfileId: 'owner',
            domain,
            provider: 'local-v1',
            ciphertext: 'encrypted-key',
            enabled: true,
        });
        expect(JSON.stringify(stored)).not.toContain('private');
        expect(result).not.toHaveProperty('ciphertext');
    });
    it('reuses the same provision request and rejects a mismatched retry', async () => {
        mocks.provision.mockResolvedValue({
            ownerProfileId: 'owner',
            domain,
            profileId: 'existing',
            agentDid: 'did:key:agent',
            displayName: request.displayName,
            enabled: true,
        });
        expect((await provisionReadableDelivery('owner', domain, request)).profileId).toBe(
            'existing'
        );
        expect(mocks.encryptKey).not.toHaveBeenCalled();
        await expect(
            provisionReadableDelivery('owner', domain, { ...request, displayName: 'Different' })
        ).rejects.toMatchObject({ code: 'FORBIDDEN' });
        expect(mocks.create).not.toHaveBeenCalled();
    });
    it('does not create a recipient if key custody fails', async () => {
        mocks.encryptKey.mockRejectedValue(new Error('private detail'));
        await expect(provisionReadableDelivery('owner', domain, request)).rejects.toMatchObject({
            code: 'PRECONDITION_FAILED',
            message: 'Readable delivery is unavailable.',
        });
        expect(mocks.create).not.toHaveBeenCalled();
    });
});

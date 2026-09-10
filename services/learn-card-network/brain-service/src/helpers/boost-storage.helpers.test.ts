import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { JWE, VC } from '@learncard/types';

const mocks = vi.hoisted(() => ({
    decrypt: vi.fn(),
    issue: vi.fn(),
    store: vi.fn(async (_credential: unknown) => ({ id: 'stored' })),
    instanceOf: vi.fn(),
    sent: vi.fn(),
    contract: vi.fn(),
    listing: vi.fn(),
    accept: vi.fn(),
    notify: vi.fn(async () => undefined),
}));

vi.mock('@models', () => ({}));
vi.mock('@services/skills-provider/inject', () => ({}));
vi.mock('@accesslayer/boost/relationships/read', () => ({}));
vi.mock('./uri.helpers', () => ({
    constructUri: (kind: string, id: string, domain: string) =>
        `lc:network:${domain}/${kind}:${id}`,
}));
vi.mock('@accesslayer/credential/create', () => ({ storeCredential: mocks.store }));
vi.mock('@accesslayer/boost/relationships/create', () => ({
    createBoostInstanceOfRelationship: mocks.instanceOf,
}));
vi.mock('@accesslayer/credential/relationships/create', () => ({
    createSentCredentialRelationship: mocks.sent,
    createCredentialIssuedViaContractRelationship: mocks.contract,
    createListingSentCredentialRelationship: mocks.listing,
}));
vi.mock('./credential.helpers', () => ({
    acceptCredential: mocks.accept,
    getCredentialUri: (id: string, domain: string) => `lc:network:${domain}/credential:${id}`,
}));
vi.mock('./learnCard.helpers', () => ({
    getLearnCard: async () => ({
        id: { did: () => 'did:example:brain', keypair: () => ({}) },
        invoke: {
            decryptDagJwe: mocks.decrypt,
            issueCredential: mocks.issue,
            resolveDid: async () => ({}),
        },
    }),
}));
vi.mock('./signingAuthority.helpers', () => ({}));
vi.mock('./notifications.helpers', () => ({ addNotificationToQueue: mocks.notify }));
vi.mock('./notificationMessages', () => ({ getNotificationMessage: () => 'Received' }));
vi.mock('./getRecipientLocale.helpers', () => ({ resolveRecipientLocale: async () => 'en' }));
vi.mock('./did.helpers', () => ({
    getDidWeb: (domain: string, id: string) => `did:web:${domain}:users:${id}`,
}));
vi.mock('./status-list.helpers', () => ({
    appendBitstringStatusListEntries: async (credential: unknown) => credential,
}));
vi.mock('@tracing', () => ({
    trace: async (_kind: string, _name: string, action: () => unknown) => action(),
    traceDb: async (_name: string, action: () => unknown) => action(),
    traceCrypto: async (_name: string, action: () => unknown) => action(),
    traceInternal: async (_name: string, action: () => unknown) => action(),
}));

import { sendBoost } from './boost.helpers';

const vc = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential', 'BoostCredential'],
    issuer: 'did:example:issuer',
    issuanceDate: '2026-01-01T00:00:00Z',
    credentialSubject: { id: 'did:example:subject' },
    boostId: 'lc:network:network.example/boost:boost',
    proof: {
        type: 'Ed25519Signature2020',
        created: '2026-01-01T00:00:00Z',
        proofPurpose: 'assertionMethod',
        verificationMethod: 'did:example:issuer#key',
    },
} as VC;
const jwe: JWE = {
    protected: 'header',
    iv: 'iv',
    ciphertext: 'ciphertext',
    tag: 'tag',
    recipients: [],
};
const options = {
    from: { type: 'profile', profile: { profileId: 'org' } },
    to: { profileId: 'student' },
    boost: { dataValues: { id: 'boost', boost: JSON.stringify(vc) } },
    credential: jwe,
    domain: 'network.example',
    autoAcceptCredential: true,
    contractTerms: { id: 'terms' },
    listingId: 'listing',
    metadata: { source: 'test' },
    activityId: 'activity',
    integrationId: 'integration',
} as unknown as Parameters<typeof sendBoost>[0];

describe('boost payload storage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.decrypt.mockResolvedValue(vc);
        mocks.issue.mockImplementation(async unsigned => ({ ...unsigned, proof: {} }));
    });

    it.each([
        ['encrypted', jwe],
        ['issuer-signed', vc],
    ] as const)(
        'stores %s payload unchanged and preserves graph, claim, and notification behavior',
        async (_kind, credential) => {
            const uri = await sendBoost({ ...options, credential });
            expect(uri).toBe('lc:network:network.example/credential:stored');
            expect(mocks.store.mock.calls[0]?.[0]).toBe(credential);
            expect(mocks.decrypt).not.toHaveBeenCalled();
            expect(mocks.issue).not.toHaveBeenCalled();
            expect(mocks.instanceOf).toHaveBeenCalledExactlyOnceWith(
                { id: 'stored' },
                options.boost
            );
            expect(mocks.sent).toHaveBeenCalledExactlyOnceWith(
                options.from,
                options.to,
                { id: 'stored' },
                options.metadata,
                'activity',
                'integration'
            );
            expect(mocks.contract).toHaveBeenCalledExactlyOnceWith(
                { id: 'stored' },
                options.contractTerms
            );
            expect(mocks.listing).toHaveBeenCalledExactlyOnceWith(
                'listing',
                options.to,
                { id: 'stored' },
                options.metadata,
                'activity',
                'integration'
            );
            expect(mocks.accept).toHaveBeenCalledExactlyOnceWith(options.to, uri, {
                skipNotification: false,
            });
            expect(mocks.notify).toHaveBeenCalledOnce();
        }
    );

    it('does not inspect template-derived fields or add a network signature', async () => {
        const credential = { ...vc, display: { backgroundColor: '#bad' } };
        await sendBoost({ ...options, credential });
        expect(mocks.store.mock.calls[0]?.[0]).toBe(credential);
        expect(mocks.decrypt).not.toHaveBeenCalled();
        expect(mocks.issue).not.toHaveBeenCalled();
    });

    it('preserves explicit notification and acceptance opt-outs', async () => {
        await sendBoost({
            ...options,
            skipNotification: true,
            autoAcceptCredential: false,
            contractTerms: undefined,
            listingId: undefined,
        });
        expect(mocks.store.mock.calls[0]?.[0]).toBe(jwe);
        expect(mocks.instanceOf).toHaveBeenCalledOnce();
        expect(mocks.sent).toHaveBeenCalledOnce();
        expect(mocks.accept).not.toHaveBeenCalled();
        expect(mocks.notify).not.toHaveBeenCalled();
        expect(mocks.contract).not.toHaveBeenCalled();
        expect(mocks.listing).not.toHaveBeenCalled();
    });
});

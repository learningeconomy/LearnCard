import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
    storeCredentialMock,
    createDagJweMock,
    getLearnCardMock,
    createBoostInstanceOfRelationshipMock,
    createSentCredentialRelationshipMock,
    createCredentialIssuedViaContractRelationshipMock,
    createListingSentCredentialRelationshipMock,
    acceptCredentialMock,
    getCredentialUriMock,
    addNotificationToQueueMock,
} = vi.hoisted(() => ({
    storeCredentialMock: vi.fn(async item => ({ id: `cred-${storeCredentialMock.mock.calls.length + 1}`, item })),
    createDagJweMock: vi.fn(async credential => ({ ciphertext: 'encrypted', cleartext: credential })),
    getLearnCardMock: vi.fn(async () => ({
        invoke: {
            createDagJwe: createDagJweMock,
        },
    })),
    createBoostInstanceOfRelationshipMock: vi.fn(async () => undefined),
    createSentCredentialRelationshipMock: vi.fn(async () => undefined),
    createCredentialIssuedViaContractRelationshipMock: vi.fn(async () => undefined),
    createListingSentCredentialRelationshipMock: vi.fn(async () => undefined),
    acceptCredentialMock: vi.fn(async () => undefined),
    getCredentialUriMock: vi.fn((id: string, domain: string) => `credential:${domain}:${id}`),
    addNotificationToQueueMock: vi.fn(async () => undefined),
}));

vi.mock('@learncard/helpers', () => ({
    isEncrypted: vi.fn((item: { ciphertext?: string }) => Boolean(item?.ciphertext)),
    isVC2Format: vi.fn(() => false),
}));

vi.mock('@services/skills-provider/inject', () => ({
    injectObv3AlignmentsIntoCredentialForBoost: vi.fn(),
    buildObv3AlignmentsForBoost: vi.fn(async () => []),
}));

vi.mock('@helpers/template.helpers', () => ({
    hasMustacheVariables: vi.fn(() => false),
    renderBoostTemplate: vi.fn((template: string) => template),
    parseRenderedTemplate: vi.fn((template: string) => JSON.parse(template)),
    shouldAutoAppendTemplateEvidence: vi.fn(() => false),
}));

vi.mock('@accesslayer/boost/relationships/read', () => ({ getBoostOwner: vi.fn() }));
vi.mock('@models', () => ({}));
vi.mock('../src/models', () => ({}));
vi.mock('@accesslayer/credential/create', () => ({
    storeCredential: storeCredentialMock,
}));
vi.mock('@accesslayer/boost/relationships/create', () => ({
    createBoostInstanceOfRelationship: createBoostInstanceOfRelationshipMock,
}));
vi.mock('@accesslayer/credential/relationships/create', () => ({
    createSentCredentialRelationship: createSentCredentialRelationshipMock,
    createCredentialIssuedViaContractRelationship: createCredentialIssuedViaContractRelationshipMock,
    createListingSentCredentialRelationship: createListingSentCredentialRelationshipMock,
}));
vi.mock('@helpers/credential.helpers', () => ({
    acceptCredential: acceptCredentialMock,
    getCredentialUri: getCredentialUriMock,
}));
vi.mock('@helpers/signingAuthority.helpers', () => ({
    issueCredentialWithSigningAuthority: vi.fn(),
}));
vi.mock('@helpers/notifications.helpers', () => ({
    addNotificationToQueue: addNotificationToQueueMock,
}));
vi.mock('@helpers/did.helpers', () => ({ getDidWeb: vi.fn() }));
vi.mock('@helpers/status-list.helpers', () => ({
    appendBitstringStatusListEntries: vi.fn(async credential => credential),
}));
vi.mock('@helpers/boost-hash.helpers', () => ({
    computeBoostTemplateHash: vi.fn(() => 'hash'),
}));
vi.mock('@helpers/uri.helpers', () => ({ constructUri: vi.fn() }));
vi.mock('../../src/helpers/learnCard.helpers', () => ({
    getLearnCard: getLearnCardMock,
}));
vi.mock('@tracing', () => ({
    trace: vi.fn(async (_op: string, _name: string, fn: () => unknown) => await fn()),
    traceDb: vi.fn(async (_name: string, fn: () => unknown) => await fn()),
}));

describe('JWE issuance hardening', () => {
    const from = {
        type: 'profile' as const,
        profile: {
            profileId: 'issuer',
            did: 'did:web:example.com:users:issuer',
            displayName: 'Issuer',
        },
    };
    const to = {
        profileId: 'recipient',
        did: 'did:web:example.com:users:recipient',
    } as const;
    const plaintextCredential = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential', 'BoostCredential'],
        credentialSubject: { id: to.did },
        issuer: from.profile.did,
        issuanceDate: '2020-08-19T21:41:50Z',
    };
    const encryptedCredential = {
        ciphertext: 'already-encrypted',
        recipients: [{ header: { kid: `${to.did}#key-1` } }],
        protected: 'protected',
        iv: 'iv',
        tag: 'tag',
    };

    beforeEach(() => {
        vi.clearAllMocks();
        storeCredentialMock.mockImplementation(async item => ({
            id: `cred-${storeCredentialMock.mock.calls.length + 1}`,
            item,
        }));
        createDagJweMock.mockImplementation(async credential => ({
            ciphertext: 'encrypted',
            cleartext: credential,
        }));
    });

    it('stores a JWE for encrypted-only boosts when the issued credential is plaintext', async () => {
        const { sendBoost } = await import('../../src/helpers/boost.helpers');

        await sendBoost({
            from,
            to: to as any,
            boost: { dataValues: { storage: 'encrypted-only' } } as any,
            credential: plaintextCredential as any,
            domain: 'example.com',
            skipNotification: true,
        });

        expect(getLearnCardMock).toHaveBeenCalledTimes(1);
        expect(createDagJweMock).toHaveBeenCalledWith(plaintextCredential, [to.did]);
        expect(storeCredentialMock).toHaveBeenCalledTimes(1);
        expect(storeCredentialMock.mock.calls[0]?.[0]).toMatchObject({ ciphertext: 'encrypted' });
        expect(createBoostInstanceOfRelationshipMock).toHaveBeenCalledWith(
            expect.objectContaining({
                item: expect.objectContaining({ ciphertext: 'encrypted' }),
            }),
            expect.anything()
        );
    });

    it('stores pre-encrypted JWEs as-is for encrypted-only boosts', async () => {
        const { sendBoost } = await import('../../src/helpers/boost.helpers');

        await sendBoost({
            from,
            to: to as any,
            boost: { dataValues: { storage: 'encrypted-only' } } as any,
            credential: encryptedCredential as any,
            domain: 'example.com',
            skipNotification: true,
        });

        expect(getLearnCardMock).not.toHaveBeenCalled();
        expect(createDagJweMock).not.toHaveBeenCalled();
        expect(storeCredentialMock).toHaveBeenCalledWith(encryptedCredential);
    });

    it('stores plaintext boosts as-is regardless of credential type', async () => {
        const { sendBoost } = await import('../../src/helpers/boost.helpers');

        await sendBoost({
            from,
            to: to as any,
            boost: { dataValues: { storage: 'plaintext' } } as any,
            credential: plaintextCredential as any,
            domain: 'example.com',
            skipNotification: true,
        });

        await sendBoost({
            from,
            to: to as any,
            boost: { dataValues: { storage: 'plaintext' } } as any,
            credential: encryptedCredential as any,
            domain: 'example.com',
            skipNotification: true,
        });

        expect(getLearnCardMock).not.toHaveBeenCalled();
        expect(createDagJweMock).not.toHaveBeenCalled();
        expect(storeCredentialMock.mock.calls[0]?.[0]).toBe(plaintextCredential);
        expect(storeCredentialMock.mock.calls[1]?.[0]).toBe(encryptedCredential);
    });
});

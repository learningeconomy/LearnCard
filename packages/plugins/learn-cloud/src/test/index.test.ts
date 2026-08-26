const mockGetClient = jest.fn();

const mockClient = {
    user: {
        getDids: { query: jest.fn().mockResolvedValue([]) },
    },
    utilities: {
        getDid: { query: jest.fn().mockResolvedValue('did:key:z6MkLearnCloud') },
    },
    storage: {
        batchResolve: { query: jest.fn() },
    },
    customStorage: {
        count: { query: jest.fn().mockResolvedValue(0) },
        create: { mutate: jest.fn() },
    },
};

jest.mock('@learncard/learn-cloud-client', () => ({
    getClient: (...args: unknown[]) => mockGetClient(...args),
}));

import { getLearnCloudPlugin } from '../';

const makeW3cVc = () => ({
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    type: ['VerifiableCredential', 'TestCredential'],
    issuer: 'did:web:issuer.example',
    credentialSubject: { id: 'did:key:holder', name: 'Ada' },
    validFrom: '2024-01-01T00:00:00.000Z',
    proof: {
        type: 'Ed25519Signature2020',
        created: '2024-01-01T00:00:00.000Z',
        proofPurpose: 'assertionMethod',
        verificationMethod: 'did:web:issuer.example#key-1',
    },
});

const makeLearnCard = (did = 'did:key:z6MkHolder') => ({
    id: {
        did: () => did,
    },
    invoke: {
        getDidAuthVp: jest.fn().mockResolvedValue('did-auth-jwt'),
        decryptDagJwe: jest.fn(async value => value),
        createDagJwe: jest.fn(async () => ({ ciphertext: 'encrypted' })),
        hash: jest.fn(async value => `hash:${value}`),
    },
    debug: jest.fn(),
});

describe('LearnCloud Plugin', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGetClient.mockResolvedValue(mockClient);
    });

    it('exposes a function', () => {
        expect(getLearnCloudPlugin).toBeDefined();
    });

    it('defers remote identity requests until a method needs them', async () => {
        await getLearnCloudPlugin(makeLearnCard() as never, 'https://cloud.example');

        expect(mockClient.user.getDids.query).not.toHaveBeenCalled();
        expect(mockClient.utilities.getDid.query).not.toHaveBeenCalled();
    });

    it('does not load associated DIDs when automatic association is disabled', async () => {
        const learnCard = makeLearnCard();
        const plugin = await getLearnCloudPlugin(
            learnCard as never,
            'https://cloud.example',
            [],
            [],
            false
        );

        await plugin.methods.learnCloudCount(
            makeLearnCard('did:web:holder.example') as never,
            undefined as never,
            false
        );

        expect(mockClient.user.getDids.query).not.toHaveBeenCalled();
        expect(mockClient.customStorage.count.query).toHaveBeenCalledWith({
            includeAssociatedDids: false,
        });
    });

    it('refreshes the LearnCloud recipient DID after the active wallet changes', async () => {
        const firstClient = {
            ...mockClient,
            utilities: {
                getDid: { query: jest.fn().mockResolvedValue('did:key:z6MkFirstLearnCloud') },
            },
            customStorage: {
                ...mockClient.customStorage,
                create: { mutate: jest.fn().mockResolvedValue('first-record') },
            },
        };
        const secondClient = {
            ...mockClient,
            utilities: {
                getDid: { query: jest.fn().mockResolvedValue('did:key:z6MkSecondLearnCloud') },
            },
            customStorage: {
                ...mockClient.customStorage,
                create: { mutate: jest.fn().mockResolvedValue('second-record') },
            },
        };
        mockGetClient.mockResolvedValueOnce(firstClient).mockResolvedValueOnce(secondClient);

        const firstLearnCard = makeLearnCard('did:key:z6MkFirstHolder');
        const secondLearnCard = makeLearnCard('did:key:z6MkSecondHolder');
        const plugin = await getLearnCloudPlugin(
            firstLearnCard as never,
            'https://cloud.example',
            [],
            [],
            false
        );

        await plugin.methods.learnCloudCreate(firstLearnCard as never, { id: 'first' });
        await plugin.methods.learnCloudCreate(secondLearnCard as never, { id: 'second' });

        expect(firstClient.utilities.getDid.query).toHaveBeenCalledTimes(1);
        expect(secondClient.utilities.getDid.query).toHaveBeenCalledTimes(1);
        expect(firstLearnCard.invoke.createDagJwe).toHaveBeenLastCalledWith(expect.anything(), [
            'did:key:z6MkFirstLearnCloud',
        ]);
        expect(secondLearnCard.invoke.createDagJwe).toHaveBeenLastCalledWith(expect.anything(), [
            'did:key:z6MkSecondLearnCloud',
        ]);
    });

    it('projects envelope-backed credentials in learnCloudBatchResolve', async () => {
        const compact =
            'eyJhbGciOiJFZERTQSIsInR5cCI6ImRjK3NkLWp3dCJ9.eyJpc3MiOiJkaWQ6d2ViOmlzc3Vlci5leGFtcGxlIiwiaWF0IjoxNzAwMDAwMDAwLCJ2Y3QiOiJodHRwczovL2V4YW1wbGUuY29tL2NyZWRlbnRpYWxzL2VtcGxveW1lbnQiLCJuYW1lIjoiQWRhIn0.AAAA~';

        mockClient.storage.batchResolve.query.mockResolvedValue([
            makeW3cVc(),
            { format: 'dc+sd-jwt', data: compact },
        ]);

        const learnCard = makeLearnCard();
        const plugin = await getLearnCloudPlugin(learnCard as never, 'https://cloud.example');

        const results = await plugin.methods.learnCloudBatchResolve(learnCard as never, [
            'lc:cloud:https%3A%2F%2Fcloud.example:cred:1',
            'lc:cloud:https%3A%2F%2Fcloud.example:cred:2',
        ]);

        expect(results).toHaveLength(2);
        expect(results[0]).toMatchObject({
            issuer: 'did:web:issuer.example',
            type: ['VerifiableCredential', 'TestCredential'],
        });
        expect(results[1]).toMatchObject({
            issuer: 'did:web:issuer.example',
            type: ['VerifiableCredential', 'SdJwtVcCredential', 'Employment'],
            credentialSubject: { name: 'Ada' },
        });
    });
});

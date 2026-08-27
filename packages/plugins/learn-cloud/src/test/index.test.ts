import { vi } from 'vitest';
const mockGetClient = vi.fn();

const makeMockClient = (learnCloudDid = 'did:key:z6MkLearnCloud') => ({
    user: {
        getDids: { query: vi.fn().mockResolvedValue([]) },
    },
    utilities: {
        getDid: { query: vi.fn().mockResolvedValue(learnCloudDid) },
    },
    customStorage: {
        create: { mutate: vi.fn().mockResolvedValue('lc:cloud:credential') },
    },
    storage: {
        batchResolve: { query: vi.fn() },
    },
});

const mockClient = makeMockClient();

vi.mock('@learncard/learn-cloud-client', () => ({
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
        getDidAuthVp: vi.fn().mockResolvedValue('did-auth-jwt'),
        decryptDagJwe: vi.fn(async value => value),
        createDagJwe: vi.fn(async (value, recipients) => ({ value, recipients })),
        hash: vi.fn().mockResolvedValue('hashed-field'),
    },
    debug: vi.fn(),
});

describe('LearnCloud Plugin', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetClient.mockResolvedValue(mockClient);
    });

    it('exposes a function', () => {
        expect(getLearnCloudPlugin).toBeDefined();
    });

    it('refreshes the LearnCloud DID after switching authenticated clients', async () => {
        const initialClient = makeMockClient('did:web:cloud-one.example');
        const switchedClient = makeMockClient('did:web:cloud-two.example');
        mockGetClient.mockResolvedValueOnce(initialClient).mockResolvedValueOnce(switchedClient);

        const initialLearnCard = makeLearnCard('did:key:holder-one');
        const switchedLearnCard = makeLearnCard('did:key:holder-two');
        const plugin = await getLearnCloudPlugin(
            initialLearnCard as never,
            'https://cloud.example',
            [],
            [],
            false
        );

        await plugin.methods.learnCloudCreate(initialLearnCard as never, { id: 'first' });
        await plugin.methods.learnCloudCreate(switchedLearnCard as never, { id: 'second' });

        expect(initialClient.utilities.getDid.query).toHaveBeenCalledTimes(1);
        expect(switchedClient.utilities.getDid.query).toHaveBeenCalledTimes(1);
        expect(initialLearnCard.invoke.createDagJwe).toHaveBeenLastCalledWith(expect.any(Object), [
            'did:web:cloud-one.example',
        ]);
        expect(switchedLearnCard.invoke.createDagJwe).toHaveBeenLastCalledWith(expect.any(Object), [
            'did:web:cloud-two.example',
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

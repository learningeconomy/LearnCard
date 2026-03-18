/**
 * Unit tests for useVerifiableData hook and its exported helpers.
 *
 * Tests the core logic (credential creation, storage, retrieval, write ordering,
 * fallback reads) via the exported non-React functions `getVerifiableDataForKey`
 * and `saveVerifiableData`, which exercise the same internal code paths as the hook.
 *
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock useWallet (imported at module level by useVerifiableData)
// ---------------------------------------------------------------------------

vi.mock('../useWallet', () => ({
    useWallet: () => ({
        initWallet: vi.fn(),
    }),
}));

// ---------------------------------------------------------------------------
// Mock wallet factory
// ---------------------------------------------------------------------------

const TEST_DID = 'did:key:z6MkTestDid123';

const createMockWallet = () => {
    const issueCredential = vi.fn();
    const uploadEncrypted = vi.fn();
    const indexGet = vi.fn();
    const indexAdd = vi.fn();
    const indexUpdate = vi.fn();
    const indexRemove = vi.fn();
    const readGet = vi.fn();

    issueCredential.mockImplementation(async (unsigned: Record<string, unknown>) => ({
        ...unsigned,
        proof: { type: 'Ed25519Signature2020', created: new Date().toISOString() },
    }));

    uploadEncrypted.mockResolvedValue('lc:cloud:test-uri-123');
    indexGet.mockResolvedValue([]);
    indexAdd.mockResolvedValue(undefined);
    indexUpdate.mockResolvedValue(undefined);
    indexRemove.mockResolvedValue(undefined);
    readGet.mockResolvedValue(null);

    return {
        id: { did: () => TEST_DID },
        invoke: { issueCredential },
        store: { LearnCloud: { uploadEncrypted } },
        index: { LearnCloud: { get: indexGet, add: indexAdd, update: indexUpdate, remove: indexRemove } },
        read: { get: readGet },
    };
};

type MockWallet = ReturnType<typeof createMockWallet>;

// ---------------------------------------------------------------------------
// Import after mocks are set up
// ---------------------------------------------------------------------------

import { getVerifiableDataForKey, saveVerifiableData } from '../useVerifiableData';

// ---------------------------------------------------------------------------
// Tests — saveVerifiableData
// ---------------------------------------------------------------------------

describe('saveVerifiableData', () => {
    let wallet: MockWallet;

    beforeEach(() => {
        vi.clearAllMocks();
        wallet = createMockWallet();
    });

    it('issues a VC v2 credential with the correct structure', async () => {
        const data = { salary: '50000', salaryType: 'per_year' };

        await saveVerifiableData(wallet as never, 'test-key', data);

        expect(wallet.invoke.issueCredential).toHaveBeenCalledOnce();

        const unsigned = wallet.invoke.issueCredential.mock.calls[0][0];

        expect(unsigned['@context']).toHaveLength(2);
        expect(unsigned['@context'][0]).toBe('https://www.w3.org/ns/credentials/v2');
        expect(unsigned['@context'][1]).toHaveProperty('VerifiableData');
        expect(unsigned['@context'][1]).toHaveProperty('dataKey');
        expect(unsigned['@context'][1].dataPayload).toMatchObject({ '@type': '@json' });

        expect(unsigned.type).toEqual(['VerifiableCredential', 'VerifiableData']);
        expect(unsigned.issuer).toBe(TEST_DID);
        expect(unsigned.validFrom).toBeDefined();

        expect(unsigned.credentialSubject).toMatchObject({
            id: TEST_DID,
            dataKey: 'test-key',
            dataPayload: data,
        });
    });

    it('does not use OBv3 context or achievement fields', async () => {
        await saveVerifiableData(wallet as never, 'key', { foo: 'bar' });

        const unsigned = wallet.invoke.issueCredential.mock.calls[0][0];

        const contexts = unsigned['@context'].map((c: unknown) =>
            typeof c === 'string' ? c : '__inline__'
        );
        expect(contexts).not.toContain('https://purl.imsglobal.org/spec/ob/v3p0/context.json');
        expect(contexts).not.toContain('https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json');

        expect(unsigned.credentialSubject).not.toHaveProperty('achievement');
    });

    it('stores the signed credential via uploadEncrypted', async () => {
        await saveVerifiableData(wallet as never, 'key', { a: 1 });

        expect(wallet.store.LearnCloud.uploadEncrypted).toHaveBeenCalledOnce();

        const stored = wallet.store.LearnCloud.uploadEncrypted.mock.calls[0][0];
        expect(stored).toHaveProperty('proof');
    });

    it('indexes the credential with the correct metadata', async () => {
        const data = { goals: ['learn piano'] };

        await saveVerifiableData(wallet as never, 'my-goals', data);

        expect(wallet.index.LearnCloud.add).toHaveBeenCalledOnce();

        const indexed = wallet.index.LearnCloud.add.mock.calls[0][0];

        expect(indexed.uri).toBe('lc:cloud:test-uri-123');
        expect(indexed.id).toBe('__verifiable_data_my-goals__');
        expect(indexed.category).toBe('VerifiableData');
        expect(indexed.title).toBe('VerifiableData: my-goals');
        expect(indexed.verifiableData).toEqual(data);
        expect(indexed.issuanceDate).toBeDefined();
    });

    it('uses a custom category when provided', async () => {
        await saveVerifiableData(wallet as never, 'key', {}, { category: 'CustomCategory' });

        const indexed = wallet.index.LearnCloud.add.mock.calls[0][0];
        expect(indexed.category).toBe('CustomCategory');
    });

    it('uses the credential validFrom as the index issuanceDate', async () => {
        await saveVerifiableData(wallet as never, 'key', {});

        const unsigned = wallet.invoke.issueCredential.mock.calls[0][0];
        const indexed = wallet.index.LearnCloud.add.mock.calls[0][0];

        expect(indexed.issuanceDate).toBe(unsigned.validFrom);
    });

    it('returns the stored URI', async () => {
        const uri = await saveVerifiableData(wallet as never, 'key', {});

        expect(uri).toBe('lc:cloud:test-uri-123');
    });

    it('throws when uploadEncrypted returns falsy', async () => {
        wallet.store.LearnCloud.uploadEncrypted.mockResolvedValueOnce(null);

        await expect(
            saveVerifiableData(wallet as never, 'key', {})
        ).rejects.toThrow('Failed to store verifiable data credential.');
    });

    // --- Update vs Add ---

    it('uses index.update when a record already exists', async () => {
        wallet.index.LearnCloud.get.mockResolvedValueOnce([
            { id: '__verifiable_data_key__', uri: 'old-uri' },
        ]);

        await saveVerifiableData(wallet as never, 'key', { updated: true });

        expect(wallet.index.LearnCloud.update).toHaveBeenCalledOnce();
        expect(wallet.index.LearnCloud.add).not.toHaveBeenCalled();

        const [id, updates] = wallet.index.LearnCloud.update.mock.calls[0];
        expect(id).toBe('__verifiable_data_key__');
        expect(updates.uri).toBe('lc:cloud:test-uri-123');
        expect(updates.verifiableData).toEqual({ updated: true });
    });

    it('uses index.add when no record exists yet', async () => {
        wallet.index.LearnCloud.get.mockResolvedValueOnce([]);

        await saveVerifiableData(wallet as never, 'key', { fresh: true });

        expect(wallet.index.LearnCloud.add).toHaveBeenCalledOnce();
        expect(wallet.index.LearnCloud.update).not.toHaveBeenCalled();
    });

    it('does not call remove during save', async () => {
        wallet.index.LearnCloud.get.mockResolvedValueOnce([
            { id: '__verifiable_data_key__', uri: 'old-uri' },
        ]);

        await saveVerifiableData(wallet as never, 'key', {});

        expect(wallet.index.LearnCloud.remove).not.toHaveBeenCalled();
    });

    // --- name / description ---

    it('includes name on the credential when provided', async () => {
        await saveVerifiableData(wallet as never, 'goals', { g: 1 }, {
            name: 'Career Goals',
        });

        const unsigned = wallet.invoke.issueCredential.mock.calls[0][0];
        expect(unsigned.name).toBe('Career Goals');
        expect(unsigned.description).toBeUndefined();
    });

    it('includes description on the credential when provided', async () => {
        await saveVerifiableData(wallet as never, 'goals', { g: 1 }, {
            description: 'Self-reported career goals',
        });

        const unsigned = wallet.invoke.issueCredential.mock.calls[0][0];
        expect(unsigned.description).toBe('Self-reported career goals');
        expect(unsigned.name).toBeUndefined();
    });

    it('includes both name and description when provided', async () => {
        await saveVerifiableData(wallet as never, 'salary', { s: 50000 }, {
            name: 'Salary Info',
            description: 'Current salary data',
        });

        const unsigned = wallet.invoke.issueCredential.mock.calls[0][0];
        expect(unsigned.name).toBe('Salary Info');
        expect(unsigned.description).toBe('Current salary data');
    });

    it('omits name and description from credential when not provided', async () => {
        await saveVerifiableData(wallet as never, 'key', {});

        const unsigned = wallet.invoke.issueCredential.mock.calls[0][0];
        expect(unsigned).not.toHaveProperty('name');
        expect(unsigned).not.toHaveProperty('description');
    });

    // --- Data types ---

    it('preserves nested objects in the dataPayload', async () => {
        const data = {
            lifetimeExperience: { years: 5, months: 3 },
            goals: ['a', 'b'],
        };

        await saveVerifiableData(wallet as never, 'profile', data);

        const unsigned = wallet.invoke.issueCredential.mock.calls[0][0];
        expect(unsigned.credentialSubject.dataPayload).toEqual(data);

        const indexed = wallet.index.LearnCloud.add.mock.calls[0][0];
        expect(indexed.verifiableData).toEqual(data);
    });

    it('handles null values in data', async () => {
        const data = { workLifeBalance: null, jobStability: 'great' };

        await saveVerifiableData(wallet as never, 'satisfaction', data);

        const unsigned = wallet.invoke.issueCredential.mock.calls[0][0];
        expect(unsigned.credentialSubject.dataPayload).toEqual(data);
    });
});

// ---------------------------------------------------------------------------
// Tests — getVerifiableDataForKey
// ---------------------------------------------------------------------------

describe('getVerifiableDataForKey', () => {
    let wallet: MockWallet;

    beforeEach(() => {
        vi.clearAllMocks();
        wallet = createMockWallet();
    });

    it('returns data from the index record (fast path)', async () => {
        const storedData = { salary: '80000', salaryType: 'per_year' };

        wallet.index.LearnCloud.get.mockResolvedValueOnce([
            {
                id: '__verifiable_data_salary__',
                uri: 'lc:cloud:abc',
                verifiableData: storedData,
                issuanceDate: '2025-01-01T00:00:00Z',
            },
        ]);

        const result = await getVerifiableDataForKey(wallet as never, 'salary');

        expect(result).toEqual(storedData);
        expect(wallet.read.get).not.toHaveBeenCalled();
    });

    it('returns undefined when no records exist', async () => {
        wallet.index.LearnCloud.get.mockResolvedValueOnce([]);

        const result = await getVerifiableDataForKey(wallet as never, 'nonexistent');

        expect(result).toBeUndefined();
    });

    it('queries with the correct index ID format', async () => {
        wallet.index.LearnCloud.get.mockResolvedValueOnce([]);

        await getVerifiableDataForKey(wallet as never, 'my-key');

        expect(wallet.index.LearnCloud.get).toHaveBeenCalledWith({
            id: '__verifiable_data_my-key__',
        });
    });

    // --- Fallback path ---

    it('falls back to reading credential dataPayload when index has no verifiableData', async () => {
        wallet.index.LearnCloud.get.mockResolvedValueOnce([
            {
                id: '__verifiable_data_goals__',
                uri: 'lc:cloud:def',
                // no verifiableData field
            },
        ]);

        wallet.read.get.mockResolvedValueOnce({
            credentialSubject: {
                id: TEST_DID,
                dataKey: 'goals',
                dataPayload: { goals: ['learn rust'] },
            },
            validFrom: '2025-06-01T00:00:00Z',
        });

        const result = await getVerifiableDataForKey(wallet as never, 'goals');

        expect(result).toEqual({ goals: ['learn rust'] });
        expect(wallet.read.get).toHaveBeenCalledWith('lc:cloud:def');
    });

    it('handles array credentialSubject in fallback path', async () => {
        wallet.index.LearnCloud.get.mockResolvedValueOnce([
            { id: '__verifiable_data_k__', uri: 'lc:cloud:arr' },
        ]);

        wallet.read.get.mockResolvedValueOnce({
            credentialSubject: [
                { id: TEST_DID, dataKey: 'k', dataPayload: { x: 42 } },
            ],
            validFrom: '2025-01-01T00:00:00Z',
        });

        const result = await getVerifiableDataForKey(wallet as never, 'k');

        expect(result).toEqual({ x: 42 });
    });

    it('returns undefined when fallback credential has no dataPayload', async () => {
        wallet.index.LearnCloud.get.mockResolvedValueOnce([
            { id: '__verifiable_data_empty__', uri: 'lc:cloud:empty' },
        ]);

        wallet.read.get.mockResolvedValueOnce({
            credentialSubject: { id: TEST_DID },
        });

        const result = await getVerifiableDataForKey(wallet as never, 'empty');

        expect(result).toBeUndefined();
    });

    it('returns undefined when fallback read throws', async () => {
        wallet.index.LearnCloud.get.mockResolvedValueOnce([
            { id: '__verifiable_data_err__', uri: 'lc:cloud:broken' },
        ]);

        wallet.read.get.mockRejectedValueOnce(new Error('network error'));

        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const result = await getVerifiableDataForKey(wallet as never, 'err');

        expect(result).toBeUndefined();
        expect(warnSpy).toHaveBeenCalledOnce();

        warnSpy.mockRestore();
    });

    it('returns undefined when index record has uri but no verifiableData and credential is null', async () => {
        wallet.index.LearnCloud.get.mockResolvedValueOnce([
            { id: '__verifiable_data_null__', uri: 'lc:cloud:null' },
        ]);

        wallet.read.get.mockResolvedValueOnce(null);

        const result = await getVerifiableDataForKey(wallet as never, 'null');

        expect(result).toBeUndefined();
    });
});

// ---------------------------------------------------------------------------
// Tests — round-trip (save then read)
// ---------------------------------------------------------------------------

describe('save → read round-trip', () => {
    it('data saved via saveVerifiableData is retrievable via getVerifiableDataForKey', async () => {
        type TestData = { goals: string[]; priority: number };
        const data: TestData = { goals: ['ship it'], priority: 1 };

        let storedRecord: Record<string, unknown> | null = null;

        const wallet = createMockWallet();

        wallet.index.LearnCloud.add.mockImplementation(async (record: Record<string, unknown>) => {
            storedRecord = record;
        });

        // Save
        await saveVerifiableData(wallet as never, 'round-trip', data);

        expect(storedRecord).not.toBeNull();

        // Read — simulate the index returning what was stored
        wallet.index.LearnCloud.get.mockResolvedValueOnce([storedRecord]);

        const result = await getVerifiableDataForKey<TestData>(wallet as never, 'round-trip');

        expect(result).toEqual(data);
    });
});

// ---------------------------------------------------------------------------
// Tests — index key format
// ---------------------------------------------------------------------------

describe('index key format', () => {
    let wallet: MockWallet;

    beforeEach(() => {
        vi.clearAllMocks();
        wallet = createMockWallet();
    });

    it('different keys produce different index IDs', async () => {
        await saveVerifiableData(wallet as never, 'key-a', { a: 1 });
        await saveVerifiableData(wallet as never, 'key-b', { b: 2 });

        const idA = wallet.index.LearnCloud.add.mock.calls[0][0].id;
        const idB = wallet.index.LearnCloud.add.mock.calls[1][0].id;

        expect(idA).toBe('__verifiable_data_key-a__');
        expect(idB).toBe('__verifiable_data_key-b__');
        expect(idA).not.toBe(idB);
    });
});

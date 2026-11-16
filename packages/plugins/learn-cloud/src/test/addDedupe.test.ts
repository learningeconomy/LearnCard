import { vi } from 'vitest';

const mockGetClient = vi.fn();
vi.mock('@learncard/learn-cloud-client', () => ({
    getClient: (...args: unknown[]) => mockGetClient(...args),
}));

import { getLearnCloudPlugin } from '../';

type Row = { id: string; fields: string[]; encryptedRecord: Record<string, unknown> };
type Filter = { fields?: { $in?: string[]; $nin?: string[] } };

/**
 * A LearnCloud index that stores rows the way the service does (hashed id, hashed `fields`,
 * the record as the "encrypted" payload) and counts with Mongo's array rules for `fields`.
 */
const makeIndex = () => {
    const rows: Row[] = [];
    const matches = (row: Row, filter: Filter = {}) => {
        const { $in, $nin } = filter.fields ?? {};
        if ($in && !$in.some(hash => row.fields.includes(hash))) return false;
        if ($nin && $nin.some(hash => row.fields.includes(hash))) return false;
        return true;
    };
    const count = vi.fn(
        async ({ query }: { query?: Filter }) => rows.filter(row => matches(row, query)).length
    );
    const add = vi.fn(async ({ record }: { record: Row }) => {
        rows.push(record);
        return true;
    });
    const client = {
        utilities: { getDid: { query: vi.fn().mockResolvedValue('did:key:z6MkLearnCloud') } },
        index: { count: { query: count }, add: { mutate: add } },
    };
    return { rows, count, add, client };
};

const learnCard = {
    id: { did: () => 'did:key:z6MkHolder' },
    invoke: {
        getDidAuthVp: vi.fn().mockResolvedValue('did-auth-jwt'),
        createDagJwe: vi.fn(async (value: unknown) => value),
        decryptDagJwe: vi.fn(async (value: unknown) => value),
        hash: vi.fn(async (value: string) => `h(${value})`),
        crypto: () => ({ randomUUID: () => Math.random().toString(36).slice(2) }),
    },
    debug: vi.fn(),
};

const setup = async () => {
    const index = makeIndex();
    mockGetClient.mockResolvedValue(index.client);
    const plugin = await getLearnCloudPlugin(learnCard as never, 'https://cloud.example');
    const add = (record: Record<string, unknown>) =>
        plugin.index.add(learnCard as never, record as never);
    return { ...index, add };
};

describe('LearnCloud index.add blocks duplicate uris (LC-2413)', () => {
    beforeEach(() => vi.clearAllMocks());

    it('adding the same uri twice leaves one row, and the second add reports stored', async () => {
        const { rows, add, count } = await setup();

        expect(await add({ id: 'a', uri: 'lc:cloud:1', category: 'Achievement' })).toBe(true);
        expect(await add({ id: 'b', uri: 'lc:cloud:1', category: 'Achievement' })).toBe(true);

        expect(rows).toHaveLength(1);
        expect(rows[0]!.encryptedRecord).toMatchObject({ id: 'a', uri: 'lc:cloud:1' });
        // One lookup per add, by the same uri field hash the stored row carries.
        expect(count).toHaveBeenCalledTimes(2);
        expect(count.mock.calls[1]![0].query).toEqual({
            fields: { $in: ['h(uri:"lc:cloud:1")'] },
        });
        expect(rows[0]!.fields).toContain('h(uri:"lc:cloud:1")');
    });

    it('different uris are both added', async () => {
        const { rows, add } = await setup();

        await add({ id: 'a', uri: 'lc:cloud:1' });
        await add({ id: 'b', uri: 'lc:cloud:2' });

        expect(rows).toHaveLength(2);
    });

    it('a failed lookup still adds, as before', async () => {
        const { rows, add, count } = await setup();
        count.mockRejectedValueOnce(new Error('index.count blocked'));

        expect(await add({ id: 'a', uri: 'lc:cloud:1' })).toBe(true);

        expect(rows).toHaveLength(1);
    });
});

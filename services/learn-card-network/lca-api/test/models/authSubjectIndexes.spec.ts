import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const collection = vi.hoisted(() => ({
    indexes: vi.fn(),
    dropIndex: vi.fn(async () => undefined),
    createIndex: vi.fn(async () => 'index'),
    findOneAndUpdate: vi.fn(),
}));

vi.mock('@mongo', () => ({ default: { collection: () => collection } }));

const createAuthSubjectIndexes = async (): Promise<void> => {
    const model = await import('../../src/models/AuthSubject');
    await model.createAuthSubjectIndexes();
};

beforeEach(() => {
    vi.resetModules();
    collection.indexes.mockReset().mockResolvedValue([{ name: '_id_', key: { _id: 1 } }]);
    collection.dropIndex.mockReset().mockResolvedValue(undefined);
    collection.createIndex.mockReset().mockResolvedValue('index');
    collection.findOneAndUpdate.mockReset().mockResolvedValue({ subject: 'subject' });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => vi.restoreAllMocks());

describe('createAuthSubjectIndexes', () => {
    it('indexes subject without uniqueness so linked sign-in methods can share it', async () => {
        await createAuthSubjectIndexes();

        expect(collection.createIndex).toHaveBeenCalledWith({ subject: 1 });
        expect(collection.createIndex).not.toHaveBeenCalledWith(
            { subject: 1 },
            expect.objectContaining({ unique: true })
        );
    });

    it('keeps identityKey unique', async () => {
        await createAuthSubjectIndexes();

        expect(collection.createIndex).toHaveBeenCalledWith({ identityKey: 1 }, { unique: true });
    });

    it('drops a pre-existing unique subject index before recreating it', async () => {
        collection.indexes.mockResolvedValue([
            { name: '_id_', key: { _id: 1 } },
            { name: 'subject_1', key: { subject: 1 }, unique: true },
        ]);

        await createAuthSubjectIndexes();

        expect(collection.dropIndex).toHaveBeenCalledWith('subject_1');
        expect(collection.dropIndex.mock.invocationCallOrder[0]).toBeLessThan(
            collection.createIndex.mock.invocationCallOrder[0] ?? Infinity
        );
    });

    it('leaves a non-unique subject index alone', async () => {
        collection.indexes.mockResolvedValue([{ name: 'subject_1', key: { subject: 1 } }]);

        await createAuthSubjectIndexes();

        expect(collection.dropIndex).not.toHaveBeenCalled();
    });

    it('treats a missing collection as having no indexes', async () => {
        collection.indexes.mockRejectedValue(Object.assign(new Error('ns'), { code: 26 }));

        await createAuthSubjectIndexes();

        expect(collection.createIndex).toHaveBeenCalledTimes(2);
    });

    it('tolerates the legacy index disappearing concurrently', async () => {
        collection.indexes.mockResolvedValue([
            { name: 'subject_1', key: { subject: 1 }, unique: true },
        ]);
        collection.dropIndex.mockRejectedValueOnce(Object.assign(new Error('gone'), { code: 27 }));

        await expect(createAuthSubjectIndexes()).resolves.toBeUndefined();
    });
});

describe('AuthSubject index readiness', () => {
    it.each(['subject', 'identityKey'])(
        'rejects all waiters when %s indexing fails, then retries',
        async failedIndex => {
            const { createIndex, findOneAndUpdate } = collection;
            const { ensureAuthSubjectIndexes, getOrCreateAuthSubject } =
                await import('../../src/models/AuthSubject');
            const failure = new Error('index unavailable');
            let rejectIndex!: (error: Error) => void;
            const pendingIndex = new Promise<string>((_resolve, reject) => {
                rejectIndex = reject;
            });
            if (failedIndex === 'identityKey') createIndex.mockResolvedValueOnce('subject');
            createIndex.mockImplementationOnce(() => pendingIndex);

            const ready = ensureAuthSubjectIndexes();
            expect(ensureAuthSubjectIndexes()).toBe(ready);
            const waiters = Promise.allSettled([
                ready,
                getOrCreateAuthSubject('email:test@example.com', { emailVerified: true }),
                getOrCreateAuthSubject('email:test@example.com', { emailVerified: true }),
            ]);
            rejectIndex(failure);
            expect(await waiters).toEqual(
                Array.from({ length: 3 }, () => ({ status: 'rejected', reason: failure }))
            );
            expect(findOneAndUpdate).not.toHaveBeenCalled();

            createIndex.mockClear();
            const completed: string[] = [];
            createIndex.mockImplementation(async (key: Record<string, number>) => {
                completed.push(Object.keys(key)[0]!);
                return 'index';
            });
            findOneAndUpdate.mockImplementation(async () => {
                expect(completed).toEqual(['subject', 'identityKey']);
                return { subject: 'subject' };
            });
            await getOrCreateAuthSubject('email:test@example.com', { emailVerified: true });
            expect(createIndex.mock.calls).toEqual([
                [{ subject: 1 }],
                [{ identityKey: 1 }, { unique: true }],
            ]);
            expect(findOneAndUpdate).toHaveBeenCalledOnce();
            await ensureAuthSubjectIndexes();
            expect(createIndex).toHaveBeenCalledTimes(2);
        }
    );
});

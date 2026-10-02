import { beforeEach, describe, expect, it, vi } from 'vitest';

const collection = vi.hoisted(() => ({
    indexes: vi.fn(),
    dropIndex: vi.fn(async () => undefined),
    createIndex: vi.fn(async () => 'index'),
}));

vi.mock('@mongo', () => ({ default: { collection: () => collection } }));

import { createAuthSubjectIndexes } from '../../src/models/AuthSubject';

describe('createAuthSubjectIndexes', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        collection.indexes.mockResolvedValue([{ name: '_id_', key: { _id: 1 } }]);
    });

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

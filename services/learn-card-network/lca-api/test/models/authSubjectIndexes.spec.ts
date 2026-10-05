import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { createIndex, findOneAndUpdate } = vi.hoisted(() => ({
    createIndex: vi.fn(),
    findOneAndUpdate: vi.fn(),
}));
vi.mock('@mongo', () => ({
    default: { collection: () => ({ createIndex, findOneAndUpdate }) },
}));

beforeEach(() => {
    vi.resetModules();
    createIndex.mockReset().mockResolvedValue('index');
    findOneAndUpdate.mockReset().mockResolvedValue({ subject: 'subject' });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => vi.restoreAllMocks());

describe('AuthSubject index readiness', () => {
    it.each(['subject', 'identityKey'])(
        'rejects all waiters when %s indexing fails, then retries',
        async failedIndex => {
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
                [{ subject: 1 }, { unique: true }],
                [{ identityKey: 1 }, { unique: true }],
            ]);
            expect(findOneAndUpdate).toHaveBeenCalledOnce();
            await ensureAuthSubjectIndexes();
            expect(createIndex).toHaveBeenCalledTimes(2);
        }
    );
});

import { describe, expect, it, vi } from 'vitest';
import { readCurrentAccountIndex, type NativeAccountIndex } from './accountReads';

describe('current native account index', () => {
    it('reads every page without cache and retains the index receiver', async () => {
        const index: NativeAccountIndex = {
            get: vi.fn(),
            getPage: vi.fn(async function (
                this: NativeAccountIndex,
                _query?: undefined,
                pagination?: { cursor?: string; limit?: number }
            ) {
                expect(this).toBe(index);
                return pagination?.cursor
                    ? { records: [{ uri: 'remaining' }], hasMore: false }
                    : { records: [{ uri: 'first' }], hasMore: true, cursor: 'next' };
            }),
        };
        expect(await readCurrentAccountIndex(index)).toEqual([
            { uri: 'first' },
            { uri: 'remaining' },
        ]);
        expect(index.get).not.toHaveBeenCalled();
        expect(index.getPage).toHaveBeenNthCalledWith(
            1,
            undefined,
            { limit: 100, cursor: undefined },
            { cache: 'skip-cache' }
        );
        expect(index.getPage).toHaveBeenNthCalledWith(
            2,
            undefined,
            { limit: 100, cursor: 'next' },
            { cache: 'skip-cache' }
        );
    });

    it.each([undefined, 'repeated'])(
        'rejects incomplete pagination with cursor %s',
        async cursor => {
            const index: NativeAccountIndex = {
                get: vi.fn(),
                getPage: vi.fn(async () => ({
                    records: [{ uri: 'partial' }],
                    hasMore: true,
                    cursor,
                })),
            };
            await expect(readCurrentAccountIndex(index)).rejects.toThrow(
                'Account index incomplete'
            );
        }
    );

    it('does not return a partial index when a later page fails', async () => {
        const index: NativeAccountIndex = {
            get: vi.fn(),
            getPage: vi
                .fn()
                .mockResolvedValueOnce({
                    records: [{ uri: 'partial' }],
                    hasMore: true,
                    cursor: 'next',
                })
                .mockRejectedValue(new Error('Offline')),
        };
        await expect(readCurrentAccountIndex(index)).rejects.toThrow('Offline');
    });
});

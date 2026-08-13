import { describe, it, expect, vi, beforeEach } from 'vitest';

import axios from 'axios';
import cache from '@cache';

import { resolveLocaleByEmail } from './locale.helpers';

vi.mock('axios');
vi.mock('@cache', () => ({
    default: {
        get: vi.fn(),
        set: vi.fn(),
    },
}));

const mockedPost = vi.mocked(axios.post);
const mockedGet = vi.mocked(cache.get);
const mockedSet = vi.mocked(cache.set);

describe('resolveLocaleByEmail', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockedGet.mockResolvedValue(null); // default: cache miss
        mockedSet.mockResolvedValue('OK');
    });

    it('returns the cached locale without calling brain-service (cache hit)', async () => {
        mockedGet.mockResolvedValueOnce('es');

        await expect(resolveLocaleByEmail('jane@example.com')).resolves.toBe('es');
        expect(mockedPost).not.toHaveBeenCalled();
    });

    it('treats a negatively-cached empty string as "no preference" (undefined, no call)', async () => {
        mockedGet.mockResolvedValueOnce('');

        await expect(resolveLocaleByEmail('jane@example.com')).resolves.toBeUndefined();
        expect(mockedPost).not.toHaveBeenCalled();
    });

    it('fetches from brain-service on a miss and caches the resolved locale', async () => {
        mockedPost.mockResolvedValueOnce({ data: { locale: 'es' } } as any);

        await expect(resolveLocaleByEmail('Jane@Example.com')).resolves.toBe('es');

        expect(mockedPost).toHaveBeenCalledWith(
            expect.stringContaining('/utilities/resolve-email-locale'),
            { email: 'Jane@Example.com' },
            expect.objectContaining({ timeout: expect.any(Number) })
        );
        // Key is normalized to lower-case; resolved value is cached with a TTL.
        expect(mockedSet).toHaveBeenCalledWith(
            'email-locale:jane@example.com',
            'es',
            expect.any(Number)
        );
    });

    it('negatively caches "no preference" (brain-service returns null) as empty string', async () => {
        mockedPost.mockResolvedValueOnce({ data: { locale: null } } as any);

        await expect(resolveLocaleByEmail('jane@example.com')).resolves.toBeUndefined();
        expect(mockedSet).toHaveBeenCalledWith(
            'email-locale:jane@example.com',
            '',
            expect.any(Number)
        );
    });

    it('returns undefined and does NOT cache on lookup failure (login must not block)', async () => {
        mockedPost.mockRejectedValueOnce(new Error('ETIMEDOUT'));

        await expect(resolveLocaleByEmail('jane@example.com')).resolves.toBeUndefined();
        expect(mockedSet).not.toHaveBeenCalled();
    });
});

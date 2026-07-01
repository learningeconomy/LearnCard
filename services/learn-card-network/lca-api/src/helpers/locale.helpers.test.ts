import { describe, it, expect, vi, beforeEach } from 'vitest';

import axios from 'axios';

import { resolveLocaleByEmail } from './locale.helpers';

vi.mock('axios');
const mockedPost = vi.mocked(axios.post);

describe('resolveLocaleByEmail', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns the locale brain-service resolves for the email', async () => {
        mockedPost.mockResolvedValueOnce({ data: { locale: 'es' } } as any);

        await expect(resolveLocaleByEmail('jane@example.com')).resolves.toBe('es');

        expect(mockedPost).toHaveBeenCalledWith(
            expect.stringContaining('/utilities/resolve-email-locale'),
            { email: 'jane@example.com' },
            expect.objectContaining({ timeout: expect.any(Number) })
        );
    });

    it('returns undefined (not empty string) when brain-service returns no locale', async () => {
        mockedPost.mockResolvedValueOnce({ data: {} } as any);

        await expect(resolveLocaleByEmail('jane@example.com')).resolves.toBeUndefined();
    });

    it('returns undefined on network/timeout error (never throws — login must not block)', async () => {
        mockedPost.mockRejectedValueOnce(new Error('ETIMEDOUT'));

        await expect(resolveLocaleByEmail('jane@example.com')).resolves.toBeUndefined();
    });
});

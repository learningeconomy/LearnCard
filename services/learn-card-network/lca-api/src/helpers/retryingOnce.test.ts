import { describe, expect, it, vi } from 'vitest';

import { createRetryingOnce } from './retryingOnce';

describe('createRetryingOnce', () => {
    it('runs the task once and shares the result', async () => {
        const task = vi.fn().mockResolvedValue('ready');
        const ensure = createRetryingOnce(task);

        await expect(Promise.all([ensure(), ensure()])).resolves.toEqual(['ready', 'ready']);
        await expect(ensure()).resolves.toBe('ready');
        expect(task).toHaveBeenCalledTimes(1);
    });

    it('shares an in-flight failure, then retries on the next call', async () => {
        const task = vi
            .fn()
            .mockRejectedValueOnce(new Error('Escrow hold index initialization failed'))
            .mockResolvedValue('ready');
        const ensure = createRetryingOnce(task);

        const first = ensure();
        const concurrent = ensure();
        await expect(first).rejects.toThrow('Escrow hold index initialization failed');
        await expect(concurrent).rejects.toThrow('Escrow hold index initialization failed');
        expect(task).toHaveBeenCalledTimes(1);

        await expect(ensure()).resolves.toBe('ready');
        expect(task).toHaveBeenCalledTimes(2);
        await expect(ensure()).resolves.toBe('ready');
        expect(task).toHaveBeenCalledTimes(2);
    });
});

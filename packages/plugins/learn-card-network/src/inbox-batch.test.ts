import { afterEach, describe, expect, it, vi } from 'vitest';
import type { InboxBatchStatus } from '@learncard/types';
import { waitForInboxCredentialBatch } from './inbox-batch';

const status = (done: boolean): InboxBatchStatus => ({
    batchId: 'batch',
    createdAt: '2026-01-01',
    done,
    status: 'NEEDS_RECONCILIATION',
    items: [],
    summary: {
        total: 2,
        succeeded: 0,
        failed: 0,
        deduplicated: 0,
        completed: done ? 2 : 1,
        pending: done ? 0 : 1,
        unconfirmed: done ? 2 : 1,
    },
});

afterEach(() => vi.useRealTimers());

describe('waitForInboxCredentialBatch', () => {
    it('waits for done, reports progress, and backs off even when reconciliation is present', async () => {
        vi.useFakeTimers();
        const read = vi
            .fn()
            .mockResolvedValueOnce(status(false))
            .mockResolvedValueOnce(status(false))
            .mockResolvedValue(status(true));
        const onProgress = vi.fn();
        const waiting = waitForInboxCredentialBatch('batch', read, { intervalMs: 100, onProgress });
        await vi.advanceTimersByTimeAsync(0);
        expect(read).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(100);
        expect(read).toHaveBeenCalledTimes(2);
        await vi.advanceTimersByTimeAsync(149);
        expect(read).toHaveBeenCalledTimes(2);
        await vi.advanceTimersByTimeAsync(1);
        expect(await waiting).toEqual(status(true));
        expect(onProgress).toHaveBeenCalledTimes(3);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('enforces a deadline even if the transport never resolves', async () => {
        vi.useFakeTimers();
        const read = vi.fn((_signal: AbortSignal) => new Promise<InboxBatchStatus>(() => {}));
        const waiting = waitForInboxCredentialBatch('batch', read, { timeoutMs: 50 });
        const assertion = expect(waiting).rejects.toMatchObject({
            name: 'TimeoutError',
            batchId: 'batch',
            message: expect.stringContaining('batchId: batch'),
        });
        await vi.advanceTimersByTimeAsync(50);
        await assertion;
        expect(read.mock.calls[0]?.[0]?.aborted).toBe(true);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('aborts a delay without polling again', async () => {
        vi.useFakeTimers();
        const controller = new AbortController();
        const read = vi.fn().mockResolvedValue(status(false));
        const waiting = waitForInboxCredentialBatch('batch', read, { signal: controller.signal });
        const assertion = expect(waiting).rejects.toMatchObject({ name: 'AbortError' });
        await vi.advanceTimersByTimeAsync(0);
        controller.abort();
        await assertion;
        await vi.advanceTimersByTimeAsync(30_000);
        expect(read).toHaveBeenCalledTimes(1);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('does not fetch with an already aborted signal', async () => {
        const controller = new AbortController();
        controller.abort();
        const read = vi.fn();
        await expect(
            waitForInboxCredentialBatch('batch', read, { signal: controller.signal })
        ).rejects.toMatchObject({ name: 'AbortError' });
        expect(read).not.toHaveBeenCalled();
    });

    it('propagates fetch and progress errors without retrying submissions', async () => {
        const error = Object.assign(new Error('unauthorized'), { data: { httpStatus: 401 } });
        await expect(
            waitForInboxCredentialBatch('batch', vi.fn().mockRejectedValue(error))
        ).rejects.toMatchObject({ cause: error, batchId: 'batch' });
        await expect(
            waitForInboxCredentialBatch('batch', vi.fn().mockResolvedValue(status(true)), {
                onProgress: () => {
                    throw error;
                },
            })
        ).rejects.toMatchObject({ cause: error, batchId: 'batch' });
    });

    it.each([
        new TypeError('network unavailable'),
        Object.assign(new Error('unavailable'), { data: { httpStatus: 503 } }),
        Object.assign(new Error('throttled'), { data: { code: 'TOO_MANY_REQUESTS' } }),
    ])('retries transient reads within the original deadline: %s', async error => {
        vi.useFakeTimers();
        const read = vi.fn().mockRejectedValueOnce(error).mockResolvedValue(status(true));
        const waiting = waitForInboxCredentialBatch('batch', read, { intervalMs: 100 });
        await vi.advanceTimersByTimeAsync(100);
        expect(await waiting).toEqual(status(true));
        expect(read).toHaveBeenCalledTimes(2);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('stops repeated read failures at the deadline and retains the batch ID', async () => {
        vi.useFakeTimers();
        const read = vi.fn().mockRejectedValue(new TypeError('offline'));
        const waiting = waitForInboxCredentialBatch('batch', read, {
            timeoutMs: 250,
            intervalMs: 100,
        });
        const assertion = expect(waiting).rejects.toMatchObject({
            name: 'TimeoutError',
            batchId: 'batch',
        });
        await vi.advanceTimersByTimeAsync(250);
        await assertion;
        expect(read).toHaveBeenCalledTimes(2);
        expect(vi.getTimerCount()).toBe(0);
    });

    it.each([0, -1, NaN, Infinity])('rejects invalid timer duration %s', async duration => {
        const read = vi.fn();
        await expect(
            waitForInboxCredentialBatch('batch', read, { timeoutMs: duration })
        ).rejects.toBeInstanceOf(RangeError);
        await expect(
            waitForInboxCredentialBatch('batch', read, { intervalMs: duration })
        ).rejects.toBeInstanceOf(RangeError);
        expect(read).not.toHaveBeenCalled();
    });
});

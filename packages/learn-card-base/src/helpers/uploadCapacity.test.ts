import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { waitForUploadCapacity } from './uploadCapacity';

const busy = (status = 503, code = 'upload_capacity_exceeded', retryAfter?: string) =>
    Response.json(
        { code },
        { status, headers: retryAfter === undefined ? {} : { 'Retry-After': retryAfter } }
    );
beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
});
afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

it.each([
    [503, 'upload_capacity_exceeded'],
    [429, 'upload_in_progress'],
])('waits for %s admission rejection, then succeeds', async (status, code) => {
    const send = vi
        .fn()
        .mockResolvedValueOnce(busy(status as number, code as string, '5'))
        .mockResolvedValue(Response.json({ ok: true }));
    const waiting = vi.fn();
    const pending = waitForUploadCapacity(send, { onWaiting: waiting });
    await vi.advanceTimersByTimeAsync(4999);
    expect(send).toHaveBeenCalledTimes(1);
    expect(waiting).toHaveBeenCalledWith(true);
    await vi.advanceTimersByTimeAsync(1);
    expect((await pending).ok).toBe(true);
    expect(send).toHaveBeenNthCalledWith(2, 1);
    expect(waiting).toHaveBeenLastCalledWith(false);
    expect(waiting.mock.calls).toEqual([[true], [false]]);
});

it('does not clear another waiting upload when this request is admitted immediately', async () => {
    const onWaiting = vi.fn();
    const send = vi
        .fn()
        .mockResolvedValueOnce(busy(503, 'upload_capacity_exceeded', '5'))
        .mockResolvedValue(Response.json({ ok: true }));
    const pending = waitForUploadCapacity(send, { onWaiting });
    await vi.advanceTimersByTimeAsync(0);
    expect(onWaiting.mock.calls).toEqual([[true]]);

    const admitted = await waitForUploadCapacity(async () => Response.json({ ok: true }), {
        onWaiting,
    });
    expect(admitted.ok).toBe(true);
    expect(onWaiting.mock.calls).toEqual([[true]]);
    await vi.runAllTimersAsync();
    expect((await pending).ok).toBe(true);
    expect(onWaiting.mock.calls).toEqual([[true], [false]]);
});

it.each([
    [503, 'MODEL_FAILED'],
    [503, 'request_capacity_exceeded'],
    [503, 'unknown'],
    [429, 'unknown'],
    [429, 'upload_capacity_exceeded'],
    [413, 'upload_body_too_large'],
    [403, 'CONSENT_DENIED'],
    [500, 'upload_capacity_exceeded'],
])('never retries processing errors or unrecognized rejection %s/%s', async (status, code) => {
    const response = busy(status as number, code as string, '1');
    const send = vi.fn().mockResolvedValue(response);
    expect(await waitForUploadCapacity(send)).toBe(response);
    expect(send).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
});

it('does not retry malformed errors or uncertain transport failures', async () => {
    const malformed = vi.fn().mockResolvedValue(new Response('unavailable', { status: 503 }));
    expect((await waitForUploadCapacity(malformed)).status).toBe(503);
    const error = new Error('synthetic transport failure');
    const send = vi.fn().mockRejectedValue(error);
    await expect(waitForUploadCapacity(send)).rejects.toBe(error);
    expect(send).toHaveBeenCalledTimes(1);
});

it('honors an HTTP-date Retry-After and adds only positive jitter', async () => {
    vi.setSystemTime(new Date('2026-10-21T12:00:00Z'));
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const send = vi
        .fn()
        .mockResolvedValueOnce(
            busy(503, 'upload_capacity_exceeded', 'Wed, 21 Oct 2026 12:00:05 GMT')
        )
        .mockResolvedValue(Response.json({ ok: true }));
    const pending = waitForUploadCapacity(send);
    await vi.advanceTimersByTimeAsync(5249);
    expect(send).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect((await pending).ok).toBe(true);
});

it('uses bounded backoff for a missing or invalid delay and gives up within two minutes', async () => {
    const send = vi.fn().mockImplementation(async () => busy());
    const pending = waitForUploadCapacity(send);
    await vi.runAllTimersAsync();
    expect((await pending).status).toBe(503);
    expect(send.mock.calls.length).toBeGreaterThan(1);
    expect(send.mock.calls.length).toBeLessThanOrEqual(25);
    expect(vi.getTimerCount()).toBe(0);
});

it('does not retry earlier than a Retry-After that exceeds the waiting budget', async () => {
    const send = vi.fn().mockResolvedValue(busy(503, 'upload_capacity_exceeded', '300'));
    expect((await waitForUploadCapacity(send)).status).toBe(503);
    expect(send).toHaveBeenCalledTimes(1);
});

it('keeps retry counts bounded even when the server requests immediate retries', async () => {
    const send = vi.fn().mockImplementation(async () => busy(503, 'upload_capacity_exceeded', '0'));
    const pending = waitForUploadCapacity(send);
    await vi.runAllTimersAsync();
    expect((await pending).status).toBe(503);
    expect(send).toHaveBeenCalledTimes(25);
});

it('stops without resending after a tab resumes beyond the waiting deadline', async () => {
    const send = vi.fn().mockResolvedValue(busy(503, 'upload_capacity_exceeded', '5'));
    const pending = waitForUploadCapacity(send);
    await vi.advanceTimersByTimeAsync(0);
    vi.setSystemTime(Date.now() + 180_000);
    await vi.runAllTimersAsync();
    expect((await pending).status).toBe(503);
    expect(send).toHaveBeenCalledTimes(1);
});

it.each(['signal', 'waitSignal'] as const)(
    'cancels waiting and removes its timer when %s aborts',
    async key => {
        const controller = new AbortController();
        const send = vi.fn().mockResolvedValue(busy(503, 'upload_capacity_exceeded', '5'));
        const waiting = vi.fn();
        const pending = waitForUploadCapacity(send, {
            [key]: controller.signal,
            onWaiting: waiting,
        });
        const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
        await vi.advanceTimersByTimeAsync(0);
        controller.abort();
        await rejected;
        await vi.runAllTimersAsync();
        expect(send).toHaveBeenCalledTimes(1);
        expect(waiting).toHaveBeenLastCalledWith(false);
        expect(waiting.mock.calls).toEqual([[true], [false]]);
        expect(vi.getTimerCount()).toBe(0);
    }
);

it('preserves an already-accepted result after the upload screen closes', async () => {
    const controller = new AbortController();
    let finish!: (response: Response) => void;
    const send = vi.fn().mockReturnValue(
        new Promise<Response>(resolve => {
            finish = resolve;
        })
    );
    const pending = waitForUploadCapacity(send, { waitSignal: controller.signal });
    controller.abort();
    finish(Response.json({ ok: true }));
    expect((await pending).ok).toBe(true);
});

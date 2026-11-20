import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { sendWithUploadReservation } from './uploadReservation';

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }));
vi.mock('./aiPassportAuth', () => ({ aiPassportFetch: fetchMock }));
const token = 'a'.repeat(43);
const options = () => ({
    url: 'https://synthetic.invalid/credentials/parse-file/reservations',
    did: 'did:example:a',
    signal: new AbortController().signal,
});
const reserved = (instanceId?: string) =>
    Response.json(
        {
            token,
            expiresAt: Date.now() + 15000,
            ...(instanceId ? { instanceId } : {}),
        },
        { status: 201 }
    );
const busy = () =>
    Response.json(
        { code: 'upload_capacity_exceeded' },
        {
            status: 503,
            headers: { 'Retry-After': '5' },
        }
    );
beforeEach(() => {
    fetchMock.mockReset();
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
});
afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
});

it('sends zero file bytes while busy and transfers one payload after reservation', async () => {
    fetchMock
        .mockResolvedValueOnce(busy())
        .mockResolvedValueOnce(busy())
        .mockResolvedValueOnce(reserved('7811619c1052d8'));
    const file = 'x'.repeat(5 * 1024 * 1024);
    const transfers: { body: string; headers: Record<string, string> }[] = [];
    const send = vi.fn(async headers => {
        transfers.push({ body: file, headers });
        return Response.json({ ok: true });
    });
    const onWaiting = vi.fn();
    const pending = sendWithUploadReservation(send, { ...options(), onWaiting });
    await vi.advanceTimersByTimeAsync(9999);
    expect(send).not.toHaveBeenCalled();
    await vi.runAllTimersAsync();
    expect((await pending).ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(
        fetchMock.mock.calls.every(
            ([url, init]) =>
                url.endsWith('/reservations') && init.method === 'POST' && init.body === undefined
        )
    ).toBe(true);
    expect(transfers.reduce((bytes, item) => bytes + item.body.length, 0)).toBe(file.length);
    expect(transfers[0].headers).toEqual({
        'X-Upload-Reservation': token,
        'fly-force-instance-id': '7811619c1052d8',
    });
    expect(onWaiting.mock.calls).toEqual([[true], [false]]);
});

it('never sends the file when capacity remains unavailable', async () => {
    fetchMock.mockImplementation(async () => busy());
    const send = vi.fn();
    const pending = sendWithUploadReservation(send, options());
    await vi.runAllTimersAsync();
    expect((await pending).status).toBe(503);
    expect(send).not.toHaveBeenCalled();
    expect(fetchMock.mock.calls.every(([, init]) => init.body === undefined)).toBe(true);
});

it.each([401, 403, 404, 500])(
    'fails closed on reservation HTTP %s without falling back to an upload',
    async status => {
        fetchMock.mockResolvedValueOnce(Response.json({ error: 'synthetic' }, { status }));
        const send = vi.fn();
        expect((await sendWithUploadReservation(send, options())).status).toBe(status);
        expect(send).not.toHaveBeenCalled();
        expect(fetchMock).toHaveBeenCalledTimes(1);
    }
);

it.each([
    { token: 'invalid', expiresAt: 123 },
    { token, expiresAt: 123, instanceId: 'https://untrusted.invalid' },
    { token },
])('does not transfer for a malformed reservation', async body => {
    fetchMock.mockResolvedValueOnce(Response.json(body, { status: 201 }));
    const send = vi.fn();
    await sendWithUploadReservation(send, options());
    expect(send).not.toHaveBeenCalled();
});

it('does not automatically resend a reserved upload rejected with 503', async () => {
    fetchMock
        .mockResolvedValueOnce(reserved())
        .mockResolvedValue(Response.json({ released: true }));
    const send = vi.fn(async () => busy());
    expect((await sendWithUploadReservation(send, options())).status).toBe(503);
    expect(send).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'DELETE', headers: { 'X-Upload-Reservation': token } }),
        'did:example:a'
    );
});

it('cancels during admission without transferring the file', async () => {
    const controller = new AbortController();
    fetchMock.mockResolvedValueOnce(busy());
    const send = vi.fn();
    const pending = sendWithUploadReservation(send, {
        ...options(),
        waitSignal: controller.signal,
    });
    const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    await vi.advanceTimersByTimeAsync(0);
    controller.abort();
    await rejected;
    expect(send).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
});

it('releases a reservation if cancelled after admission but before transfer', async () => {
    const controller = new AbortController();
    const response = reserved('7811619c1052d8');
    const clone = response.clone();
    vi.spyOn(response, 'clone').mockReturnValue(clone);
    const json = clone.json.bind(clone);
    vi.spyOn(clone, 'json').mockImplementation(async () => {
        const body = await json();
        controller.abort();
        return body;
    });
    fetchMock.mockResolvedValueOnce(response).mockResolvedValue(Response.json({ released: true }));
    const send = vi.fn();
    await expect(
        sendWithUploadReservation(send, { ...options(), waitSignal: controller.signal })
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(send).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({
            method: 'DELETE',
            headers: { 'X-Upload-Reservation': token, 'fly-force-instance-id': '7811619c1052d8' },
        }),
        'did:example:a'
    );
});

it('preserves accepted processing when the foreground wait is cancelled', async () => {
    fetchMock.mockResolvedValueOnce(reserved());
    const controller = new AbortController();
    const done = Promise.withResolvers<Response>();
    const entered = Promise.withResolvers<void>();
    const send = vi.fn(() => {
        entered.resolve();
        return done.promise;
    });
    const pending = sendWithUploadReservation(send, {
        ...options(),
        waitSignal: controller.signal,
    });
    await entered.promise;
    controller.abort();
    done.resolve(Response.json({ ok: true }));
    expect((await pending).ok).toBe(true);
    expect(send).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
});

it('keeps transport failures visible and attempts bounded best-effort release', async () => {
    fetchMock.mockResolvedValueOnce(reserved()).mockRejectedValue(new Error('cleanup unavailable'));
    const error = new TypeError('synthetic network failure');
    const send = vi.fn().mockRejectedValue(error);
    await expect(sendWithUploadReservation(send, options())).rejects.toBe(error);
    expect(send).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
});

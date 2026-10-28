import { createConnection } from 'node:net';
import { expect, mock, spyOn, test } from 'bun:test';
import { createUploadRequestGuard, UPLOAD_RESERVATION_HEADER } from './uploadRequest';
import { createHttpRequestBodyGuard } from './requestBody';

const respond = (data: unknown, status = 200) => Response.json(data, { status });
const reservationRequest = (method = 'POST', token?: string) =>
    new Request('http://localhost/credentials/parse-file/reservations', {
        method,
        headers: token ? { [UPLOAD_RESERVATION_HEADER]: token } : {},
    });
const upload = (
    token?: string,
    body = JSON.stringify({
        file: 'data:text/plain;base64,YQ==',
        fileType: 'resume',
    })
) =>
    new Request('http://localhost/credentials/parse-file', {
        method: 'POST',
        body,
        headers: token === undefined ? {} : { [UPLOAD_RESERVATION_HEADER]: token },
    });
const ok = async () => respond({ ok: true });
const reserve = async (guard: ReturnType<typeof createUploadRequestGuard>, did = 'a') => {
    const response = guard.reserve(reservationRequest(), did, respond);
    expect(response.status).toBe(201);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    return (await response.json()).token as string;
};

test('reservation holds the same global and owner slots as legacy uploads', async () => {
    const guard = createUploadRequestGuard({
        maxConcurrentUploads: 2,
        maxUploadsPerOwner: 1,
    });
    const token = await reserve(guard);
    expect(guard.reserve(reservationRequest(), 'a', respond).status).toBe(429);
    expect((await guard(upload(), 'a', respond, ok)).status).toBe(429);
    const second = await reserve(guard, 'b');
    expect(guard.reserve(reservationRequest(), 'c', respond).status).toBe(503);
    expect((await guard(upload(), 'c', respond, ok)).status).toBe(503);
    expect((await guard(upload(token), 'a', respond, ok)).status).toBe(200);
    guard.releaseReservation(reservationRequest('DELETE', second), 'b', respond);
    expect((await guard(upload(), 'c', respond, ok)).status).toBe(200);
});

test('reservation returns issuer affinity and is consumed only once by its owner', async () => {
    const guard = createUploadRequestGuard({ instanceId: '7811619c1052d8' });
    const response = guard.reserve(reservationRequest(), 'a', respond);
    const { token, expiresAt, instanceId } = await response.json();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(expiresAt).toBeGreaterThan(Date.now());
    expect(instanceId).toBe('7811619c1052d8');
    const operation = mock(ok);
    expect((await guard(upload(token), 'b', respond, operation)).status).toBe(409);
    guard.releaseReservation(reservationRequest('DELETE', token), 'b', respond);
    expect((await guard(upload(token), 'a', respond, operation)).status).toBe(200);
    expect((await guard(upload(token), 'a', respond, operation)).status).toBe(409);
    expect(operation).toHaveBeenCalledTimes(1);
});

test('abandoned reservations expire and return capacity', async () => {
    const guard = createUploadRequestGuard({
        maxConcurrentUploads: 1,
        maxUploadsPerOwner: 1,
        reservationTtlMs: 10,
    });
    const token = await reserve(guard);
    await Bun.sleep(25);
    expect((await guard(upload(token), 'a', respond, ok)).status).toBe(409);
    expect((await guard(upload(), 'b', respond, ok)).status).toBe(200);
});

test('expired deadlines are checked even before timer cleanup runs', async () => {
    const guard = createUploadRequestGuard({ reservationTtlMs: 1 });
    const token = await reserve(guard);
    const end = Date.now() + 5;
    while (Date.now() < end) {
        /* Hold the event loop past the lease deadline. */
    }
    expect((await guard(upload(token), 'a', respond, ok)).status).toBe(409);
});

test('release is idempotent and cannot release a consumed processing slot', async () => {
    const guard = createUploadRequestGuard({
        maxConcurrentUploads: 1,
        maxUploadsPerOwner: 1,
        reservationTtlMs: 10,
    });
    const token = await reserve(guard);
    const entered = Promise.withResolvers<void>();
    const done = Promise.withResolvers<void>();
    const pending = guard(upload(token), 'a', respond, async () => {
        entered.resolve();
        await done.promise;
        return ok();
    });
    await entered.promise;
    guard.releaseReservation(reservationRequest('DELETE', token), 'a', respond);
    await Bun.sleep(25);
    expect(guard.reserve(reservationRequest(), 'b', respond).status).toBe(503);
    done.resolve();
    expect((await pending).status).toBe(200);
    const next = await reserve(guard, 'b');
    guard.releaseReservation(reservationRequest('DELETE', next), 'b', respond);
    guard.releaseReservation(reservationRequest('DELETE', next), 'b', respond);
    expect((await guard(upload(), 'c', respond, ok)).status).toBe(200);
});

test('bad payloads and processing errors return a consumed reservation slot', async () => {
    const guard = createUploadRequestGuard({
        maxConcurrentUploads: 1,
        maxUploadsPerOwner: 1,
    });
    const first = await reserve(guard);
    expect((await guard(upload(first, '{}'), 'a', respond, ok)).status).toBe(400);
    const second = await reserve(guard);
    await expect(
        guard(upload(second), 'a', respond, async () => {
            throw new Error('synthetic');
        })
    ).rejects.toThrow('synthetic');
    expect((await guard(upload(), 'b', respond, ok)).status).toBe(200);
});

test('invalid tickets never read the upload body or fall back to legacy admission', async () => {
    const guard = createUploadRequestGuard();
    const req = upload('invalid');
    const reader = spyOn(req.body!, 'getReader');
    const operation = mock(ok);
    expect((await guard(req, 'a', respond, operation)).status).toBe(409);
    expect(reader).not.toHaveBeenCalled();
    reader.mockRestore();
    expect(operation).not.toHaveBeenCalled();
});

test('reservation endpoints reject request bodies and do not consume slots', async () => {
    const guard = createUploadRequestGuard({
        maxConcurrentUploads: 1,
        maxUploadsPerOwner: 1,
    });
    const http = createHttpRequestBodyGuard();
    const response = await http(
        new Request('http://localhost/credentials/parse-file/reservations', {
            method: 'POST',
            body: 'x',
            headers: { 'Content-Length': '1' },
        }),
        respond,
        async req => guard.reserve(req, 'a', respond)
    );
    expect(response.status).toBe(413);
    const token = await reserve(guard);
    guard.releaseReservation(reservationRequest('DELETE', token), 'a', respond);
});

test('real Bun ingress reserves without a body then uploads with authentication delay', async () => {
    const guard = createUploadRequestGuard({
        maxConcurrentUploads: 1,
        maxUploadsPerOwner: 1,
    });
    const http = createHttpRequestBodyGuard();
    const server = Bun.serve({
        hostname: '127.0.0.1',
        port: 0,
        fetch: req =>
            http(req, respond, async bounded => {
                await Bun.sleep(5);
                if (new URL(bounded.url).pathname.endsWith('/reservations'))
                    return guard.reserve(bounded, 'a', respond);
                return guard(bounded, 'a', respond, ok);
            }),
    });
    try {
        const response = await fetch(new URL('/credentials/parse-file/reservations', server.url), {
            method: 'POST',
        });
        expect(response.status).toBe(201);
        const { token } = await response.json();
        const body = JSON.stringify({
            file: 'data:text/plain;base64,YQ==',
            fileType: 'resume',
        });
        const result = await fetch(new URL('/credentials/parse-file', server.url), {
            method: 'POST',
            body,
            headers: { [UPLOAD_RESERVATION_HEADER]: token },
        });
        expect(result.status).toBe(200);
    } finally {
        server.stop(true);
    }
});

test('a ticket cannot be redeemed on a different process', async () => {
    const first = createUploadRequestGuard({ instanceId: '7811619c1052d8' });
    const second = createUploadRequestGuard({ instanceId: '48e62eea992d08' });
    const token = await reserve(first);
    expect((await second(upload(token), 'a', respond, ok)).status).toBe(409);
    expect((await first(upload(token), 'a', respond, ok)).status).toBe(200);
});

test.each([
    [{ 'Content-Length': String(6 * 1024 * 1024 + 1) }, 413],
    [{ 'Content-Encoding': 'gzip' }, 415],
    [{ 'Content-Length': 'invalid' }, 400],
] as const)(
    "early header rejection %j releases the owner's unused reservation",
    async (headers, status) => {
        const guard = createUploadRequestGuard({
            maxConcurrentUploads: 1,
            maxUploadsPerOwner: 1,
        });
        const token = await reserve(guard);
        const request = upload(token);
        for (const [key, value] of Object.entries(headers)) request.headers.set(key, value);
        const operation = mock(ok);
        expect((await guard(request, 'a', respond, operation)).status).toBe(status);
        expect(operation).not.toHaveBeenCalled();
        const replacement = await reserve(guard, 'b');
        expect((await guard(upload(token), 'a', respond, ok)).status).toBe(409);
        guard.releaseReservation(reservationRequest('DELETE', replacement), 'b', respond);
    }
);

test("early header rejection cannot release another owner's reservation", async () => {
    const guard = createUploadRequestGuard({
        maxConcurrentUploads: 1,
        maxUploadsPerOwner: 1,
    });
    const token = await reserve(guard);
    const request = upload(token);
    request.headers.set('Content-Encoding', 'gzip');
    expect((await guard(request, 'b', respond, ok)).status).toBe(415);
    expect(guard.reserve(reservationRequest(), 'b', respond).status).toBe(503);
    expect((await guard(upload(token), 'a', respond, ok)).status).toBe(200);
});

test('early header rejection cannot release a reservation already consumed by processing', async () => {
    const guard = createUploadRequestGuard({
        maxConcurrentUploads: 1,
        maxUploadsPerOwner: 1,
    });
    const token = await reserve(guard);
    const entered = Promise.withResolvers<void>();
    const done = Promise.withResolvers<void>();
    const pending = guard(upload(token), 'a', respond, async () => {
        entered.resolve();
        await done.promise;
        return ok();
    });
    await entered.promise;
    try {
        const request = upload(token);
        request.headers.set('Content-Encoding', 'gzip');
        expect((await guard(request, 'a', respond, ok)).status).toBe(415);
        expect(guard.reserve(reservationRequest(), 'b', respond).status).toBe(503);
    } finally {
        done.resolve();
        await pending;
    }
    expect((await guard(upload(), 'b', respond, ok)).status).toBe(200);
});

const chunkedRequest = (port: number, method: string, chunk: string, token?: string) =>
    new Promise<string>((resolve, reject) => {
        const socket = createConnection({ host: '127.0.0.1', port });
        let response = '';
        socket.setTimeout(2000, () => {
            socket.destroy();
            reject(new Error('Loopback request timed out'));
        });
        socket.on('error', reject);
        socket.on('data', data => {
            response += data.toString();
            // Read the complete HTTP message rather than depending on TCP close timing.
            const headerEnd = response.indexOf('\r\n\r\n');
            if (headerEnd < 0) return;
            const length = response.slice(0, headerEnd).match(/content-length:\s*(\d+)/i);
            if (length && Buffer.byteLength(response.slice(headerEnd + 4)) >= Number(length[1])) {
                socket.destroy();
                resolve(response);
            }
        });
        socket.on('end', () => resolve(response));
        socket.on('connect', () =>
            socket.write(
                `${method} /credentials/parse-file/reservations HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\nTransfer-Encoding: chunked\r\n${token ? `${UPLOAD_RESERVATION_HEADER}: ${token}\r\n` : ''}\r\n${chunk}`
            )
        );
    });

test.each(['POST', 'DELETE'])('empty chunked %s reaches the reservation handler', async method => {
    const guard = createUploadRequestGuard({
        maxConcurrentUploads: 1,
        maxUploadsPerOwner: 1,
    });
    const http = createHttpRequestBodyGuard();
    const token = method === 'DELETE' ? await reserve(guard) : undefined;
    const server = Bun.serve({
        hostname: '127.0.0.1',
        port: 0,
        fetch: req =>
            http(req, respond, async bounded => {
                await Bun.sleep(2);
                return method === 'POST'
                    ? guard.reserve(bounded, 'a', respond)
                    : guard.releaseReservation(bounded, 'a', respond);
            }),
    });
    try {
        const raw = await chunkedRequest(server.port!, method, '0\r\n\r\n', token);
        expect(raw).toContain(method === 'POST' ? '201 Created' : '200 OK');
        const body = JSON.parse(raw.slice(raw.indexOf('\r\n\r\n') + 4));
        if (method === 'POST')
            guard.releaseReservation(reservationRequest('DELETE', body.token), 'a', respond);
        else expect(body.released).toBe(true);
    } finally {
        server.stop(true);
    }
});

test.each(['POST', 'DELETE'])(
    'nonempty chunked %s is still rejected by zero-byte ingress',
    async method => {
        const guard = createUploadRequestGuard();
        const http = createHttpRequestBodyGuard();
        const handler = mock(async req =>
            method === 'POST'
                ? guard.reserve(req, 'a', respond)
                : guard.releaseReservation(req, 'a', respond)
        );
        const server = Bun.serve({
            hostname: '127.0.0.1',
            port: 0,
            fetch: req => http(req, respond, handler),
        });
        try {
            const raw = await chunkedRequest(server.port!, method, '1\r\nx\r\n0\r\n\r\n');
            expect(raw).toMatch(/^HTTP\/1\.1 413 /);
            expect(handler).not.toHaveBeenCalled();
        } finally {
            server.stop(true);
        }
    }
);

test('only one unused reservation per owner is allowed without reducing consumed concurrency', async () => {
    const guard = createUploadRequestGuard({
        maxConcurrentUploads: 3,
        maxUploadsPerOwner: 2,
    });
    const token = await reserve(guard);
    const rejected = guard.reserve(reservationRequest(), 'a', respond);
    expect(rejected.status).toBe(429);
    expect(rejected.headers.get('Retry-After')).toBe('5');
    const entered = Promise.withResolvers<void>();
    const done = Promise.withResolvers<void>();
    const pending = guard(upload(token), 'a', respond, async () => {
        entered.resolve();
        await done.promise;
        return ok();
    });
    await entered.promise;
    try {
        const next = await reserve(guard);
        expect((await guard(upload(next), 'a', respond, ok)).status).toBe(200);
    } finally {
        done.resolve();
        await pending;
    }
});

test.each(['release', 'expire'])('%s clears the per-owner pending limit', async kind => {
    const guard = createUploadRequestGuard({ reservationTtlMs: 10 });
    const token = await reserve(guard);
    if (kind === 'release')
        guard.releaseReservation(reservationRequest('DELETE', token), 'a', respond);
    else await Bun.sleep(25);
    const next = await reserve(guard);
    guard.releaseReservation(reservationRequest('DELETE', next), 'a', respond);
});

test('DELETE truthfully reports removal without distinguishing unknown or other-owner tickets', async () => {
    const first = createUploadRequestGuard();
    const second = createUploadRequestGuard();
    const token = await reserve(first);
    const body = async (guard: typeof first, did: string, ticket = token) =>
        await guard.releaseReservation(reservationRequest('DELETE', ticket), did, respond).json();
    expect(await body(second, 'a')).toEqual({ released: false });
    expect(await body(first, 'b')).toEqual({ released: false });
    expect(await body(first, 'a', 'unknown')).toEqual({ released: false });
    expect(await body(first, 'a')).toEqual({ released: true });
    expect(await body(first, 'a')).toEqual({ released: false });
    const consumed = await reserve(first);
    await first(upload(consumed), 'a', respond, ok);
    expect(await body(first, 'a', consumed)).toEqual({ released: false });
});

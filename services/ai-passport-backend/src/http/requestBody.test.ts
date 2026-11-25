import { afterEach, expect, mock, test } from 'bun:test';
import { createConnection } from 'node:net';
import { createJsonResponse } from './jsonResponse';
import { createUploadRequestGuard } from './uploadRequest';
import {
    createHttpRequestBodyGuard,
    MAX_HTTP_REQUEST_BODY_BYTES,
    MAX_PUBLIC_REQUEST_BODY_BYTES,
    MAX_AUTH_REQUEST_BODY_BYTES,
    MAX_CONCURRENT_HTTP_BODIES,
    readBoundedRequestBody,
} from './requestBody';

const respond = (body: unknown, status?: number) =>
    createJsonResponse(body, status, {
        'Access-Control-Allow-Origin': 'https://synthetic.example',
    });
const request = (path: string, body: BodyInit, headers = {}) =>
    new Request(`http://localhost${path}`, { method: 'POST', body, headers });

test.each([
    '/auth/session',
    '/auth/handoff',
    '/insights/occupations',
    '/oauth/token',
    '/oauth/register',
])('known oversized %s rejects before downstream/auth or decoding, with CORS', async path => {
    const guard = createHttpRequestBodyGuard();
    const operation = mock(async () => respond({ ok: true }));
    const response = await guard(
        request(path, 'x', {
            'content-length': String(MAX_AUTH_REQUEST_BODY_BYTES + 1),
        }),
        respond,
        operation
    );
    expect(response.status).toBe(413);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://synthetic.example');
    expect(operation).not.toHaveBeenCalled();
});

test.each([
    '/insights/occupations',
    '/oauth/register',
    '/oauth/token',
    '/auth/session',
    '/assessment',
])('oversized undeclared body on %s is cancelled before the route', async path => {
    let cancelled = false;
    const guard = createHttpRequestBodyGuard();
    const operation = mock(async () => respond({ ok: true }));
    const response = await guard(
        request(
            path,
            new ReadableStream({
                pull(controller) {
                    controller.enqueue(new Uint8Array(1024 * 1024));
                },
                cancel() {
                    cancelled = true;
                },
            })
        ),
        respond,
        operation
    );
    expect(response.status).toBe(413);
    expect(cancelled).toBe(true);
    expect(operation).not.toHaveBeenCalled();
});

test('valid JSON, multipart and URL-encoded bodies retain downstream decoding and signal', async () => {
    const guard = createHttpRequestBodyGuard();
    const form = new FormData();
    form.set('event', 'visible');
    const cases = [
        request('/auth/session', JSON.stringify({ vp: 'synthetic' }), {
            'content-type': 'application/json',
        }),
        request('/threads/visibility', form),
        request('/oauth/token', 'grant_type=refresh_token', {
            'content-type': 'application/x-www-form-urlencoded',
        }),
    ];
    for (const [index, req] of cases.entries()) {
        const response = await guard(req, respond, async bounded => {
            expect(bounded.method).toBe('POST');
            expect(bounded.headers.get('content-type')).toBe(req.headers.get('content-type'));
            if (index === 0) expect(await bounded.json()).toEqual({ vp: 'synthetic' });
            else
                expect((await bounded.formData()).get(index === 1 ? 'event' : 'grant_type')).toBe(
                    index === 1 ? 'visible' : 'refresh_token'
                );
            return respond({ ok: true });
        });
        expect(response.status).toBe(200);
    }
});

test('concurrent body reads reject excess traffic, release after completion/errors and leave bodyless traffic available', async () => {
    const guard = createHttpRequestBodyGuard({ maxConcurrentRequests: 1 });
    const entered = Promise.withResolvers<void>();
    let finishRead!: ReadableStreamDefaultController<Uint8Array>;
    const pending = guard(
        request(
            '/oauth/token',
            new ReadableStream<Uint8Array>({
                start(controller) {
                    finishRead = controller;
                    controller.enqueue(new TextEncoder().encode('x'));
                },
                pull() {
                    entered.resolve();
                },
            })
        ),
        respond,
        async req => respond({ text: await req.text() })
    );
    await entered.promise;
    let cancelled = false;
    const rejected = await guard(
        request(
            '/auth/session',
            new ReadableStream({
                cancel() {
                    cancelled = true;
                },
            })
        ),
        respond,
        async () => respond({ ok: true })
    );
    expect(rejected.status).toBe(503);
    expect(rejected.headers.get('Retry-After')).toBe('5');
    expect(cancelled).toBe(true);
    expect(
        (
            await guard(new Request('http://localhost/health'), respond, async () =>
                respond({ ok: true })
            )
        ).status
    ).toBe(200);
    finishRead.close();
    expect(await (await pending).json()).toEqual({ text: 'x' });
    const invalid = await guard(
        request('/auth/session', 'x', {
            'content-length': String(MAX_AUTH_REQUEST_BODY_BYTES + 1),
        }),
        respond,
        async () => respond({ ok: true })
    );
    expect(invalid.status).toBe(413);
    await expect(
        guard(request('/auth/session', 'x'), respond, async () => {
            throw new Error('synthetic');
        })
    ).rejects.toThrow('synthetic');
    expect(
        (await guard(request('/auth/session', 'x'), respond, async () => respond({ ok: true })))
            .status
    ).toBe(200);
});

test('sixteen slow finish handlers do not block a new authentication body', async () => {
    const guard = createHttpRequestBodyGuard();
    const finish = Promise.withResolvers<void>();
    const entered = Promise.withResolvers<void>();
    let count = 0;
    const pending = Array.from({ length: MAX_CONCURRENT_HTTP_BODIES }, () =>
        guard(
            request('/threads/finish', '{"threadId":"synthetic"}', {
                'content-type': 'application/json',
            }),
            respond,
            async req => {
                expect(await req.json()).toEqual({ threadId: 'synthetic' });
                count += 1;
                if (count === MAX_CONCURRENT_HTTP_BODIES) entered.resolve();
                await finish.promise; // Represents downstream model/database work.
                return respond({ ok: true });
            }
        )
    );
    try {
        await entered.promise;
        const response = await guard(
            request('/auth/session', '{"vp":"synthetic"}', {
                'content-type': 'application/json',
            }),
            respond,
            async req => respond(await req.json())
        );
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ vp: 'synthetic' });
    } finally {
        finish.resolve();
        await Promise.all(pending);
    }
});

test('short bodies retain only their received bytes, not the 6 MiB scratch buffer', async () => {
    const bytes = await readBoundedRequestBody(
        request('/threads/finish', 'ok'),
        MAX_HTTP_REQUEST_BODY_BYTES
    );
    expect(new TextDecoder().decode(bytes)).toBe('ok');
    expect(bytes.byteLength).toBe(2);
    expect(bytes.buffer.byteLength).toBe(2);
});

test('stalled non-upload bodies time out before any route runs', async () => {
    const guard = createHttpRequestBodyGuard({
        maxConcurrentRequests: 1,
        bodyTimeoutMs: 10,
    });
    const operation = mock(async () => respond({ ok: true }));
    const response = await guard(request('/oauth/token', new ReadableStream()), respond, operation);
    expect(response.status).toBe(408);
    expect(operation).not.toHaveBeenCalled();
    const next = await guard(request('/auth/session', 'x'), respond, async () =>
        respond({ ok: true })
    );
    expect(next.status).toBe(200);
});

test('upload and bodyless requests retain their original request for the upload guard/websocket path', async () => {
    const guard = createHttpRequestBodyGuard();
    const req = request('/credentials/parse-file', 'synthetic');
    await guard(req, respond, async original => {
        expect(original).toBe(req);
        expect(await original.text()).toBe('synthetic');
        return respond({ ok: true });
    });
    const ws = new Request('http://localhost/', {
        headers: { upgrade: 'websocket' },
    });
    expect(
        await guard(ws, respond, async original => {
            expect(original).toBe(ws);
            return undefined;
        })
    ).toBeUndefined();
});

test('shared reader handles a losing abort after the read settles', async () => {
    const abort = new AbortController();
    const req = new Request('http://localhost/', {
        method: 'POST',
        body: 'ok',
        signal: abort.signal,
    });
    const slice = Uint8Array.prototype.slice;
    const { spyOn } = await import('bun:test');
    const spy = spyOn(Uint8Array.prototype, 'slice').mockImplementationOnce(function (
        this: Uint8Array<ArrayBuffer>,
        start,
        end
    ) {
        const result = slice.call(this, start, end);
        queueMicrotask(() => abort.abort());
        return result;
    });
    try {
        expect(new TextDecoder().decode(await readBoundedRequestBody(req, 16))).toBe('ok');
    } finally {
        spy.mockRestore();
    }
    expect(abort.signal.aborted).toBe(true);
    await Bun.sleep(0);
});

test('upload bypass does not materialize the body before asynchronous authentication', async () => {
    const guard = createHttpRequestBodyGuard();
    const req = request('/credentials/parse-file', '{}');
    const getBody = Object.getOwnPropertyDescriptor(Request.prototype, 'body')!.get!;
    let reads = 0;
    Object.defineProperty(req, 'body', {
        get() {
            reads += 1;
            return getBody.call(this);
        },
    });
    await guard(req, respond, async original => {
        expect(original).toBe(req);
        expect(reads).toBe(0);
        await Bun.sleep(0);
        return respond({ ok: true });
    });
});

let server: ReturnType<typeof Bun.serve> | undefined;
afterEach(() => server?.stop(true));

test('real upload survives authentication delay through both body guards', async () => {
    const httpGuard = createHttpRequestBodyGuard();
    const uploadGuard = createUploadRequestGuard();
    const payload = { file: 'data:text/plain;base64,YQ==', fileType: 'resume' };
    const process = mock(async body => respond(body));
    server = Bun.serve({
        hostname: '127.0.0.1',
        port: 0,
        fetch: req =>
            httpGuard(req, respond, async original => {
                // Session/owner lookups yield before the authenticated upload guard reads.
                await Bun.sleep(20);
                return uploadGuard(original, 'did:example:qa', respond, process);
            }),
    });
    const response = await fetch(new URL('/credentials/parse-file', server.url), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(payload);
    expect(process).toHaveBeenCalledTimes(1);
});
const chunked = (port: number, path: string, bytes: number) =>
    new Promise<string>((resolve, reject) => {
        const socket = createConnection({ host: '127.0.0.1', port });
        const chunks: Buffer[] = [];
        socket.setTimeout(5000, () => socket.destroy(new Error('timeout')));
        socket.on('data', data => chunks.push(Buffer.from(data)));
        socket.on('end', () => resolve(Buffer.concat(chunks).toString()));
        socket.on('error', error =>
            chunks.length ? resolve(Buffer.concat(chunks).toString()) : reject(error)
        );
        socket.on('connect', () => {
            socket.write(
                `POST ${path} HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\nTransfer-Encoding: chunked\r\n\r\n`
            );
            const chunk = Buffer.alloc(bytes, 'a');
            socket.write(
                Buffer.concat([
                    Buffer.from(`${bytes.toString(16)}\r\n`),
                    chunk,
                    Buffer.from('\r\n0\r\n\r\n'),
                ])
            );
        });
    });

test.each(['/insights/occupations', '/auth/session', '/oauth/token', '/oauth/register'])(
    'real Bun chunked %s stops before downstream parsing',
    async path => {
        const guard = createHttpRequestBodyGuard();
        const operation = mock(async (req: Request) => respond({ text: await req.text() }));
        server = Bun.serve({
            hostname: '127.0.0.1',
            port: 0,
            maxRequestBodySize: MAX_HTTP_REQUEST_BODY_BYTES,
            fetch: req => guard(req, respond, operation),
        });
        const response = await chunked(
            server.port!,
            path,
            path.startsWith('/auth/')
                ? MAX_AUTH_REQUEST_BODY_BYTES + 1
                : MAX_PUBLIC_REQUEST_BODY_BYTES + 1
        );
        expect(response).toStartWith('HTTP/1.1 413');
        expect(response.toLowerCase()).toContain(
            'access-control-allow-origin: https://synthetic.example'
        );
        expect(operation).not.toHaveBeenCalled();
    }
);

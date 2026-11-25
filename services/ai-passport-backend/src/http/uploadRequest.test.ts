import { afterEach, describe, expect, mock, spyOn, test } from 'bun:test';
import { createConnection } from 'node:net';
import { FileUploadTypesEnum } from '../ai/generation-schemas';
import { createJsonResponse } from './jsonResponse';
import {
    createUploadRequestGuard,
    getUploadCapacityConfig,
    MAX_CONCURRENT_FILE_UPLOADS,
    MAX_HTTP_REQUEST_BODY_BYTES,
} from './uploadRequest';

const payload = {
    file: 'data:application/pdf;base64,QQ==',
    fileType: FileUploadTypesEnum.Resume,
};
const encoded = new TextEncoder().encode(JSON.stringify(payload));
const request = (body: BodyInit = JSON.stringify(payload), headers = {}) =>
    new Request('http://localhost/credentials/parse-file', {
        method: 'POST',
        body,
        headers,
    });
const respond = (data: unknown, status?: number) =>
    createJsonResponse(data, status, {
        'Access-Control-Allow-Origin': 'https://synthetic.example',
    });
const success = async () => respond({ ok: true });

test('upload capacities are configurable with validated defaults', () => {
    expect(getUploadCapacityConfig({})).toEqual({
        maxConcurrentUploads: 16,
        maxUploadsPerOwner: 2,
    });
    expect(
        getUploadCapacityConfig({
            MAX_CONCURRENT_FILE_UPLOADS: '32',
            MAX_CONCURRENT_FILE_UPLOADS_PER_OWNER: '4',
        })
    ).toEqual({ maxConcurrentUploads: 32, maxUploadsPerOwner: 4 });
    for (const value of ['0', '33', 'invalid', '1.5']) {
        expect(() => getUploadCapacityConfig({ MAX_CONCURRENT_FILE_UPLOADS: value })).toThrow(
            'Invalid upload capacity'
        );
    }
    expect(() =>
        getUploadCapacityConfig({
            MAX_CONCURRENT_FILE_UPLOADS: '4',
            MAX_CONCURRENT_FILE_UPLOADS_PER_OWNER: '5',
        })
    ).toThrow('Invalid upload capacity');
});

test('configured owner and global limits count requests rather than distinct owners', async () => {
    const guard = createUploadRequestGuard({
        maxConcurrentUploads: 3,
        maxUploadsPerOwner: 2,
    });
    const release = Promise.withResolvers<void>();
    let entered = 0;
    const processing = async () => {
        entered += 1;
        await release.promise;
        return success();
    };
    const pending = [
        guard(request(), 'a', respond, processing),
        guard(request(), 'a', respond, processing),
    ];
    while (entered < 2) await Bun.sleep(0);
    expect((await guard(request(), 'a', respond, success)).status).toBe(429);
    pending.push(guard(request(), 'b', respond, processing));
    while (entered < 3) await Bun.sleep(0);
    expect((await guard(request(), 'c', respond, success)).status).toBe(503);
    release.resolve();
    expect((await Promise.all(pending)).every(response => response.status === 200)).toBe(true);
    expect((await guard(request(), 'a', respond, success)).status).toBe(200);
});

test('a normal base64 upload reaches processing unchanged', async () => {
    const guard = createUploadRequestGuard();
    const operation = mock(async body => respond(body));
    const response = await guard(request(), 'did:example:a', respond, operation);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(payload);
    expect(operation).toHaveBeenCalledTimes(1);
});

test('preserves validated diagnostics and strips unknown fields before processing', async () => {
    const guard = createUploadRequestGuard();
    const diagnostics = {
        enabled: true,
        operationId: crypto.randomUUID(),
        attemptId: crypto.randomUUID(),
        attempt: 2,
    };
    const operation = mock(async body => respond(body));
    const response = await guard(
        request(
            JSON.stringify({
                ...payload,
                diagnostics: { ...diagnostics, privateText: 'PRIVATE_NESTED_FIELD' },
                privateText: 'PRIVATE_TOP_LEVEL_FIELD',
                ownerDid: 'did:example:attacker-supplied-owner',
            })
        ),
        'did:example:authenticated-owner',
        respond,
        operation
    );
    const expected = { ...payload, diagnostics };
    expect(response.status).toBe(200);
    expect(operation).toHaveBeenCalledWith(expected);
    expect(await response.json()).toEqual(expected);
});

test.each([
    null,
    { enabled: 'true' },
    { operationId: 'not-a-uuid' },
    { attemptId: 'not-a-uuid' },
    { attempt: 0 },
    { attempt: 101 },
    { attempt: 1.5 },
])('invalid diagnostics do not reach processing: %j', async diagnostics => {
    const guard = createUploadRequestGuard();
    const operation = mock(success);
    const response = await guard(
        request(JSON.stringify({ ...payload, diagnostics })),
        'a',
        respond,
        operation
    );
    expect(response.status).toBe(400);
    expect(operation).not.toHaveBeenCalled();
    expect((await guard(request(), 'a', respond, success)).status).toBe(200);
});

test('the envelope allows the existing 4 MiB file limit including base64 overhead', async () => {
    const file =
        'data:application/pdf;base64,' + Buffer.alloc(4 * 1024 * 1024 - 100).toString('base64');
    const guard = createUploadRequestGuard();
    const response = await guard(
        request(JSON.stringify({ ...payload, file })),
        'did:example:a',
        respond,
        async body => {
            expect(body.file).toBe(file);
            return success();
        }
    );
    expect(response.status).toBe(200);
});

test('rejects oversized declared lengths before reading or parsing, with CORS', async () => {
    const guard = createUploadRequestGuard();
    const req = request(encoded, {
        'content-length': String(MAX_HTTP_REQUEST_BODY_BYTES + 1),
    });
    const reader = spyOn(req.body!, 'getReader');
    const parse = spyOn(JSON, 'parse');
    const operation = mock(success);
    try {
        const response = await guard(req, 'did:example:a', respond, operation);
        expect(response.status).toBe(413);
        expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
            'https://synthetic.example'
        );
        expect(reader).not.toHaveBeenCalled();
        expect(parse).not.toHaveBeenCalled();
        expect(operation).not.toHaveBeenCalled();
    } finally {
        reader.mockRestore();
        parse.mockRestore();
    }
});

test.each(['-1', '1e8', 'invalid', '1.5'])('rejects malformed Content-Length %s', async length => {
    const guard = createUploadRequestGuard();
    expect(
        (await guard(request(encoded, { 'content-length': length }), 'a', respond, success)).status
    ).toBe(400);
});

test('bounds bytes from a body without Content-Length before JSON parsing and cancels it', async () => {
    const guard = createUploadRequestGuard();
    let cancelled = false;
    let reads = 0;
    const body = new ReadableStream<Uint8Array>({
        pull(controller) {
            reads += 1;
            controller.enqueue(new Uint8Array(1024 * 1024));
        },
        cancel() {
            cancelled = true;
        },
    });
    const parse = spyOn(JSON, 'parse');
    const operation = mock(success);
    try {
        const response = await guard(request(body), 'a', respond, operation);
        expect(response.status).toBe(413);
        expect(cancelled).toBe(true);
        expect(reads).toBeLessThanOrEqual(8);
        expect(parse).not.toHaveBeenCalled();
        expect(operation).not.toHaveBeenCalled();
    } finally {
        parse.mockRestore();
    }
    expect((await guard(request(), 'a', respond, success)).status).toBe(200);
});

test('counts UTF-8 bytes rather than characters and does not trust a smaller declared size', async () => {
    const guard = createUploadRequestGuard();
    const body = JSON.stringify({
        ...payload,
        padding: 'é'.repeat(MAX_HTTP_REQUEST_BODY_BYTES / 2),
    });
    expect(body.length).toBeLessThan(MAX_HTTP_REQUEST_BODY_BYTES);
    expect(
        (await guard(request(body, { 'content-length': '1' }), 'a', respond, success)).status
    ).toBe(413);
});

test('accepts an envelope exactly at the byte limit', async () => {
    const guard = createUploadRequestGuard();
    const empty = JSON.stringify({ ...payload, padding: '' });
    const body = JSON.stringify({
        ...payload,
        padding: 'a'.repeat(MAX_HTTP_REQUEST_BODY_BYTES - Buffer.byteLength(empty)),
    });
    expect(Buffer.byteLength(body)).toBe(MAX_HTTP_REQUEST_BODY_BYTES);
    expect((await guard(request(body), 'a', respond, success)).status).toBe(200);
});

test('rejects compressed HTTP request bodies without reading them', async () => {
    const guard = createUploadRequestGuard();
    const operation = mock(success);
    const req = request(encoded, { 'content-encoding': 'gzip' });
    const reader = spyOn(req.body!, 'getReader');
    expect((await guard(req, 'a', respond, operation)).status).toBe(415);
    expect(reader).not.toHaveBeenCalled();
    expect(operation).not.toHaveBeenCalled();
    reader.mockRestore();
});

test('one owner cannot reserve another slot while its body is still being read', async () => {
    const guard = createUploadRequestGuard({ maxUploadsPerOwner: 1 });
    let source!: ReadableStreamDefaultController<Uint8Array>;
    const first = guard(
        request(
            new ReadableStream({
                start(controller) {
                    source = controller;
                },
            })
        ),
        'a',
        respond,
        success
    );
    const second = request();
    const reader = spyOn(second.body!, 'getReader');
    const response = await guard(second, 'a', respond, success);
    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('5');
    expect(reader).not.toHaveBeenCalled();
    reader.mockRestore();
    source.enqueue(encoded);
    source.close();
    expect((await first).status).toBe(200);
    expect((await guard(request(), 'a', respond, success)).status).toBe(200);
});

test('caps uploads across different owners without queuing or reading excess bodies', async () => {
    const guard = createUploadRequestGuard();
    const release = Promise.withResolvers<void>();
    const started = Promise.withResolvers<void>();
    let active = 0;
    const pending = Array.from({ length: MAX_CONCURRENT_FILE_UPLOADS }, (_, i) =>
        guard(request(), `owner-${i}`, respond, async () => {
            active += 1;
            if (active === MAX_CONCURRENT_FILE_UPLOADS) started.resolve();
            await release.promise;
            return success();
        })
    );
    await started.promise;
    const excess = request();
    const reader = spyOn(excess.body!, 'getReader');
    const operation = mock(success);
    const response = await guard(excess, 'other-owner', respond, operation);
    expect(response.status).toBe(503);
    expect(response.headers.get('Retry-After')).toBe('5');
    expect(reader).not.toHaveBeenCalled();
    expect(operation).not.toHaveBeenCalled();
    reader.mockRestore();
    release.resolve();
    expect((await Promise.all(pending)).every(r => r.status === 200)).toBe(true);
    expect((await guard(request(), 'other-owner', respond, success)).status).toBe(200);
});

test.each([
    'not json',
    'null',
    '{}',
    '{"file":1,"fileType":"resume"}',
    '{"file":"x","fileType":"unsupported"}',
])('invalid body releases admission: %s', async body => {
    const guard = createUploadRequestGuard();
    const operation = mock(success);
    expect((await guard(request(body), 'a', respond, operation)).status).toBe(400);
    expect(operation).not.toHaveBeenCalled();
    expect((await guard(request(), 'a', respond, success)).status).toBe(200);
});

test('a stalled body times out, is cancelled, and releases admission', async () => {
    const guard = createUploadRequestGuard({ bodyTimeoutMs: 20 });
    let cancelled = false;
    const operation = mock(success);
    const response = await guard(
        request(
            new ReadableStream({
                cancel() {
                    cancelled = true;
                },
            })
        ),
        'a',
        respond,
        operation
    );
    expect(response.status).toBe(408);
    expect(cancelled).toBe(true);
    expect(operation).not.toHaveBeenCalled();
    expect((await guard(request(), 'a', respond, success)).status).toBe(200);
});

test('a disconnected or failed body releases admission', async () => {
    const guard = createUploadRequestGuard();
    const abort = new AbortController();
    const req = new Request('http://localhost/credentials/parse-file', {
        method: 'POST',
        body: new ReadableStream(),
        signal: abort.signal,
    });
    const pending = guard(req, 'a', respond, success);
    abort.abort();
    expect((await pending).status).toBe(400);
    const failed = new ReadableStream({
        start(controller) {
            controller.error(new Error('private stream failure'));
        },
    });
    const response = await guard(request(failed), 'a', respond, success);
    expect(response.status).toBe(400);
    expect(await response.text()).not.toContain('private stream failure');
    expect((await guard(request(), 'a', respond, success)).status).toBe(200);
});

test('abort scheduled after decoding stays handled', async () => {
    const guard = createUploadRequestGuard();
    const abort = new AbortController();
    const req = new Request('http://localhost/credentials/parse-file', {
        method: 'POST',
        body: JSON.stringify(payload),
        signal: abort.signal,
    });
    const parseJson = JSON.parse;
    const parse = spyOn(JSON, 'parse').mockImplementationOnce((text, reviver) => {
        const parsed = parseJson(text, reviver);
        // The shared reader has settled; a late abort must not affect processing.
        queueMicrotask(() => abort.abort());
        return parsed;
    });
    try {
        const response = await guard(req, 'a', respond, success);
        expect(response.status).toBe(200);
        expect(abort.signal.aborted).toBe(true);
    } finally {
        parse.mockRestore();
    }
    // Bun's test runner reports any unhandled rejection from the losing branch.
    await Bun.sleep(0);
    expect((await guard(request(), 'a', respond, success)).status).toBe(200);
});

test('timeout handles the read rejection and delayed cancellation failure', async () => {
    const guard = createUploadRequestGuard({ bodyTimeoutMs: 10 });
    const cancelled = Promise.withResolvers<void>();
    const operation = mock(success);
    const response = await guard(
        request(
            new ReadableStream({
                async cancel() {
                    await Bun.sleep(10);
                    cancelled.resolve();
                    throw new Error('synthetic delayed cancellation failure');
                },
            })
        ),
        'a',
        respond,
        operation
    );
    expect(response.status).toBe(408);
    expect(operation).not.toHaveBeenCalled();
    await cancelled.promise;
    await Bun.sleep(0);
    expect((await guard(request(), 'a', respond, success)).status).toBe(200);
});

test('processing failure releases admission without changing the original error', async () => {
    const guard = createUploadRequestGuard();
    const error = new Error('synthetic processing failure');
    await expect(
        guard(request(), 'a', respond, async () => {
            throw error;
        })
    ).rejects.toBe(error);
    expect((await guard(request(), 'a', respond, success)).status).toBe(200);
});

test('client abort during processing does not free a slot before the work settles', async () => {
    const guard = createUploadRequestGuard({ maxUploadsPerOwner: 1 });
    const entered = Promise.withResolvers<void>();
    const finish = Promise.withResolvers<void>();
    const abort = new AbortController();
    const req = new Request('http://localhost/credentials/parse-file', {
        method: 'POST',
        body: JSON.stringify(payload),
        signal: abort.signal,
    });
    const pending = guard(req, 'a', respond, async () => {
        entered.resolve();
        await finish.promise;
        return success();
    });
    await entered.promise;
    abort.abort();
    expect((await guard(request(), 'a', respond, success)).status).toBe(429);
    finish.resolve();
    expect((await pending).status).toBe(200);
    expect((await guard(request(), 'a', respond, success)).status).toBe(200);
});

const rawHttp = (port: number, wire: Buffer | string): Promise<string> =>
    new Promise((resolve, reject) => {
        const socket = createConnection({ host: '127.0.0.1', port });
        const chunks: Buffer[] = [];
        socket.setTimeout(10_000, () => socket.destroy(new Error('HTTP test timed out')));
        socket.on('data', data => chunks.push(Buffer.isBuffer(data) ? data : Buffer.from(data)));
        socket.on('end', () => resolve(Buffer.concat(chunks).toString()));
        socket.on('error', error =>
            chunks.length ? resolve(Buffer.concat(chunks).toString()) : reject(error)
        );
        socket.on('connect', () => socket.write(wire));
    });

describe('real Bun HTTP ingress', () => {
    let server: ReturnType<typeof Bun.serve> | undefined;
    afterEach(() => server?.stop(true));
    const start = () => {
        const guard = createUploadRequestGuard();
        const processing = mock(success);
        let entered = 0;
        server = Bun.serve({
            hostname: '127.0.0.1',
            port: 0,
            maxRequestBodySize: MAX_HTTP_REQUEST_BODY_BYTES,
            fetch(req) {
                entered += 1;
                return guard(req, 'a', respond, processing);
            },
        });
        return { port: server.port!, processing, entered: () => entered };
    };

    test('known oversized Content-Length is rejected without sending any body bytes', async () => {
        const app = start();
        const response = await rawHttp(
            app.port,
            `POST /credentials/parse-file HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\nContent-Length: ${MAX_HTTP_REQUEST_BODY_BYTES + 1}\r\n\r\n`
        );
        expect(response).toStartWith('HTTP/1.1 413');
        expect(response.toLowerCase()).not.toContain('access-control-allow-origin');
        expect(app.entered()).toBe(0);
        expect(app.processing).not.toHaveBeenCalled();
    });

    test('chunked upload exceeding the cap is rejected before processing', async () => {
        const app = start();
        const chunk = Buffer.alloc(1024 * 1024, 'a');
        const frames: Buffer[] = [];
        for (let i = 0; i < 7; i += 1)
            frames.push(Buffer.from('100000\r\n'), chunk, Buffer.from('\r\n'));
        const response = await rawHttp(
            app.port,
            Buffer.concat([
                Buffer.from(
                    'POST /credentials/parse-file HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\nContent-Type: application/json\r\nTransfer-Encoding: chunked\r\n\r\n'
                ),
                ...frames,
                Buffer.from('0\r\n\r\n'),
            ])
        );
        expect(response).toStartWith('HTTP/1.1 413');
        expect(app.processing).not.toHaveBeenCalled();
        expect(app.entered()).toBe(1);
        const valid = await fetch(`http://127.0.0.1:${app.port}/credentials/parse-file`, {
            method: 'POST',
            body: JSON.stringify(payload),
        });
        expect(valid.status).toBe(200);
        expect(app.processing).toHaveBeenCalledTimes(1);
    });
});

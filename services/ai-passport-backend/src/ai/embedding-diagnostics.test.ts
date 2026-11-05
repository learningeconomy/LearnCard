import { expect, test } from 'bun:test';
import { deserialize, serialize } from 'bson';
import {
    markEmbeddingFailure,
    embeddingFailureDetails,
    copyEmbeddingFailureDetails,
    sanitizeEmbeddingFailure,
    withEmbeddingUnitDeadline,
    embeddingFailureSummary,
} from './embedding-diagnostics';
const secret = 'secret bearer did:private credential prompt https://private.invalid';
function capture(error: object, signal?: AbortSignal) {
    markEmbeddingFailure(error, 2, performance.now() - 25, signal);
    return embeddingFailureDetails(error)!;
}
test('SDK timeout and transport categories never retain messages or error bodies', () => {
    for (const [name, message, code, category] of [
        [
            'TimeoutError',
            '@smithy/node-http-handler - the request socket did not establish a connection ' +
                secret,
            undefined,
            'connection_timeout',
        ],
        [
            'TimeoutError',
            '@smithy/node-http-handler - the request socket timed out ' + secret,
            undefined,
            'socket_timeout',
        ],
        [
            'TimeoutError',
            '@smithy/node-http-handler - [ERROR] a request has exceeded the configured ' + secret,
            undefined,
            'request_timeout',
        ],
        ['ModelTimeoutException', secret, undefined, 'upstream_timeout'],
        ['TimeoutError', secret, undefined, 'sdk_timeout'],
        ['Error', secret, 'ECONNRESET', 'socket_reset'],
        ['Error', secret, 'EPIPE', 'socket_pipe'],
    ] as const) {
        const detail = capture(
            Object.assign(new Error(message), {
                name,
                code,
                $metadata: { httpStatusCode: 504 },
                body: secret,
            })
        );
        expect(detail.sdkCategory).toBe(category);
        expect(detail.httpStatus).toBe(504);
        expect(detail.ordinal).toBe(2);
        expect(detail.callerAborted).toBe(false);
        expect(detail.callerAbortKind).toBe('none');
        expect(detail.elapsedMs).toBeGreaterThanOrEqual(25);
        expect(JSON.stringify(detail)).not.toContain(secret);
    }
});
test('caller cancellation and caller deadline remain separate from SDK timeout category', () => {
    for (const kind of ['cancelled', 'deadline'] as const) {
        const caller = new AbortController();
        caller.abort(
            kind === 'deadline' ? new DOMException(secret, 'TimeoutError') : new Error(secret)
        );
        const detail = capture(
            Object.assign(new Error(secret), { name: 'TimeoutError' }),
            caller.signal
        );
        expect(detail.callerAborted).toBe(true);
        expect(detail.callerAbortKind).toBe(kind);
        expect(detail.sdkCategory).toBe('sdk_timeout');
        expect(JSON.stringify(detail)).not.toContain(secret);
    }
});
test('remaining unit deadline is async-context isolated and clamped after expiry', async () => {
    const a = {},
        b = {},
        c = {};
    await Promise.all([
        withEmbeddingUnitDeadline(Date.now() + 60000, async () => {
            await Promise.resolve();
            capture(a);
        }),
        withEmbeddingUnitDeadline(Date.now() - 1000, async () => {
            await Promise.resolve();
            capture(b);
        }),
    ]);
    capture(c);
    expect(embeddingFailureDetails(a)?.unitRemainingMs).toBeGreaterThan(55000);
    expect(embeddingFailureDetails(b)?.unitRemainingMs).toBe(0);
    expect(embeddingFailureDetails(c)).not.toHaveProperty('unitRemainingMs');
});
test('unknown errors/accessors cannot leak into saved metadata or invoke getters', () => {
    let reads = 0;
    const error = {};
    for (const key of ['name', 'message', 'code', 'status', '$metadata'])
        Object.defineProperty(error, key, {
            get() {
                reads += 1;
                throw new Error(secret);
            },
        });
    const detail = capture(error);
    expect(reads).toBe(0);
    expect(detail.sdkCategory).toBe('unknown');
    expect(detail.httpStatus).toBeUndefined();
    const unknown = capture({ name: secret, message: secret, status: 999, body: secret });
    expect(JSON.stringify(unknown)).not.toContain(secret);
    expect(unknown.httpStatus).toBeUndefined();
});
test('normalization copies diagnostics and BSON/public sanitization retains only fixed valid fields', () => {
    const source = {},
        target = {};
    capture(source);
    copyEmbeddingFailureDetails(source, target);
    const stored = deserialize(
        serialize({
            ...embeddingFailureDetails(target),
            unitRemainingMs: null,
            httpStatus: null,
            body: secret,
            prompt: secret,
        })
    );
    const detail = sanitizeEmbeddingFailure(stored)!;
    expect(detail).toEqual(embeddingFailureDetails(source)!);
    expect(JSON.stringify(detail)).not.toContain(secret);
    expect(embeddingFailureSummary(stored)).toContain('Embedding 2:');
    for (const change of [
        { ordinal: 0 },
        { sdkCategory: secret },
        { elapsedMs: -1 },
        { callerAborted: true },
        { callerAbortKind: secret },
        { httpStatus: 999 },
    ])
        expect(sanitizeEmbeddingFailure({ ...detail, ...change })).toBeUndefined();
});

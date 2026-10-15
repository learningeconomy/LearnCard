import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const source = readFileSync(new URL('./capgo-manifest-diagnostics.cjs', import.meta.url), 'utf8');
const manifestUrl = 'https://example.com/private/set_manifest';
const token = 'test-token-must-be-redacted';
const install = (fetch, logger, secret = token) => {
    const messages = [];
    const context = vm.createContext({
        fetch,
        URL,
        Buffer,
        process: { env: { CAPGO_TOKEN: secret } },
        console: { error: logger ?? (message => messages.push(message)) },
    });
    vm.runInContext(source, context);
    assert.equal(
        messages[0],
        !logger && typeof fetch === 'function'
            ? '[capgo-manifest-diagnostics] installed'
            : undefined
    );
    return { fetch: context.fetch, messages };
};

test('logs failed manifest details with redaction and leaves the response body readable', async () => {
    const body = { error: 'error_set_manifest', moreInfo: { message: token } };
    const response = Response.json(body, {
        status: 500,
        headers: { 'x-request-id': 'request-123' },
    });
    const hook = install(async () => response);
    assert.equal(await hook.fetch(manifestUrl), response);
    assert.deepEqual(await response.json(), body);
    assert.match(hook.messages[1], /request-123/);
    assert.match(hook.messages[1], /error_set_manifest/);
    assert.match(hook.messages[1], /\[redacted\]/);
    assert.ok(!hook.messages[1].includes(token));
});

test('leaves missing or non-callable fetch untouched for the CLI to initialize', () => {
    for (const unavailable of [undefined, null, false]) {
        const hook = install(unavailable);
        assert.equal(hook.fetch, unavailable);
        assert.deepEqual(hook.messages, []);
    }
});

test('redacts JSON-escaped and commonly encoded tokens, including nested object keys', async () => {
    const secret = 'secret-"quote"-\\slash-\n-newline-ü/?+end';
    const forms = [
        secret,
        encodeURIComponent(secret),
        Buffer.from(secret).toString('base64'),
        Buffer.from(secret).toString('base64url'),
    ];
    const response = Response.json(
        { error: 'error_set_manifest', moreInfo: forms.map(value => ({ [value]: value })) },
        { status: 500 }
    );
    const hook = install(async () => response, undefined, secret);
    assert.equal(await hook.fetch(manifestUrl), response);
    for (const form of forms) {
        assert.ok(!hook.messages[1].includes(form));
        assert.ok(!hook.messages[1].includes(JSON.stringify(form).slice(1, -1)));
    }
    assert.match(hook.messages[1], /\[redacted\]/);
});

test('redacts a secret crossing the output truncation boundary before slicing', async () => {
    const response = Response.json(
        { error: 'error_set_manifest', message: 'x'.repeat(11920) + token + 'x'.repeat(200) },
        { status: 500 }
    );
    const hook = install(async () => response);
    await hook.fetch(manifestUrl);
    assert.ok(!hook.messages[1].includes(token.slice(0, 10)));
    assert.ok(hook.messages[1].length <= '[capgo-manifest-response] '.length + 12000);
});

test('also logs an error body returned with HTTP 200', async () => {
    const hook = install(async () => Response.json({ error: 'manifest_rejected' }));
    await hook.fetch(manifestUrl);
    assert.match(hook.messages[1], /manifest_rejected/);
});

test('successful manifests and unrelated failures stay quiet after installation', async () => {
    const hook = install(async () => Response.json({ success: true }));
    await hook.fetch(new URL(manifestUrl));
    const unrelated = install(async () => Response.json({ error: 'other' }, { status: 500 }));
    await unrelated.fetch('https://example.com/other');
    assert.equal(hook.messages.length, 1);
    assert.equal(unrelated.messages.length, 1);
});

test('invalid URLs and throwing request URL getters cannot change successful fetches', async () => {
    const response = Response.json({ success: true });
    const hook = install(async () => response);
    assert.equal(await hook.fetch('/relative-url'), response);
    assert.equal(
        await hook.fetch({
            get url() {
                throw new Error('URL inspection failed');
            },
        }),
        response
    );
});

test('undecodable error responses retain their body and log the HTTP status', async () => {
    const response = new Response('upstream unavailable', { status: 502 });
    const hook = install(async () => response);
    assert.equal(await hook.fetch(manifestUrl), response);
    assert.match(hook.messages[1], /HTTP 502/);
    assert.equal(await response.text(), 'upstream unavailable');
});

test('logging failures cannot change fetch results', async () => {
    const response = Response.json({ error: 'manifest_rejected' }, { status: 500 });
    const hook = install(
        async () => response,
        () => {
            throw new Error('stderr unavailable');
        }
    );
    assert.equal(await hook.fetch(manifestUrl), response);
});

test('original fetch rejections propagate unchanged', async () => {
    const error = new Error('network unavailable');
    const hook = install(async () => {
        throw error;
    });
    await assert.rejects(hook.fetch(manifestUrl), value => value === error);
});

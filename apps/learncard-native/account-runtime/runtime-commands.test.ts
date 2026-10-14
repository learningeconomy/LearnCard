import { beforeAll, expect, test } from 'bun:test';
import { build } from 'esbuild';
import { resolve } from 'node:path';
import { createContext, runInContext } from 'node:vm';
import { webcrypto } from 'node:crypto';

interface AccountAPI {
    call: (method: string, input: unknown) => Promise<string>;
}

let account: AccountAPI;
let bridgeCalls = 0;

beforeAll(async () => {
    // Execute the actual browser bundle in an isolated realm. No initialized identity,
    // server requests, global fetch replacement or module mocks in other test files.
    const output = await build({
        entryPoints: [resolve(import.meta.dir, 'runtime.ts')],
        bundle: true,
        write: false,
        format: 'iife',
        platform: 'browser',
        conditions: ['development', 'browser'],
        alias: {
            '@learncard/didkit-plugin-node': resolve(
                import.meta.dir,
                '../sdk-spike/node-unavailable.ts'
            ),
        },
        plugins: [
            {
                name: 'native-logger',
                setup(builder) {
                    builder.onResolve({ filter: /\/logging\/logger$/ }, () => ({
                        path: resolve(import.meta.dir, 'safe-logger.ts'),
                    }));
                },
            },
        ],
        logLevel: 'silent',
    });
    const refused = async () => {
        bridgeCalls++;
        throw new Error('Unexpected native request');
    };
    const realm = createContext({
        URL,
        URLSearchParams,
        Request,
        Response,
        Headers,
        TextEncoder,
        TextDecoder,
        crypto: webcrypto,
        atob,
        btoa,
        setTimeout,
        clearTimeout,
        console,
        navigator: { userAgent: 'Native account command regression fixture' },
        location: new URL('file:///native-fixture/account-index.html'),
        webkit: {
            messageHandlers: {
                accountNative: { postMessage: refused },
                accountTransport: { postMessage: refused },
            },
        },
    });
    runInContext('globalThis.window = globalThis; globalThis.self = globalThis;', realm);
    runInContext(output.outputFiles[0].text, realm);
    account = realm.LearnCardAccount as AccountAPI;
});

// Exercise every Swift facade route with invalid or signed-out input. Registered
// actions return friendly envelopes; a missing handler throws before that boundary.
test.each([
    'initialize',
    'recover',
    'snapshot',
    'more',
    'claim',
    'create',
    'createDraft',
    'creations',
    'send',
    'recipient',
    'share',
    'updateProfile',
    'signOut',
    'forget',
])(
    'native account command %s rejects unavailable input through its registered handler',
    async method => {
        const reply = JSON.parse(await account.call(method, {}));
        expect(reply.ok).toBe(false);
        expect(reply.error).toBe(
            method === 'initialize'
                ? 'connection'
                : method === 'recover'
                  ? 'recovery'
                  : 'unavailable'
        );
        expect(bridgeCalls).toBe(0);
    }
);

test('signed-out recipient search returns no account data or native requests', async () => {
    const reply = JSON.parse(await account.call('searchRecipients', { query: 'someone' }));
    expect(reply).toEqual({ ok: true, value: [] });
    expect(bridgeCalls).toBe(0);
});

test('unknown and inherited command names are refused', async () => {
    for (const method of ['unknown', 'constructor', 'toString', '__proto__']) {
        await expect(account.call(method, {})).rejects.toThrow('Command refused');
    }
    expect(bridgeCalls).toBe(0);
});

// These routes must remain in the actual dispatch table when feature modules move.
test.each([
    'appsBrowse',
    'appsInstalled',
    'appsInstall',
    'appsRemove',
    'appsReview',
    'appsConsent',
    'appsLaunch',
    'appsIdentity',
    'appsEvent',
    'privacySnapshot',
    'privacyWithdraw',
    'privacyStopLink',
    'privacyLinkURL',
])('consumer command %s uses a registered, sanitized failure envelope', async method => {
    const reply = JSON.parse(await account.call(method, {}));
    expect(reply.ok).toBe(false);
    expect(['consumer:signIn', 'consumer:connection']).toContain(reply.error);
    expect(bridgeCalls).toBe(0);
});

test.each([
    'familiesList',
    'familiesDetail',
    'familiesPinStatus',
    'familiesCreate',
    'familiesEdit',
    'familiesInvite',
])('family command %s is registered and never forwards signed-out input', async method => {
    const reply = JSON.parse(await account.call(method, {}));
    expect(reply.ok).toBe(false);
    expect(['family:unavailable', 'family:decision']).toContain(reply.error);
    expect(bridgeCalls).toBe(0);
});

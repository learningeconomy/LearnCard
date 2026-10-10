const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

const source = path.resolve(__dirname, '../../apps/learn-card-app/tests/mocks/auth.ts');
const exportsForTest = {};
vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(source, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
    }).outputText,
    {
        exports: exportsForTest,
        URL,
        URLSearchParams,
        require: name =>
            name === '../constants' ? { TEST_USER_SEED: 'a'.repeat(64) } : require(name),
    }
);
const { signInMockUser } = exportsForTest;
const profileId = 'e2e-test-user-1';

function fakePage({ payload, ok = true, missing = false, early = false, late = false } = {}) {
    const navigations = [];
    let currentUrl = 'http://localhost:3010/';
    let listener;
    let urlWait;
    let submitted = false;
    let filledSeed;
    const response = {
        url: () => 'http://localhost:4000/trpc/other.query%2Cprofile.getProfile?batch=1',
        ok: () => ok,
        json: async () =>
            payload ?? [{ result: { data: null } }, { result: { data: { profileId } } }],
    };
    const page = {
        goto: async (url, options) => {
            assert.ok(listener, 'Observe profile responses before loading the app');
            assert.equal(options.waitUntil, 'domcontentloaded');
            if (early) listener(response);
            navigations.push(url);
            currentUrl = new URL(url, currentUrl).href;
        },
        url: () => currentUrl,
        on: (event, callback) => {
            assert.equal(event, 'response');
            listener = callback;
        },
        off: (event, callback) => {
            assert.equal(event, 'response');
            assert.equal(callback, listener);
            listener = undefined;
        },
        waitForResponse: (predicate, options) =>
            new Promise((resolve, reject) => {
                assert.equal(submitted, true, 'Start the response timeout after sign-in');
                assert.equal(options.timeout, 1234);
                assert.equal(
                    predicate({ url: () => 'http://localhost:3010/tenant-config.json' }),
                    false
                );
                assert.equal(predicate(response), true, 'Encoded tRPC batches must match');
                if (missing) reject(new Error('Profile response timed out'));
                else resolve(response);
            }),
        waitForURL: (predicate, options) =>
            new Promise(resolve => {
                assert.equal(submitted, false, 'Redirect wait must be armed before submission');
                assert.equal(options.waitUntil, 'domcontentloaded');
                urlWait = { resolve, predicate };
            }),
        getByRole: role => ({
            fill: async seed => {
                assert.equal(role, 'textbox');
                filledSeed = seed;
            },
            click: async () => {
                assert.equal(role, 'button');
                submitted = true;
                assert.ok(listener);
                assert.ok(urlWait);
                const destination = new URL(currentUrl).searchParams.get('next');
                assert.equal(urlWait.predicate(new URL(destination, currentUrl)), true);
                urlWait.resolve();
                if (!missing && !early && !late) listener(response);
            },
        }),
        locator: () => {
            throw new Error('Mock login must not probe the optional profile modal');
        },
    };
    return { page, navigations, getSeed: () => filledSeed, hasListener: () => !!listener };
}

test('mock login verifies the requested profile and redirects without a second page load', async () => {
    const fixture = fakePage();
    const destination = '/launchpad/browse?tab=All#details';
    const seed = 'b'.repeat(64);
    await signInMockUser(fixture.page, { profileId, path: destination, seed }, 1234);
    assert.equal(fixture.navigations.length, 1);
    const url = new URL(fixture.navigations[0], 'http://localhost:3010');
    assert.equal(url.searchParams.get('next'), destination);
    assert.equal(url.searchParams.get('profileId'), profileId);
    assert.equal(fixture.getSeed(), seed);
    assert.equal(fixture.hasListener(), false);
});

test('mock login defaults to the wallet and test seed', async () => {
    const fixture = fakePage();
    await signInMockUser(fixture.page, { profileId }, 1234);
    assert.equal(fixture.getSeed(), 'a'.repeat(64));
    assert.equal(
        new URL(fixture.navigations[0], 'http://localhost:3010').searchParams.get('next'),
        '/wallet'
    );
});

for (const [name, payload] of [
    ['missing profile', [{ result: { data: null } }, { result: { data: null } }]],
    [
        'wrong profile',
        [{ result: { data: { profileId } } }, { result: { data: { profileId: 'wrong' } } }],
    ],
    ['tRPC error', [{ result: { data: null } }, { error: { message: 'unavailable' } }]],
]) {
    test(`mock login rejects a ${name} instead of silently succeeding`, async () => {
        const fixture = fakePage({ payload });
        await assert.rejects(
            signInMockUser(fixture.page, { profileId }, 1234),
            /requested profile/
        );
    });
}

test('mock login rejects HTTP failures', async () => {
    const fixture = fakePage({ ok: false });
    await assert.rejects(signInMockUser(fixture.page, { profileId }, 1234), /lookup must succeed/);
});

test('mock login propagates a missing-response timeout', async () => {
    const fixture = fakePage({ missing: true });
    await assert.rejects(
        signInMockUser(fixture.page, { profileId }, 1234),
        /Profile response timed out/
    );
});

for (const timing of ['early', 'late']) {
    test(`mock login handles ${timing} profile responses without polling for a modal`, async () => {
        const fixture = fakePage({ [timing]: true });
        await signInMockUser(fixture.page, { profileId }, 1234);
        assert.equal(fixture.hasListener(), false);
    });
}

test('default mock profile supports repeated batched boot reads and feature overrides', async () => {
    const mocksDir = path.resolve(__dirname, '../../apps/learn-card-app/tests/mocks');
    function load(file, dependencies) {
        const exports = {};
        vm.runInNewContext(
            ts.transpileModule(fs.readFileSync(path.join(mocksDir, file), 'utf8'), {
                compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
            }).outputText,
            {
                exports,
                URL,
                __dirname: mocksDir,
                process: { env: {} },
                require: name => dependencies[name] ?? require(name),
            }
        );
        return exports;
    }
    const trpc = load('trpc.ts', {});
    const { installNetwork } = load('network.ts', {
        './trpc': trpc,
        '../constants': { TEST_USER_PROFILE_ID: profileId },
    });
    let routeHandler;
    const mock = await installNetwork({
        routeFromHAR: async () => {},
        route: async (_pattern, handler) => {
            routeHandler = handler;
        },
    });
    let data;
    const route = {
        request: () => ({
            headers: () => ({}),
            method: () => 'POST',
            url: () =>
                'http://localhost:4000/trpc/profile.getProfile%2Cprofile.getProfile%2Cprofile.getProfile?batch=1',
            postData: () => '{}',
        }),
        fulfill: async response => {
            data = JSON.parse(response.body);
        },
        fallback: () => {
            throw new Error('Boot reads must not fall through to the single-read HAR');
        },
    };
    await routeHandler(route);
    assert.deepEqual(
        data.map(item => item.result.data.profileId),
        [profileId, profileId, profileId]
    );
    mock.on('profile.getProfile', () => ({ profileId: 'override' }));
    await routeHandler(route);
    assert.deepEqual(
        data.map(item => item.result.data.profileId),
        ['override', 'override', 'override']
    );
});

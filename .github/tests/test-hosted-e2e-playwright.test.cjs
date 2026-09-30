const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const app = path.resolve(__dirname, '../../apps/learn-card-app');

function load(file, dependencies = {}) {
    const output = ts.transpileModule(fs.readFileSync(path.join(app, file), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    const exports = {};
    vm.runInNewContext(
        output,
        {
            exports,
            process,
            URL,
            require: name => dependencies[name] ?? require(name),
        },
        { filename: file }
    );
    return exports;
}

async function checkSetup(config, expectedOrigin) {
    const navigations = [];
    const completedSignIns = [];
    let launches = 0;
    const locator = {
        waitFor: async () => {},
        fill: async () => {},
        click: async () => {},
        first() {
            return this;
        },
    };
    const context = {
        storageState: async () => ({
            origins: [
                {
                    origin: expectedOrigin,
                    localStorage: [
                        {
                            name: 'currentUserStore',
                            value: '{"state":{"currentUser":{"uid":"fixture"}}}',
                        },
                    ],
                },
            ],
        }),
        newPage: async () => ({
            goto: async url => {
                assert.equal(typeof url, 'string', 'navigation URL must exist without webServer');
                navigations.push(url);
            },
            url: () => navigations.at(-1),
            getByRole: () => locator,
            getByText: () => locator,
            waitForURL: async () => {},
            context: () => context,
        }),
    };
    const browserType = {
        launch: async () => {
            launches++;
            return { newContext: async () => context, close: async () => {} };
        },
    };
    const setup = load('playwright-global-setup.ts', {
        '@playwright/test': { chromium: browserType, firefox: browserType },
        './tests/setup-auth': {
            finishSetupSignIn: async (_page, profileId) => {
                completedSignIns.push(profileId);
            },
        },
        './tests/route.helpers': { mockDidKitWasmForContext: async () => {} },
        'learn-card-base/src/logging/logger': { getLogger: () => ({ info() {}, error() {} }) },
    }).default;
    if (expectedOrigin) {
        await setup(config);
        assert.deepEqual(completedSignIns, ['test-demo', 'test-seed-two']);
        assert.deepEqual(
            navigations.map(url => new URL(url).href),
            [expectedOrigin + '/', expectedOrigin + '/developer/sign-in']
        );
    } else {
        await assert.rejects(setup(config), /baseURL.*absolute HTTP\(S\) URL/);
        assert.equal(launches, 0, 'invalid URL must fail before browser launch');
        assert.deepEqual(completedSignIns, []);
    }
}

(async () => {
    process.env.CI = 'true';
    let failures = 0;
    for (const mode of ['false', 'true']) {
        process.env.E2E_EXTERNAL_STACK = mode;
        const config = load('playwright.config.ts').default;
        assert.equal(config.webServer === undefined, mode === 'true');
        assert.equal(config.workers, 1);
        assert.equal(
            config.reporter.some(([name]) => name === 'github'),
            true
        );
        const a11y = load('playwright.a11y.config.ts', {
            './playwright.config': { default: config, __esModule: true },
        }).default;
        assert.equal(a11y.webServer, config.webServer);
        assert.equal(a11y.workers, 1);
        const parallel = load('playwright.parallel.config.ts', {
            './playwright.config': { default: config, __esModule: true },
        }).default;
        assert.equal(parallel.workers, 2);
        assert.equal(parallel.fullyParallel, true);
        assert.equal(parallel.globalSetup, undefined);
        assert.deepEqual(JSON.parse(JSON.stringify(parallel.use.storageState)), {
            cookies: [],
            origins: [],
        });
        for (const file of ['app-store', 'wallet-credentials', 'consent-flow-race']) {
            assert.equal(parallel.testMatch.test(`${file}.spec.ts`), true);
        }
        assert.equal(parallel.testMatch.test('accessibility.spec.ts'), false);
        assert.equal(parallel.testMatch.test('credentials.spec.ts'), false);
        const mocked = load('playwright.mock.config.ts', {
            './playwright.config': { default: config, __esModule: true },
        }).default;
        assert.equal(mocked.workers, 2);
        assert.equal(mocked.fullyParallel, true);
        assert.equal(mocked.globalSetup, undefined);

        for (const [baseURL, origin] of [
            ['http://localhost:3000', 'http://localhost:3000'],
            ['https://example.test:8443/', 'https://example.test:8443'],
            [undefined, undefined],
            ['relative', undefined],
            ['file:///tmp/test', undefined],
        ]) {
            const fullConfig = {
                ...config,
                projects: [{ name: 'firefox', use: { ...config.use, baseURL } }],
            };
            try {
                await checkSetup(fullConfig, origin);
            } catch (error) {
                failures++;
                console.error(`FAIL mode=${mode} baseURL=${baseURL}: ${error.message}`);
            }
        }
    }
    // Drive the real actor fixture across workers and a retry. They must never
    // reuse backend identities or inherit the demo user's browser state.
    let fixtures;
    load('tests/fixtures/isolated-test.ts', {
        './mocked-test': {
            test: {
                extend: value => {
                    fixtures = value;
                },
            },
        },
        '@playwright/test': { expect: {} },
    });
    assert.deepEqual(JSON.parse(JSON.stringify(fixtures.storageState)), {
        cookies: [],
        origins: [],
    });
    const identities = new Set();
    const seeds = new Set();
    for (const attempt of [
        { parallelIndex: 0, retry: 0 },
        { parallelIndex: 1, retry: 0 },
        { parallelIndex: 0, retry: 1 },
    ]) {
        await fixtures.actors(
            { browserName: 'firefox' },
            async actors => {
                for (const actor of Object.values(actors)) {
                    assert.match(actor.seed, /^[a-f0-9]{64}$/);
                    assert.match(actor.profileId, /^[a-z0-9-]+$/);
                    assert.ok(actor.profileId.length <= 64);
                    assert.ok(
                        !identities.has(actor.profileId),
                        'backend profile reused across attempts'
                    );
                    assert.ok(!seeds.has(actor.seed), 'backend seed reused across attempts');
                    identities.add(actor.profileId);
                    seeds.add(actor.seed);
                }
            },
            attempt
        );
    }
    assert.equal(failures, 0, 'global setup URL contract failures');
    console.log(
        'Hosted E2E Playwright tests passed (2 config modes, 10 global setup URL cases, a11y inheritance)'
    );
})().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
});

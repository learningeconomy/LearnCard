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
        './tests/test.helpers': { locatorExists: async () => false },
        './tests/route.helpers': { mockDidKitWasmForContext: async () => {} },
        'learn-card-base/src/logging/logger': { getLogger: () => ({ info() {}, error() {} }) },
    }).default;
    if (expectedOrigin) {
        await setup(config);
        assert.deepEqual(
            navigations.map(url => new URL(url).href),
            [expectedOrigin + '/', expectedOrigin + '/hidden/seed']
        );
    } else {
        await assert.rejects(setup(config), /baseURL.*absolute HTTP\(S\) URL/);
        assert.equal(launches, 0, 'invalid URL must fail before browser launch');
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
    assert.equal(failures, 0, 'global setup URL contract failures');
    console.log(
        'Hosted E2E Playwright tests passed (2 config modes, 10 global setup URL cases, a11y inheritance)'
    );
})().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
});

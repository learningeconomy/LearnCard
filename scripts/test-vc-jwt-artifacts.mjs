#!/usr/bin/env node
/**
 * LC-2195 packaged-artifact and browser-parity harness.
 *
 * Validates the release artifacts a consumer actually receives, not vitest
 * source aliases:
 *
 *   Phase 1  production export resolution (no `development` condition) for the
 *            built didkit and VC plugins plus the native addon
 *   Phase 2  real Chrome (via playwright-core against the installed browser)
 *            running the built DIDKit WASM through the positive/negative
 *            VC-JWT matrix plus a local text/plain 1EdTech refresh
 *   Phase 3  the freshly built native addon matrix (test-jwt-verify.mjs)
 *
 * Requires a prior `BUILD_DIDKIT_NAPI=1 bunx nx run didkit-plugin-node:build`
 * and `bunx nx run didkit-plugin:build` / `vc-plugin:build` in this checkout.
 *
 * Usage: node scripts/test-vc-jwt-artifacts.mjs [--skip-native] [--skip-browser]
 *        CHROME_PATH=/path/to/chrome (optional)
 */

import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import esbuild from 'esbuild';
import { chromium } from 'playwright-core';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));

const DIDKIT_DIST_WASM = path.join(root, 'packages/plugins/didkit/dist/didkit/didkit_wasm_bg.wasm');
const BROWSER_ENTRY = path.join(root, 'scripts/vc-jwt-browser-entry.ts');
const NATIVE_TEST = path.join(root, 'packages/plugins/didkit-plugin-node/test-jwt-verify.mjs');
const NATIVE_REFRESH_TEST = path.join(
    root,
    'packages/plugins/didkit-plugin-node/test-native-refresh.mjs'
);

const failures = [];
const checks = [];

const check = (name, ok, detail = '') => {
    checks.push({ name, ok: !!ok, detail: String(detail) });
    if (!ok) failures.push(name);
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  -- ${detail}` : ''}`);
};

const findChrome = () => {
    const candidates = [
        process.env.CHROME_PATH,
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser',
    ].filter(Boolean);
    return candidates.find(candidate => existsSync(candidate));
};

// --- Phase 1: production export resolution ---------------------------------------
const runNode = code => spawnSync(process.execPath, ['-e', code], { cwd: root, encoding: 'utf8' });

const phase1 = () => {
    console.log('\n=== Phase 1: production export resolution (no development condition) ===');

    const native = runNode(`
        const resolved = require.resolve('@learncard/didkit-plugin-node');
        const { getDidKitPlugin } = require('@learncard/didkit-plugin-node');
        if (typeof getDidKitPlugin !== 'function') { console.error('missing getDidKitPlugin'); process.exit(1); }
        getDidKitPlugin().then(plugin => {
            const missing = ['verifyCredential','issueCredential'].filter(k => typeof plugin.methods[k] !== 'function');
            if (missing.length) { console.error('missing native methods: ' + missing.join(',')); process.exit(1); }
            console.log(JSON.stringify({ resolved, methodsReady: true }));
        }).catch(error => { console.error(error); process.exit(1); });
    `);
    if (!args.has('--skip-native')) {
        check(
            'didkit-plugin-node production require loads the addon and exposes real methods',
            native.status === 0,
            native.stderr || native.stdout
        );
        check(
            'didkit-plugin-node resolves to built dist, not src',
            native.status === 0 && !/[/\\]src[/\\]/.test(native.stdout || ''),
            native.stdout
        );
    }

    const vc = runNode(`
        import('@learncard/vc-plugin').then(mod => {
            const fns = ['verifyCredentialJwt','refreshCredential','getVCPlugin','extractCompactJwt'];
            const missing = fns.filter(k => typeof mod[k] !== 'function');
            if (missing.length) { console.error('missing vc exports: ' + missing.join(',')); process.exit(1); }
            console.log('vc exports ok');
        }).catch(e => { console.error(e); process.exit(1); });
    `);
    check(
        'vc-plugin production import resolves built exports',
        vc.status === 0,
        vc.stderr || vc.stdout
    );

    const didkit = runNode(`
        import('@learncard/didkit-plugin').then(mod => {
            if (typeof mod.getDidKitPlugin !== 'function') { console.error('missing getDidKitPlugin'); process.exit(1); }
            console.log('didkit exports ok');
        }).catch(e => { console.error(e); process.exit(1); });
    `);
    check(
        'didkit-plugin production import resolves built exports',
        didkit.status === 0,
        didkit.stderr || didkit.stdout
    );

    check(
        'DIDKit WASM artifact exists in built dist',
        existsSync(DIDKIT_DIST_WASM),
        DIDKIT_DIST_WASM
    );
};

// --- Phase 2: real browser ---------------------------------------------------------
const phase2 = async () => {
    console.log('\n=== Phase 2: real-browser WASM parity (Chrome) ===');

    const chrome = findChrome();
    if (!chrome) {
        check('a Chrome/Chromium binary is available for browser parity', false, 'set CHROME_PATH');
        return;
    }
    check('Chrome/Chromium binary located', true, chrome);
    check('built DIDKit WASM present for browser', existsSync(DIDKIT_DIST_WASM), DIDKIT_DIST_WASM);

    const outDir = mkdtempSync(path.join(tmpdir(), 'lc-vc-jwt-browser-'));
    await esbuild.build({
        entryPoints: [BROWSER_ENTRY],
        bundle: true,
        format: 'esm',
        platform: 'browser',
        target: 'es2020',
        outfile: path.join(outDir, 'harness.js'),
        define: { 'process.env.NODE_ENV': '"production"' },
        logLevel: 'warning',
    });
    check('production-condition browser bundle built', true, outDir);

    const wasmBytes = readFileSync(DIDKIT_DIST_WASM);
    const state = { replacementToken: '', hits: { standard: 0, attacker: 0, managed: 0 } };

    const server = createServer((req, res) => {
        const url = new URL(req.url, 'http://127.0.0.1');
        const send = (status, type, body) => {
            res.writeHead(status, {
                'content-type': type,
                'cache-control': 'no-store',
                'access-control-allow-origin': '*',
            });
            res.end(body);
        };

        if (url.pathname === '/') {
            send(
                200,
                'text/html',
                `<!doctype html><html><head><meta charset="utf-8"><title>LC-2195</title></head>
                 <body><script type="module" src="/harness.js"></script></body></html>`
            );
            return;
        }
        if (url.pathname === '/harness.js') {
            send(200, 'text/javascript', readFileSync(path.join(outDir, 'harness.js')));
            return;
        }
        if (url.pathname === '/didkit_wasm_bg.wasm') {
            send(200, 'application/wasm', wasmBytes);
            return;
        }
        if (url.pathname === '/set-replacement' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
                body += chunk;
            });
            req.on('end', () => {
                try {
                    state.replacementToken = JSON.parse(body).token;
                    send(200, 'application/json', '{"ok":true}');
                } catch (error) {
                    send(400, 'application/json', JSON.stringify({ error: String(error) }));
                }
            });
            return;
        }
        if (url.pathname === '/refresh/standard') {
            state.hits.standard += 1;
            send(200, 'text/plain; charset=UTF-8', state.replacementToken);
            return;
        }
        if (url.pathname === '/refresh/attacker') {
            state.hits.attacker += 1;
            send(200, 'text/plain', state.replacementToken);
            return;
        }
        if (url.pathname === '/refresh/managed') {
            state.hits.managed += 1;
            // A managed service must never answer a standard request; the client
            // must reject text/plain before parsing this body.
            send(200, 'text/plain', 'not-a-managed-jwe');
            return;
        }
        if (url.pathname === '/__hits') {
            send(200, 'application/json', JSON.stringify(state.hits));
            return;
        }

        send(404, 'text/plain', 'not found');
    });

    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    const origin = `http://127.0.0.1:${port}`;
    check('local refresh endpoint listening on loopback', true, origin);

    const browser = await chromium.launch({ executablePath: chrome, headless: true });
    let browserResults;

    try {
        const page = await browser.newPage();
        await page.goto(`${origin}/`, { waitUntil: 'load', timeout: 30_000 });
        await page.waitForFunction(
            () => window.__LC_VC_JWT_RESULTS__ && window.__LC_VC_JWT_RESULTS__.done,
            { timeout: 120_000 }
        );

        browserResults = await page.evaluate(() => window.__LC_VC_JWT_RESULTS__);
    } finally {
        await browser.close();
        await new Promise(resolve => server.close(resolve));
    }

    if (!browserResults) {
        check('browser harness produced results', false);
        return;
    }
    if (browserResults.fatal) {
        check('browser harness completed without a fatal error', false, browserResults.fatal);
        return;
    }

    for (const result of browserResults.checks) {
        check(`[browser] ${result.name}`, result.ok, result.detail);
    }
    console.log(`\nBrowser checks: ${browserResults.checks.length}`);
};

// --- Phase 3: native addon ---------------------------------------------------------
const phase3 = () => {
    console.log('\n=== Phase 3: freshly built native addon matrix ===');

    if (!existsSync(NATIVE_TEST)) {
        check('native JWT parity test present', false, NATIVE_TEST);
        return;
    }

    const result = spawnSync(process.execPath, [NATIVE_TEST], {
        cwd: path.dirname(NATIVE_TEST),
        encoding: 'utf8',
    });

    console.log(result.stdout || '');
    if (result.stderr) console.error(result.stderr);

    check('native addon JWT parity matrix passes', result.status === 0, `exit ${result.status}`);

    if (!existsSync(NATIVE_REFRESH_TEST)) {
        check('native renewal refresh test present', false, NATIVE_REFRESH_TEST);
        return;
    }

    const refresh = spawnSync(process.execPath, [NATIVE_REFRESH_TEST], {
        cwd: path.dirname(NATIVE_REFRESH_TEST),
        encoding: 'utf8',
    });

    console.log(refresh.stdout || '');
    if (refresh.stderr) console.error(refresh.stderr);

    check(
        'native addon exercises expired-held -> HTTP -> replacement refresh',
        refresh.status === 0,
        `exit ${refresh.status}`
    );
};

const main = async () => {
    console.log(`LC-2195 artifact harness in ${root}`);

    phase1();
    if (!args.has('--skip-browser')) await phase2();
    if (!args.has('--skip-native')) phase3();

    console.log('\n=== Summary ===');
    const passed = checks.filter(entry => entry.ok).length;
    console.log(`${passed}/${checks.length} checks passed`);

    if (failures.length > 0) {
        console.error(`\n${failures.length} FAILED:`);
        failures.forEach(name => console.error(`  - ${name}`));
        process.exit(1);
    }

    console.log('\nAll LC-2195 artifact checks passed.');
};

main().catch(error => {
    console.error(error);
    process.exit(1);
});

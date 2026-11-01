import { build } from 'vite';
import { chromium, expect } from '@playwright/test';
import { execFileSync, spawn } from 'node:child_process';
import { createServer } from 'node:http';
import {
    closeSync,
    cpSync,
    existsSync,
    mkdirSync,
    openSync,
    readFileSync,
    statSync,
    writeFileSync,
} from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';

const types = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.wasm': 'application/wasm',
};

/** Preserve SPA fallback behavior while confining requests to this fixture's output. */
export const createFixtureServer = directory => {
    const root = resolve(directory);
    return createServer((request, response) => {
        try {
            const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
            if (path.includes('\0')) {
                response.writeHead(400).end();
                return;
            }
            const file = resolve(root, '.' + path);
            if (!file.startsWith(root + sep) && file !== root) {
                response.writeHead(403).end();
                return;
            }
            // Missing lazy modules must still return 200 HTML, as on the actual SPA host.
            const target =
                existsSync(file) && statSync(file).isFile() ? file : join(root, 'index.html');
            const body = readFileSync(target);
            response.setHeader(
                'Content-Type',
                types[extname(target)] ?? 'application/octet-stream'
            );
            response.end(body);
        } catch {
            response.writeHead(400).end();
        }
    });
};

export const getSmokeTimeout = value => {
    if (value === undefined) return 180000;
    const ms = Number(value);
    if (!Number.isSafeInteger(ms) || ms <= 0 || ms > 2147483647) {
        throw new Error('SQLITE_BUILD_SMOKE_TIMEOUT_MS must be a positive integer <= 2147483647');
    }
    return ms;
};

/** Wait until child stdio closes so private logs are complete before closing their descriptor. */
export const waitForChild = child =>
    new Promise((resolve, reject) => {
        child.once('error', reject);
        child.once('close', (code, signal) => {
            if (code === 0) resolve();
            else
                reject(
                    new Error(
                        signal
                            ? `Production-build smoketests terminated by signal ${signal} (possible timeout); inspect private log`
                            : `Production-build smoketests failed with exit code ${code}; inspect private log`
                    )
                );
        });
    });

const main = async () => {
    const { values } = parseArgs({ options: { output: { type: 'string' } } });
    if (!values.output) throw new Error('Use --output <new private evidence directory>');
    const repo = resolve(import.meta.dirname, '..');
    const output = resolve(values.output);
    mkdirSync(output, { mode: 0o700 });
    const dist = join(output, 'dist');
    await build({
        configFile: false,
        envFile: false,
        root: join(repo, 'packages/learn-card-base/tests/sqlite-web-build'),
        publicDir: false,
        logLevel: 'warn',
        resolve: {
            alias: { 'learn-card-base': join(repo, 'packages/learn-card-base/src') },
            dedupe: ['react', 'react-dom'],
        },
        build: { outDir: dist, emptyOutDir: false, target: 'es2022' },
    });
    mkdirSync(join(dist, 'assets'), { recursive: true });
    cpSync(
        join(repo, 'apps/learn-card-app/public/assets/sql-wasm.wasm'),
        join(dist, 'assets/sql-wasm.wasm')
    );

    const server = createFixtureServer(dist);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    let browser;
    const errors = [],
        badAssets = [],
        external = [];
    try {
        const origin = `http://127.0.0.1:${server.address().port}`;
        browser = await chromium.launch();
        const context = await browser.newContext();
        await context.route('**/*', route => {
            const url = route.request().url();
            if (new URL(url).origin === origin) return route.continue();
            external.push(url);
            return route.abort();
        });
        const page = await context.newPage();
        page.on('pageerror', error => errors.push(String(error)));
        page.on('console', message => {
            if (message.type() === 'error') errors.push(message.text());
        });
        page.on('response', response => {
            const path = new URL(response.url()).pathname;
            if (
                /\.(js|css|wasm)$/.test(path) &&
                (response.status() >= 400 ||
                    response.headers()['content-type']?.includes('text/html'))
            )
                badAssets.push(path);
        });
        await page.goto(origin);
        await expect(page.getByRole('button', { name: 'Write synthetic row' })).toBeEnabled({
            timeout: 15000,
        });
        await page.getByRole('button', { name: 'Write synthetic row' }).click();
        await expect(page.getByRole('status')).toHaveText('Saved synthetic row');
        await page.reload();
        await expect(page.getByRole('button', { name: 'Read saved row' })).toBeEnabled();
        await page.getByRole('button', { name: 'Read saved row' }).click();
        await expect(page.getByRole('status')).toHaveText('Restored synthetic row');
        expect(errors).toEqual([]);
        expect(badAssets).toEqual([]);
        expect(external).toEqual([]);
        await page.screenshot({ path: join(output, 'sqlite-production-build.png') });
        // Run the real deployed-smoke assertions against this production build too.
        // Spawn asynchronously so the task-owned HTTP server can keep serving requests.
        const smokeLog = openSync(join(output, 'smoke-private.log'), 'w', 0o600);
        try {
            const child = spawn(
                process.execPath,
                [
                    join(repo, 'node_modules/@playwright/test/cli.js'),
                    'test',
                    '--project=browser',
                    '--retries=0',
                    '--reporter=line',
                    '--output',
                    join(output, 'smoke-private-results'),
                    '--grep',
                    'no critical JS console errors on load|critical assets load successfully',
                ],
                {
                    cwd: join(repo, 'tests/smoketests'),
                    env: { ...process.env, SMOKETEST_ENV: 'staging', SMOKETEST_APP_URL: origin },
                    stdio: ['ignore', smokeLog, smokeLog],
                    timeout: getSmokeTimeout(process.env.SQLITE_BUILD_SMOKE_TIMEOUT_MS),
                }
            );
            await waitForChild(child);
        } finally {
            closeSync(smokeLog);
        }
        const result = {
            head: execFileSync('git', ['rev-parse', 'HEAD'], {
                cwd: repo,
                encoding: 'utf8',
            }).trim(),
            productionBuild: true,
            persistedAcrossReload: true,
            deployedSmokeAssertionsPassed: true,
            browserErrors: errors.length,
            badAssets: badAssets.length,
            externalRequests: external.length,
        };
        writeFileSync(join(output, 'summary.json'), JSON.stringify(result, null, 2) + '\n');
        console.log(JSON.stringify(result));
    } finally {
        writeFileSync(
            join(output, 'diagnostics-private.json'),
            JSON.stringify({ errors, badAssets, external }, null, 2)
        );
        await browser?.close();
        await new Promise(resolve => server.close(resolve));
    }
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();

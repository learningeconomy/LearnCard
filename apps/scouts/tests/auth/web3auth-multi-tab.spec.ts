import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createServer, type Server, type ServerResponse } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import type {} from './fixtures/web3auth-multi-tab';

let server: Server;
let origin: string;
let connections = 0;
const usedTokens = new Set<string>();
const waitingTabs: ServerResponse[] = [];
test.beforeAll(async () => {
    const directory = mkdtempSync(join(tmpdir(), 'web3auth-multi-tab-'));
    let script: string;
    try {
        const output = join(directory, 'fixture.js');
        execFileSync('bun', [resolve(__dirname, 'fixtures/build-web3auth-fixture.ts'), output]);
        script = readFileSync(output, 'utf8');
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
    server = createServer((request, response) => {
        if (request.url === '/derivation-start') {
            waitingTabs.push(response);
            if (waitingTabs.length === 4) waitingTabs.forEach(tab => tab.end());
        } else if (request.url === '/connect') {
            let token = '';
            request.on('data', chunk => {
                token += chunk.toString();
            });
            request.on('end', () => {
                connections++;
                const reused = usedTokens.has(token);
                usedTokens.add(token);
                // Make competing tabs overlap before the first session is saved.
                setTimeout(() => {
                    response.statusCode = reused ? 409 : 200;
                    response.end();
                }, 100);
            });
        } else if (request.url === '/fixture.js') {
            response.setHeader('Content-Type', 'application/javascript');
            response.end(script);
        } else {
            response.setHeader('Content-Type', 'text/html');
            response.end('<!doctype html><script src="/fixture.js"></script>');
        }
    });
    await new Promise<void>(resolveListening => server.listen(0, '127.0.0.1', resolveListening));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Missing server address');
    origin = `http://127.0.0.1:${address.port}`;
});
test.afterAll(async () => {
    if (server) await new Promise<void>(resolveClosed => server.close(() => resolveClosed()));
});
test.beforeEach(() => {
    connections = 0;
    usedTokens.clear();
    waitingTabs.length = 0;
});

test('a hung tab bounds queued sign-in without stealing its lock, then permits retry', async ({
    context,
}) => {
    const holder = await context.newPage();
    await holder.goto(origin);
    await holder.evaluate(async () => {
        await new Promise<void>(acquired => {
            void navigator.locks.request('learncard:web3auth:key-derivation', () => {
                acquired();
                return new Promise<void>(() => {});
            });
        });
    });
    const waiting = await context.newPage();
    await waiting.clock.install();
    await waiting.goto(origin);
    const messages: string[] = [];
    waiting.on('console', message => messages.push(message.text()));
    const result = waiting.evaluate(() =>
        window.web3AuthTabTest.deriveWithoutFirebase().catch((error: Error) => error.message)
    );
    await expect
        .poll(() => waiting.evaluate(async () => (await navigator.locks.query()).pending?.length))
        .toBe(1);
    await waiting.clock.runFor(30_000);
    expect(await result).toContain('Sign-in is taking longer in another tab');
    expect(
        messages.some(message => message.includes('Waiting for another tab to finish sign-in'))
    ).toBe(true);
    expect(connections).toBe(0);
    const locks = await holder.evaluate(() => navigator.locks.query());
    expect(locks.pending).toHaveLength(0);
    expect(
        locks.held?.filter(lock => lock.name === 'learncard:web3auth:key-derivation')
    ).toHaveLength(1);
    // Closing the holder releases its real browser lock. The expired request
    // must not run later; retry starts a new operation and makes one connection.
    await holder.close();
    expect(await waiting.evaluate(() => window.web3AuthTabTest.deriveWithoutFirebase())).toBe(
        'synthetic-private-key'
    );
    expect(connections).toBe(1);
});

test('one Firebase login coordinates ordinary setup and legacy upgrade across signed-out tabs', async ({
    context,
}) => {
    const encode = (value: unknown): string =>
        Buffer.from(JSON.stringify(value)).toString('base64url');
    const now = Math.floor(Date.now() / 1000);
    const idToken = `${encode({ alg: 'RS256' })}.${encode({ sub: 'test-user', aud: 'test-project', iss: 'https://securetoken.google.com/test-project', iat: now, exp: now + 3600 })}.synthetic-signature`;
    await context.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (url.origin === origin) return route.continue();
        if (
            url.hostname === 'identitytoolkit.googleapis.com' &&
            url.pathname.endsWith(':signInWithCustomToken')
        ) {
            return route.fulfill({
                json: {
                    idToken,
                    refreshToken: 'synthetic-refresh-token',
                    expiresIn: '3600',
                    localId: 'test-user',
                },
            });
        }
        if (url.hostname === 'identitytoolkit.googleapis.com' && url.pathname.endsWith(':lookup')) {
            return route.fulfill({
                json: { users: [{ localId: 'test-user', createdAt: String(now * 1000) }] },
            });
        }
        throw new Error(`Unexpected external request to ${url.hostname}`);
    });
    const tabs = await Promise.all(Array.from({ length: 4 }, () => context.newPage()));
    await Promise.all(
        tabs.map(async (tab, index) => {
            await tab.goto(`${origin}${index % 2 ? '/?upgrade' : '/'}`);
            await tab.evaluate(() => window.web3AuthTabTest.ready());
            expect(await tab.evaluate(() => window.web3AuthTabTest.status)).toBe('idle');
        })
    );
    await tabs[0]!.evaluate(() => window.web3AuthTabTest.signIn());
    for (const tab of tabs) {
        await expect.poll(() => tab.evaluate(() => window.web3AuthTabTest.status)).toBe('ready');
        expect(await tab.evaluate(() => window.web3AuthTabTest.key)).toBe('synthetic-private-key');
        expect(await tab.evaluate(() => window.web3AuthTabTest.error)).toBeUndefined();
    }
    expect(connections).toBe(1);
});

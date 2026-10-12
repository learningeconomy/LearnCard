import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { expect, test, type Page } from '@playwright/test';
import type { FirebaseLogoutHarness } from './fixtures/firebase-logout';

let server: Server;
let origin: string;

const currentUser = (page: Page): Promise<ReturnType<FirebaseLogoutHarness['currentUserId']>> =>
    page.evaluate(() => window.firebaseLogoutTest.currentUserId());

test.beforeAll(async () => {
    const directory = mkdtempSync(join(tmpdir(), 'firebase-logout-'));
    let script: string;
    try {
        const output = join(directory, 'fixture.js');
        execFileSync('bun', [
            'build',
            resolve(__dirname, 'fixtures/firebase-logout.ts'),
            '--target=browser',
            '--format=iife',
            '--define',
            'import.meta.env={}',
            '--outfile',
            output,
        ]);
        script = readFileSync(output, 'utf8');
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }

    server = createServer((request, response) => {
        if (request.url === '/fixture.js') {
            response.setHeader('Content-Type', 'application/javascript');
            response.end(script);
        } else {
            response.setHeader('Content-Type', 'text/html');
            response.end('<!doctype html><script src="/fixture.js"></script>');
        }
    });
    await new Promise<void>(resolveListening => server.listen(0, '127.0.0.1', resolveListening));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Missing fixture server address');
    origin = `http://127.0.0.1:${address.port}`;
});

test.afterAll(async () => {
    if (server) await new Promise<void>(resolveClosed => server.close(() => resolveClosed()));
});

test('logout removes the persisted user and permits login with older Firebase tabs open', async ({
    context,
}) => {
    // Synthetic tokens and responses only; no request reaches a live Firebase project.
    const now = Math.floor(Date.now() / 1000);
    const encode = (value: unknown): string =>
        Buffer.from(JSON.stringify(value)).toString('base64url');
    const idToken = `${encode({ alg: 'RS256' })}.${encode({
        sub: 'test-user',
        aud: 'test-project',
        iss: 'https://securetoken.google.com/test-project',
        iat: now,
        auth_time: now,
        exp: now + 3600,
    })}.test-signature`;

    await context.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (url.origin === origin) return route.continue();
        if (url.hostname === 'identitytoolkit.googleapis.com') {
            if (url.pathname.endsWith(':signInWithCustomToken')) {
                return route.fulfill({
                    json: {
                        idToken,
                        refreshToken: 'test-refresh-token',
                        expiresIn: '3600',
                        localId: 'test-user',
                    },
                });
            }
            if (url.pathname.endsWith(':lookup')) {
                return route.fulfill({
                    json: {
                        users: [{ localId: 'test-user', createdAt: String(now * 1000) }],
                    },
                });
            }
        }
        if (url.hostname === 'firebaseinstallations.googleapis.com') {
            const body = route.request().postDataJSON();
            return route.fulfill({
                json: {
                    fid: body.fid,
                    refreshToken: 'test-installation-refresh-token',
                    authToken: { token: 'test-installation-token', expiresIn: '3600s' },
                },
            });
        }
        throw new Error(`Unexpected external request to ${url.hostname}${url.pathname}`);
    });

    const olderTab = await context.newPage();
    await olderTab.goto(origin);
    await olderTab.evaluate(() => window.firebaseLogoutTest.ready());
    expect(await olderTab.evaluate(() => window.firebaseLogoutTest.signIn())).toBe('test-user');
    const installationId = await olderTab.evaluate(() =>
        window.firebaseLogoutTest.installationId()
    );

    const logoutTab = await context.newPage();
    await logoutTab.goto(origin);
    await logoutTab.evaluate(() => window.firebaseLogoutTest.ready());
    expect(await currentUser(logoutTab)).toBe('test-user');

    const blockedWarnings: string[] = [];
    logoutTab.on('console', message => {
        if (message.text().includes('IndexedDB logout cleanup blocked')) {
            blockedWarnings.push(message.text());
        }
    });

    await logoutTab.evaluate(() => window.firebaseLogoutTest.logout());
    expect(await currentUser(logoutTab)).toBeNull();
    await expect.poll(() => currentUser(olderTab)).toBeNull();

    for (let cycle = 0; cycle < 2; cycle++) {
        // A fresh context on the same origin must initialize while both old tabs remain open.
        const freshTab = await context.newPage();
        await freshTab.goto(origin);
        await freshTab.evaluate(() => window.firebaseLogoutTest.ready());
        expect(await currentUser(freshTab)).toBeNull();
        expect(await freshTab.evaluate(() => window.firebaseLogoutTest.installationId())).toBe(
            installationId
        );
        expect(await freshTab.evaluate(() => window.firebaseLogoutTest.signIn())).toBe('test-user');
        await freshTab.evaluate(() => window.firebaseLogoutTest.logout());
        await expect.poll(() => currentUser(olderTab)).toBeNull();
        await freshTab.close();
    }

    // The auth DB remains open, but its signed-in user record must be gone.
    const userKeys = await logoutTab.evaluate(async () => {
        const request = indexedDB.open('firebaseLocalStorageDb');
        const database = await new Promise<IDBDatabase>((resolveDb, reject) => {
            request.onsuccess = () => resolveDb(request.result);
            request.onerror = () => reject(request.error);
        });
        try {
            const keysRequest = database
                .transaction('firebaseLocalStorage')
                .objectStore('firebaseLocalStorage')
                .getAllKeys();
            const keys = await new Promise<IDBValidKey[]>((resolveKeys, reject) => {
                keysRequest.onsuccess = () => resolveKeys(keysRequest.result);
                keysRequest.onerror = () => reject(keysRequest.error);
            });
            return keys.filter(
                key => typeof key === 'string' && key.startsWith('firebase:authUser:')
            );
        } finally {
            database.close();
        }
    });
    expect(userKeys).toEqual([]);

    expect(blockedWarnings).toEqual([]);
});

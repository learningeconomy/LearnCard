import { expect, test } from '@playwright/test';

import {
    authenticateTestPage,
    BACKEND_URL,
    createTestLoginPresentation,
    createTestPresentation,
    createTestSession,
} from '../auth';

test.describe('Authentication Flow', () => {
    test('starts challenged login and accepts an authenticated backend session', async ({
        page,
        baseURL,
    }) => {
        await page.goto('/login');

        const loginButton = page.getByRole('link', {
            name: /LearnCard/,
        });

        await expect(loginButton).toBeVisible();

        const loginUrl = new URL((await loginButton.getAttribute('href')) ?? '');

        expect(loginUrl.origin).toBe(BACKEND_URL);
        expect(loginUrl.pathname).toBe('/auth/login');
        expect(loginUrl.searchParams.get('returnTo')).toBe(new URL('/topics', baseURL).toString());

        const did = await authenticateTestPage(page, baseURL!);
        const websocketTicketResponse = page.waitForResponse(
            response =>
                new URL(response.url()).pathname === '/auth/websocket-ticket' &&
                response.request().method() === 'POST'
        );

        await page.reload();

        await expect(page).toHaveURL('/topics', { timeout: 10_000 });
        await expect(
            page.getByRole('heading', {
                name: 'What would you like to learn about today?',
            })
        ).toBeVisible();
        expect((await websocketTicketResponse).ok()).toBe(true);

        const sessionResponse = await page.request.get(`${BACKEND_URL}/auth/session`, {
            headers: { Origin: baseURL! },
        });

        expect(sessionResponse.ok()).toBe(true);
        expect(await sessionResponse.json()).toMatchObject({
            authenticated: true,
            did,
        });

        const cookies = await page.context().cookies(BACKEND_URL);

        expect(cookies.find(cookie => cookie.name === 'ai_passport_session')).toBeDefined();
        expect(cookies.find(cookie => cookie.name === 'did')).toBeUndefined();
        expect(await page.evaluate(() => localStorage.getItem('did'))).toBeNull();
    });

    test('completes top-level login without putting the VP in the request URL', async ({
        page,
        baseURL,
    }) => {
        const { challenge, did, vp } = await createTestPresentation(page, baseURL!);
        const callbackUrl = new URL('/auth/callback', BACKEND_URL);

        callbackUrl.searchParams.set('challenge', challenge);
        callbackUrl.searchParams.set('response_mode', 'fragment');

        expect(callbackUrl.searchParams.has('vp')).toBe(false);

        await page.goto(`${callbackUrl}#${new URLSearchParams({ vp }).toString()}`);

        await expect(page).toHaveURL('/topics', { timeout: 10_000 });

        const sessionResponse = await page.request.get(`${BACKEND_URL}/auth/session`, {
            headers: { Origin: baseURL! },
        });

        expect(await sessionResponse.json()).toMatchObject({
            authenticated: true,
            did,
        });
        expect(
            (await page.context().cookies(BACKEND_URL)).some(cookie =>
                cookie.name.startsWith('ai_passport_login_')
            )
        ).toBe(false);
    });

    test('completes shipped login with bearer auth when session cookies are blocked', async ({
        page,
        baseURL,
    }) => {
        await page.route(`${BACKEND_URL}/auth/callback**`, async route => {
            if (route.request().method() === 'GET') {
                await route.continue();
                return;
            }

            const response = await route.fetch();
            const headers = response.headers();

            delete headers['set-cookie'];
            await page.context().clearCookies();
            await route.fulfill({ response, headers });
        });
        await page.route(`${BACKEND_URL}/auth/handoff`, async route => {
            const response = await route.fetch();
            const headers = response.headers();

            delete headers['set-cookie'];
            await page.context().clearCookies();
            await route.fulfill({ response, headers });
        });

        const returnTo = new URL('/topics', baseURL).toString();
        const { callbackUrl, did, vp } = await createTestLoginPresentation(page, returnTo);
        const websocketTicketResponse = page.waitForResponse(
            response =>
                new URL(response.url()).pathname === '/auth/websocket-ticket' &&
                response.request().method() === 'POST'
        );

        await page.goto(`${callbackUrl}#${new URLSearchParams({ vp }).toString()}`);
        await expect(page).toHaveURL('/topics', { timeout: 10_000 });
        await expect(
            page.getByRole('heading', {
                name: 'What would you like to learn about today?',
            })
        ).toBeVisible();

        const ticketResponse = await websocketTicketResponse;
        const authorization = ticketResponse.request().headers()['authorization'] ?? '';

        expect(ticketResponse.ok()).toBe(true);
        expect(authorization).toMatch(/^Bearer [A-Za-z0-9_-]{32,128}$/);

        const sessionResponse = await page.request.get(`${BACKEND_URL}/auth/session`, {
            headers: {
                Authorization: authorization,
                Origin: baseURL!,
            },
        });

        expect(await sessionResponse.json()).toMatchObject({
            authenticated: true,
            did,
        });
        expect(
            (await page.context().cookies(BACKEND_URL)).find(
                cookie => cookie.name === 'ai_passport_session'
            )
        ).toBeUndefined();
        expect(await page.evaluate(() => location.hash)).toBe('');
        expect(await page.evaluate(() => localStorage.getItem('did'))).toBeNull();
    });

    test('redirects to /topics when a backend session already exists', async ({
        page,
        baseURL,
    }) => {
        await authenticateTestPage(page, baseURL!);
        await page.goto('/login');

        await expect(page).toHaveURL('/topics', { timeout: 10_000 });
        await expect(
            page.getByRole('heading', {
                name: 'What would you like to learn about today?',
            })
        ).toBeVisible();
    });
    test('clears the login binding after a rejected callback proof', async ({ page, baseURL }) => {
        const { challenge, vp } = await createTestPresentation(page, baseURL!);
        const callbackUrl = new URL('/auth/callback', BACKEND_URL);

        callbackUrl.searchParams.set('challenge', challenge);
        callbackUrl.searchParams.set('response_mode', 'fragment');

        const callbackResponse = await page.request.post(callbackUrl.toString(), {
            data: { vp: `${vp}tampered` },
        });

        expect(callbackResponse.status()).toBe(401);
        expect(
            (await page.context().cookies(BACKEND_URL)).some(cookie =>
                cookie.name.startsWith('ai_passport_login_')
            )
        ).toBe(false);
    });

    test('uses an in-memory bearer when cross-site cookies are unavailable', async ({
        page,
        baseURL,
    }) => {
        const { did, token: sessionToken } = await createTestSession(page, baseURL!);

        await page.context().clearCookies();

        expect(await page.context().cookies(BACKEND_URL)).toEqual([]);

        const sessionResponse = await page.request.get(`${BACKEND_URL}/auth/session`, {
            headers: {
                Authorization: `Bearer ${sessionToken}`,
                Origin: baseURL!,
            },
        });

        expect(sessionResponse.ok()).toBe(true);
        expect(await sessionResponse.json()).toMatchObject({
            authenticated: true,
            did,
        });

        const ticketResponse = await page.request.post(`${BACKEND_URL}/auth/websocket-ticket`, {
            headers: {
                Authorization: `Bearer ${sessionToken}`,
                Origin: baseURL!,
            },
        });
        const { ticket } = (await ticketResponse.json()) as {
            ticket?: string;
        };

        expect(ticketResponse.ok()).toBe(true);

        if (!ticket) throw new Error('Backend did not issue a WebSocket ticket');

        await page.goto('/login');
        await expect(page).toHaveURL(/\/login$/);

        const socketResult = await page.evaluate(
            ({ backendUrl, ticket: websocketTicket }) =>
                new Promise<{ outcome: string; protocol?: string }>(resolve => {
                    const socket = new WebSocket(backendUrl.replace(/^http/, 'ws'), [
                        'ai-passport',
                        `ai-passport-ticket.${websocketTicket}`,
                    ]);
                    const timeout = window.setTimeout(() => resolve({ outcome: 'timeout' }), 5000);

                    socket.addEventListener('open', () => {
                        window.clearTimeout(timeout);
                        const { protocol } = socket;

                        socket.close();
                        resolve({ outcome: 'open', protocol });
                    });
                    socket.addEventListener('error', () => {
                        window.clearTimeout(timeout);
                        resolve({ outcome: 'error' });
                    });
                }),
            { backendUrl: BACKEND_URL, ticket }
        );

        expect(socketResult).toEqual({
            outcome: 'open',
            protocol: 'ai-passport',
        });
        expect(await page.evaluate(() => localStorage.getItem('did'))).toBeNull();
    });
});

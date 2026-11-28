import type { Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';

import { test } from '../fixtures/mocked-test';
import { installNetwork } from '../mocks/network';
import { waitForAuthenticatedState } from '../test.helpers';
import { TEST_USER_PROFILE_ID } from '../constants';

/**
 * Times in-app navigations between signed-in wallet routes on a production build.
 *
 * Each sample is a fresh signed-in session, so every route is a first visit (its page code and data
 * are not cached yet), which is when route modules and clientLoaders matter. A sample is the time
 * from `router.navigate()` until the destination's content element is in the DOM.
 *
 * Conditions (the same for every build): 4x CPU slowdown and 150 ms added latency on page assets
 * (Chromium network emulation), and 150 ms added to every mocked backend response.
 */
// `ready` is text the destination shows once its content (and, where it has any, its data) is in.
const ROUTES: Array<{ path: string; ready: string }> = JSON.parse(
    process.env.PERF_ROUTES ??
        JSON.stringify([
            // The More Apps grid's empty state renders after the installed/featured/curated queries.
            { path: '/launchpad', ready: 'No apps to show yet.' },
            { path: '/notifications', ready: 'Alerts' },
            { path: '/contacts', ready: 'My Contact Card' },
        ])
);
const SAMPLES = Number(process.env.PERF_SAMPLES ?? 5);
const START = process.env.PERF_START ?? '/wallet';
const SETTLE_MS = Number(process.env.PERF_SETTLE_MS ?? 3000);
const BACKEND_DELAY_MS = 150;

type RouterWindow = Window & {
    __reactRouterDataRouter: {
        navigate: (path: string) => Promise<void>;
        state: { navigation: { state: string }; location: { pathname: string } };
    };
};

const signIn = async (page: Page) => {
    const mock = await installNetwork(page);
    void mock;
    await page.route(/localhost:(4000|4100|5100)\//, async route => {
        await new Promise(resolve => setTimeout(resolve, BACKEND_DELAY_MS));
        await route.fallback();
    });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', {
        offline: false,
        latency: 150,
        downloadThroughput: -1,
        uploadThroughput: -1,
    });
    await waitForAuthenticatedState(page, {
        path: START,
        nextPath: START,
        profileId: TEST_USER_PROFILE_ID,
        waitUntil: 'commit',
    });
    await page.waitForFunction(start => location.pathname === start, START, { timeout: 120_000 });
    await page.waitForTimeout(SETTLE_MS);
};

const timeNavigation = (page: Page, path: string, ready: string) =>
    page.evaluate(
        ({ path, ready }) =>
            new Promise<number>((resolve, reject) => {
                const router = (window as unknown as RouterWindow).__reactRouterDataRouter;
                if ((document.body.textContent ?? '').includes(ready)) {
                    reject(new Error(`"${ready}" is already on the page before ${path}`));
                    return;
                }
                const start = performance.now();
                const deadline = start + 60_000;
                void router.navigate(path);
                const check = () => {
                    const done =
                        location.pathname === path &&
                        router.state.navigation.state === 'idle' &&
                        (document.body.textContent ?? '').includes(ready);
                    if (done) resolve(performance.now() - start);
                    else if (performance.now() > deadline) reject(new Error(`timeout ${path}`));
                    else requestAnimationFrame(check);
                };
                check();
            }),
        { path, ready }
    );

test('signed-in route transitions', async ({ browser }) => {
    const results: Record<string, number[]> = {};
    for (let sample = 0; sample < SAMPLES; sample += 1) {
        const context = await browser.newContext();
        const page = await context.newPage();
        await signIn(page);
        if (process.env.PERF_EXPLORE) {
            for (const { path } of ROUTES) {
                await page.evaluate(
                    p => (window as unknown as RouterWindow).__reactRouterDataRouter.navigate(p),
                    path
                );
                await page.waitForTimeout(8000);
                const outline = await page.evaluate(() =>
                    [
                        ...document.querySelectorAll(
                            'h1, h2, h3, [data-testid], [role=list], [role=heading]'
                        ),
                    ]
                        .slice(0, 40)
                        .map(
                            el =>
                                `${el.tagName} ${el.getAttribute('data-testid') ?? ''} ${(el as HTMLElement).innerText?.slice(0, 40).replace(/\n/g, ' ')}`
                        )
                );
                console.log(path, page.url(), JSON.stringify(outline, null, 1));
                await page.screenshot({
                    path: `test-results/perf-${path.replace(/\W/g, '_')}.png`,
                });
            }
            await context.close();
            return;
        }
        for (const { path, ready } of ROUTES) {
            (results[path] ??= []).push(await timeNavigation(page, path, ready));
            await page.waitForTimeout(1000);
        }
        await context.close();
    }
    const median = (values: number[]) => {
        const sorted = [...values].sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
    };
    const summary = Object.fromEntries(
        Object.entries(results).map(([path, values]) => [path, { median: median(values), values }])
    );
    console.log(JSON.stringify(summary));
    if (process.env.PERF_OUT)
        writeFileSync(process.env.PERF_OUT, JSON.stringify(summary, null, 2) + '\n');
});

import type { Page } from '@playwright/test';
import path from 'path';
import { createTrpcMock, type TrpcMock } from './trpc';

// A .zip HAR is a single self-contained artifact (manifest + response bodies).
// A plain .har path would instead scatter each body into a hash-named file.
const HAR_PATH = path.resolve(__dirname, 'har/issue.har.zip');

// Set PWHAR=update and run against the real docker stack to (re)record the HAR.
const RECORDING = process.env.PWHAR === 'update';

// All backend traffic on the local ports — brain (4000), cloud (4100), SSS (5100).
// Scoped by port so the app's own :3000 assets are untouched, but broad enough to
// catch non-tRPC calls too (e.g. did:web resolution at /users/<id>/did.json).
const BACKEND_URLS = /localhost:(4000|4100|5100)\//;

/**
 * Composes the mocked backend for a page:
 *  - HAR baseline replays the recorded auth/boot handshake + reads (or records
 *    them when PWHAR=update). This covers the finicky wallet-init dance verbatim.
 *  - A typed `createTrpcMock` layered on top (registered last → matched first)
 *    lets a test override specific tRPC procedures deterministically via the
 *    returned mock; unknown procedures fall through to the HAR baseline.
 *
 * In record mode the typed layer is not installed so every real call is captured.
 * Call this BEFORE navigating/logging in. Returns the mock for optional overrides.
 */
export const installNetwork = async (page: Page): Promise<TrpcMock> => {
    await page.routeFromHAR(HAR_PATH, {
        url: BACKEND_URLS,
        update: RECORDING,
        // Replay must fail loudly on an unrecorded, un-overridden backend call so
        // missing coverage surfaces instead of silently hanging.
        notFound: RECORDING ? 'fallback' : 'abort',
    });

    const trpc = createTrpcMock(page);
    if (!RECORDING) await trpc.install();

    // Opt-in diagnostics: `PWNETLOG=1` prints aborted backend calls + page errors
    // so a failing mocked flow reveals which request/exception is uncovered.
    if (process.env.PWNETLOG) {
        page.on('requestfailed', req => {
            const url = req.url();
            if (/localhost:(4000|4100|5100)|\/(trpc|api|keys|xapi)\b/.test(url)) {
                console.log('[mock:requestfailed]', req.method(), url, req.failure()?.errorText);
            }
        });
        page.on('console', msg => {
            if (msg.type() === 'error') console.log('[mock:console.error]', msg.text());
        });
        page.on('pageerror', err => console.log('[mock:pageerror]', err.message));
    }

    return trpc;
};

export { ABORT } from './trpc';

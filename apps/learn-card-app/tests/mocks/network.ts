import type { Page } from '@playwright/test';
import path from 'path';
import { createTrpcMock, type TrpcMock } from './trpc';

const HAR_PATH = path.resolve(__dirname, 'har/issue.har');

// Set PWHAR=update and run against the real docker stack to (re)record the HAR.
const RECORDING = process.env.PWHAR === 'update';

// Brain/cloud tRPC (localhost:4000|4100 /trpc) + SSS key server (localhost:5100 /api, /keys).
const BACKEND_URLS = '**/{trpc,api,keys}/**';

/**
 * Composes the mocked backend for a page:
 *  - HAR baseline replays the recorded auth/boot + issuance traffic (or records
 *    it when PWHAR=update). This covers the finicky wallet-init dance verbatim.
 *  - A typed `createTrpcMock` layered on top (registered last → matched first)
 *    lets individual tests override specific procedures deterministically; any
 *    procedure it doesn't own falls through to the HAR baseline.
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
    return trpc;
};

export { ABORT } from './trpc';

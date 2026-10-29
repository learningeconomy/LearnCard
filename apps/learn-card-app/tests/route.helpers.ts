import { Page, BrowserContext } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Path to local WASM file relative to tests directory
// From apps/learn-card-app/tests/ -> packages/plugins/didkit/src/didkit/pkg/
const WASM_PATH = path.resolve(
    __dirname,
    '../../../packages/plugins/didkit/src/didkit/pkg/didkit_wasm_bg.wasm'
);

// Cache the WASM buffer to avoid repeated file reads
let wasmBuffer: Buffer | null = null;

const getWasmBuffer = (): Buffer => {
    if (!wasmBuffer) {
        wasmBuffer = fs.readFileSync(WASM_PATH);
    }
    return wasmBuffer;
};

/**
 * Intercepts requests to the FileStack CDN for DIDKit WASM and serves
 * the local WASM file instead. This significantly speeds up test startup
 * by avoiding external network requests for the ~9MB WASM file.
 */
export const mockDidKitWasm = async (page: Page) => {
    await page.route('https://cdn.filestackcontent.com/HReKwBTm2Wha4Wlo4uwe', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/wasm',
            body: getWasmBuffer(),
        });
    });
};

/**
 * Applies DIDKit WASM interception to a browser context.
 * All pages created in this context will serve WASM from local file.
 */
export const mockDidKitWasmForContext = async (context: BrowserContext) => {
    await context.route('https://cdn.filestackcontent.com/HReKwBTm2Wha4Wlo4uwe', async route => {
        await route.fulfill({
            status: 200,
            contentType: 'application/wasm',
            body: getWasmBuffer(),
        });
    });
};

export type MockFeatureFlags = Record<string, { value: unknown }>;

export const mockLaunchDarkly = async (
    target: Page | BrowserContext,
    testFlags: MockFeatureFlags = {}
): Promise<void> => {
    const flags = {
        inAppMessages: { value: { messages: [] } },
        inAppMessagesV2: { value: { messages: [] } },
        ...testFlags,
    };

    await target.route(/.*\.launchdarkly\..*/, async route => {
        const request = route.request();
        const url = new URL(request.url());
        const headers = {
            'access-control-allow-origin': request.headers().origin ?? '*',
            'access-control-allow-credentials': 'true',
            'access-control-allow-methods': 'GET, POST, REPORT, OPTIONS',
            'access-control-allow-headers':
                request.headers()['access-control-request-headers'] ?? '*',
        };

        if (request.method() === 'OPTIONS') {
            await route.fulfill({ status: 204, headers });
        } else if (url.hostname.startsWith('clientstream.')) {
            await route.fulfill({
                contentType: 'text/event-stream',
                headers,
                body: `retry: 60000\nevent: put\ndata: ${JSON.stringify(flags)}\n\n`,
            });
        } else if (url.pathname.startsWith('/sdk/eval')) {
            await route.fulfill({ json: flags, headers });
        } else if (url.pathname.startsWith('/sdk/goals/')) {
            await route.fulfill({ json: [], headers });
        } else if (url.hostname.startsWith('events.')) {
            await route.fulfill({ status: 202, body: '', headers });
        } else {
            await route.abort('blockedbyclient');
        }
    });
};

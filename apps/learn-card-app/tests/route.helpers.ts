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

export const mockLaunchDarkly = async (
    page: Page,
    testFlags: { [key: string]: { value: any } }
) => {
    await page.route(/.*\.launchdarkly\..*/, route => {
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(testFlags),
        });
    });
};

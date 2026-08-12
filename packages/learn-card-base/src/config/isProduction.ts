/**
 * Shared production-environment detection helper.
 *
 * Checks the Vite `define` global `IS_PRODUCTION` first (injected at build time),
 * then falls back to `process.env.NODE_ENV`. Uses typeof guards so it works
 * safely in any environment (browser, Node, SSR, tests).
 *
 * This is the single source of truth — do NOT inline this check elsewhere.
 */

// Ambient declaration so TypeScript doesn't error on the typeof guard.
// The actual value is injected by Vite's `define` in consuming apps.
declare const IS_PRODUCTION: boolean | undefined;

export const isProductionEnvironment = (): boolean =>
    // eslint-disable-next-line no-restricted-globals
    (typeof IS_PRODUCTION !== 'undefined' && (IS_PRODUCTION as unknown as boolean)) ||
    (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production');

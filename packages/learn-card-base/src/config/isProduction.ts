/**
 * Shared production-environment detection helper.
 *
 * Browser hosts inject the validated build-mode flag as `IS_PRODUCTION`.
 * Non-browser consumers default to false unless they provide the same explicit global.
 */

// Ambient declaration so TypeScript doesn't error on the typeof guard.
// The actual value is injected by Vite's `define` in consuming apps.
declare const IS_PRODUCTION: boolean | undefined;

export const isProductionEnvironment = (): boolean =>
    typeof IS_PRODUCTION !== 'undefined' && IS_PRODUCTION;

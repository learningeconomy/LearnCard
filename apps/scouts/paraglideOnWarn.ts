/**
 * Rollup `onwarn` guard that turns "missing Paraglide message" warnings into
 * hard build failures.
 *
 * When a component references a message key that doesn't exist in the catalogs
 * (e.g. `m['skillProfile.step4.workLifeBalance']()` with no such key), Rollup
 * resolves the string-literal namespace access and emits a
 * `"X" is not exported by "…/paraglide/messages/…"` warning — but a warning
 * doesn't fail the build, so the bad call reaches runtime and throws a
 * TypeError (`undefined()`).
 *
 * Paraglide IS type-safe, but nothing in this repo runs `tsc`, so those type
 * errors are invisible until runtime. This guard is the cheap backstop: it
 * fires during any real build (main app via `vite.config.ts`, Storybook/
 * Chromatic via `.storybook/main.ts`) and is scoped to paraglide so unrelated
 * vendor `MISSING_EXPORT` warnings still pass through untouched.
 */
type RollupWarning = { code?: string; message?: string };
type WarnHandler = (warning: RollupWarning) => void;

export const paraglideMissingKeyOnWarn = (
    warning: RollupWarning,
    defaultHandler: WarnHandler
): void => {
    const message = warning.message ?? '';

    if (/is not exported by .*paraglide.*messages/.test(message)) {
        throw new Error(
            `[i18n] A component references a Paraglide message that does not exist. ` +
                `Add the key to public/locales/*/translation.json (or fix the typo). ${message}`
        );
    }

    defaultHandler(warning);
};

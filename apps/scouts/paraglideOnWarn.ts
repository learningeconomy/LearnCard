/**
 * Rollup/Rolldown `onwarn` guard that turns "missing Paraglide message" warnings
 * into hard build failures.
 *
 * When a component references a message key that doesn't exist in the catalogs
 * (e.g. `m['skillProfile.step4.workLifeBalance']()` with no such key), Rollup
 * emits `"X" is not exported by "…/paraglide/messages/…"` and Rolldown (Vite 8)
 * emits `[IMPORT_IS_UNDEFINED] Import \`X\` will always be undefined because
 * there is no matching export in '…/paraglide/messages.js'` — neither fails the
 * build on its own, so the bad call reaches runtime and throws `undefined()`.
 *
 * Paraglide IS type-safe, but nothing in this repo runs strict `tsc` over the
 * whole app, so those type errors can slip through. This guard is the cheap
 * backstop: it fires during any real build (main app via `vite.config.ts`) and
 * is scoped to paraglide so unrelated vendor missing-export warnings still pass
 * through untouched.
 */
type BundlerWarning = { code?: string; message?: string };
type WarnHandler = (warning: BundlerWarning) => void;

// eslint-disable-next-line no-control-regex -- strip ANSI colors Rolldown puts in warning messages
const ANSI_ESCAPE = /\u001b\[[0-9;]*m/g;
const PARAGLIDE_MISSING_EXPORT =
    /(?:is not exported by|no matching export in)\s+[^\n]*paraglide[^\n]*messages/;

export const paraglideMissingKeyOnWarn = (
    warning: BundlerWarning,
    defaultHandler: WarnHandler
): void => {
    const message = (warning.message ?? '').replace(ANSI_ESCAPE, '');

    if (PARAGLIDE_MISSING_EXPORT.test(message)) {
        throw new Error(
            `[i18n] A component references a Paraglide message that does not exist. ` +
                `Add the key to public/locales/*/translation.json (or fix the typo). ${message}`
        );
    }

    defaultHandler(warning);
};

/**
 * Packages published as a single bundled file with no install-time dependencies.
 *
 * Shared by the two release steps that treat them specially:
 * - release-bundled-dependents.mjs re-releases them when a bundled dependency changes.
 * - prepare-publish-workspace-deps.mjs omits their dependency list from the published manifest.
 */
export const SELF_CONTAINED_PACKAGES = new Map([
    [
        '@learncard/cli',
        {
            entry: 'dist/index.js',
            // Written by the package's bundler: every non-builtin module the bundle still loads.
            externals: 'dist/bundle-externals.json',
            // Nothing may be left for the installer to provide.
            allowedExternals: new Set(),
        },
    ],
]);

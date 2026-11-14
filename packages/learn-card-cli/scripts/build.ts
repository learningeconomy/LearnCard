/**
 * Builds the published CLI as one self-contained file.
 *
 * Every dependency is bundled from workspace source (the `development` export condition), so
 * `npx @learncard/cli` installs a single package. The only file loaded at runtime besides
 * `dist/index.js` are the didkit WASM and clipboardy's helper binaries, copied next to it.
 * Third-party licence notices are written to `dist/THIRD_PARTY_LICENSES.txt`.
 *
 * Pass `--metafile` to also write `dist/meta.json` for bundle-size analysis.
 */
import { copyFile, cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire, isBuiltin } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { build, type Plugin } from 'esbuild';

import {
    bundledThirdPartyPackages,
    disallowedPackages,
    renderLicenseNotices,
} from './third-party-licenses';

export const DIDKIT_WASM_FILENAME = 'didkit_wasm_bg.wasm';
export const BUNDLE_EXTERNALS_FILENAME = 'bundle-externals.json';
export const THIRD_PARTY_LICENSES_FILENAME = 'THIRD_PARTY_LICENSES.txt';

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outdir = resolve(packageRoot, 'dist');
// Checked-in wasm-pack output; the same file `@learncard/didkit-plugin` publishes in its dist.
const didkitWasmSource = resolve(
    packageRoot,
    '../plugins/didkit/src/didkit/pkg',
    DIDKIT_WASM_FILENAME
);
const require = createRequire(import.meta.url);
const clipboardyRoot = dirname(require.resolve('clipboardy/package.json'));

export const CLIPBOARD_FALLBACKS_DIRNAME = 'clipboardy-fallbacks';

/**
 * Three dependencies assume they are installed as packages; this adapts them to a single file.
 *
 * - `emphasize` (REPL syntax highlighting, via pretty-repl) registers every highlight.js
 *   language. The shim registers JavaScript only.
 * - `@learncard/didkit-plugin-node` is a per-platform native addon. The shim serves
 *   `didkit: 'node'` from the bundled WebAssembly DIDKit instead.
 * - `clipboardy` runs helper binaries from `<its package>/fallbacks` on Linux and Windows.
 *   They are copied to `dist/clipboardy-fallbacks` and the lookups are pointed there.
 */
const singleFilePlugin: Plugin = {
    name: 'learncard-cli-single-file',
    setup(pluginBuild) {
        pluginBuild.onResolve({ filter: /^emphasize$/ }, () => ({
            path: resolve(packageRoot, 'scripts/bundle-shims/emphasize-javascript.cjs'),
        }));

        pluginBuild.onResolve({ filter: /^@learncard\/didkit-plugin-node$/ }, () => ({
            path: resolve(packageRoot, 'scripts/bundle-shims/didkit-plugin-node.ts'),
        }));

        pluginBuild.onLoad(
            { filter: /clipboardy[\\/]lib[\\/](linux|windows)\.js$/ },
            async args => {
                const source = await readFile(args.path, 'utf8');
                const contents = source.replaceAll(
                    '../fallbacks/',
                    `./${CLIPBOARD_FALLBACKS_DIRNAME}/`
                );

                if (contents === source) {
                    throw new Error(`clipboardy fallback path not found in ${args.path}`);
                }

                return { contents, loader: 'js' };
            }
        );
    },
};

const run = async (): Promise<void> => {
    await rm(outdir, { recursive: true, force: true });
    await mkdir(outdir, { recursive: true });

    const result = await build({
        absWorkingDir: packageRoot,
        entryPoints: ['src/index.tsx'],
        outfile: resolve(outdir, 'index.js'),
        bundle: true,
        platform: 'node',
        format: 'cjs',
        target: 'node20',
        conditions: ['development'],
        minify: true,
        // The published file has no source map; keep function and class names so a stack
        // trace in a bug report is still readable.
        keepNames: true,
        legalComments: 'none',
        metafile: true,
        logOverride: {
            // Dependencies written as ESM read import.meta.url; the banner below supplies it.
            'empty-import-meta': 'silent',
            // @learncard/core's polyfills (Promise, AbortController) are marked side-effect
            // free and dropped; Node >= 20 provides both natively.
            'ignored-bare-import': 'silent',
        },
        plugins: [singleFilePlugin],
        define: {
            'process.env.LEARNCARD_CLI_BUNDLED': '"1"',
            'import.meta.url': '__learncardImportMetaUrl',
        },
        banner: {
            js: [
                '#!/usr/bin/env node',
                'const __learncardImportMetaUrl = require("node:url").pathToFileURL(__filename).href;',
            ].join('\n'),
        },
    });

    await copyFile(didkitWasmSource, resolve(outdir, DIDKIT_WASM_FILENAME));
    await cp(resolve(clipboardyRoot, 'fallbacks'), resolve(outdir, CLIPBOARD_FALLBACKS_DIRNAME), {
        recursive: true,
    });

    // Evidence for the publish step (scripts/prepare-publish-workspace-deps.mjs) that nothing
    // from `dependencies` is loaded at runtime, so the published manifest can omit them.
    const externals = [
        ...new Set(
            Object.values(result.metafile.outputs)
                .flatMap(output => output.imports)
                .filter(imported => imported.external && !isBuiltin(imported.path))
                .map(imported => imported.path)
        ),
    ].sort();
    await writeFile(
        resolve(outdir, BUNDLE_EXTERNALS_FILENAME),
        `${JSON.stringify(externals, null, 4)}\n`
    );

    // clipboardy is listed explicitly: its helper binaries are copied, not bundled.
    const thirdParty = bundledThirdPartyPackages(
        Object.keys(result.metafile.inputs).map(file => resolve(packageRoot, file)),
        [clipboardyRoot]
    );
    const disallowed = disallowedPackages(thirdParty);

    if (disallowed.length > 0) {
        throw new Error(
            [
                'Bundled packages with a licence that is not allowed in the CLI bundle:',
                ...disallowed.map(
                    ({ name, version, license }) => `  ${name}@${version}: ${license}`
                ),
                'Remove the dependency from the bundle, or add the licence to ALLOWED_LICENSES or the',
                'package to LICENSE_EXCEPTIONS in scripts/third-party-licenses.ts with a reason.',
            ].join('\n')
        );
    }

    await writeFile(
        resolve(outdir, THIRD_PARTY_LICENSES_FILENAME),
        renderLicenseNotices(thirdParty)
    );

    if (process.argv.includes('--metafile')) {
        await writeFile(resolve(outdir, 'meta.json'), JSON.stringify(result.metafile));
    }
};

await run();

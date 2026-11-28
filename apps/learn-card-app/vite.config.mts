import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { execSync } from 'child_process';
import { createRequire } from 'module';
import { readdirSync, readFileSync, existsSync } from 'fs';

import { defineConfig, loadEnv, type ConfigEnv, type Plugin, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { reactRouter } from '@react-router/dev/vite';
import svgr from 'vite-plugin-svgr';
import stdlibbrowser from 'node-stdlib-browser';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { visualizer } from 'rollup-plugin-visualizer';
import { paraglideVitePlugin } from '@inlang/paraglide-js';

import { findDuplicateMessageImports } from './scripts/check-i18n-imports.mjs';
import { paraglideMissingKeyOnWarn } from './paraglideOnWarn';
import { paraglideLazyLocales } from './src/i18n/paraglideLazyLocales';
import { minifySvgPathDataInSource } from './src/buildPlugins/minifySvgPathData';
import {
    chunkPrefetchFiles,
    PREFETCH_CHUNKS,
    type BundleChunk,
} from './src/buildPlugins/chunkPrefetchList';
import { CHUNK_PREFETCH_LIST_FILE } from './scripts/finalize-static-build';
import { cssModulesInEvaluationOrder, orderEntryCss } from './src/buildPlugins/entryCssOrder';
import { serveStaticDevHtml } from './scripts/serve-static-dev-html';
import { warmDevServer } from './scripts/warm-dev-server';
import { documentBrandingFor } from './src/config/documentBranding';
import { createManualChunks } from './src/buildPlugins/vendorChunks';
import { parseLearnCardAppEnvironment } from './src/config/buildEnvironment';
import { registryProxyDevServer } from '../../packages/learn-card-base/src/registry-proxy/registryProxyDevServer';

// Re-optimization can replace chunks without changing a dependency entry's URL version.
// Revalidate dev responses instead of keeping Vite's year-long immutable browser cache.
// A named plugin also changes the optimizer fingerprint, retiring already-cached URLs.
const devCacheRevalidation: Plugin = {
    name: 'dev-cache-revalidation',
    apply: (_config, { command, isPreview }) => command === 'serve' && !isPreview,
    config: () => ({
        server: { headers: { 'Cache-Control': 'no-cache' } },
    }),
};

/**
 * Fail the build/dev start if any file imports paraglide/messages.js twice
 * (declares `m` twice → runtime SyntaxError). See scripts/check-i18n-imports.mjs.
 */
const i18nImportGuard = () => ({
    name: 'i18n-duplicate-import-guard',
    buildStart() {
        const offenders = findDuplicateMessageImports();
        if (offenders.length) {
            const detail = offenders
                .map(o => `  ${o.file}\n${o.lines.map(l => `      ${l}`).join('\n')}`)
                .join('\n');
            this.error(
                `Duplicate paraglide/messages.js import(s) — causes "Identifier 'm' has ` +
                    `already been declared" at runtime:\n${detail}\n  Fix: keep ONE import per file.`
            );
        }
    },
});

// CommonJS interop: readDefaultChannel.cjs is the shared SSOT for the Capgo
// channel. It is intentionally reused by Vite config and CI helpers so we do
// not duplicate the regex or drift from the configured native channel.
const requireFromHere = createRequire(import.meta.url);
const { readDefaultChannel } = requireFromHere('../../tools/capgo/readDefaultChannel.cjs') as {
    readDefaultChannel: (configPath: string) => string | undefined;
};

/**
 * App version read directly from this app's package.json.
 *
 * Deliberately NOT `process.env.npm_package_version` — that env var reflects
 * the package.json of the directory the build command was invoked from, so
 * CI builds run from the monorepo root (`bunx nx build learn-card-app`) would
 * bake in the root package's version (e.g. 1.0.1) instead of the app's.
 */
const packageVersion = (
    JSON.parse(readFileSync(path.join(__dirname, 'package.json'), 'utf-8')) as {
        version: string;
    }
).version;

/**
 * Resolve a short build commit SHA at config-eval time.
 *
 * Source preference:
 *   1. CI-provided env vars (GitHub Actions / Heroku / Vercel etc.)
 *   2. Local `git rev-parse --short HEAD`
 *   3. The string 'dev' if neither is available (e.g. in a stripped Docker
 *      build with no .git directory).
 *
 * Surfaced to the runtime via the `__BUILD_SHA__` global, used in the
 * VersionInfoModal so support / engineering can identify the exact commit
 * a binary or OTA bundle was built from.
 */
const resolveBuildSha = (environment: ReturnType<typeof parseLearnCardAppEnvironment>): string => {
    const fromEnvironment =
        environment.GITHUB_SHA ??
        environment.HEROKU_SLUG_COMMIT ??
        environment.VERCEL_GIT_COMMIT_SHA ??
        environment.BUILD_SHA;

    if (fromEnvironment) return fromEnvironment.slice(0, 7);

    try {
        return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
            .toString()
            .trim();
    } catch {
        return 'dev';
    }
};

// Every @learncard/* workspace package in the monorepo. In dev these resolve to their
// TypeScript source (via the `development` export condition below), so they must be kept
// out of esbuild pre-bundling for HMR to work. Collected by scanning the packages roots
// so a newly added package is picked up automatically — no hand-maintained list to drift.
const collectWorkspacePackages = (): string[] => {
    const names = new Set<string>();

    // Depth-bounded walk: packages live at varying nesting (packages/x, packages/plugins/x,
    // packages/learn-card-network/brain-client, ...). Prune heavy/irrelevant dirs so the scan
    // stays cheap and never descends into module or source trees.
    const walk = (dir: string, depth: number): void => {
        if (depth < 0 || !existsSync(dir)) return;

        for (const entry of readdirSync(dir, { withFileTypes: true })) {
            if (!entry.isDirectory()) continue;
            if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'src') {
                continue;
            }

            const child = path.join(dir, entry.name);
            const pkgPath = path.join(child, 'package.json');

            if (existsSync(pkgPath)) {
                try {
                    const { name } = JSON.parse(readFileSync(pkgPath, 'utf8')) as { name?: string };
                    if (name?.startsWith('@learncard/')) names.add(name);
                } catch {
                    // Ignore unreadable/partial package.json files during the scan.
                }
            }

            walk(child, depth - 1);
        }
    };

    walk(path.resolve(__dirname, '../../packages'), 2);

    return [...names];
};

const workspacePackages = collectWorkspacePackages();

/**
 * Production builds: resolve the root entry of each @learncard/* workspace package to its TypeScript
 * source (the `development` export) instead of its prebuilt ESM dist. Several dist bundles inline their
 * own copies of zod and @learncard/types (brain-client, openid4vc, render-method, sss-key-manager, helpers...),
 * so the startup bundle carried ~6 copies that Rollup cannot dedupe or tree-shake. Only root entries of
 * @learncard/* are redirected; npm packages keep production export conditions (a global `development`
 * condition would pull dev builds of e.g. micromark). didkit keeps its dist (wasm asset wiring).
 */
const SOURCE_ENTRY_EXCLUDE = new Set(['@learncard/didkit-plugin', '@learncard/didkit-plugin-node']);
const collectWorkspaceSourceEntries = (): Map<string, string> => {
    const entries = new Map<string, string>();
    const walk = (dir: string, depth: number): void => {
        if (depth < 0 || !existsSync(dir)) return;
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
            if (!entry.isDirectory() || ['node_modules', 'dist', 'src'].includes(entry.name))
                continue;
            const child = path.join(dir, entry.name);
            const pkgPath = path.join(child, 'package.json');
            if (existsSync(pkgPath)) {
                try {
                    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
                        name?: string;
                        exports?: Record<string, unknown>;
                    };
                    const root = pkg.exports?.['.'] as { development?: unknown } | undefined;
                    const dev =
                        typeof root?.development === 'string' ? root.development : undefined;
                    if (
                        pkg.name?.startsWith('@learncard/') &&
                        dev &&
                        !SOURCE_ENTRY_EXCLUDE.has(pkg.name)
                    ) {
                        const file = path.join(child, dev);
                        if (existsSync(file)) entries.set(pkg.name, file);
                    }
                } catch {
                    // Ignore unreadable/partial package.json files during the scan.
                }
            }
            walk(child, depth - 1);
        }
    };
    walk(path.resolve(__dirname, '../../packages'), 2);
    return entries;
};

const workspaceSourceEntries = (): Plugin => {
    const entries = collectWorkspaceSourceEntries();
    return {
        name: 'learncard-workspace-source-entries',
        enforce: 'pre',
        apply: 'build',
        resolveId: id => entries.get(id) ?? null,
    };
};

// `lodash` is CommonJS, so one `import { isEqual } from 'lodash'` in workspace code bundles all of it
// (~76 KB raw) into the entry. Resolve workspace imports of it to lodash-es (same API, tree-shakes).
// Packages in node_modules keep real lodash: CJS callers may rely on the callable `_` chain.
const lodashEsForWorkspace = (): Plugin => ({
    name: 'learncard-lodash-es-for-workspace',
    enforce: 'pre',
    apply: 'build',
    async resolveId(id, importer) {
        if (id !== 'lodash' || !importer || importer.includes('/node_modules/')) return null;
        return this.resolve('lodash-es', path.join(__dirname, 'index.html'), { skipSelf: true });
    },
});

// Inline SVG icons are Figma exports (absolute coordinates, four decimals): ~1 MB of startup JS.
// Round path points to a 0.01 grid (0.001 for small view boxes) and use the shorter of absolute or
// relative commands. Source stays as exported; see src/buildPlugins/minifySvgPathData.ts.
const minifySvgPathData = (): Plugin => ({
    name: 'learncard-minify-svg-path-data',
    enforce: 'pre',
    apply: 'build',
    transform(code, id) {
        if (id.includes('/node_modules/') || !/\.[jt]sx$/.test(id.split('?')[0])) return null;
        const next = minifySvgPathDataInSource(code);
        // edits stay within single lines, so the existing source map is still line-accurate
        return next === null ? null : { code: next, map: null };
    },
});

// Paraglide's messages.js only re-exports messages/_index.js, plus the `m` namespace object that
// mDynamic reads by key. Rolldown keeps a bare `import "./messages-*.js"` in every chunk that
// imports it, and that chunk holds the whole namespace (~100 KB gzip), so it landed on the startup
// path. It has no side effects; saying so lets static `m.key()` calls skip that chunk.
const PARAGLIDE_MESSAGES_BARREL = /[\\/]paraglide[\\/]messages\.js$/;
const paraglideBarrelWithoutSideEffects = (): Plugin => ({
    name: 'learncard-paraglide-barrel-no-side-effects',
    apply: 'build',
    transform(code, id) {
        if (!PARAGLIDE_MESSAGES_BARREL.test(id)) return null;
        return { code, map: null, moduleSideEffects: false };
    },
});

// Lazy chunks the app warms ahead of time with plain fetch() (src/helpers/prefetchChunk.ts).
// Lists each one's file URLs for the client build; finalizeStaticBuild writes the list into every
// HTML file once React Router has prerendered them. Dev lists source modules (see root.tsx).
const chunkPrefetchList = (): Plugin => {
    let base = '/';
    let root = __dirname;
    return {
        name: 'learncard-chunk-prefetch-list',
        apply: 'build',
        configResolved(config) {
            base = config.base;
            root = config.root;
        },
        generateBundle(_options, bundle) {
            if (this.environment.name !== 'client') return;
            const chunks = bundle as Record<string, BundleChunk & { isEntry?: boolean }>;
            // React Router's HTML imports every entry chunk (client entry and route modules).
            const entries = Object.values(chunks)
                .filter(chunk => chunk.type === 'chunk' && chunk.isEntry)
                .map(chunk => chunk.fileName);
            const list = Object.fromEntries(
                Object.entries(PREFETCH_CHUNKS).map(([key, source]) => {
                    const files = chunkPrefetchFiles(chunks, entries, path.resolve(root, source));
                    if (files.length === 0)
                        throw new Error(`[chunk-prefetch-list] no chunk for ${source}`);
                    return [key, files.map(file => `${base}${file}`)];
                })
            );
            this.emitFile({
                type: 'asset',
                fileName: CHUNK_PREFETCH_LIST_FILE,
                source: JSON.stringify(list),
            });
        },
    };
};

// Keep the startup stylesheet order of the old index.html (see src/buildPlugins/entryCssOrder.ts).
// Runs before Vite writes .vite/manifest.json, which React Router reads to link the root route's CSS.
const reactRouterEntryCssOrder = (): Plugin => ({
    name: 'learncard-react-router-entry-css-order',
    apply: 'build',
    generateBundle: {
        order: 'pre',
        handler(_options, bundle) {
            if (this.environment.name !== 'client') return;
            const entry = Object.values(bundle).find(
                chunk =>
                    chunk.type === 'chunk' &&
                    chunk.isEntry &&
                    chunk.facadeModuleId === path.join(__dirname, 'src/entry.client.tsx')
            );
            if (!entry || entry.type !== 'chunk' || !entry.facadeModuleId) return;
            const cssModules = cssModulesInEvaluationOrder(
                entry.facadeModuleId,
                id => this.getModuleInfo(id)?.importedIds ?? []
            );
            orderEntryCss(bundle as Record<string, BundleChunk>, entry.fileName, cssModules);
        },
    },
});

/** Title strings for the document head, from the tenant config prepare-native-config wrote. */
const documentBranding = () => {
    const tenantConfig = path.join(__dirname, 'public/tenant-config.json');
    const branding = existsSync(tenantConfig)
        ? (
              JSON.parse(readFileSync(tenantConfig, 'utf8')) as {
                  branding?: { name?: string; shortName?: string };
              }
          ).branding
        : undefined;
    return documentBrandingFor(branding);
};

// Browser polyfills for Node built-ins. `module` stays out: the polyfill is an empty mock, and
// React Router's prerender (server) build needs the real `node:module` for Rolldown's runtime.
const browserStdlibAliases = Object.fromEntries(
    Object.entries(stdlibbrowser).filter(([name]) => name !== 'module' && name !== 'node:module')
);

const paraglideBaseLocale = (
    JSON.parse(readFileSync(path.join(__dirname, 'project.inlang/settings.json'), 'utf8')) as {
        baseLocale: string;
    }
).baseLocale;

/**
 * The app's Vite config. `frameworkMode` adds React Router's framework plugins, which own the
 * document and the build; without it the React plugin alone compiles the source, for plain Vite
 * pages such as the visual-regression fixtures (tests/visual/vite.config.mts).
 */
export const learnCardViteConfig = async (
    { mode, command }: ConfigEnv,
    { frameworkMode }: { frameworkMode: boolean }
): Promise<UserConfig> => {
    const loadedEnvironment = loadEnv(mode, __dirname, '');
    const environment = parseLearnCardAppEnvironment(
        { ...loadedEnvironment, ...process.env, MODE: mode },
        `Vite ${command} (${mode})`,
        command
    );
    const { default: tsconfigPaths } = await import('vite-tsconfig-paths');

    // VITE_DOCKER_SOURCE is an explicit opt-in source/debug mode, keyed off the flag
    // rather than `mode`. Production and self-host docker-builds both run `vite build`
    // in production mode and intentionally resolve the prebuilt workspace dist.
    // Emit a loud build-log notice so accidental source-mode production builds are obvious.
    const useDockerSourceMode = environment.VITE_DOCKER_SOURCE;
    if (useDockerSourceMode) {
        console.warn(
            [
                '',
                '════════════════════════════════════════════════════════════════════════',
                '⚠️  VITE_DOCKER_SOURCE=true — resolving @learncard/* to TypeScript SOURCE.',
                '    Opt-in source/debug mode only; self-host docker-builds leave this UNSET.',
                '    Production/Netlify/npm-dist builds resolve optimized prebuilt workspace dist.',
                '════════════════════════════════════════════════════════════════════════',
                '',
            ].join('\n')
        );
    }

    // Resolve @learncard/* to TypeScript source when serving the dev server (HMR / Fast
    // Refresh) or when source/debug mode is explicitly enabled. Production and self-host
    // docker-builds leave it off so consumers get the optimized prebuilt workspace dist.
    const useSourceConditions = useDockerSourceMode || command === 'serve';

    return {
        plugins: [
            devCacheRevalidation,
            ...(useSourceConditions ? [] : [workspaceSourceEntries()]),
            lodashEsForWorkspace(),
            minifySvgPathData(),
            tailwindcss(),
            registryProxyDevServer(),
            i18nImportGuard(),
            paraglideBarrelWithoutSideEffects(),
            // The prefetch list and stylesheet order are for the documents React Router writes.
            ...(frameworkMode
                ? [
                      serveStaticDevHtml(__dirname),
                      warmDevServer(),
                      chunkPrefetchList(),
                      reactRouterEntryCssOrder(),
                      ...reactRouter(),
                  ]
                : [react()]),
            svgr(),
            tsconfigPaths({ root: '../../' }),
            paraglideVitePlugin({
                project: './project.inlang',
                outdir: './src/paraglide',
                outputStructure: 'locale-modules',
            }),
            // Only the active language's strings load at startup (production builds).
            paraglideLazyLocales(
                paraglideBaseLocale,
                path.join(__dirname, 'src/paraglide/messages')
            ),
            ...(environment.ANALYZE
                ? [
                      visualizer({
                          open: true,
                          filename: path.join(__dirname, 'build', 'client', 'stats.html'),
                          gzipSize: true,
                          template: 'treemap',
                      }),
                  ]
                : []),
        ],
        build: {
            target: 'esnext',
            cssTarget: ['chrome111', 'safari16.4', 'firefox128'],
            outDir: path.join(__dirname, 'build'),
            rollupOptions: {
                onwarn: paraglideMissingKeyOnWarn,
                output: {
                    // Rolldown (Vite 8) only takes the function form. See vendorChunks.ts.
                    manualChunks: createManualChunks({ paraglideBaseLocale }),
                },
            },
        },
        optimizeDeps: {
            // Workspace source is excluded below, so its external imports are invisible to
            // the initial dependency scan. Pre-bundle them before serving the first page:
            // discovering them during sign-in replaces chunks and reloads active navigation.
            include: [
                // Lazy XLSX workers must not discover dependencies and reload an active import.
                'xlsx',
                'fflate',
                'buffer',
                'process',
                'react-router',
                'crypto-browserify',
                '@learncard/helpers > @noble/hashes/sha2',
                '@learncard/helpers > @sd-jwt/core',
                '@learncard/helpers > @trpc/server/observable',
                'zod/v4',
                '@learncard/sss-key-manager > shamir-secret-sharing',
                '@learncard/sss-key-manager > hash-wasm',
                '@learncard/sss-key-manager > @noble/ed25519',
                // Escrow Nitro attestation (recovery) imports these at runtime.
                '@learncard/sss-key-manager > reflect-metadata',
                '@learncard/sss-key-manager > cborg',
                '@learncard/sss-key-manager > @peculiar/x509',
                '@learncard/sss-key-manager > @scure/bip39/wordlists/english',
                '@learncard/react > react-barcode',
                '@learncard/react > react-flip-toolkit',
                '@learncard/lca-api-plugin > pbkdf2-hmac',
                '@learncard/lca-api-plugin > hex-lite',
                '@learncard/vpqr-plugin > @digitalbazaar/vpqr',
                '@learncard/ethereum-plugin > ethers',
                '@learncard/network-brain-client > @trpc/client',
                '@learncard/learn-cloud-client > @trpc/client',
                '@learncard/lca-api-plugin > @learncard/lca-api-client > @trpc/client',
                '@learncard/core > core-js/actual/promise',
                '@learncard/core > abort-controller/dist/abort-controller.js',
                '@learncard/chapi-plugin > credential-handler-polyfill',
                '@learncard/chapi-plugin > web-credential-handler',
                '@learncard/sd-jwt-vc-plugin > @sd-jwt/sd-jwt-vc',
                '@learncard/sd-jwt-vc-plugin > @noble/curves/ed25519',
                '@learncard/sd-jwt-vc-plugin > @scure/base',
                '@learncard/openid4vc-plugin > jose',
                '@learncard/openid4vc-plugin > safe-regex',
                '@learncard/openid4vc-plugin > @peculiar/x509',
                '@learncard/openid4vc-plugin > dcql',
                '@learncard/vc-plugin > multiformats/bases/base58',
                '@learncard/vc-plugin > multiformats/bases/base64',
                // Found only after first paint (lazy routes, locale imports); a cold dev
                // server otherwise re-optimizes and reloads mid-navigation.
                '@headlessui/react',
                '@emoji-mart/react',
                'recharts',
                '@digitalcredentials/jsonld',
                '@capacitor-community/in-app-review',
                'moment/dist/locale/ar',
                'moment/dist/locale/es',
                'moment/dist/locale/fr',
                // Discovered during verification/mock sign-in on a cold Vite 8 cache.
                // Without these, "optimized dependencies changed. reloading" detaches the Sign in button.
                '@capacitor-mlkit/barcode-scanning',
                '@capacitor/network',
                '@capacitor/share',
                '@capawesome/capacitor-badge',
                '@nanostores/react',
                '@tanstack/react-query-persist-client',
                'base64url',
                'capacitor-native-settings',
                'dompurify',
                'html2canvas',
                'jspdf',
                'lodash-es/isEqual',
                'lodash-es/omit',
                'lodash/debounce',
                // Discovered mid-warmup when the HTTP crawl walked the whole @fs graph
                // and triggered "optimized dependencies changed. reloading" in CI.
                'react-google-autocomplete/lib/usePlacesAutocompleteService',
                '@xterm/addon-fit',
                '@xterm/addon-web-links',
                '@xterm/xterm',
                '@streamdown/code',
                '@streamdown/math',
                'filestack-js',
                'prop-types',
                'streamdown',
                'emoji-picker-react',
                'date-fns/locale',
                'react-datepicker',
                '@xyflow/react',
                'posthog-js',
                'qr-scanner',
                'pdf-lib',
                'react-colorful',
                'react-lottie-player',
                'react-oauth2-code-pkce',
                'zustand',
                '@capacitor-community/media',
                'papaparse',
                '@typeform/embed-react',
                'jszip',
                'react-countdown',
                'react-phone-number-input',
            ],
            // Exclude workspace packages from pre-bundling so Vite serves their TypeScript sources.
            exclude: workspacePackages,
            // Vite 8 pre-bundles with Rolldown, which can't run esbuild plugins. Oxc's inject and
            // define do what NodeGlobalsPolyfillPlugin did: provide `process`, `Buffer` and `global`.
            rolldownOptions: {
                transform: {
                    define: { global: 'globalThis' },
                    inject: { process: 'process', Buffer: ['buffer', 'Buffer'] },
                },
            },
        },
        define: {
            __PACKAGE_VERSION__: JSON.stringify(packageVersion),
            __APP_VERSION__: JSON.stringify(packageVersion),
            __BUILD_SHA__: JSON.stringify(resolveBuildSha(environment)),
            __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
            __CAPGO_DEFAULT_CHANNEL__: JSON.stringify(
                readDefaultChannel(path.join(__dirname, 'capacitor.config.ts')) ?? ''
            ),
            __APP_BUILD_ENV__: JSON.stringify(environment),
            IS_PRODUCTION: mode === 'production',
            __LC_DOCUMENT_BRANDING__: JSON.stringify(documentBranding()),
        },
        resolve: {
            // See useSourceConditions above: the `development` condition resolves @learncard/*
            // to source only when serving locally or when VITE_DOCKER_SOURCE=true is explicit.
            // Production and self-host Docker builds use the prebuilt dist bundles.
            ...(useSourceConditions
                ? { conditions: ['development', 'module', 'browser', 'import', 'default'] }
                : {}),
            alias: {
                ...browserStdlibAliases,
                // cbor-x (via @sd-jwt/sd-jwt-vc status lists) declares a top-level `Buffer` that
                // collides with the injected Buffer polyfill in pre-bundled deps. Its UMD build keeps it scoped.
                'cbor-x': 'cbor-x/index-no-eval',
                '@web3auth/openlogin-adapter':
                    '@web3auth/openlogin-adapter/dist/openloginAdapter.umd.min.js',
                'learn-card-base': path.resolve(__dirname, '../../packages/learn-card-base/src'),
                'apps/learn-card-app': path.resolve(__dirname),
                '@analytics': path.resolve(__dirname, 'src/analytics'),
                // Swiper's package exports resolve differently under Bun's hoisted install in
                // this Vite app; keep this pinned to the published ESM modules entry.
                'swiper/modules': path.resolve(
                    __dirname,
                    '../../node_modules/swiper/modules/index.mjs'
                ),
            },
            dedupe: [
                'react',
                'react-dom',
                'react-router',
                // Required: learn-card-base is aliased to raw TS source and imports
                // react-query with bare specifiers. Without this pin the prod build
                // resolves two react-query instances, splitting the QueryClient React
                // Context and throwing "No QueryClient set" at runtime.
                '@tanstack/react-query',
            ],
        },
        server: {
            port: 3000,
            watch: {
                // Native assembly writes generated HTML/assets; those must not reload an
                // in-progress credential request in the development WebView.
                ignored: ['**/android/**', '**/ios/**', '**/build/**'],
                // Enable polling for Docker volume mounts
                usePolling: environment.CHOKIDAR_USEPOLLING,
                interval: environment.CHOKIDAR_INTERVAL,
            },
        },
    };
};

// React Router framework mode builds and serves the app (react-router.config.ts). `vite preview`
// serves the finished static build/ directly, except for the preview server React Router starts
// itself to prerender, which needs the plugin.
export default defineConfig(environment =>
    learnCardViteConfig(environment, {
        frameworkMode: !environment.isPreview || process.env.IS_RR_BUILD_REQUEST === 'yes',
    })
);

import path from 'path';
import { execSync } from 'child_process';
import { createRequire } from 'module';
import { readdirSync, readFileSync, existsSync } from 'fs';

import { NodeGlobalsPolyfillPlugin as GlobalPolyfill } from '@esbuild-plugins/node-globals-polyfill';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';
import stdlibbrowser from 'node-stdlib-browser';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { visualizer } from 'rollup-plugin-visualizer';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import type { Plugin as EsbuildPlugin } from 'esbuild';

import { findDuplicateMessageImports } from './scripts/check-i18n-imports.mjs';
import { paraglideMissingKeyOnWarn } from './paraglideOnWarn';
import { parseLearnCardAppEnvironment } from './src/config/buildEnvironment';

// The polyfill package ships against a different esbuild type instance than Vite.
const globalPolyfillPlugin = GlobalPolyfill({
    process: true,
    buffer: true,
}) as unknown as EsbuildPlugin;

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

export default defineConfig(async ({ mode, command }) => {
    const loadedEnvironment = loadEnv(mode, __dirname, '');
    const environment = parseLearnCardAppEnvironment(
        { ...loadedEnvironment, ...process.env, MODE: mode },
        `Vite ${command} (${mode})`
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
            i18nImportGuard(),
            react(),
            svgr(),
            tsconfigPaths({ root: '../../' }),
            paraglideVitePlugin({
                project: './project.inlang',
                outdir: './src/paraglide',
                outputStructure: 'locale-modules',
            }),
            ...(environment.ANALYZE
                ? [
                      visualizer({
                          open: true,
                          filename: path.join(__dirname, 'build', 'stats.html'),
                          gzipSize: true,
                          template: 'treemap',
                      }),
                  ]
                : []),
        ],
        build: {
            target: 'esnext',
            outDir: path.join(__dirname, 'build'),
            rollupOptions: {
                onwarn: paraglideMissingKeyOnWarn,
                output: {
                    manualChunks: {
                        // Core framework
                        'vendor-react': ['react', 'react-dom', 'react-router', 'react-router-dom'],
                        'vendor-ionic': ['@ionic/react', '@ionic/react-router', '@ionic/core'],
                        // Heavy deps in their own chunks
                        'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/analytics'],
                        'vendor-sentry': ['@sentry/react', '@sentry/browser'],
                        'vendor-launchdarkly': ['launchdarkly-react-client-sdk'],
                        'vendor-swiper': ['swiper'],
                        'vendor-lottie': ['react-lottie-player'],
                        'vendor-tanstack': ['@tanstack/react-query'],
                    },
                },
            },
        },
        optimizeDeps: {
            // disabled: false,
            include: ['buffer', 'process', 'react-router', 'react-router-dom', 'crypto-browserify'],
            // Exclude workspace packages from pre-bundling so Vite serves their TypeScript sources.
            exclude: workspacePackages,
            esbuildOptions: {
                target: 'esnext',
                define: { global: 'globalThis' },
                plugins: [globalPolyfillPlugin],
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
        },
        resolve: {
            // See useSourceConditions above: the `development` condition resolves @learncard/*
            // to source only when serving locally or when VITE_DOCKER_SOURCE=true is explicit.
            // Production and self-host Docker builds use the prebuilt dist bundles.
            ...(useSourceConditions
                ? { conditions: ['development', 'module', 'browser', 'import', 'default'] }
                : {}),
            alias: {
                ...stdlibbrowser,
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
                'react-router-dom',
                'history',
                '@ionic/react-router',
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
                // Enable polling for Docker volume mounts
                usePolling: environment.CHOKIDAR_USEPOLLING,
                interval: environment.CHOKIDAR_INTERVAL,
            },
        },
    };
});

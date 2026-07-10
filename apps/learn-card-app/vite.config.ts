import path from 'path';
import { execSync } from 'child_process';
import { createRequire } from 'module';
import { readdirSync, readFileSync, existsSync } from 'fs';

import GlobalPolyfill from '@esbuild-plugins/node-globals-polyfill';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';
import stdlibbrowser from 'node-stdlib-browser';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { visualizer } from 'rollup-plugin-visualizer';

// CommonJS interop: readDefaultChannel.cjs is the shared SSOT for the Capgo
// channel. It is intentionally reused by Vite config and CI helpers so we do
// not duplicate the regex or drift from the configured native channel.
const requireFromHere = createRequire(import.meta.url);
const { readDefaultChannel } = requireFromHere('../../tools/capgo/readDefaultChannel.cjs') as {
    readDefaultChannel: (configPath: string) => string | undefined;
};

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
const resolveBuildSha = (): string => {
    const fromEnv =
        process.env.GITHUB_SHA ??
        process.env.HEROKU_SLUG_COMMIT ??
        process.env.VERCEL_GIT_COMMIT_SHA ??
        process.env.BUILD_SHA;

    if (fromEnv) return fromEnv.slice(0, 7);

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
    const env = loadEnv(mode, process.cwd(), '');
    const { default: tsconfigPaths } = await import('vite-tsconfig-paths');

    // Keyed off VITE_DOCKER_SOURCE alone (not `mode`) because the self-host build
    // legitimately runs `vite build` in production mode, so `mode` can't distinguish it
    // from a Netlify/dist build. We instead emit a loud build-log notice so an accidental
    // production build with this flag set — which would ship uncompiled TS — is obvious.
    const useDockerSourceMode = process.env.VITE_DOCKER_SOURCE === 'true';
    if (useDockerSourceMode) {
        console.warn(
            [
                '',
                '════════════════════════════════════════════════════════════════════════',
                '⚠️  VITE_DOCKER_SOURCE=true — resolving @learncard/* to TypeScript SOURCE.',
                '    Intended ONLY for self-host container builds (docker-build).',
                '    A production/Netlify/npm-dist build MUST leave this UNSET, otherwise',
                '    the app ships uncompiled workspace sources instead of optimized dist.',
                '════════════════════════════════════════════════════════════════════════',
                '',
            ].join('\n')
        );
    }

    // Resolve @learncard/* to TypeScript source when serving the dev server (HMR / Fast
    // Refresh) or in the self-host container build. Production dist builds leave this off
    // so consumers get the optimized prebuilt bundles.
    const useSourceConditions = useDockerSourceMode || command === 'serve';

    return {
        plugins: [
            react(),
            svgr(),
            tsconfigPaths({ root: '../../' }),
            ...(process.env.ANALYZE
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
                plugins: [GlobalPolyfill({ process: true, buffer: true }) as any],
            },
        },
        define: {
            __PACKAGE_VERSION__: JSON.stringify(process.env.npm_package_version),
            __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
            __BUILD_SHA__: JSON.stringify(resolveBuildSha()),
            __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
            __CAPGO_DEFAULT_CHANNEL__: JSON.stringify(
                readDefaultChannel(path.join(__dirname, 'capacitor.config.ts')) ?? ''
            ),
            IS_PRODUCTION: process.env.NODE_ENV === 'production',
            // DEPRECATED — these are now in TenantConfig (config.json → auth.*)
            // Kept as fallbacks for backward compat; will be removed in a future PR.
            'process.env.REACT_APP_KEY_DERIVATION_PROVIDER': process.env
                .REACT_APP_KEY_DERIVATION_PROVIDER
                ? JSON.stringify(process.env.REACT_APP_KEY_DERIVATION_PROVIDER)
                : 'undefined',
            'process.env.REACT_APP_SSS_SERVER_URL': process.env.REACT_APP_SSS_SERVER_URL
                ? JSON.stringify(process.env.REACT_APP_SSS_SERVER_URL)
                : 'undefined',
            // DEPRECATED — now in config.json → observability.sentryEnv / sentryDsn
            SENTRY_ENV: process.env.SENTRY_ENV ? `"${process.env.SENTRY_ENV}"` : '"development"',
            SENTRY_DSN: process.env.SENTRY_DSN
                ? `"${process.env.SENTRY_DSN}"`
                : '"https://68210fb71359458b9746c55cf5f545b4@o246842.ingest.us.sentry.io/4505432118984704"',
            // Not yet in TenantConfig — keep as-is
            GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY
                ? `"${process.env.GOOGLE_MAPS_API_KEY}"`
                : 'undefined',
            // DEPRECATED — now in config.json → branding.defaultTheme
            APP_THEME: env.APP_THEME ? JSON.stringify(env.APP_THEME) : '"colorful"',
            // Not yet in TenantConfig — keep as-is
            CORS_PROXY_API_KEY: env.CORS_PROXY_API_KEY
                ? JSON.stringify(env.CORS_PROXY_API_KEY)
                : 'undefined',
        },
        resolve: {
            // See useSourceConditions above: the `development` condition resolves @learncard/*
            // to source for the dev server and self-host container builds; Netlify/dist builds
            // leave it off and use the published dist bundles.
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
                usePolling: process.env.CHOKIDAR_USEPOLLING === 'true',
                interval: parseInt(process.env.CHOKIDAR_INTERVAL || '1000', 10),
            },
        },
    };
});

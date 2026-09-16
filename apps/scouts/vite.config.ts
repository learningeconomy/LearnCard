import path from 'path';
import { readFileSync } from 'fs';

import GlobalPolyfill from '@esbuild-plugins/node-globals-polyfill';
import { defineConfig, loadEnv } from 'vite';
import type { UserConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';
import stdlibbrowser from 'node-stdlib-browser';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import type { Plugin as EsbuildPlugin } from 'esbuild';

import { findDuplicateMessageImports } from './scripts/check-i18n-imports.mjs';
import { paraglideMissingKeyOnWarn } from './paraglideOnWarn';
import { parseScoutsEnvironment } from './src/config/buildEnvironment';
import { deepMerge } from '../../packages/learn-card-base/src/config/deepMerge';
import productionTenantConfig from './environments/scoutpass/config.json';
import localTenantConfig from './environments/scoutpass/config.local.json';
import stagingTenantConfig from './environments/scoutpass/config.staging.json';

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

// The polyfill package ships against a different esbuild type instance than Vite.
const globalPolyfillPlugin = GlobalPolyfill({
    process: true,
    buffer: true,
}) as unknown as EsbuildPlugin;

// App version read directly from this app's package.json.
// Deliberately NOT `process.env.npm_package_version` — that reflects the package.json
// of the directory the build was invoked from, so CI builds run from the monorepo root
// would bake in the root package's version instead of the app's.
const packageVersion = (
    JSON.parse(readFileSync(path.join(__dirname, 'package.json'), 'utf-8')) as {
        version: string;
    }
).version;

export default defineConfig(({ mode, command }) => {
    const loadedEnvironment = loadEnv(mode, __dirname, '');
    const environment = parseScoutsEnvironment(
        {
            ...loadedEnvironment,
            ...process.env,
            MODE: mode,
            VITE_NODE_ENV:
                process.env.VITE_NODE_ENV ??
                loadedEnvironment.VITE_NODE_ENV ??
                (mode === 'production' ? 'production' : 'development'),
        },
        `Vite ${command} (${mode})`
    );
    const cacheDir = environment.VITE_DOCKER_SOURCE ? '.vite-docker' : '.vite-local';
    const stageTenantConfig = environment.VITE_NODE_ENV.startsWith('staging')
        ? stagingTenantConfig
        : environment.VITE_NODE_ENV.startsWith('development')
          ? localTenantConfig
          : {};
    const tenantOverrides = deepMerge(
        productionTenantConfig as Record<string, unknown>,
        stageTenantConfig as Record<string, unknown>
    );

    return {
        cacheDir,
        plugins: [
            i18nImportGuard(),
            react(),
            svgr(),
            basicSsl(),
            tsconfigPaths({ projects: [path.resolve(__dirname, 'tsconfig.json')] }),
            paraglideVitePlugin({
                project: './project.inlang',
                outdir: './src/paraglide',
                outputStructure: 'locale-modules',
            }),
        ],
        build: {
            target: 'esnext',
            outDir: path.join(__dirname, 'build'),
            // Turn "missing Paraglide message" rollup warnings into hard build
            // failures so a bad m['…'] key can't white-screen a route at runtime.
            rollupOptions: { onwarn: paraglideMissingKeyOnWarn },
        },
        optimizeDeps: {
            // disabled: false,
            include: ['buffer', 'process', 'react-router', 'react-router-dom', 'crypto-browserify'],
            esbuildOptions: {
                target: 'esnext',
                define: { global: 'globalThis' },
                plugins: [globalPolyfillPlugin],
            },
        },
        define: {
            __PACKAGE_VERSION__: JSON.stringify(packageVersion),
            __APP_VERSION__: JSON.stringify(packageVersion),
            __SCOUTS_BUILD_ENV__: JSON.stringify(environment),
            __SCOUTS_TENANT_OVERRIDES__: JSON.stringify(tenantOverrides),
            'process.version': '"1.0.0"',
            IS_PRODUCTION: mode === 'production',
        },
        resolve: {
            // The self-host Docker build (docker-build script) sets VITE_DOCKER_SOURCE=true so
            // vite resolves @learncard/* via their `development` export → TS source, exactly like
            // the dev server. This lets the container bundle the app in one vite pass without
            // pre-building every workspace package's dist. Netlify's `build` leaves this unset and
            // keeps resolving the published dist outputs.
            ...(environment.VITE_DOCKER_SOURCE
                ? { conditions: ['development', 'module', 'browser', 'import', 'default'] }
                : {}),
            alias: [
                ...Object.entries(stdlibbrowser).map(([find, replacement]) => ({
                    find,
                    replacement,
                })),
                {
                    find: /^learn-card-base$/,
                    replacement: path.resolve(__dirname, '../../packages/learn-card-base/src'),
                },
                {
                    find: /^learn-card-base\/(.*)$/,
                    replacement:
                        path.resolve(__dirname, '../../packages/learn-card-base/src') + '/$1',
                },
                {
                    find: '@web3auth/openlogin-adapter',
                    replacement: '@web3auth/openlogin-adapter/dist/openloginAdapter.umd.min.js',
                },
                { find: 'apps/scouts', replacement: path.resolve(__dirname) },
            ],
            dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom'],
        },
        server: {
            port: 3000,
            proxy: {
                // Proxy SSS key-manager API requests to the lca-api Docker service.
                // Used when VITE_SSS_SERVER_URL is set to '/lca-api' (e.g. in docker-start)
                // to avoid CORS issues during local development.
                '/lca-api': {
                    target: 'http://localhost:5100',
                    changeOrigin: true,
                    rewrite: requestPath => requestPath.replace(/^\/lca-api/, '/api'),
                },
            },
        },
    } as UserConfig;
});

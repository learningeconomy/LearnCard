import path from 'path';
import { fileURLToPath } from 'url';

import type { StorybookConfig } from '@storybook/react-vite';
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';
import { mergeConfig, type PluginOption } from 'vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { paraglideMissingKeyOnWarn } from '../paraglideOnWarn';
import { LOCALE_LOADER_MODULE } from '../src/i18n/paraglideLazyLocales';
import stdlibbrowser from 'node-stdlib-browser';
import fs from 'fs';
import type { LearnCardAppEnvironment } from '../src/config/buildEnvironment';

// Storybook 10 loads main.ts as ESM, so there is no CommonJS __dirname.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const STORYBOOK_BUILD_ENVIRONMENT = {
    MODE: 'development',
    VITE_ENABLE_AUTH_DEBUG_WIDGET: false,
    VITE_DOCKER_SOURCE: false,
    ANALYZE: false,
    CHOKIDAR_USEPOLLING: false,
    CHOKIDAR_INTERVAL: 1000,
    DEV: false,
    PROD: true,
} satisfies LearnCardAppEnvironment;

/**
 * `@learncard/react`'s prebuilt `dist/**\/*.svg` files are JS modules that
 * declare both a named `ReactComponent` export and a default export twice,
 * which esbuild/rollup reject during a production Storybook build. This plugin
 * loads those files and keeps only the `export default` data-URL, which is all
 * the dashboard's transitive icon imports actually consume.
 */
const stripPrebuiltSvgDuplicateExports = (): PluginOption => ({
    name: 'strip-prebuilt-svg-duplicate-exports',
    enforce: 'pre',
    load(id) {
        const clean = id.split('?')[0];
        if (!clean.endsWith('.svg')) return null;
        if (!clean.includes('react-learn-card/dist') && !clean.includes('@learncard/react/dist'))
            return null;

        const source = fs.readFileSync(clean, 'utf-8');
        const match = source.match(/export default\s+("[^"]*"|'[^']*');?/);
        if (!match) return null;
        return `export default ${match[1]};`;
    },
});

/**
 * Storybook bundles Paraglide's default output with every locale, so serve the app's lazy-locale
 * loader module (`virtual:paraglide-lazy-locales`, see src/i18n/paraglideLazyLocales.ts) as the
 * no-op it is in dev and tests.
 */
const paraglideLazyLocalesNoop = (): PluginOption => ({
    name: 'paraglide-lazy-locales-noop',
    resolveId: id => (id === LOCALE_LOADER_MODULE ? `\0${LOCALE_LOADER_MODULE}` : undefined),
    load: id =>
        id === `\0${LOCALE_LOADER_MODULE}`
            ? 'export const loadLocaleMessages = () => Promise.resolve();\nexport const isLocaleMessagesLoaded = () => true;\n'
            : undefined,
});

const config: StorybookConfig = {
    stories: [
        '../src/**/*.stories.@(ts|tsx)',
        '../../../packages/learn-card-base/src/ui/**/*.stories.@(ts|tsx)',
    ],
    // Storybook 9 folded essentials and interactions into core; docs stays an addon.
    addons: ['@storybook/addon-docs', '@storybook/addon-themes'],
    framework: {
        name: '@storybook/react-vite',
        options: {
            builder: {
                viteConfigPath: path.resolve(__dirname, 'storybook-vite.config.ts'),
            },
        },
    },
    core: { disableTelemetry: true },
    typescript: { reactDocgen: false },
    viteFinal: async baseConfig =>
        mergeConfig(baseConfig, {
            plugins: [
                stripPrebuiltSvgDuplicateExports(),
                svgr(),
                // Generate Paraglide messages during the Storybook build, mirroring
                // vite.config.ts. Without this, components importing the gitignored,
                // build-generated `src/paraglide/messages.js` fail to resolve.
                paraglideVitePlugin({
                    project: path.resolve(__dirname, '../project.inlang'),
                    outdir: path.resolve(__dirname, '../src/paraglide'),
                }),
                paraglideLazyLocalesNoop(),
                tsconfigPaths({
                    projects: [path.resolve(__dirname, '../tsconfig.json')],
                    ignoreConfigErrors: true,
                }),
            ],
            build: {
                // Chromatic consumes the emitted files and dependency stats, not Vite's
                // informational gzip report. Computing compressed sizes for this large
                // Storybook creates an avoidable memory spike after bundling completes.
                reportCompressedSize: false,
                rollupOptions: {
                    // Fail the Storybook (Chromatic) build on missing Paraglide keys.
                    onwarn: paraglideMissingKeyOnWarn,
                },
            },
            define: {
                __PACKAGE_VERSION__: JSON.stringify('storybook'),
                __APP_BUILD_ENV__: JSON.stringify(STORYBOOK_BUILD_ENVIRONMENT),
                __APP_VERSION__: JSON.stringify('storybook'),
                __BUILD_SHA__: JSON.stringify('storybook'),
                __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
                IS_PRODUCTION: false,
                APP_THEME: JSON.stringify('colorful'),
                global: 'globalThis',
                'process.env.NODE_ENV': JSON.stringify('development'),
            },
            resolve: {
                alias: {
                    // Node stdlib browser shims — mirrors vite.config.ts so transitive
                    // @learncard/* deps that touch Node globals don't crash the browser.
                    ...stdlibbrowser,
                    'learn-card-base': path.resolve(
                        __dirname,
                        '../../../packages/learn-card-base/src'
                    ),
                    'apps/learn-card-app': path.resolve(__dirname, '..'),
                    '@analytics': path.resolve(__dirname, '../src/analytics'),
                    // The optional Streamdown code plugin imports Shiki's complete language
                    // registry. Current stories do not render AI code blocks, so preserve the
                    // production renderer while excluding those unused grammars from Storybook.
                    '@streamdown/code': path.resolve(__dirname, './stubs/streamdownCodePlugin.ts'),
                },
                dedupe: ['react', 'react-dom', 'react-router', 'react-router-dom', 'history'],
            },
            optimizeDeps: {
                // Pre-bundle the transitive CJS deps Vite would otherwise discover at
                // request time; late discovery triggers a re-optimize that strands story
                // chunks on a stale hash (the "504 Outdated Optimize Dep" loop).
                include: [
                    'react',
                    'react-dom',
                    'buffer',
                    'process',
                    'end-of-stream',
                    'decode-uri-component',
                    'filter-obj',
                    'split-on-first',
                ],
                // Vite 8 pre-bundles with Rolldown, which can't run esbuild plugins. Oxc's inject and
                // define provide the Buffer/process globals, matching the app's vite.config.mts.
                rolldownOptions: {
                    transform: {
                        define: { global: 'globalThis' },
                        inject: { process: 'process', Buffer: ['buffer', 'Buffer'] },
                    },
                },
            },
        }),
};

export default config;

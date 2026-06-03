import path from 'path';

import type { StorybookConfig } from '@storybook/react-vite';
import svgr from 'vite-plugin-svgr';
import tsconfigPaths from 'vite-tsconfig-paths';
import { mergeConfig, type PluginOption } from 'vite';
import GlobalPolyfill from '@esbuild-plugins/node-globals-polyfill';
import stdlibbrowser from 'node-stdlib-browser';
import fs from 'fs';

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

const config: StorybookConfig = {
    stories: ['../src/**/*.stories.@(ts|tsx)'],
    addons: ['@storybook/addon-essentials', '@storybook/addon-themes'],
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
                tsconfigPaths({
                    projects: [path.resolve(__dirname, '../tsconfig.json')],
                    ignoreConfigErrors: true,
                }),
            ],
            define: {
                __PACKAGE_VERSION__: JSON.stringify('storybook'),
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
                    'learn-card-base': path.resolve(__dirname, '../../../packages/learn-card-base/src'),
                    'apps/learn-card-app': path.resolve(__dirname, '..'),
                    '@analytics': path.resolve(__dirname, '../src/analytics'),
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
                    'isomorphic-webcrypto',
                    'decode-uri-component',
                    'filter-obj',
                    'split-on-first',
                ],
                esbuildOptions: {
                    target: 'esnext',
                    define: { global: 'globalThis' },
                    // Injects the Buffer/process globals into pre-bundled deps, matching
                    // the main app's vite.config.ts optimizeDeps setup.
                    plugins: [GlobalPolyfill({ process: true, buffer: true }) as any],
                },
            },
        }),
};

export default config;

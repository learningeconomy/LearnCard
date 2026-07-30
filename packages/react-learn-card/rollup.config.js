import glob from 'glob';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import del from 'rollup-plugin-delete';
import smartAsset from 'rollup-plugin-smart-asset';
import esbuild from 'rollup-plugin-esbuild';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import dts from 'rollup-plugin-dts';
import svgr from '@svgr/rollup';
import styles from 'rollup-plugin-styles';

const packageJson = require('./package.json');

/**
 * Force singleton-bearing modules into their own shared chunk. With multiple
 * entry points (src/index.ts + every component index.ts) and no manualChunks,
 * rollup duplicates small modules across entry chunks — which is fatal for
 * `src/i18n` because each copy runs its own `createContext()`, yielding multiple
 * I18nContext instances. The app mounts the provider on one instance while the
 * rendered components (VerificationsBox, etc.) read another → `useT` silently
 * falls back to English. Keeping i18n in a single chunk guarantees one context.
 */
const manualChunks = id => {
    if (id.includes('/src/i18n/')) return 'i18n';
    return undefined;
};

export default [
    {
        input: ['src/index.ts', ...glob.sync('src/?(components)/**/index.ts')],
        output: [
            {
                dir: packageJson.main,
                format: 'cjs',
                sourcemap: true,
                exports: 'named',
                assetFileNames: '[name]-[hash][extname]',
                manualChunks,
            },
            {
                dir: packageJson.module,
                format: 'esm',
                sourcemap: true,
                assetFileNames: '[name]-[hash][extname]',
                manualChunks,
            },
        ],
        plugins: [
            del({ targets: [packageJson.main, packageJson.module] }),
            smartAsset({
                url: 'copy',
                keepImport: true,
                extensions: ['.svg', '.gif', '.png', '.jpg', '.webp', '.jpeg'],
            }),
            json(),
            peerDepsExternal(),
            svgr(),
            resolve(),
            commonjs(),
            esbuild(),
        ],
        external: ['react', 'react-dom', '@learncard/init'],
    },
    {
        input: ['src/assets/styles/main.css', 'src/assets/styles/base.css'],
        output: [{ dir: 'dist', assetFileNames: '[name][extname]' }],
        plugins: [styles({ mode: 'extract', minimize: true, modules: false })],
    },
    {
        input: ['src/index.ts'],
        output: [{ file: packageJson.types, format: 'es' }],
        plugins: [
            smartAsset({
                url: 'copy',
                keepImport: true,
                extensions: ['.svg', '.gif', '.png', '.jpg', '.webp', '.jpeg'],
            }),
            dts(),
        ],
    },
];

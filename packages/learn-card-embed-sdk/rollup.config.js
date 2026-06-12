import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import esbuild from 'rollup-plugin-esbuild';
import del from 'rollup-plugin-delete';
import dts from 'rollup-plugin-dts';
import { string } from 'rollup-plugin-string';

const pkg = require('./package.json');

/**
 * Minify island-vanilla.js and expose it as a string for both the package
 * build and direct Vite `?raw` source imports.
 */
function minifyIslandPlugin() {
    const loadIsland = id => {
        const { readFileSync } = require('fs');
        const { transformSync } = require('esbuild');
        const src = readFileSync(id.split('?')[0], 'utf-8');
        const { code: minified } = transformSync(src, { minify: true, loader: 'js' });

        return { code: `export default ${JSON.stringify(minified)};`, map: null };
    };

    return {
        name: 'minify-island',
        resolveId(source, importer) {
            if (!source.endsWith('island-vanilla.js?raw')) return null;

            const { dirname, resolve } = require('path');

            return resolve(dirname(importer), source);
        },
        load(id) {
            if (!id.includes('island-vanilla.js?raw')) return null;

            return loadIsland(id);
        },
        transform(_code, id) {
            if (!id.includes('island-vanilla.js')) return null;

            return loadIsland(id);
        },
    };
}

export default [
    {
        input: 'src/index.ts',
        output: [
            {
                file: pkg.main,
                format: 'iife',
                name: 'LearnCard',
                sourcemap: true,
            },
            {
                file: pkg.module,
                format: 'esm',
                sourcemap: true,
            },
        ],
        plugins: [
            del({ targets: ['dist/*'] }),
            string({
                include: [
                    'packages/learn-card-embed-sdk/src/iframe/island-vanilla.js',
                    'src/iframe/island-vanilla.js',
                    'src/iframe/island-vanilla.js?raw',
                ],
            }),
            minifyIslandPlugin(),
            replace({
                'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
                preventAssignment: true,
            }),
            resolve({ browser: true }),
            commonjs(),
            esbuild({ target: 'es2019' }),
        ],
    },
    {
        input: 'src/index.ts',
        output: [{ file: pkg.types, format: 'es' }],
        plugins: [dts()],
    },
];

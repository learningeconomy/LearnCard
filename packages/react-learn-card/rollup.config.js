import glob from 'glob';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import postcss from 'rollup-plugin-postcss';
import commonjs from '@rollup/plugin-commonjs';
import image from 'rollup-plugin-img';
import esbuild from 'rollup-plugin-esbuild';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import dts from 'rollup-plugin-dts';
import svgr from '@svgr/rollup'

const packageJson = require('./package.json');

export default [
    {
        input: ['src/index.ts', ...glob.sync('src/?(components)/**/index.ts')],
        output: [
            { dir: packageJson.main, format: 'cjs', sourcemap: true, exports: 'named' },
            { dir: packageJson.module, format: 'esm', sourcemap: true },
        ],
        plugins: [
            json(),
            peerDepsExternal(),
            postcss({ minimize: true, inject: { insertAt: 'top' } }),
            image(),
            svgr(),
            resolve(),
            commonjs(),
            esbuild(),
        ],
        external: ['react', 'react-dom'],
    },
    {
        input: ['src/index.ts'],
        output: [{ file: packageJson.types, format: 'es' }],
        plugins: [postcss({ inject: false }), image(), dts()],
    },
];

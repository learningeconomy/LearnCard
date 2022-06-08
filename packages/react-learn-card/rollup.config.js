import glob from 'glob';
import resolve from '@rollup/plugin-node-resolve';
import postcss from 'rollup-plugin-postcss';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import image from 'rollup-plugin-img';
import { terser } from 'rollup-plugin-terser';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';

const packageJson = require('./package.json');

export default [
    {
        input: ['src/index.ts', ...glob.sync('src/?(components)/**/index.ts')],
        output: [
            { dir: packageJson.main, format: 'cjs', sourcemap: true, exports: 'named' },
            { dir: packageJson.module, format: 'esm', sourcemap: true },
        ],
        plugins: [
            postcss({ minimize: true, inject: { insertAt: 'top' } }),
            peerDepsExternal(),
            image(),
            resolve(),
            typescript(),
            commonjs(),
            terser(),
        ],
    },
];

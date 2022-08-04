import glob from 'glob';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import del from 'rollup-plugin-delete';
import image from 'rollup-plugin-img';
import esbuild from 'rollup-plugin-esbuild';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import dts from 'rollup-plugin-dts';
import svgr from '@svgr/rollup';
import styles from 'rollup-plugin-styles';

const packageJson = require('./package.json');

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
            },
            {
                dir: packageJson.module,
                format: 'esm',
                sourcemap: true,
                assetFileNames: '[name]-[hash][extname]',
            },
        ],
        plugins: [
            del({ targets: [packageJson.main, packageJson.module] }),
            json(),
            peerDepsExternal(),
            image(),
            svgr(),
            resolve(),
            commonjs(),
            esbuild(),
        ],
        external: ['react', 'react-dom', '@learncard/core'],
    },
    {
        input: ['src/assets/styles/main.css', 'src/assets/styles/base.css'],
        output: [{ dir: 'dist', assetFileNames: '[name][extname]' }],
        plugins: [styles({ mode: 'extract', minimize: true, modules: false })],
    },
    {
        input: ['src/index.ts'],
        output: [{ file: packageJson.types, format: 'es' }],
        plugins: [image(), dts()],
    },
];

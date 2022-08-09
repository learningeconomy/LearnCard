import del from 'rollup-plugin-delete';
import { base64 } from 'rollup-plugin-base64';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import esbuild from 'rollup-plugin-esbuild';
import snaps from '@metamask/rollup-plugin-snaps';
import dts from 'rollup-plugin-dts';

const packageJson = require('./package.json');

/** @type {RollupOptions[]} */
const snapConfig = [
    {
        input: './src/snap.ts',
        output: {
            file: './dist/snap.js',
            format: 'cjs',
            banner: 'var require = () => "window.crypto";\nvar self = window;',
        },
        plugins: [
            del({ targets: ['./dist/snap.js'] }),
            commonjs(),
            resolve({ browser: true, preferBuiltins: true }),
            base64({ include: '**/*.wasm' }),
            esbuild(),
            snaps(),
        ],
        external: ['isomorphic-fetch', 'cross-fetch'],
    },
    {
        input: './src/index.ts',
        output: [
            { file: packageJson.main, format: 'cjs', sourcemap: true },
            { file: packageJson.module, format: 'esm', sourcemap: true },
        ],
        plugins: [
            del({ targets: [packageJson.main, packageJson.module] }),
            commonjs(),
            resolve({ browser: true, preferBuiltins: true }),
            esbuild(),
        ],
    },
    {
        input: './src/index.ts',
        output: { file: packageJson.types, format: 'es' },
        plugins: [dts()],
    },
];

export default snapConfig;

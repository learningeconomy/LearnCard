import del from 'rollup-plugin-delete';
import { base64 } from 'rollup-plugin-base64';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import esbuild from 'rollup-plugin-esbuild';
import snaps from '@metamask/rollup-plugin-snaps';

/** @type {RollupOptions} */
const snapConfig = {
    input: './src/index.ts',
    output: {
        file: './dist/bundle.js',
        format: 'cjs',
        banner: 'var require = () => "window.crypto";',
    },
    plugins: [
        del({ targets: ['./dist'] }),
        commonjs(),
        resolve({ browser: true, preferBuiltins: true }),
        base64({ include: '**/*.wasm' }),
        esbuild(),
        snaps(),
    ],
};

export default snapConfig;

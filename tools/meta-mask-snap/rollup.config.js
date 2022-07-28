import del from 'rollup-plugin-delete';
import nodePolyfills from 'rollup-plugin-polyfill-node';
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
    },
    plugins: [
        del({ targets: ['./dist'] }),
        // nodePolyfills({ include: 'crypto' }),
        commonjs(),
        resolve({ browser: true, preferBuiltins: false }),
        esbuild(),
        snaps(),
    ],
};

export default snapConfig;

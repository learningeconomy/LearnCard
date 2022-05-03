import resolve from '@rollup/plugin-node-resolve';
import postcss from 'rollup-plugin-postcss';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import { terser } from 'rollup-plugin-terser';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';

const packageJson = require('./package.json');

export default [
    {
        input: 'src/index.ts',
        output: [
            {
                file: packageJson.main,
                format: 'cjs',
                sourcemap: true,
            },
            {
                file: packageJson.module,
                format: 'esm',
                sourcemap: true,
            },
        ],
        plugins: [
            peerDepsExternal(),
            postcss({
                minimize: true,
                modules: true,
                extract: true,
            }),
            resolve(),
            commonjs(),
            typescript({ tsconfig: './tsconfig.json' }),
            terser(),
        ],
        external: ['react', 'react-dom', 'styled-components'],
    },
    /* {
        input: "types/index.d.ts",
        output: [{ file: "dist/index.d.ts", format: "esm" }],
        plugins: [dts()],
    }, */
];

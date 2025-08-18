import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import esbuild from 'rollup-plugin-esbuild';
import del from 'rollup-plugin-delete';
import dts from 'rollup-plugin-dts';
import { string } from 'rollup-plugin-string';

const pkg = require('./package.json');

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
      }
    ],
    plugins: [
      del({ targets: ['dist/*'] }),
      string({
        include: [
          '**/preact/dist/preact.min.umd.js',
          'packages/learn-card-embed-sdk/src/iframe/island.js',
          'src/iframe/island.js',
        ],
      }),
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

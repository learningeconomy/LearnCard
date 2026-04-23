import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import esbuild from 'rollup-plugin-esbuild';
import del from 'rollup-plugin-delete';
import dts from 'rollup-plugin-dts';
import { string } from 'rollup-plugin-string';

const pkg = require('./package.json');

/**
 * Minify island-vanilla.js with esbuild after rollup-plugin-string reads it.
 * Must be placed AFTER string() in plugins array so it runs second.
 */
function minifyIslandPlugin() {
  return {
    name: 'minify-island',
    transform(_code, id) {
      if (!id.endsWith('island-vanilla.js')) return null;
      const { readFileSync } = require('fs');
      const { transformSync } = require('esbuild');
      const src = readFileSync(id, 'utf-8');
      const { code: minified } = transformSync(src, { minify: true, loader: 'js' });
      return { code: `export default ${JSON.stringify(minified)};`, map: null };
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
      }
    ],
    plugins: [
      del({ targets: ['dist/*'] }),
      string({
        include: [
          'packages/learn-card-embed-sdk/src/iframe/island-vanilla.js',
          'src/iframe/island-vanilla.js',
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
  // Separate IIFE bundle for the one-line `<script src="...badge-claim.js">` embed.
  // Self-executing: reads data-* attributes from its own <script> tag and renders
  // a button/QR immediately. No global namespace footprint required.
  {
    input: 'src/badge-claim.ts',
    output: {
      file: 'dist/badge-claim.js',
      format: 'iife',
      name: 'LearnCardBadgeClaim',
      sourcemap: true,
    },
    plugins: [
      replace({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
        preventAssignment: true,
      }),
      resolve({ browser: true }),
      commonjs(),
      esbuild({ target: 'es2019', minify: process.env.NODE_ENV === 'production' }),
    ],
  },
];

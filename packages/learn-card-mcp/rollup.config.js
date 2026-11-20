import { createRequire } from 'module';

import esbuild from 'rollup-plugin-esbuild';
import dts from 'rollup-plugin-dts';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');

// Runtime dependencies (and their subpath imports) stay external so the host service
// shares one MCP SDK and Express instance with this package.
const deps = Object.keys(pkg.dependencies ?? {});
const external = id =>
    id.startsWith('node:') || deps.some(dep => id === dep || id.startsWith(`${dep}/`));

export default [
    {
        input: 'src/index.ts',
        external,
        output: [
            { file: pkg.main, format: 'cjs', sourcemap: true, exports: 'named' },
            { file: pkg.module, format: 'esm', sourcemap: true },
        ],
        plugins: [esbuild({ target: 'es2022' })],
    },
    {
        input: 'src/index.ts',
        external,
        output: [{ file: pkg.types, format: 'es' }],
        plugins: [dts()],
    },
];

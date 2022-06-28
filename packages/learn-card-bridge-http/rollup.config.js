import json from '@rollup/plugin-json';
import esbuild from 'rollup-plugin-esbuild';

const packageJson = require('./package.json');

export default [
    {
        input: ['cli/index.tsx'],
        output: [{ file: packageJson.bin, format: 'cjs' }],
        plugins: [json(), esbuild()],
    },
];

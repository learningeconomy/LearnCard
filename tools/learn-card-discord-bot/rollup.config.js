import json from '@rollup/plugin-json';
import esbuild from 'rollup-plugin-esbuild';

const packageJson = require('./package.json');

export default [
    {
        input: ['src/Bot.ts'],
        output: [{ file: packageJson.bin, format: 'cjs', banner: '#!/usr/bin/env node' }],
        plugins: [json(), esbuild()],
        external: ['discord.js'],
    },
];

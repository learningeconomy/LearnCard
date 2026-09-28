import json from '@rollup/plugin-json';
import esbuild from 'rollup-plugin-esbuild';

import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default [
    {
        input: ['src/index.tsx'],
        output: [
            {
                file: packageJson.bin,
                format: 'cjs',
                banner: '#!/usr/bin/env node',
                inlineDynamicImports: true,
            },
        ],
        plugins: [
            json(),
            esbuild(),
            {
                name: 'native-webhook-import',
                renderDynamicImport({ moduleId }) {
                    // Rollup 2 otherwise emits require(data:...), which Node cannot load.
                    if (moduleId.endsWith('/src/webhook.ts')) {
                        return { left: 'import(', right: ')' };
                    }
                    return null;
                },
            },
        ],
    },
];

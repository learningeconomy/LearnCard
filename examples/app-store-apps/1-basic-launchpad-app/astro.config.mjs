import { defineConfig } from 'astro/config';
import path from 'path';
import { fileURLToPath } from 'url';

import netlify from '@astrojs/netlify';
import tailwind from '@astrojs/tailwind';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(__dirname, '../../..');

export default defineConfig({
    output: 'server',
    adapter: netlify(),
    integrations: [tailwind()],

    vite: {
        resolve: {
            alias: {
                // learn-card-helpers externalizes `filter-obj` which pnpm resolves
                // to the CJS v1.1.0 in hoisted node_modules. That version uses
                // `module.exports` (breaks noExternal) and lacks named exports
                // (breaks as external). Force resolution to the ESM v5.x already
                // in the pnpm store.
                'filter-obj': path.join(
                    monorepoRoot,
                    'node_modules/.pnpm/filter-obj@5.1.0/node_modules/filter-obj/index.js'
                ),
            },
        },
    },
});

import path from 'path';
import { fileURLToPath } from 'url';

import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import tailwind from '@astrojs/tailwind';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(__dirname, '../../..');

export default defineConfig({
    output: 'server',
    adapter: netlify(),
    outDir: 'dist',
    integrations: [tailwind()],
    vite: {
        resolve: {
            alias: {
                '@learncard/init': path.join(
                    monorepoRoot,
                    'packages/learn-card-init/dist/init.esm.js'
                ),
                // LearnCard SSR can externalize `filter-obj` to the hoisted CJS v1 build,
                // which breaks Astro's ESM module runner with `module is not defined`.
                'filter-obj': path.join(
                    monorepoRoot,
                    'node_modules/.pnpm/filter-obj@5.1.0/node_modules/filter-obj/index.js'
                ),
            },
        },
    },
});

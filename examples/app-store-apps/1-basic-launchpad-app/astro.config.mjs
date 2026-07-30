import { defineConfig } from 'astro/config';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

import netlify from '@astrojs/netlify';
import tailwind from '@astrojs/tailwind';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const monorepoRoot = path.resolve(__dirname, '../../..');

export default defineConfig({
    output: 'server',
    adapter: netlify(),
    integrations: [tailwind()],

    build: {
        assets: '_astro',
        client: './client/',
        concurrency: 1,
        format: 'directory',
        inlineStylesheets: 'auto',
        redirects: true,
        server: './server/',
        serverEntry: 'entry.mjs',
    },

    image: {
        remotePatterns: [],
    },

    vite: {
        resolve: {
            alias: {
                // learn-card-helpers externalizes `filter-obj`; force Vite to the
                // package entry that the current package manager resolved instead
                // of relying on an installer-specific node_modules layout.
                'filter-obj': require.resolve('filter-obj', { paths: [monorepoRoot] }),
            },
        },
    },
});

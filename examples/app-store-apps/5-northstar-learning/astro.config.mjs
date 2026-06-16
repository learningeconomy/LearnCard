import { defineConfig } from 'astro/config';

import netlify from '@astrojs/netlify';

// Server output + Netlify adapter — Astro actions need a server runtime
// to sign VCs with `@learncard/init`. Static hosting would defeat the
// purpose (we'd have no secure seed boundary).
export default defineConfig({
    output: 'server',
    adapter: netlify(),
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
});

import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  // No edge functions here; local edge emulation breaks on Deno 2.9+.
  adapter: netlify({
    devFeatures: { environmentVariables: false, images: true, edgeFunctions: false },
  }),
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

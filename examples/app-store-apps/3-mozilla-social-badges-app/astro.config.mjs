import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

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

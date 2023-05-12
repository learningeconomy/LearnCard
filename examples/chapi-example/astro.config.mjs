import { defineConfig } from 'astro/config';
import GlobalPolyfill from '@esbuild-plugins/node-globals-polyfill';
import stdlibbrowser from 'node-stdlib-browser';
import basicSsl from '@vitejs/plugin-basic-ssl';
import react from '@astrojs/react';

import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
    vite: {
        plugins: [basicSsl()],
        optimizeDeps: {
            exclude: [],
            esbuildOptions: {
                define: { global: 'globalThis' },
                plugins: [GlobalPolyfill({ process: true, buffer: true })],
            },
        },
        resolve: { alias: stdlibbrowser },
    },
    integrations: [react(), tailwind()],
});

import { defineConfig } from 'astro/config';
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
            },
        },
        resolve: { alias: stdlibbrowser },
    },
    integrations: [react(), tailwind()],
});

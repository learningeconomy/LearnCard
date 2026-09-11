import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    output: 'static',
    outDir: 'dist',
    integrations: [],
    vite: {
        plugins: [tailwindcss()],
    },
    build: {
        client: './client/',
        server: './server/',
    },
    image: {
        remotePatterns: [],
    },
});

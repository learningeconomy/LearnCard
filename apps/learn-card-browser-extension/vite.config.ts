import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './src/manifest.json';

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2020',
    rollupOptions: {
      input: {
        offscreen: 'src/offscreen.html'
      }
    }
  }
});

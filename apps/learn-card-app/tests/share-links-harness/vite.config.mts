import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'node:path';
import tailwind from 'tailwindcss';
import { createRequire } from 'node:module';
const tailwindConfig = createRequire(import.meta.url)('../../tailwind.config.js');
const app = path.resolve(import.meta.dirname, '../..');
const fixture = path.resolve(import.meta.dirname, 'wallet.ts');
export default defineConfig({
    root: import.meta.dirname,
    plugins: [
        react(),
        {
            name: 'isolated-share-fixtures',
            enforce: 'pre',
            resolveId(id) {
                if (
                    id === 'learn-card-base' ||
                    id.endsWith('/learn-card-base/src') ||
                    id.endsWith('/helpers/walletHelpers') ||
                    id.endsWith('config/bootstrapTenantConfig')
                )
                    return fixture;
            },
        },
    ],
    resolve: {
        alias: { 'learn-card-base': path.resolve(app, '../../packages/learn-card-base/src') },
    },
    css: {
        postcss: {
            plugins: [
                tailwind({
                    ...tailwindConfig,
                    content: [path.join(app, 'src/components/share-links/*.{ts,tsx}')],
                }),
            ],
        },
    },
    server: {
        host: '127.0.0.1',
        port: 3018,
        strictPort: true,
        fs: { allow: [path.resolve(app, '../..')] },
    },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
const app = path.resolve(import.meta.dirname, '../..');
const fixture = path.resolve(import.meta.dirname, 'wallet.ts');
export default defineConfig({
    root: import.meta.dirname,
    plugins: [
        tailwindcss(),
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
    server: {
        host: '127.0.0.1',
        port: 3018,
        strictPort: true,
        fs: { allow: [path.resolve(app, '../..')] },
    },
});

import * as path from 'node:path';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@learncard/credential-library': path.resolve(
                __dirname,
                '../../packages/credential-library/src/index.ts',
            ),
            '@learncard/render-method-designer': path.resolve(
                __dirname,
                '../../packages/render-method-designer/src/index.ts',
            ),
            '@learncard/render-method-plugin': path.resolve(
                __dirname,
                '../../packages/plugins/render-method/src/index.ts',
            ),
        },
    },
    server: {
        port: 5174,
    },
});

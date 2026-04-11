import * as path from 'node:path';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fixtureWriter from './src/vite-plugin-fixtures';

export default defineConfig({
    plugins: [react(), fixtureWriter()],
    resolve: {
        alias: {
            // Resolve to source so new fixtures appear via HMR without rebuilding
            '@learncard/credential-library': path.resolve(
                __dirname,
                '../../packages/credential-library/src/index.ts',
            ),
        },
    },
});

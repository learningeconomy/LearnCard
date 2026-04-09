import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
    resolve: {
        alias: {
            'learn-card-base/': resolve(__dirname, 'src') + '/',
            'learn-card-base': resolve(__dirname, 'src/index.ts'),
        },
    },
    test: {
        globals: true,
        include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    },
});

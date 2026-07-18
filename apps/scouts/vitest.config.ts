import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        include: ['src/**/*.test.{ts,tsx}'],
    },
    resolve: {
        alias: {
            'learn-card-base': path.resolve(__dirname, '../../packages/learn-card-base/src'),
            'apps/scouts': path.resolve(__dirname),
        },
    },
});

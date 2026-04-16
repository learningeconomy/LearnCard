import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        fileParallelism: false,
        globalSetup: ['./setup/global-setup.ts'],
        setupFiles: ['./setup/test-setup.ts'],
        teardownTimeout: 120_000,
        exclude: ['**/node_modules/**', '**/dist/**', '**/.{idea,git,cache,output,temp}/**'],
    },
});

import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

/**
 * Resolve the plugin import straight at its TypeScript source so we
 * don't need a prior build step. Mirrors the in-process e2e package.
 */
const pluginSrc = resolve(
    __dirname,
    '../../packages/plugins/openid4vc/src/index.ts'
);

export default defineConfig({
    resolve: {
        alias: {
            '@learncard/openid4vc-plugin': pluginSrc,
        },
    },
    test: {
        environment: 'node',
        globals: true,
        // One walt.id stack per run — serialize so the shared docker
        // bring-up is only paid once.
        fileParallelism: false,
        globalSetup: ['./setup/global-setup.ts'],
        // walt.id is slow to warm up on a cold image pull.
        hookTimeout: 180_000,
        testTimeout: 60_000,
        teardownTimeout: 60_000,
        exclude: ['**/node_modules/**', '**/dist/**', '**/.{idea,git,cache,output,temp}/**'],
    },
});

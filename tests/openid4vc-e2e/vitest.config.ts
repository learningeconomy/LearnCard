import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

/**
 * The OpenID4VC plugin ships as a built artifact — its `package.json`
 * `main` points at `./dist/index.js`, which doesn't exist until
 * `pnpm --filter @learncard/openid4vc-plugin build` runs. To keep
 * local dev / CI fast we bypass the build and resolve the plugin
 * import straight to its TypeScript source. Vitest/Vite handle the
 * TS transform transparently.
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
        // Each `describe` block owns its own ephemeral server via
        // `beforeAll` / `afterAll` — no globalSetup needed. Keep
        // fileParallelism off so concurrent suites don't both try to
        // bind to the same ephemeral port in the same node process.
        fileParallelism: false,
        teardownTimeout: 30_000,
        exclude: ['**/node_modules/**', '**/dist/**', '**/.{idea,git,cache,output,temp}/**'],
    },
});

import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        // Without an explicit include, vitest 3.x quietly skips this
        // suite's specs — `setup/` siblings sit beside `tests/` and
        // the default include traverses both, but our `globalSetup`
        // entry under `setup/` is matched by the spec glob just enough
        // to confuse collection. Pinning `tests/**` makes discovery
        // deterministic.
        include: ['tests/**/*.spec.ts'],
        // One OpenCred stack per run — serialize so the shared docker
        // bring-up is only paid once.
        fileParallelism: false,
        globalSetup: ['./setup/global-setup.ts'],
        // OpenCred's Docker build (when not cached) can take minutes —
        // the first cold run on a fresh CI machine must build the image
        // before the test process can even probe `/health/live`.
        hookTimeout: 600_000,
        testTimeout: 60_000,
        teardownTimeout: 60_000,
        exclude: ['**/node_modules/**', '**/dist/**', '**/.{idea,git,cache,output,temp}/**'],

    },
});

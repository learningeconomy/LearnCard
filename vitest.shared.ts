import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig, mergeConfig, type UserConfig } from 'vitest/config';

process.env.TZ ??= 'UTC';

const coverage = {
    provider: 'v8' as const,
    reporter: ['text', 'text-summary', 'json', 'lcov'],
    reportsDirectory: 'coverage',
};

const basePreset = defineConfig({
    plugins: [tsconfigPaths()],
    test: {
        globals: true,
        passWithNoTests: true,
        coverage,
    },
});

export const nodePreset = mergeConfig(
    basePreset,
    defineConfig({
        test: {
            environment: 'node',
        },
    })
);

export const happyDomPreset = mergeConfig(
    basePreset,
    defineConfig({
        test: {
            environment: 'happy-dom',
        },
    })
);

export const serviceIntegrationPreset = mergeConfig(
    nodePreset,
    defineConfig({
        test: {
            fileParallelism: false,
            pool: 'forks',
            teardownTimeout: 5_000,
            testTimeout: 30_000,
        },
    })
);

export const createVitestConfig = (preset: UserConfig, overrides: UserConfig = {}): UserConfig =>
    mergeConfig(preset, defineConfig(overrides));

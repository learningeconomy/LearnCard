import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig, mergeConfig, type UserConfig } from 'vitest/config';
import { CiTestRetryReporter } from './scripts/ci-test-retries/reporter';

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

export const createVitestConfig = (preset: UserConfig, overrides: UserConfig = {}): UserConfig => {
    const config = mergeConfig(preset, defineConfig(overrides));
    if (process.env.LC_CI_TEST_RETRY !== '1') return config;
    const directory = process.env.LC_CI_TEST_REPORT_DIR;
    if (!directory) throw new Error('CI test retries require a report directory.');
    return mergeConfig(config, {
        test: {
            retry: 1,
            includeTaskLocation: true,
            reporters: ['default', new CiTestRetryReporter(directory, __dirname)],
        },
    });
};

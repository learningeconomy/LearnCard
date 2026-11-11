import { createVitestConfig, happyDomPreset } from '../../vitest.shared';

export default createVitestConfig(happyDomPreset, {
    test: {
        include: ['src/**/*.test.ts'],
        // Scoped crypto test limits; rationale: README.md#testing.
        maxWorkers: 2,
        testTimeout: 15_000,
    },
});

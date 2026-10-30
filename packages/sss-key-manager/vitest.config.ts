import { createVitestConfig, happyDomPreset } from '../../vitest.shared';

export default createVitestConfig(happyDomPreset, {
    test: {
        include: ['src/**/*.test.ts'],
        // Real Argon2id tests share CPU with other Nx projects. Bound this
        // package's workers and allow full-cost multi-derivation checks to finish.
        maxWorkers: 2,
        testTimeout: 15_000,
    },
});

import { createVitestConfig, nodePreset } from '../../vitest.shared';

export default createVitestConfig(nodePreset, {
    test: {
        include: ['src/**/*.test.ts'],
        testTimeout: 30_000,
        hookTimeout: 30_000,
    },
});

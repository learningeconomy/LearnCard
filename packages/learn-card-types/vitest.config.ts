import { createVitestConfig, nodePreset } from '../../vitest.shared';

export default createVitestConfig(nodePreset, {
    test: {
        globals: false,
        passWithNoTests: false,
        include: ['src/**/*.test.ts'],
    },
});

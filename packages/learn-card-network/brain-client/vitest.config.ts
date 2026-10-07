import { createVitestConfig, nodePreset } from '../../../vitest.shared';

export default createVitestConfig(nodePreset, {
    test: {
        include: ['test/**/*.test.ts'],
    },
});

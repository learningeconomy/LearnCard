import { createVitestConfig, nodePreset } from '../../vitest.shared';

export default createVitestConfig(nodePreset, {
    test: {
        globals: false,
        include: ['src/__tests__/registry.test.ts'],
    },
});

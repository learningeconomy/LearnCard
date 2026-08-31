import { createVitestConfig, nodePreset } from '../../vitest.shared';

export default createVitestConfig(nodePreset, {
    test: {
        include: ['src/**/*.test.ts'],
        exclude: ['src/bundle/**'],
    },
});

import { createVitestConfig, nodePreset } from '../../../vitest.shared';

export default createVitestConfig(nodePreset, {
    test: { typecheck: { enabled: true, include: ['src/**/*.test-d.ts'] } },
});

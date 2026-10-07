import { createVitestConfig, happyDomPreset } from '../../vitest.shared';

export default createVitestConfig(happyDomPreset, {
    test: {
        fileParallelism: false,
    },
});

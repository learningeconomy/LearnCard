import { configDefaults } from 'vitest/config';

import { createVitestConfig, nodePreset } from '../../vitest.shared';

export default createVitestConfig(nodePreset, {
    test: {
        globals: false,
        include: ['src/**/*.test.ts'],
        exclude: [...configDefaults.exclude, 'src/__tests__/issuance.test.ts'],
    },
});

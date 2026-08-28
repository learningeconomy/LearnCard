import tsconfigPaths from 'vite-tsconfig-paths';

import { createVitestConfig, serviceIntegrationPreset } from '../../../vitest.shared';

const consoleBffPreset = {
    ...serviceIntegrationPreset,
    plugins: [tsconfigPaths({ root: './' })],
};

export default createVitestConfig(consoleBffPreset, {
    test: {
        include: ['test/**/*.spec.ts'],
    },
});

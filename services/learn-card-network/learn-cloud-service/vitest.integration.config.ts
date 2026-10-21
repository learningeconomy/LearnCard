import { createRequire } from 'node:module';

import { createVitestConfig, serviceIntegrationPreset } from '../../../vitest.shared';

const require = createRequire(import.meta.url);

export default createVitestConfig(serviceIntegrationPreset, {
    test: {
        globalSetup: './vitest-setup.ts',
        include: ['test/**/*.spec.ts'],
        setupFiles: ['./test/setupFile.ts'],
        alias: { '@mongo': require.resolve('./test/helpers/mock-mongo.ts') },
    },
});

import { createRequire } from 'node:module';

import { createVitestConfig, serviceIntegrationPreset } from '../../../vitest.shared';

const require = createRequire(import.meta.url);

export default createVitestConfig(serviceIntegrationPreset, {
    test: {
        globalSetup: './vitest-setup.ts',
        include: ['test/**/*.spec.ts'],
        // Fully-mocked unit specs (mock @cache/@models/@environment) run under
        // vitest.config.ts; they must not load the live-Mongo integration setup.
        exclude: ['test/auth-tickets.spec.ts', 'test/oidc.spec.ts'],
        alias: { '@mongo': require.resolve('./test/helpers/mock-mongo.ts') },
    },
});

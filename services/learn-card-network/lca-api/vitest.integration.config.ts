import { createRequire } from 'node:module';

import { createVitestConfig, serviceIntegrationPreset } from '../../../vitest.shared';

const require = createRequire(import.meta.url);

export default createVitestConfig(serviceIntegrationPreset, {
    test: {
        globalSetup: './vitest-setup.ts',
        include: ['test/**/*.spec.ts'],
        env: {
            IS_E2E_TEST: 'true',
            ESCROW_RELAY_URL: 'https://escrow-relay.example',
            ESCROW_RELAY_AUTH_TOKEN: 'relay-auth-token',
        },
        alias: { '@mongo': require.resolve('./test/helpers/mock-mongo.ts') },
    },
});

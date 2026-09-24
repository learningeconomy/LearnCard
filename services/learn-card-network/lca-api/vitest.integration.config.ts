import { createRequire } from 'node:module';

import { createVitestConfig, serviceIntegrationPreset } from '../../../vitest.shared';

const require = createRequire(import.meta.url);
const liveBroker =
    process.env.KEYCLOAK_INTEGRATION === 'true' && process.env.KEYCLOAK_ROUNDTRIP === 'true';

export default createVitestConfig(serviceIntegrationPreset, {
    test: {
        globalSetup: liveBroker ? [] : './vitest-setup.ts',
        include: liveBroker
            ? [
                  'test/keycloak-broker-roundtrip.integration.spec.ts',
                  'test/keycloak-migration.integration.spec.ts',
                  'test/keycloak-verify.integration.spec.ts',
                  'test/oidc.integration.spec.ts',
              ]
            : ['test/**/*.spec.ts'],
        env: {
            IS_E2E_TEST: 'true',
            ESCROW_RELAY_URL: 'https://escrow-relay.example',
            ESCROW_RELAY_AUTH_TOKEN: 'relay-auth-token',
        },
        // Fully-mocked unit specs (mock @cache/@models/@environment) run under
        // vitest.config.ts; they must not load the live-Mongo integration setup.
        exclude: ['test/auth-tickets.spec.ts', 'test/oidc.spec.ts'],
        alias: {
            '@mongo': require.resolve(
                liveBroker ? './test/helpers/live-mongo.ts' : './test/helpers/mock-mongo.ts'
            ),
        },
    },
});

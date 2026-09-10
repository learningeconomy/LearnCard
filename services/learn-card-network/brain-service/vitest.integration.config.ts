import { createRequire } from 'node:module';

import { createVitestConfig, serviceIntegrationPreset } from '../../../vitest.shared';

const require = createRequire(import.meta.url);

export default createVitestConfig(serviceIntegrationPreset, {
    test: {
        globalSetup: './test-setup.ts',
        include: ['test/**/*.spec.ts'],
        alias: { '@instance': require.resolve('./test/helpers/mock-instance.ts') },
        env: {
            IS_E2E_TEST: 'true',
            // A domain keeps the production misconfiguration guard active without
            // disabling the in-process LearnCard cache as IS_OFFLINE would.
            DOMAIN_NAME: 'localhost%3A3000',
            LOGIN_PROVIDER_DID: 'did:key:z6Mko9uYxDPk2BetRRziLz1xHN8nR5zQWdNjytKNDPcygHJP',
            APP_STORE_ADMIN_PROFILE_IDS: 'app-store-admin',
            TRACE_CONSOLE: 'false',
        },
    },
});

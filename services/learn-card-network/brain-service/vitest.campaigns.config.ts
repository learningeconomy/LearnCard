import { createRequire } from 'node:module';

import { createVitestConfig, serviceIntegrationPreset } from '../../../vitest.shared';

const require = createRequire(import.meta.url);

export default createVitestConfig(serviceIntegrationPreset, {
    test: {
        globalSetup: './test-setup.ts',
        include: ['test/campaigns.spec.ts'],
        alias: { '@instance': require.resolve('./test/helpers/mock-instance.ts') },
        env: {
            IS_E2E_TEST: 'true',
            DOMAIN_NAME: 'localhost%3A3000',
            SEED: 'a'.repeat(64),
            CAMPAIGN_ADMIN_PROFILE_IDS: 'campaign-admin',
            TRACE_CONSOLE: 'false',
            NEO4J_SKIP_INDICES: 'true',
        },
    },
});

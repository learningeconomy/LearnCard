import { createRequire } from 'node:module';

import { createVitestConfig, serviceIntegrationPreset } from '../../../vitest.shared';

const require = createRequire(import.meta.url);

/**
 * Isolated real-Neo4j integration config for the LC-2187 view-receipt
 * repository: atomic consume+increment, concurrent duplicate acknowledgement,
 * lock-blocked time sampling, policy transition, TTL and one-shot pruning.
 */
export default createVitestConfig(serviceIntegrationPreset, {
    test: {
        globalSetup: './test-setup.ts',
        include: ['test/share-link-receipt.neo4j.spec.ts'],
        alias: { '@instance': require.resolve('./test/helpers/mock-instance.ts') },
        env: {
            IS_E2E_TEST: 'true',
            DOMAIN_NAME: 'localhost%3A3000',
            TRACE_CONSOLE: 'false',
        },
    },
});

import { createRequire } from 'node:module';

import { createVitestConfig, serviceIntegrationPreset } from '../../../vitest.shared';

const require = createRequire(import.meta.url);

/**
 * Isolated real-Neo4j integration config for the LC-2187 durable reservation
 * recovery repository. It reuses the existing testcontainers harness and the
 * `@instance` test alias, and discovers only this feature's spec so it never runs
 * the whole brain integration suite. It does not modify any global config.
 */
export default createVitestConfig(serviceIntegrationPreset, {
    test: {
        globalSetup: './test-setup.ts',
        include: ['test/share-link-recovery.neo4j.spec.ts'],
        alias: { '@instance': require.resolve('./test/helpers/mock-instance.ts') },
        env: {
            IS_E2E_TEST: 'true',
            DOMAIN_NAME: 'localhost%3A3000',
            TRACE_CONSOLE: 'false',
        },
    },
});

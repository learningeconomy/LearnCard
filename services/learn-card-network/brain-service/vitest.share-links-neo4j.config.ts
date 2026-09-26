import { createRequire } from 'node:module';

import { createVitestConfig, serviceIntegrationPreset } from '../../../vitest.shared';

const require = createRequire(import.meta.url);

// Real database suites run serially because they clear the same disposable graph.
export default createVitestConfig(serviceIntegrationPreset, {
    test: {
        globalSetup: './test-setup.ts',
        include: ['test/share-link-*.neo4j.spec.ts'],
        alias: { '@instance': require.resolve('./test/helpers/mock-instance.ts') },
        env: {
            IS_E2E_TEST: 'true',
            DOMAIN_NAME: 'localhost%3A3000',
            TRACE_CONSOLE: 'false',
        },
    },
});

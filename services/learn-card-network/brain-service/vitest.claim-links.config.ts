import { createRequire } from 'node:module';
import { createVitestConfig, serviceIntegrationPreset } from '../../../vitest.shared';

const require = createRequire(import.meta.url);

export default createVitestConfig(serviceIntegrationPreset, {
    test: {
        globalSetup: './test/claim-links.setup.ts',
        include: ['src/accesslayer/claim-link-request.test.ts'],
        alias: { '@instance': require.resolve('./test/helpers/mock-instance.ts') },
        env: {
            IS_E2E_TEST: 'true',
            NEO4J_SKIP_INDICES: 'true',
            DOMAIN_NAME: 'localhost%3A3000',
            TRACE_CONSOLE: 'false',
        },
    },
});

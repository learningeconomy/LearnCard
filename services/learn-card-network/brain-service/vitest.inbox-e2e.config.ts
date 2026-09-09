import { createRequire } from 'node:module';

import { createVitestConfig, serviceIntegrationPreset } from '../../../vitest.shared';

const require = createRequire(import.meta.url);

export default createVitestConfig(serviceIntegrationPreset, {
    test: {
        globalSetup: './inbox-e2e-setup.ts',
        setupFiles: ['./test/helpers/inbox-e2e-environment.ts'],
        include: ['test/inbox-security.e2e.ts'],
        alias: { '@instance': require.resolve('./test/helpers/mock-instance.ts') },
        env: {
            NODE_ENV: 'test',
            IS_E2E_TEST: 'true',
            IS_OFFLINE: 'false',
            DOMAIN_NAME: 'localhost%3A3000',
            SEED: 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
            TRACE_CONSOLE: 'false',
            SKIP_DIDKIT_NAPI: 'true',
        },
    },
});

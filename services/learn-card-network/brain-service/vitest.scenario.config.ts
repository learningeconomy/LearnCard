import { createRequire } from 'node:module';
import tsconfigPaths from 'vite-tsconfig-paths';

import { createVitestConfig, serviceIntegrationPreset } from '../../../vitest.shared';

const require = createRequire(import.meta.url);

/** The scenario runner's in-process driver against a fresh test database (scenario/). */
export default createVitestConfig(serviceIntegrationPreset, {
    // tsconfig.json only includes src and test; scenario/ resolves its aliases through
    // tsconfig.scenario.json.
    plugins: [tsconfigPaths({ projects: ['./tsconfig.json', './tsconfig.scenario.json'] })],
    test: {
        globalSetup: './test-setup.ts',
        setupFiles: ['./test/helpers/scenario-preflight.ts'],
        include: ['test/scenario-mvp.spec.ts'],
        alias: { '@instance': require.resolve('./test/helpers/mock-instance.ts') },
        hookTimeout: 60_000,
        testTimeout: 180_000,
        env: {
            NODE_ENV: 'test',
            IS_E2E_TEST: 'true',
            DOMAIN_NAME: 'localhost%3A3000',
            SEED: 'a'.repeat(64),
            // Pinned over any local .env; see vitest.integration.config.ts.
            REDIS_HOST: '',
            REDIS_PORT: '',
            IS_OFFLINE: 'false',
            SKIP_DIDKIT_NAPI: 'true',
            TRACE_CONSOLE: 'false',
            LOGIN_PROVIDER_DID: 'did:key:z6Mko9uYxDPk2BetRRziLz1xHN8nR5zQWdNjytKNDPcygHJP',
            APP_STORE_ADMIN_PROFILE_IDS: 'app-store-admin',
            INSTALL_INTENT_RECONCILER_ALLOW_LOCAL_COORDINATION: 'true',
            INSTALL_INTENT_RECONCILER_SCHEDULER_DISABLED: 'true',
        },
    },
});

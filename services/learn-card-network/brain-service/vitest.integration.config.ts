import { createRequire } from 'node:module';

import { createVitestConfig, serviceIntegrationPreset } from '../../../vitest.shared';

const require = createRequire(import.meta.url);

export default createVitestConfig(serviceIntegrationPreset, {
    test: {
        globalSetup: './test-setup.ts',
        include: ['test/**/*.spec.ts'],
        exclude: [
            // Batch tests require SQS as well as Neo4j; run via test:inbox:e2e.
            'test/inbox-batch.spec.ts',
            // Needs the scenario config (tsconfig paths for scenario/, timeouts, preflight);
            // run via test:scenario.
            'test/scenario-mvp.spec.ts',
        ],
        alias: { '@instance': require.resolve('./test/helpers/mock-instance.ts') },
        // A stalled setup hook should fail the file, not hang the run.
        hookTimeout: 60_000,
        env: {
            IS_E2E_TEST: 'true',
            // Pin over a developer's .env (environment.ts loads it): a REDIS_HOST there makes
            // every cache call retry against a Redis the tests never started, and
            // IS_OFFLINE=true rebuilds the LearnCard plugin stack on every call.
            REDIS_HOST: '',
            REDIS_PORT: '',
            IS_OFFLINE: 'false',
            // A domain keeps the production misconfiguration guard active without
            // disabling the in-process LearnCard cache as IS_OFFLINE would.
            DOMAIN_NAME: 'localhost%3A3000',
            CREDENTIAL_REFRESH_ENABLED: 'true',
            LOGIN_PROVIDER_DID: 'did:key:z6Mko9uYxDPk2BetRRziLz1xHN8nR5zQWdNjytKNDPcygHJP',
            APP_STORE_ADMIN_PROFILE_IDS: 'app-store-admin',
            TRACE_CONSOLE: 'false',
        },
    },
});

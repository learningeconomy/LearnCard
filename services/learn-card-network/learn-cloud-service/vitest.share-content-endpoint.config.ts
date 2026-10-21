import { createVitestConfig, serviceIntegrationPreset } from '../../../vitest.shared';

/**
 * Isolated LC-2187 endpoint suite.
 *
 * These specs exercise the real Fastify inject path, the real C1 verification
 * module, a real ephemeral MongoDB and a real Redis container (global setup).
 * They import no service `@mongo` singleton and touch no application database.
 */
export default createVitestConfig(serviceIntegrationPreset, {
    test: {
        globalSetup: './test/share-content-redis-setup.ts',
        include: [
            'test/share-content-config.spec.ts',
            'test/share-content-endpoint.spec.ts',
            'test/share-content-didkit.spec.ts',
        ],
        hookTimeout: 240_000,
        testTimeout: 120_000,
    },
});

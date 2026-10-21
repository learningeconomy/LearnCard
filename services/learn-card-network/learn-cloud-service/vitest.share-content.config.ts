import { createVitestConfig, serviceIntegrationPreset } from '../../../vitest.shared';

/**
 * Isolated real-Mongo test config for the LC-2187 share-content repository and
 * authorization module.
 *
 * These specs start their own `MongoMemoryServer` (or none at all) and never
 * import the service `@mongo` singleton, so they do not need the shared
 * integration global setup, Redis, the app router or any environment. The
 * endpoint/transport suite lives in `vitest.share-content-endpoint.config.ts`
 * and requires a real Redis container; it is deliberately excluded here so this
 * repository-level config stays independent of Redis.
 */
export default createVitestConfig(serviceIntegrationPreset, {
    test: {
        include: ['test/share-content.spec.ts', 'test/share-content-auth.spec.ts'],
        hookTimeout: 120_000,
    },
});

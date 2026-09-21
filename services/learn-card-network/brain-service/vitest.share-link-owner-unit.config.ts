import tsconfigPaths from 'vite-tsconfig-paths';

import { createVitestConfig, nodePreset } from '../../../vitest.shared';

const brainServicePreset = {
    ...nodePreset,
    plugins: [tsconfigPaths({ root: '../../' })],
};

/**
 * Isolated, DB-free unit config for the LC-2187 owner share-link policy
 * decision table, route boundary, lazy initialization and coordinator
 * intent-hash/default-expiry regressions.
 */
export default createVitestConfig(brainServicePreset, {
    test: {
        include: [
            'test/share-link-policy.unit.spec.ts',
            'test/share-link-owner-policy.unit.spec.ts',
            'test/share-link-owner-runtime.unit.spec.ts',
            'test/share-link-owner-route.unit.spec.ts',
            'test/share-link-list-cursor.unit.spec.ts',
            'test/share-link-public-config.unit.spec.ts',
            'test/share-link-public-route.unit.spec.ts',
            'test/openapi.spec.ts',
        ],
        env: {
            IS_E2E_TEST: 'false',
            // DB-free suite: the combined AppRouter (real tRPC middleware and
            // OpenAPI generation) transitively imports the model registry, whose
            // module scope otherwise fires credential-refresh constraint/index
            // setup against a real Neo4j. Skipping indices prevents that eager
            // graph contact; a test that genuinely queries still fails.
            NEO4J_SKIP_INDICES: 'true',
        },
    },
});

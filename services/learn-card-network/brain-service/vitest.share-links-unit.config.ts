import tsconfigPaths from 'vite-tsconfig-paths';

import { createVitestConfig, nodePreset } from '../../../vitest.shared';

const brainServicePreset = {
    ...nodePreset,
    plugins: [tsconfigPaths({ root: '../../' })],
};

// DB-free share-link tests, including real tRPC and HTTP adapter boundaries.
export default createVitestConfig(brainServicePreset, {
    test: {
        include: [
            'test/share-link-*.unit.spec.ts',
            'test/share-content-client.*.spec.ts',
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

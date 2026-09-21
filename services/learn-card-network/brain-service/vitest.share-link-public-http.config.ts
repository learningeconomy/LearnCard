import tsconfigPaths from 'vite-tsconfig-paths';

import { createVitestConfig, nodePreset } from '../../../vitest.shared';

const brainServicePreset = {
    ...nodePreset,
    plugins: [tsconfigPaths({ root: '../../' })],
};

/**
 * Isolated, DB-free config for the LC-2187 real-local Fastify adapter evidence:
 * the OpenAPI no-store boundary and the tRPC responseMeta header on the mounted
 * `/api` paths. Backing services are injected; no server bootstrap is imported.
 */
export default createVitestConfig(brainServicePreset, {
    test: {
        include: ['test/share-link-public-http-adapter.unit.spec.ts'],
        env: {
            IS_E2E_TEST: 'false',
            NEO4J_SKIP_INDICES: 'true',
        },
    },
});

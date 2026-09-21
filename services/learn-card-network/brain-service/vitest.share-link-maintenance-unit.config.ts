import tsconfigPaths from 'vite-tsconfig-paths';

import { createVitestConfig, nodePreset } from '../../../vitest.shared';

const brainServicePreset = {
    ...nodePreset,
    plugins: [tsconfigPaths({ root: '../../' })],
};

/**
 * Isolated, DB-free config for the LC-2187 share-link maintenance config,
 * runtime composition, runner, scheduler and telemetry. It never loads the
 * Neo4j `@instance` or the did:web signing graph.
 */
export default createVitestConfig(brainServicePreset, {
    test: {
        include: ['test/share-link-maintenance.unit.spec.ts'],
    },
});

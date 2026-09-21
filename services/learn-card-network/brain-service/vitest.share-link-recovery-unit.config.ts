import tsconfigPaths from 'vite-tsconfig-paths';

import { createVitestConfig, nodePreset } from '../../../vitest.shared';

const brainServicePreset = {
    ...nodePreset,
    plugins: [tsconfigPaths({ root: '../../' })],
};

/**
 * Isolated, DB-free config for the LC-2187 durable reservation recovery runner
 * and its pure binding/reconciliation helpers. It does not modify the global
 * unit config and never loads the Neo4j `@instance`.
 */
export default createVitestConfig(brainServicePreset, {
    test: {
        include: ['test/share-link-recovery.unit.spec.ts'],
    },
});

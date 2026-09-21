import tsconfigPaths from 'vite-tsconfig-paths';

import { createVitestConfig, nodePreset } from '../../../vitest.shared';

const brainServicePreset = {
    ...nodePreset,
    plugins: [tsconfigPaths({ root: '../../' })],
};

/**
 * Isolated, DB-free config for the LC-2187 share-link coordinator and one-shot
 * cleanup runner unit tests. It does not modify the global unit config.
 */
export default createVitestConfig(brainServicePreset, {
    test: {
        include: ['test/share-link-coordinator.unit.spec.ts'],
    },
});

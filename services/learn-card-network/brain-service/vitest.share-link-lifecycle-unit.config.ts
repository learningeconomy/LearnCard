import tsconfigPaths from 'vite-tsconfig-paths';

import { createVitestConfig, nodePreset } from '../../../vitest.shared';

const brainServicePreset = {
    ...nodePreset,
    plugins: [tsconfigPaths({ root: '../../' })],
};

/**
 * Isolated, DB-free config for the LC-2187 share-link pure helpers and constraint
 * readiness. It exists so those checks can run without Docker while still using
 * the brain service path aliases; it does not modify the global unit config.
 */
export default createVitestConfig(brainServicePreset, {
    test: {
        include: ['test/share-link-lifecycle.unit.spec.ts'],
    },
});

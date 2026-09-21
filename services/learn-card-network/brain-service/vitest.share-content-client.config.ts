import tsconfigPaths from 'vite-tsconfig-paths';

import { createVitestConfig, nodePreset } from '../../../vitest.shared';

const brainServicePreset = {
    ...nodePreset,
    plugins: [tsconfigPaths({ root: '../../' })],
};

/**
 * Isolated, DB-free config for the LC-2187 LearnCloud share-content client
 * transport tests and the C1 interop contract test. It does not modify the
 * global unit config.
 */
export default createVitestConfig(brainServicePreset, {
    test: {
        include: [
            'test/share-content-client.unit.spec.ts',
            'test/share-content-client.contract.spec.ts',
        ],
    },
});

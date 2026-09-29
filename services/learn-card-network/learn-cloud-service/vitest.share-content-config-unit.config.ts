import tsconfigPaths from 'vite-tsconfig-paths';
import { createVitestConfig, nodePreset } from '../../../vitest.shared';

/** Configuration and boot-order checks without starting databases or services. */
export default createVitestConfig(
    { ...nodePreset, plugins: [tsconfigPaths({ root: '../../' })] },
    { test: { include: ['test/share-content-config.spec.ts'] } }
);

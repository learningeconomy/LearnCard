import tsconfigPaths from 'vite-tsconfig-paths';

import { createVitestConfig, nodePreset } from '../../../vitest.shared';

const brainServicePreset = {
    ...nodePreset,
    plugins: [tsconfigPaths({ root: '../../' })],
};

export default createVitestConfig(brainServicePreset, {
    test: {
        include: [
            'test/uri-helpers.spec.ts',
            'test/oidc-jwt.spec.ts',
            'test/notificationMessages.spec.ts',
            'src/helpers/posthog.helpers.test.ts',
            'src/helpers/rateLimit.helpers.test.ts',
            'src/helpers/percentile.helpers.test.ts',
            'src/helpers/perf.test.ts',
        ],
    },
});

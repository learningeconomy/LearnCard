import { createVitestConfig, nodePreset } from '../../../vitest.shared';

export default createVitestConfig(nodePreset, {
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

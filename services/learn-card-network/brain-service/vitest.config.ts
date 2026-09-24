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
            'src/helpers/inbox-batch.helpers.test.ts',
            'src/helpers/inbox-queue.helpers.test.ts',
            'src/helpers/inbox-batch-http.helpers.test.ts',
            'src/cache/atomic-counter.test.ts',
            'src/helpers/credential-refresh-auth.helpers.test.ts',
            'src/helpers/credential-refresh-proof.helpers.test.ts',
            'src/helpers/credential-refresh-email-content.helpers.test.ts',
            'src/helpers/credential-refresh-initial-binding.helpers.test.ts',
            'src/helpers/credential-refresh-materiality.helpers.test.ts',
            'src/helpers/credential-refresh-notification-policy.helpers.test.ts',
            'src/config/environment.test.ts',
            'src/credential-refresh.test.ts',
            'src/accesslayer/credential-refresh/read.test.ts',
            'src/models/credential-refresh-constraints.test.ts',
            'src/routes/credential-refreshes.test.ts',
            'src/routes/act-as.test.ts',
            'src/helpers/percentile.helpers.test.ts',
            'src/helpers/perf.test.ts',
            'src/helpers/signingAuthority.helpers.test.ts',
            'src/helpers/status-list.helpers.test.ts',
            'src/helpers/boost-storage.helpers.test.ts',
            'src/accesslayer/credential/create.test.ts',
            'src/helpers/inbox-encryption.helpers.test.ts',
            'src/helpers/send-inbox-config.helpers.test.ts',
            'src/helpers/contact-method.helpers.test.ts',
            'src/services/delivery/adapters/postmark.adapter.test.ts',
            'src/helpers/inbox-maintenance.helpers.test.ts',
        ],
    },
});

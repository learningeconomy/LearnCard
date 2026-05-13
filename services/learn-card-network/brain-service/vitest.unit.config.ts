import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    plugins: [tsconfigPaths({ root: '../../' }) as any],
    test: {
        environment: 'node',
        globals: true,
        include: [
            'test/uri-helpers.spec.ts',
            'test/oidc-jwt.spec.ts',
            'src/helpers/posthog.helpers.test.ts',
            'src/helpers/percentile.helpers.test.ts',
            'src/helpers/perf.test.ts',
        ],
    },
});

import { resolve } from 'path';
import { createVitestConfig, nodePreset } from '../../vitest.shared';

export default createVitestConfig(nodePreset, {
    resolve: {
        alias: [
            { find: 'learn-card-base/', replacement: resolve(__dirname, 'src') + '/' },
            { find: 'learn-card-base', replacement: resolve(__dirname, 'src/index.ts') },
            // Netlify edge entries import a build-time copy of the canonical handler.
            {
                find: /^\.\/shared\/registryProxy\.ts$/,
                replacement: resolve(__dirname, 'src/registry-proxy/registryProxy.ts'),
            },
        ],
    },
    test: {
        include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    },
});

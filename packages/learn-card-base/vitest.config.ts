import { resolve } from 'path';
import { createVitestConfig, nodePreset } from '../../vitest.shared';

export default createVitestConfig(nodePreset, {
    resolve: {
        alias: {
            'learn-card-base/': resolve(__dirname, 'src') + '/',
            'learn-card-base': resolve(__dirname, 'src/index.ts'),
        },
    },
    test: {
        include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    },
});

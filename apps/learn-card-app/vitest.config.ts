import react from '@vitejs/plugin-react-swc';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';
import { createVitestConfig, happyDomPreset } from '../../vitest.shared';
import type { LearnCardAppEnvironment } from './src/config/buildEnvironment';

const TEST_BUILD_ENVIRONMENT = {
    MODE: 'test',
    VITE_ENABLE_AUTH_DEBUG_WIDGET: false,
    VITE_DOCKER_SOURCE: false,
    ANALYZE: false,
    CHOKIDAR_USEPOLLING: false,
    CHOKIDAR_INTERVAL: 1000,
    DEV: true,
    PROD: false,
} satisfies LearnCardAppEnvironment;

export default createVitestConfig(happyDomPreset, {
    define: {
        __APP_BUILD_ENV__: JSON.stringify(TEST_BUILD_ENVIRONMENT),
        __APP_VERSION__: JSON.stringify('0.0.0-test'),
    },
    plugins: [
        react(),
        tsconfigPaths({ root: '../../' }),
        paraglideVitePlugin({
            project: './project.inlang',
            outdir: './src/paraglide',
            outputStructure: 'locale-modules',
        }),
    ],
    test: {
        // DOMPurify's SVG sanitization and computed CSS serialization require jsdom semantics.
        environment: 'jsdom',
        setupFiles: ['./vitest.setup.ts'],
        include: ['src/**/*.test.{ts,tsx}'],
    },
    resolve: {
        alias: {
            'learn-card-base': path.resolve(__dirname, '../../packages/learn-card-base/src'),
            'apps/learn-card-app': path.resolve(__dirname),
        },
    },
});

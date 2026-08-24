import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';
import { createVitestConfig, happyDomPreset } from '../../vitest.shared';

export default createVitestConfig(happyDomPreset, {
    plugins: [react(), tsconfigPaths({ root: '../../' })],
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

import { defineConfig } from 'vitest/config';
import path from 'path';
import { createVitestConfig, nodePreset } from '../../vitest.shared';

export default defineConfig(async () => {
    // Keep this import dynamic: Paraglide is ESM-only, while this Vitest version
    // loads TypeScript config files through a CommonJS compatibility bundle.
    const { paraglideVitePlugin } = await import('@inlang/paraglide-js');

    return createVitestConfig(nodePreset, {
        plugins: [
            paraglideVitePlugin({
                project: './project.inlang',
                outdir: './src/paraglide',
                outputStructure: 'locale-modules',
            }),
        ],
        test: {
            include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
        },
        resolve: {
            alias: {
                'learn-card-base': path.resolve(__dirname, '../../packages/learn-card-base/src'),
                'apps/scouts': path.resolve(__dirname),
            },
        },
    });
});

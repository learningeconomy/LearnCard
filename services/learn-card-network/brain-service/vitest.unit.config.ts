import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    plugins: [tsconfigPaths({ root: '../../' }) as any],
    test: {
        environment: 'node',
        globals: true,
        include: ['test/uri-helpers.spec.ts'],
    },
});

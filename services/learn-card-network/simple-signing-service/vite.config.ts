import { createRequire } from 'module';
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

const require = createRequire(import.meta.url);

export default defineConfig({
    plugins: [tsconfigPaths({ root: './' }) as any],
    test: {
        environment: 'node',
        globals: true,
        fileParallelism: false,
        globalSetup: './vitest-setup.ts',
        alias: { '@mongo': require.resolve('./test/helpers/mock-mongo.ts') },
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/cypress/**',
            '**/.{idea,git,cache,output,temp}/**',
            '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
        ],
    },
});

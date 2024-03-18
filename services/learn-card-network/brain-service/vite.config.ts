import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    plugins: [tsconfigPaths({ root: '../../' }) as any],
    test: {
        environment: 'node',
        globals: true,
        fileParallelism: false,
        poolOptions: { threads: { singleThread: true, maxThreads: 1 } },
        globalSetup: './test-setup.ts',
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/cypress/**',
            '**/.{idea,git,cache,output,temp}/**',
            '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
        ],
    },
});

import { createRequire } from 'module';
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

const require = createRequire(import.meta.url);

export default defineConfig({
    plugins: [tsconfigPaths({ root: '../../' }) as any],
    test: {
        environment: 'node',
        globals: true,
        fileParallelism: false,
        globalSetup: './test-setup.ts',
        alias: { '@instance': require.resolve('./test/helpers/mock-instance.ts') },
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/cypress/**',
            '**/.{idea,git,cache,output,temp}/**',
            '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
        ],
        env: {
            IS_E2E_TEST: 'true',
            LOGIN_PROVIDER_DID: 'did:key:z6Mko9uYxDPk2BetRRziLz1xHN8nR5zQWdNjytKNDPcygHJP',
            APP_STORE_ADMIN_PROFILE_IDS: 'app-store-admin',
            TRACE_CONSOLE: 'false',
        },
        // testTimeout: 30000,
    },
});

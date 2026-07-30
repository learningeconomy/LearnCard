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
            // The brain-service test suite runs against a local Neo4j container
            // and never has a real DOMAIN_NAME. After LC-1644 made
            // getServerDidWebDID() fail loud on (no DOMAIN_NAME && no IS_OFFLINE)
            // to catch production misconfigs, we set DOMAIN_NAME here to the
            // localhost value that was previously synthesised — satisfies the
            // guard and produces the same did:web:localhost%3A3000 the suite
            // was built against. Setting IS_OFFLINE instead would also work
            // for the DID, but it invalidates the in-process LearnCard cache
            // (see learnCard.helpers.ts:137) and breaks the cache tests.
            DOMAIN_NAME: 'localhost%3A3000',
            LOGIN_PROVIDER_DID: 'did:key:z6Mko9uYxDPk2BetRRziLz1xHN8nR5zQWdNjytKNDPcygHJP',
            APP_STORE_ADMIN_PROFILE_IDS: 'app-store-admin',
            TRACE_CONSOLE: 'false',
        },
        // testTimeout: 30000,
    },
});

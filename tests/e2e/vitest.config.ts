import { createVitestConfig, serviceIntegrationPreset } from '../../vitest.shared';

export default createVitestConfig(serviceIntegrationPreset, {
    test: {
        globalSetup: ['./setup/global-setup.ts'],
        setupFiles: ['./setup/test-setup.ts'],
        teardownTimeout: 120_000,
        exclude: [
            'isomorphic/**',
            '**/node_modules/**',
            '**/dist/**',
            '**/cypress/**',
            '**/.{idea,git,cache,output,temp}/**',
            '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
        ],
    },
});

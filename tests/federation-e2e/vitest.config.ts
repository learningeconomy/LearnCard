import { createVitestConfig, serviceIntegrationPreset } from '../../vitest.shared';

export default createVitestConfig(serviceIntegrationPreset, {
    test: {
        globalSetup: ['./setup/global-setup.ts'],
        setupFiles: ['./setup/test-setup.ts'],
        teardownTimeout: 120_000,
        exclude: ['**/node_modules/**', '**/dist/**', '**/.{idea,git,cache,output,temp}/**'],
    },
});

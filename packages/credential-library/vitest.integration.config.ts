import { createVitestConfig, serviceIntegrationPreset } from '../../vitest.shared';

export default createVitestConfig(serviceIntegrationPreset, {
    test: {
        globals: false,
        include: ['src/__tests__/issuance.test.ts'],
    },
});

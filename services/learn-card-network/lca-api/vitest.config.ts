import { createVitestConfig, nodePreset } from '../../../vitest.shared';

export default createVitestConfig(nodePreset, {
    test: {
        include: [
            'src/**/*.test.ts',
            'test/keycloak-verify.spec.ts',
            'test/keycloak-verify.integration.spec.ts',
        ],
    },
});

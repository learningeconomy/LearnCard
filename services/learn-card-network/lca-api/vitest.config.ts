import { createVitestConfig, nodePreset } from '../../../vitest.shared';

export default createVitestConfig(nodePreset, {
    test: {
        include: [
            'src/**/*.test.ts',
            '*Lambda.test.ts',
            'test/keycloak-verify.spec.ts',
            'test/keycloak-verify.integration.spec.ts',
            'test/oidc.spec.ts',
            'test/auth-tickets.spec.ts',
            'test/models/authSubjectIndexes.spec.ts',
            'test/oidc.integration.spec.ts',
        ],
    },
});

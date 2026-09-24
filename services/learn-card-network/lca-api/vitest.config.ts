import { createRequire } from 'node:module';
import { createVitestConfig, nodePreset } from '../../../vitest.shared';

const require = createRequire(import.meta.url);
const liveBroker =
    process.env.KEYCLOAK_INTEGRATION === 'true' && process.env.KEYCLOAK_ROUNDTRIP === 'true';

export default createVitestConfig(nodePreset, {
    test: {
        alias: liveBroker ? { '@mongo': require.resolve('./test/helpers/live-mongo.ts') } : {},
        include: [
            'src/**/*.test.ts',
            'test/keycloak-verify.spec.ts',
            'test/keycloak-verify.integration.spec.ts',
            'test/oidc.spec.ts',
            'test/auth-tickets.spec.ts',
            'test/models/authSubjectIndexes.spec.ts',
            'test/oidc.integration.spec.ts',
            'test/keycloak-broker-roundtrip.integration.spec.ts',
            'test/keycloak-migration.integration.spec.ts',
        ],
    },
});

import { z } from 'zod';
import { createKeycloakAdmin } from '../../../services/learn-card-network/lca-api/scripts/keycloak-admin';

// Explicit opt-in and loopback-only: this fixture must never provision a deployed realm.
if (
    process.env.KEYCLOAK_INTEGRATION !== 'true' ||
    (process.env.KEYCLOAK_ADMIN_URL ?? 'http://localhost:8081') !== 'http://localhost:8081'
) {
    throw new Error('Fake Google provisioning is local integration-test only');
}
const admin = await createKeycloakAdmin();
const google = z
    .object({
        trustEmail: z.boolean(),
        firstBrokerLoginFlowAlias: z.string(),
        config: z.record(z.string(), z.string()),
    })
    .parse(await (await admin.request('/identity-provider/instances/google')).json());
await admin.request('/identity-provider/instances', {
    method: 'POST',
    body: JSON.stringify({
        alias: 'fake-google',
        providerId: 'oidc',
        enabled: true,
        trustEmail: google.trustEmail,
        firstBrokerLoginFlowAlias: google.firstBrokerLoginFlowAlias,
        config: {
            clientId: 'learncard-broker',
            clientSecret: 'fake-google-test-only-secret',
            authorizationUrl:
                'http://localhost:8081/realms/fake-google/protocol/openid-connect/auth',
            issuer: 'http://localhost:8081/realms/fake-google',
            tokenUrl: 'http://localhost:8080/realms/fake-google/protocol/openid-connect/token',
            jwksUrl: 'http://localhost:8080/realms/fake-google/protocol/openid-connect/certs',
            disableUserInfo: 'true',
            validateSignature: 'true',
            useJwksUrl: 'true',
            defaultScope: 'openid email profile',
            syncMode: 'IMPORT',
            filteredByClaim: google.config.filteredByClaim,
            claimFilterName: google.config.claimFilterName,
            claimFilterValue: google.config.claimFilterValue,
        },
    }),
});

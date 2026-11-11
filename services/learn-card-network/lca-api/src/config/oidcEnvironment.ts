import 'dotenv/config';

import { z } from 'zod';
import {
    optionalEnvironmentBoolean,
    optionalEnvironmentString,
    parseEnvironment,
} from '@learncard/helpers';

/**
 * Focused environment contract for the OIDC provider surface so the OIDC Lambda
 * can boot without SEED/MONGO/Postmark/Firebase/bundle. Validates ONLY the
 * fields read by src/oidc.ts and src/helpers/oidc.helpers.ts, reproducing the
 * full schema's parsers and its KEYCLOAK_ISSUERS->KEYCLOAK_AUDIENCES superRefine
 * verbatim so no constraint is weakened.
 */
export const oidcEnvironmentShape = {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    LAMBDA_STAGE: optionalEnvironmentString,
    IS_OFFLINE: optionalEnvironmentBoolean.default(false),
    IS_E2E_TEST: optionalEnvironmentBoolean.default(false),
    KEYCLOAK_ISSUERS: optionalEnvironmentString,
    KEYCLOAK_AUDIENCES: optionalEnvironmentString,
    OIDC_ISSUER: optionalEnvironmentString,
    OIDC_SIGNING_KEY_JWK: optionalEnvironmentString,
    OIDC_SIGNING_KEY_SECRET_ID: optionalEnvironmentString,
    OIDC_CLIENT_ID: optionalEnvironmentString,
    OIDC_CLIENT_SECRET: optionalEnvironmentString,
    OIDC_REDIRECT_URIS: optionalEnvironmentString,
} satisfies z.ZodRawShape;

export const oidcEnvironmentSchema = z
    .object(oidcEnvironmentShape)
    .superRefine((environment, context) => {
        if (
            environment.KEYCLOAK_ISSUERS?.split(',').some(value => value.trim()) &&
            !environment.KEYCLOAK_AUDIENCES?.split(',').some(value => value.trim())
        ) {
            context.addIssue({
                code: 'custom',
                path: ['KEYCLOAK_AUDIENCES'],
                message: 'Required when KEYCLOAK_ISSUERS is configured',
            });
        }
    });

export type OidcEnvironment = z.output<typeof oidcEnvironmentSchema>;

export const parseOidcEnvironment = (
    raw: Record<string, unknown>,
    source = 'process environment'
): OidcEnvironment =>
    parseEnvironment(oidcEnvironmentSchema, raw, {
        project: 'lca-api (oidc)',
        source,
        examplePath: 'services/learn-card-network/lca-api/.env.example',
    });

export const environment = parseOidcEnvironment(process.env);

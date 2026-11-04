import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

/**
 * How every Bedrock client in this service authenticates.
 *
 * - `api-key`: a Bedrock API key from AWS_BEARER_TOKEN_BEDROCK, sent as
 *   `Authorization: Bearer <key>`. Local development only; no MFA step.
 * - `credential-chain`: the existing path. Generation mints short-term bearer
 *   tokens from SDK credentials (Fly web identity, CI OIDC, a profile), and
 *   the guardrail clients sign with SigV4.
 */
export type BedrockAuth = { kind: 'api-key'; token: string } | { kind: 'credential-chain' };

export const BEDROCK_API_KEY_ENV = 'AWS_BEARER_TOKEN_BEDROCK';

export const getBedrockAuth = (environment: NodeJS.ProcessEnv = process.env): BedrockAuth => {
    const token = environment[BEDROCK_API_KEY_ENV]?.trim();
    if (!token) return { kind: 'credential-chain' };
    // Deployed apps use the Fly web identity role; a long-lived key must never
    // become an ambient production credential.
    if (environment.FLY_APP_NAME)
        throw new Error(
            `${BEDROCK_API_KEY_ENV} is for local development only. Deployed Fly apps authenticate to Bedrock with the AWS_ROLE_ARN web identity role; unset ${BEDROCK_API_KEY_ENV}.`
        );
    return { kind: 'api-key', token };
};

/**
 * Auth settings for AWS SDK Bedrock clients (BedrockClient and
 * BedrockRuntimeClient). Always explicit: the SDK also reads
 * AWS_BEARER_TOKEN_BEDROCK on its own and prefers bearer auth whenever the
 * variable merely exists, so a blank `AWS_BEARER_TOKEN_BEDROCK=` line in .env
 * would otherwise send an empty bearer token instead of signing with SigV4.
 */
export const getBedrockSdkAuthConfig = (
    auth: BedrockAuth
):
    | { token: { token: string }; authSchemePreference: ['httpBearerAuth'] }
    | { authSchemePreference: ['sigv4'] } =>
    auth.kind === 'api-key'
        ? {
              token: { token: auth.token },
              authSchemePreference: ['httpBearerAuth'],
          }
        : { authSchemePreference: ['sigv4'] };

const CREDENTIAL_ENV_HINTS = [
    'AWS_ACCESS_KEY_ID',
    'AWS_PROFILE',
    'AWS_WEB_IDENTITY_TOKEN_FILE',
    'AWS_CONTAINER_CREDENTIALS_RELATIVE_URI',
    'AWS_CONTAINER_CREDENTIALS_FULL_URI',
] as const;

/**
 * Cheap startup check that the SDK credential chain has something to try.
 * It cannot prove the credentials are valid (that needs a network call), but
 * it turns "no AWS setup at all" into a clear error instead of a 503 later.
 */
export const hasAwsCredentialSource = (
    environment: NodeJS.ProcessEnv = process.env,
    fileExists: (path: string) => boolean = existsSync
): boolean =>
    CREDENTIAL_ENV_HINTS.some(name => Boolean(environment[name]?.trim())) ||
    [
        environment.AWS_SHARED_CREDENTIALS_FILE || join(homedir(), '.aws', 'credentials'),
        environment.AWS_CONFIG_FILE || join(homedir(), '.aws', 'config'),
    ].some(path => fileExists(path));

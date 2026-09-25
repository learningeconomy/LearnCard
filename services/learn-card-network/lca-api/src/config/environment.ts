import 'dotenv/config';

import { z } from 'zod';
import {
    environmentPort,
    optionalEnvironmentBoolean,
    optionalEnvironmentPort,
    optionalEnvironmentString,
    optionalEnvironmentUrl,
    parseEnvironment,
    requiredEnvironmentString,
} from '@learncard/helpers';

export const lcaApiEnvironmentShape = {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: environmentPort.default(3000),
    SEED: requiredEnvironmentString,
    MONGO_URI: requiredEnvironmentString,
    MONGO_DB_NAME: requiredEnvironmentString,
    DOMAIN_NAME: optionalEnvironmentString,
    AUTHORIZED_DIDS: optionalEnvironmentString,
    LEARN_CLOUD_URL: optionalEnvironmentUrl,
    NETWORK_BRAIN_SERVICE_URL: optionalEnvironmentUrl,
    GOOGLE_APPLICATION_CREDENTIAL: optionalEnvironmentString,
    OPENAI_API_KEY: optionalEnvironmentString,
    METABASE_SECRET_KEY: optionalEnvironmentString,
    SCOUTS_SSO_CLIENT_SECRET: optionalEnvironmentString,
    POSTMARK_SERVER_TOKEN: optionalEnvironmentString,
    POSTMARK_FROM_EMAIL: optionalEnvironmentString,
    POSTMARK_BRAND_NAME: optionalEnvironmentString,
    POSTMARK_LOGIN_CODE_TEMPLATE_ALIAS: optionalEnvironmentString,
    POSTMARK_ENDORSEMENT_REQUEST_TEMPLATE_ALIAS: optionalEnvironmentString,
    POSTMARK_RECOVERY_EMAIL_CODE_TEMPLATE_ALIAS: optionalEnvironmentString,
    POSTMARK_RECOVERY_KEY_TEMPLATE_ALIAS: optionalEnvironmentString,
    ESCROW_RELAY_URL: optionalEnvironmentUrl,
    ESCROW_RELAY_AUTH_TOKEN: optionalEnvironmentString,
    ESCROW_ENCLAVE_MODE: optionalEnvironmentString.pipe(z.enum(['software', 'remote']).optional()),
    ESCROW_ENCLAVE_SOFTWARE_PRIVATE_KEYS_JSON: optionalEnvironmentString,
    ESCROW_ENCLAVE_ACTIVE_KEY_ID: optionalEnvironmentString,
    ESCROW_ENCLAVE_REMOTE_URL: optionalEnvironmentUrl,
    ESCROW_ENCLAVE_REMOTE_TOKEN: optionalEnvironmentString,
    /** Operator-flipped, manual-only kill switch (P7.1). When true, startRecovery/completeRecovery
     *  refuse with a friendly message; hold cancellation and notifications keep working. Never
     *  auto-flipped by the escrow-ledger-monitor — a compromised monitor must not be able to
     *  silently DoS recovery. See services/escrow-ledger-monitor/README.md. */
    ESCROW_RELEASE_KILL_SWITCH: optionalEnvironmentBoolean,
    ESCROW_ENCLAVE_REMOTE_TIMEOUT_MS: optionalEnvironmentString
        .transform(value => (value === undefined ? 10_000 : Number(value)))
        .pipe(z.number().int().positive().max(30_000)),
    ESCROW_HOLD_DURATION_MS: optionalEnvironmentString
        .transform(value => (value === undefined ? 604_800_000 : Number(value)))
        .pipe(z.number().int().positive().max(Number.MAX_SAFE_INTEGER)),
    ESCROW_HOLD_RESTART_MIN_AGE_MS: optionalEnvironmentString
        .transform(value => (value === undefined ? 86_400_000 : Number(value)))
        .pipe(z.number().int().positive().max(Number.MAX_SAFE_INTEGER)),
    ANDROID_PUSH_ICON: optionalEnvironmentString,
    REDIS_HOST: optionalEnvironmentString,
    REDIS_PORT: optionalEnvironmentPort,
    NSO_DASHBOARD_ID: optionalEnvironmentPort,
    GLOBAL_DASHBOARD_ID: optionalEnvironmentPort,
    TROOP_DASHBOARD_ID: optionalEnvironmentPort,
    SENTRY_DSN: optionalEnvironmentUrl,
    SENTRY_ENV: optionalEnvironmentString,
    IS_OFFLINE: optionalEnvironmentBoolean.default(false),
    IS_CI: optionalEnvironmentBoolean.default(false),
    IS_E2E_TEST: optionalEnvironmentBoolean.default(false),
    SKIP_DIDKIT_NAPI: optionalEnvironmentBoolean.default(false),
    CI: optionalEnvironmentBoolean.default(false),
} satisfies z.ZodRawShape;

export const lcaApiEnvironmentSchema = z
    .object(lcaApiEnvironmentShape)
    .superRefine((environment, context) => {
        if (environment.ESCROW_ENCLAVE_MODE === 'software') {
            try {
                const keys = parseEscrowPrivateKeys(
                    environment.ESCROW_ENCLAVE_SOFTWARE_PRIVATE_KEYS_JSON ?? ''
                );
                if (
                    !environment.ESCROW_ENCLAVE_ACTIVE_KEY_ID ||
                    !Object.hasOwn(keys, environment.ESCROW_ENCLAVE_ACTIVE_KEY_ID)
                ) {
                    context.addIssue({
                        code: 'custom',
                        path: ['ESCROW_ENCLAVE_ACTIVE_KEY_ID'],
                        message: 'Software escrow requires an active key ID present in the key map',
                    });
                }
            } catch {
                context.addIssue({
                    code: 'custom',
                    path: ['ESCROW_ENCLAVE_SOFTWARE_PRIVATE_KEYS_JSON'],
                    message:
                        'Software escrow requires a valid nonempty key ID to private key JSON map',
                });
            }
        }
        // Format-only: absence at 'remote' mode is intentionally NOT a parse-time
        // failure. getEscrowEnclave() fails closed per-request instead, so a
        // misconfigured remote backend degrades that one feature rather than
        // crashing the whole service at boot (see escrow-enclave/index.ts).
        if (environment.ESCROW_ENCLAVE_REMOTE_URL) {
            const { protocol, hostname } = new URL(environment.ESCROW_ENCLAVE_REMOTE_URL);
            const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(hostname);
            if (protocol !== 'https:' && environment.NODE_ENV !== 'test' && !isLocalhost) {
                context.addIssue({
                    code: 'custom',
                    path: ['ESCROW_ENCLAVE_REMOTE_URL'],
                    message: 'Must use https:// outside tests or localhost',
                });
            }
        }
        if (
            environment.ESCROW_ENCLAVE_REMOTE_TOKEN &&
            environment.ESCROW_ENCLAVE_REMOTE_TOKEN.length < 32
        ) {
            context.addIssue({
                code: 'custom',
                path: ['ESCROW_ENCLAVE_REMOTE_TOKEN'],
                message: 'Must be at least 32 characters',
            });
        }
        if (
            environment.NODE_ENV === 'production' &&
            !environment.IS_OFFLINE &&
            !environment.DOMAIN_NAME
        ) {
            context.addIssue({
                code: 'custom',
                path: ['DOMAIN_NAME'],
                message: 'Required for a non-offline production deployment',
            });
        }

        const hasPostmarkToken = Boolean(environment.POSTMARK_SERVER_TOKEN);
        const hasPostmarkSender = Boolean(environment.POSTMARK_FROM_EMAIL);

        if (hasPostmarkToken !== hasPostmarkSender) {
            context.addIssue({
                code: 'custom',
                path: [hasPostmarkToken ? 'POSTMARK_FROM_EMAIL' : 'POSTMARK_SERVER_TOKEN'],
                message:
                    'POSTMARK_SERVER_TOKEN and POSTMARK_FROM_EMAIL must be configured together',
            });
        }
    });

export type LcaApiEnvironment = z.output<typeof lcaApiEnvironmentSchema>;

export const parseLcaApiEnvironment = (
    raw: Record<string, unknown>,
    source = 'process environment'
): LcaApiEnvironment => {
    const testDefaults =
        raw.NODE_ENV === 'test'
            ? {
                  SEED: 'a'.repeat(64),
                  MONGO_URI: 'mongodb://localhost:27017',
                  MONGO_DB_NAME: 'lca-api-test',
              }
            : {};

    return parseEnvironment(
        lcaApiEnvironmentSchema,
        { ...testDefaults, ...raw },
        {
            project: 'lca-api',
            source,
            examplePath: 'services/learn-card-network/lca-api/.env.example',
        }
    );
};

// Read live from process.env (not the frozen `environment` snapshot below) so an
// operator's flip takes effect on the next request without a full restart, and so
// tests can toggle it per-case. The escrow-ledger-monitor must never set this itself
// — see services/escrow-ledger-monitor/README.md.
export const isEscrowReleaseKillSwitchEnabled = (): boolean =>
    process.env.ESCROW_RELEASE_KILL_SWITCH === 'true';

/** Parse configuration without exposing secret values in validation errors. */
export const parseEscrowPrivateKeys = (serialized: string): Record<string, string> => {
    try {
        const parsed: unknown = JSON.parse(serialized);
        return z
            .record(z.string().regex(/^[A-Za-z0-9._-]{1,128}$/), z.string().trim().min(1))
            .refine(keys => Object.keys(keys).length > 0)
            .parse(parsed);
    } catch {
        throw new Error('Invalid escrow private key configuration');
    }
};

export const environment = parseLcaApiEnvironment(process.env);

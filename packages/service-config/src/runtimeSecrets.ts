import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

/** Default deploy-environment variable naming the Secrets Manager bundle to load. */
export const DEFAULT_SECRET_ID_ENV = 'RUNTIME_SECRETS_ID';

/** Options for {@link loadRuntimeSecrets}. */
export interface LoadRuntimeSecretsOptions {
    /**
     * Name of the environment variable holding the Secrets Manager bundle id (name or ARN).
     * Defaults to {@link DEFAULT_SECRET_ID_ENV} (`RUNTIME_SECRETS_ID`).
     */
    secretIdEnv?: string;
}

/** Validate the entire bundle before merging; errors deliberately omit keys and values. */
export const parseRuntimeSecrets = (serialized: string | undefined): Record<string, string> => {
    try {
        if (!serialized) throw new Error();
        const parsed: unknown = JSON.parse(serialized);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
        const entries = Object.entries(parsed);
        if (
            entries.some(
                ([key, value]) =>
                    !/^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$/.test(key) || typeof value !== 'string'
            )
        ) {
            throw new Error();
        }
        return Object.fromEntries(entries);
    } catch {
        throw new Error(
            'Invalid runtime secrets bundle: expected a flat JSON object of environment names to strings'
        );
    }
};

/** Pure merge: explicit non-empty environment values take precedence over bundle values. */
export const mergeRuntimeSecrets = (
    current: Record<string, string | undefined>,
    secrets: Record<string, string>
): Record<string, string | undefined> => ({
    ...current,
    ...Object.fromEntries(
        Object.entries(secrets).map(([key, value]) => [key, current[key] || value])
    ),
});

/**
 * In-flight load promise, keyed by the resolved secret id so distinct ids never share a
 * memoized result. A rejected load clears its own entry so the next call retries.
 */
const loading = new Map<string, Promise<void>>();

/**
 * Load the runtime secrets bundle once per cold start, before importing modules that
 * validate environment on import. Only runs inside AWS Lambda (gated on
 * `AWS_LAMBDA_FUNCTION_NAME`) and only when the configured secret id env var is set.
 *
 * Concurrent and subsequent calls share a single fetch. A failed fetch clears the memo
 * so the next invocation retries (Lambda can retry; the module bundler cannot).
 */
export const loadRuntimeSecrets = (options: LoadRuntimeSecretsOptions = {}): Promise<void> => {
    // Secrets live in AWS Secrets Manager and are only reachable (and only needed) inside
    // Lambda. Local, Docker, CI and self-hosters keep using plain environment variables.
    if (!process.env.AWS_LAMBDA_FUNCTION_NAME) return Promise.resolve();

    const secretIdEnv = options.secretIdEnv ?? DEFAULT_SECRET_ID_ENV;
    const secretId = process.env[secretIdEnv];
    if (!secretId) return Promise.resolve();

    let pending = loading.get(secretId);
    if (!pending) {
        pending = (async () => {
            const client = new SecretsManagerClient({});
            try {
                const result = await client.send(new GetSecretValueCommand({ SecretId: secretId }));
                const secrets = parseRuntimeSecrets(result.SecretString);
                const merged = mergeRuntimeSecrets(process.env, secrets);
                for (const [key, value] of Object.entries(secrets)) {
                    process.env[key] = merged[key] ?? value;
                }
            } finally {
                client.destroy();
            }
        })().catch(() => {
            loading.delete(secretId);
            // Never retain SDK errors, causes, secret identifiers or payloads.
            throw new Error('Unable to load runtime secrets bundle');
        });
        loading.set(secretId, pending);
    }
    return pending;
};

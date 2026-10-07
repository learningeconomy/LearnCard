import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

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

let loading: Promise<void> | undefined;

/** Load once per cold start, before importing modules that validate environment on import. */
export const loadRuntimeSecrets = (): Promise<void> => {
    const secretId = process.env.RUNTIME_SECRETS_ID;
    if (!secretId) return Promise.resolve();
    if (!loading) {
        loading = (async () => {
            const client = new SecretsManagerClient({});
            try {
                const result = await client.send(new GetSecretValueCommand({ SecretId: secretId }));
                const secrets = parseRuntimeSecrets(result.SecretString);
                const merged = mergeRuntimeSecrets(process.env, secrets);
                for (const key of Object.keys(secrets)) {
                    process.env[key] = merged[key];
                }
            } finally {
                client.destroy();
            }
        })().catch(() => {
            loading = undefined;
            // Never retain SDK errors, causes, secret identifiers or payloads.
            throw new Error('Unable to load runtime secrets bundle');
        });
    }
    return loading;
};

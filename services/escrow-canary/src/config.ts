import { z } from 'zod';

const identifier = z.string().regex(/^[A-Za-z0-9._-]{1,128}$/);
const pcr = z
    .string()
    .regex(/^[a-f0-9]{96}$/)
    .refine(value => !/^0+$/.test(value));
const account = z.object({
    id: identifier,
    secretArn: z.string().startsWith('arn:aws:secretsmanager:'),
});
export const configSchema = z
    .object({
        environment: z.enum(['staging', 'production']),
        serverUrl: z
            .string()
            .url()
            .refine(value => {
                const url = new URL(value);
                return (
                    url.protocol === 'https:' &&
                    !url.username &&
                    !url.password &&
                    !url.search &&
                    !url.hash
                );
            })
            .transform(value => value.replace(/\/$/, '')),
        tenantId: identifier,
        firebaseApiKey: z.string().min(1),
        keyId: identifier,
        authorityGeneration: identifier,
        measurements: z
            .array(z.object({ pcr0: pcr, pcr1: pcr, pcr2: pcr }).strict())
            .min(1)
            .max(3),
        accounts: z.tuple([account, account, account]),
    })
    .refine(
        config =>
            new Set(config.accounts.map(value => value.secretArn)).size === 3 &&
            new Set(config.accounts.map(value => value.id)).size === 3
    );
export type Config = z.infer<typeof configSchema>;

/** Trust comes only from reviewed configuration, never the probed endpoint. */
export const loadConfig = (env: NodeJS.ProcessEnv = process.env): Config => {
    try {
        return configSchema.parse({
            environment: env.CANARY_ENVIRONMENT,
            serverUrl: env.LCA_API_URL,
            tenantId: env.TENANT_ID,
            firebaseApiKey: env.FIREBASE_API_KEY,
            keyId: env.ESCROW_KEY_ID,
            authorityGeneration: env.AUTHORITY_GENERATION,
            measurements: JSON.parse(env.ESCROW_MEASUREMENTS_JSON ?? 'null'),
            accounts: JSON.parse(env.CANARY_ACCOUNTS_JSON ?? 'null'),
        });
    } catch {
        throw new Error('Invalid canary configuration');
    }
};

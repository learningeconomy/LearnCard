import {
    GetSecretValueCommand,
    PutSecretValueCommand,
    SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import { z } from 'zod';

const nonEmpty = z.string().min(1);
/** Tier 3 only: resume material for one in-flight hold, persisted, never rebuilt from status. */
export const holdSecretSchema = z
    .object({
        runId: nonEmpty,
        holdId: nonEmpty,
        resumeToken: nonEmpty,
        clientEphemeralPrivateKey: nonEmpty,
        expectations: z
            .object({
                tenant: nonEmpty,
                did: nonEmpty,
                holdId: nonEmpty,
                clientEphemeralPublicKey: nonEmpty,
                blobHash: nonEmpty,
                authorityGeneration: nonEmpty,
                holdDigest: nonEmpty,
                ledgerPublicKey: nonEmpty,
                keyId: nonEmpty,
            })
            .strict(),
        requestedAt: z.number().int(),
    })
    .strict();
export type HoldSecret = z.infer<typeof holdSecretSchema>;

export const secretSchema = z
    .object({
        accountId: z.string().min(1),
        privateKey: z.string().regex(/^[0-9a-f]{64}$/i),
        did: z.string().startsWith('did:key:'),
        pin: z.string().regex(/^\d{6,12}$/),
        refreshToken: z.string().min(1),
        recoveryEmail: z.string().email(),
        recoveryLanguage: z.string().min(1),
        deviceState: z.object({
            shares: z.record(z.string(), z.string()),
            versions: z.record(z.string(), z.number().int()),
        }),
        lastSlot: z.number().int().optional(),
        wrongPinWeek: z.number().int().optional(),
        needsPinReset: z.boolean().optional(),
        // Tier 3 only (runner-written; never edit by hand).
        hold: holdSecretSchema.optional(),
        lastReleasedRunId: z.string().min(1).optional(),
    })
    .strict();
export type AccountSecret = z.infer<typeof secretSchema>;
export interface SecretStore {
    read(arn: string): Promise<AccountSecret>;
    write(arn: string, secret: AccountSecret): Promise<void>;
}

export const createSecretStore = (
    client = new SecretsManagerClient({ maxAttempts: 2 })
): SecretStore => ({
    async read(arn) {
        const response = await client.send(new GetSecretValueCommand({ SecretId: arn }));
        try {
            return secretSchema.parse(JSON.parse(response.SecretString ?? 'null'));
        } catch {
            throw new Error('Invalid canary secret');
        }
    },
    async write(arn, secret) {
        await client.send(
            new PutSecretValueCommand({ SecretId: arn, SecretString: JSON.stringify(secret) })
        );
    },
});

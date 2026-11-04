import { AsyncLocalStorage } from 'node:async_hooks';
import { z } from 'zod';
import { NOVA_IDENTITY } from '../ai/embedding-generation';

export const RECOVERY_PASS_CAPS = {
    generation: 1,
    embedding: 5,
    privacy: 3,
} as const;
const counts = z
    .object({
        generation: z.number().int().min(0).max(1),
        embedding: z.number().int().min(0).max(5),
        privacy: z.number().int().min(0).max(3),
    })
    .strict();
export const recoveryPassRequestSchema = z
    .object({
        requestId: z.string().uuid(),
        record: z.number().int().min(1).max(10000),
        paidAuthorized: z.literal(true),
        caps: z
            .object({
                generation: z.literal(1),
                embedding: z.literal(5),
                privacy: z.literal(3),
            })
            .strict(),
    })
    .strict();
export const supplementalRecoverySchema = z
    .object({
        id: z.string().uuid(),
        index: z.number().int().min(0).max(9999),
        sourceFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
        consentRevision: z.string().min(1).max(512),
        sourceEpoch: z.string().min(1).max(200),
        modelIdentity: z.literal(NOVA_IDENTITY),
        createdAt: z.date(),
        expiresAt: z.date(),
        phase: z.enum(['running', 'completed', 'failed']),
        used: counts,
        embeddingOrdinals: z.array(z.number().int().min(0).max(1)).length(5),
        baselineAttempts: z.array(z.number().int().min(0).max(3)).length(5),
    })
    .strict();
export type SupplementalRecovery = z.infer<typeof supplementalRecoverySchema>;
export type RecoveryPassRequest = z.infer<typeof recoveryPassRequestSchema>;
export type SingleRecoveryContext = {
    runId: string;
    record: number;
    sourceFingerprint: string;
    baselineAttempts: number[];
    reserveEmbedding: (ordinal: number) => Promise<void>;
};
const scope = new AsyncLocalStorage<SingleRecoveryContext | undefined>();
export const withSingleRecoveryPass = <T>(
    value: SingleRecoveryContext | undefined,
    action: () => T
): T => scope.run(value, action);
export const currentSingleRecoveryPass = () => scope.getStore();
export const RECOVERY_PASS_CONSUMED_MESSAGE =
    'This single-use recovery pass has already been claimed. It cannot replay after failure or interruption; review its preserved accounting.';

import { sanitizeBackfillFailure } from './backfill-diagnostics';
import { BEDROCK_TIMEOUT_MS } from '../ai/bedrock-config';
import {
    EMBEDDING_PRIVACY_MAX_RETRIES,
    EMBEDDING_PRIVACY_RETRY_DELAYS_MS,
    waitForPrivacyRetry,
} from '../ai/embedding-privacy-recovery';
import { z } from 'zod';
import type { Collection } from 'mongodb';
import type { BackfillJob } from './backfill';
import {
    markEmbeddingStop,
    managedEmbeddingTimeout,
    EMBEDDING_WRITE_RESERVE_MS,
    EMBEDDING_MAX_ATTEMPTS,
    embeddingRetryDelay,
    waitForEmbeddingRetry,
    type EmbeddingRecovery,
} from '../ai/embedding-recovery';
import { reserveProviderRequest } from '../ai/usage-meter';

const slot = z
    .object({
        attempts: z.number().int().min(0).max(EMBEDDING_MAX_ATTEMPTS),
        notBefore: z.number().int().nonnegative(),
    })
    .strict();
export const embeddingRecoveryLedgerSchema = z
    .object({
        record: z.number().int().positive(),
        fingerprint: z.string().min(1),
        slots: z.array(slot).length(5),
        privacyRetry: z
            .object({
                used: z.number().int().min(0).max(EMBEDDING_PRIVACY_MAX_RETRIES),
                notBefore: z.number().int().nonnegative(),
            })
            .strict()
            .optional(),
    })
    .strict();
export type EmbeddingRecoveryLedger = z.infer<typeof embeddingRecoveryLedgerSchema>;

/** Only counters/timestamps, never model inputs, outputs, DIDs or vectors. */
export function managedEmbeddingRecovery(options: {
    store: Collection<BackfillJob>;
    id: string;
    lease: string;
    record: number;
    fingerprint: string;
    deadline: number;
    active: () => Promise<void>;
    supplemental?: {
        baselineAttempts: number[];
        reserveEmbedding: (ordinal: number) => Promise<void>;
    };
}): EmbeddingRecovery & { assertAvailable: () => Promise<void> } {
    const { store, id, lease, record, fingerprint, deadline, active } = options;
    const filter = () => ({
        _id: id,
        lease,
        cancel: false,
        leaseUntil: { $gt: new Date() },
    });
    const read = async (): Promise<EmbeddingRecoveryLedger> => {
        await active();
        const job = await store.findOne(filter());
        if (!job) throw new Error('Embedding retry lease lost');
        const existing =
            job.embeddingRecovery === undefined
                ? undefined
                : embeddingRecoveryLedgerSchema.parse(job.embeddingRecovery);
        if (
            options.supplemental &&
            (!existing ||
                existing.record !== record ||
                existing.fingerprint !== fingerprint ||
                existing.slots.some(
                    (slot, index) => slot.attempts !== options.supplemental!.baselineAttempts[index]
                ))
        )
            throw new Error('Recovery baseline ledger changed');
        if (existing === undefined || existing.record < record) {
            await store.updateOne(
                {
                    ...filter(),
                    ...(existing === undefined
                        ? { embeddingRecovery: { $exists: false } }
                        : { 'embeddingRecovery.record': existing.record }),
                },
                {
                    $set: {
                        embeddingRecovery: {
                            record,
                            fingerprint,
                            slots: Array.from({ length: 5 }, () => ({
                                attempts: 0,
                                notBefore: 0,
                            })),
                        },
                    },
                }
            );
            // Concurrent ordinals may initialize this one record together. Re-read
            // under the same live lease; never reset a ledger another ordinal won.
            return read();
        }
        const ledger = existing;
        if (ledger.record !== record || ledger.fingerprint !== fingerprint)
            throw new Error('Embedding retry source changed');
        return ledger;
    };
    const getSlot = (ledger: EmbeddingRecoveryLedger, ordinal: number) => {
        const value = ledger.slots[ordinal - 1];
        if (!Number.isInteger(ordinal) || !value) throw new Error('Invalid embedding ordinal');
        return value;
    };
    const change = async (
        ordinal: number,
        previous: z.infer<typeof slot>,
        next: z.infer<typeof slot>
    ) => {
        await active();
        const path = `embeddingRecovery.slots.${ordinal - 1}`;
        const result = await store.updateOne(
            {
                ...filter(),
                'embeddingRecovery.record': record,
                'embeddingRecovery.fingerprint': fingerprint,
                [`${path}.attempts`]: previous.attempts,
                [`${path}.notBefore`]: previous.notBefore,
            },
            { $set: { [path]: next } }
        );
        if (result.matchedCount !== 1) throw new Error('Embedding retry checkpoint changed');
    };
    // The retried operation includes a fresh logging check and an ApplyGuardrail
    // request. Keep both existing 15s request caps plus finalization headroom.
    const privacyFits = (notBefore: number) =>
        Math.max(Date.now(), notBefore) + 2 * BEDROCK_TIMEOUT_MS <=
        deadline - EMBEDDING_WRITE_RESERVE_MS;
    return {
        deadline,
        privacy: options.supplemental
            ? undefined
            : {
                  prepare: async signal => {
                      const ledger = await read();
                      const next = ledger.privacyRetry?.notBefore ?? 0;
                      if (next > Date.now() && !privacyFits(next))
                          throw markEmbeddingStop(
                              new Error('Privacy filtering cannot fit record deadline'),
                              'record_deadline'
                          );
                      await waitForPrivacyRetry(next, signal);
                      managedEmbeddingTimeout(deadline);
                      await active();
                      signal?.throwIfAborted();
                  },
                  retry: async signal => {
                      signal?.throwIfAborted();
                      const ledger = await read();
                      const previous = ledger.privacyRetry;
                      const used = previous?.used ?? 0;
                      if (used >= EMBEDDING_PRIVACY_MAX_RETRIES) return false;
                      const notBefore = Date.now() + EMBEDDING_PRIVACY_RETRY_DELAYS_MS[used]!;
                      if (!privacyFits(notBefore)) return false;
                      const saved = await store.updateOne(
                          {
                              ...filter(),
                              'embeddingRecovery.record': record,
                              'embeddingRecovery.fingerprint': fingerprint,
                              ...(previous
                                  ? {
                                        'embeddingRecovery.privacyRetry.used': used,
                                        'embeddingRecovery.privacyRetry.notBefore':
                                            previous.notBefore,
                                    }
                                  : { 'embeddingRecovery.privacyRetry': { $exists: false } }),
                          },
                          {
                              $set: {
                                  'embeddingRecovery.privacyRetry': { used: used + 1, notBefore },
                              },
                          }
                      );
                      if (saved.matchedCount !== 1)
                          throw new Error('Privacy retry checkpoint changed');
                      await waitForPrivacyRetry(notBefore, signal);
                      await active();
                      signal?.throwIfAborted();
                      return true;
                  },
              },
        assertAvailable: async () => {
            const ledger = await read();
            if (
                !options.supplemental &&
                ledger.slots.some(s => s.attempts >= EMBEDDING_MAX_ATTEMPTS)
            )
                throw markEmbeddingStop(
                    new Error('Embedding retry attempts exhausted'),
                    'attempts_exhausted'
                );
        },
        reserve: async (ordinal, timeoutMs, signal) => {
            if (options.supplemental) {
                getSlot(await read(), ordinal);
                managedEmbeddingTimeout(deadline);
                signal?.throwIfAborted();
                await options.supplemental.reserveEmbedding(ordinal);
                signal?.throwIfAborted();
                return;
            }
            const previous = getSlot(await read(), ordinal);
            if (previous.attempts >= EMBEDDING_MAX_ATTEMPTS)
                throw markEmbeddingStop(
                    new Error('Embedding retry attempts exhausted'),
                    'attempts_exhausted'
                );
            if (Math.max(Date.now(), previous.notBefore) >= deadline - EMBEDDING_WRITE_RESERVE_MS)
                throw markEmbeddingStop(
                    new Error('Embedding retry exceeds unit deadline'),
                    'retry_deadline'
                );
            await waitForEmbeddingRetry(previous.notBefore, signal);
            await active();
            signal?.throwIfAborted();
            const dispatchTimeout = Math.min(timeoutMs, managedEmbeddingTimeout(deadline));
            // Budget reservation is durable and conservative even if a crash follows.
            await reserveProviderRequest('embedding');
            signal?.throwIfAborted();
            await change(ordinal, previous, {
                attempts: previous.attempts + 1,
                notBefore:
                    Date.now() + dispatchTimeout + embeddingRetryDelay(previous.attempts + 1),
            });
        },
        failed: async ordinal => {
            if (options.supplemental) return false;
            const previous = getSlot(await read(), ordinal);
            if (previous.attempts >= EMBEDDING_MAX_ATTEMPTS) return false;
            await change(ordinal, previous, {
                ...previous,
                notBefore: Date.now() + embeddingRetryDelay(previous.attempts),
            });
            return true;
        },
    };
}

export const EMBEDDING_RESUME_BLOCKED_MESSAGE =
    'Embedding attempt limit exhausted for this record. Resume cannot add attempts. Review the failed record before planning further paid work; counters and completed work are preserved.';
export type EmbeddingResumeBlock = {
    code: 'embedding_attempts_exhausted' | 'single_recovery_consumed';
    record: number;
    message: string;
};
/** Only a current diagnosed stop and its matching durable ledger block Resume. */
export function embeddingResumeBlock(
    job: Pick<
        BackfillJob,
        'workflowVersion' | 'snapshotIndex' | 'lastFailure' | 'embeddingRecovery'
    > | null,
    index: number
): EmbeddingResumeBlock | undefined {
    if (job?.workflowVersion !== 2 || job.snapshotIndex !== index) return;
    const failure = sanitizeBackfillFailure(job.lastFailure);
    const ledger = embeddingRecoveryLedgerSchema.safeParse(job.embeddingRecovery);
    if (
        failure?.record !== index + 1 ||
        failure.embeddingStop !== 'attempts_exhausted' ||
        !ledger.success ||
        ledger.data.record !== index + 1 ||
        !ledger.data.slots.some(slot => slot.attempts === EMBEDDING_MAX_ATTEMPTS)
    )
        return;
    return {
        code: 'embedding_attempts_exhausted',
        record: index + 1,
        message: EMBEDDING_RESUME_BLOCKED_MESSAGE,
    };
}
export class EmbeddingResumeBlockedError extends Error {
    readonly code = 'embedding_attempts_exhausted';
    constructor(readonly record: number) {
        super(EMBEDDING_RESUME_BLOCKED_MESSAGE);
        this.name = 'EmbeddingResumeBlockedError';
    }
}

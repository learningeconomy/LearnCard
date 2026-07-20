import { randomUUID } from 'node:crypto';

import type { Db, Filter } from 'mongodb';

import {
    createFieldAad,
    type EncryptedJsonEnvelopeV1,
    type EncryptionService,
} from '../security/encryption';

export const AGENT_AUTONOMOUS_RUNS_COLLECTION = 'agentAutonomousRuns';
export const AGENT_AUTONOMOUS_LEASES_COLLECTION = 'agentAutonomousLeases';

export type AutonomousRunStatus = 'running' | 'succeeded' | 'failed' | 'abandoned';
export type AutonomousTriggerSource = 'startup' | 'interval' | 'manual' | 'trigger';

export interface AutonomousRunSummary {
    agentRunId: string;
    responsePreview: string;
    toolNames: string[];
    cardIds: string[];
    retroCompleted: boolean;
}

export interface AutonomousRun {
    runId: string;
    ownerDid: string;
    scheduleId: string;
    scheduledFor: Date;
    triggerType: 'user-schedule';
    triggerSource: AutonomousTriggerSource;
    status: AutonomousRunStatus;
    createdAt: Date;
    startedAt: Date;
    completedAt?: Date;
    leaseId: string;
    leaseExpiresAt: Date;
    summary?: AutonomousRunSummary;
    error?: string;
}

export interface AutonomousRunRepository {
    create(run: AutonomousRun): Promise<boolean>;
    findByOccurrence(
        ownerDid: string,
        scheduleId: string,
        scheduledFor: Date
    ): Promise<AutonomousRun | undefined>;
    renewLease(runId: string, leaseId: string, now: Date, leaseExpiresAt: Date): Promise<boolean>;
    markSucceeded(
        runId: string,
        leaseId: string,
        completedAt: Date,
        summary: AutonomousRunSummary
    ): Promise<boolean>;
    markFailed(runId: string, leaseId: string, completedAt: Date, error: string): Promise<boolean>;
    markAbandoned(runId: string, completedAt: Date): Promise<boolean>;
    recoverExpired(now: Date): Promise<number>;
}

export interface AutonomousLeaseRepository {
    acquire(
        ownerDid: string,
        scheduleId: string,
        runId: string,
        now: Date,
        expiresAt: Date
    ): Promise<string | undefined>;
    renew(ownerDid: string, leaseId: string, now: Date, expiresAt: Date): Promise<boolean>;
    release(ownerDid: string, leaseId: string): Promise<boolean>;
}

interface StoredAutonomousRun extends Omit<AutonomousRun, 'summary' | 'error'> {
    summary?: EncryptedJsonEnvelopeV1;
    error?: EncryptedJsonEnvelopeV1;
}

interface AutonomousLease {
    ownerDid: string;
    leaseId: string;
    runId: string;
    scheduleId: string;
    acquiredAt: Date;
    expiresAt: Date;
}

const cloneSummary = (summary: AutonomousRunSummary): AutonomousRunSummary => ({
    ...summary,
    toolNames: [...summary.toolNames],
    cardIds: [...summary.cardIds],
});

const cloneRun = (run: AutonomousRun): AutonomousRun => ({
    ...run,
    createdAt: new Date(run.createdAt),
    startedAt: new Date(run.startedAt),
    ...(run.completedAt ? { completedAt: new Date(run.completedAt) } : {}),
    leaseExpiresAt: new Date(run.leaseExpiresAt),
    ...(run.summary ? { summary: cloneSummary(run.summary) } : {}),
});

const isDuplicateKeyError = (error: unknown): boolean =>
    Boolean(error && typeof error === 'object' && 'code' in error && error.code === 11000);

export const sanitizeAutonomousRunError = (error: unknown): string => {
    const raw = error instanceof Error ? `${error.name}: ${error.message}` : String(error);

    return raw
        .replace(/Bearer\s+[^\s"']+/gi, 'Bearer [REDACTED]')
        .replace(/\bsk-[A-Za-z0-9_-]+\b/g, '[REDACTED]')
        .replace(/(mongodb(?:\+srv)?:\/\/)[^@\s/]+@/gi, '$1[REDACTED]@')
        .replace(/([?&][^=&\s]*(?:key|token|secret)[^=&\s]*=)[^&#\s]*/gi, '$1[REDACTED]')
        .slice(0, 1_000);
};

export const createMongoAutonomousRunRepository = (
    db: Db,
    encryption: EncryptionService
): AutonomousRunRepository => {
    const collection = db.collection<StoredAutonomousRun>(AGENT_AUTONOMOUS_RUNS_COLLECTION);
    let indexesReady: Promise<void> | undefined;

    const aad = (run: Pick<AutonomousRun, 'ownerDid' | 'runId'>, fieldPath: string): string =>
        createFieldAad({
            collectionName: AGENT_AUTONOMOUS_RUNS_COLLECTION,
            ownerDid: run.ownerDid,
            stableRecordId: run.runId,
            fieldPath,
        });

    const encryptRun = async (run: AutonomousRun): Promise<StoredAutonomousRun> => {
        const { summary, error, ...metadata } = run;

        return {
            ...metadata,
            ...(summary
                ? { summary: await encryption.encryptJson(summary, aad(run, 'summary')) }
                : {}),
            ...(error ? { error: await encryption.encryptJson(error, aad(run, 'error')) } : {}),
        };
    };

    const decryptRun = async (run: StoredAutonomousRun): Promise<AutonomousRun> => {
        const { summary, error, ...metadata } = run;

        return {
            ...metadata,
            ...(summary
                ? {
                      summary: await encryption.decryptJson<AutonomousRunSummary>(
                          summary,
                          aad(run, 'summary')
                      ),
                  }
                : {}),
            ...(error
                ? { error: await encryption.decryptJson<string>(error, aad(run, 'error')) }
                : {}),
        };
    };

    const ensureIndexes = async (): Promise<void> => {
        indexesReady ??= Promise.all([
            collection.createIndex(
                { ownerDid: 1, scheduleId: 1, scheduledFor: 1 },
                { unique: true }
            ),
            collection.createIndex({ runId: 1 }, { unique: true }),
            collection.createIndex({ ownerDid: 1, startedAt: -1 }),
        ]).then(() => undefined);

        await indexesReady;
    };

    return {
        create: async run => {
            await ensureIndexes();

            try {
                await collection.insertOne(await encryptRun(run));

                return true;
            } catch (error) {
                if (isDuplicateKeyError(error)) return false;

                throw error;
            }
        },
        findByOccurrence: async (ownerDid, scheduleId, scheduledFor) => {
            await ensureIndexes();

            const run = await collection.findOne({
                ownerDid,
                scheduleId,
                scheduledFor,
            } as Filter<StoredAutonomousRun>);

            return run ? decryptRun(run) : undefined;
        },
        renewLease: async (runId, leaseId, now, leaseExpiresAt) => {
            await ensureIndexes();

            const result = await collection.updateOne(
                {
                    runId,
                    leaseId,
                    status: 'running',
                    leaseExpiresAt: { $gt: now },
                    $expr: { $gt: ['$leaseExpiresAt', '$$NOW'] },
                } as Filter<StoredAutonomousRun>,
                { $set: { leaseExpiresAt } }
            );

            return result.matchedCount === 1;
        },
        markSucceeded: async (runId, leaseId, completedAt, summary) => {
            await ensureIndexes();

            const run = await collection.findOne({
                runId,
                leaseId,
                status: 'running',
                leaseExpiresAt: { $gt: completedAt },
            } as Filter<StoredAutonomousRun>);
            if (!run) return false;

            const encryptedSummary = await encryption.encryptJson(summary, aad(run, 'summary'));
            const result = await collection.updateOne(
                {
                    runId,
                    leaseId,
                    status: 'running',
                    leaseExpiresAt: { $gt: completedAt },
                    $expr: { $gt: ['$leaseExpiresAt', '$$NOW'] },
                } as Filter<StoredAutonomousRun>,
                {
                    $set: { status: 'succeeded', completedAt, summary: encryptedSummary },
                    $unset: { error: '' },
                }
            );

            return result.matchedCount === 1;
        },
        markFailed: async (runId, leaseId, completedAt, error) => {
            await ensureIndexes();

            const run = await collection.findOne({
                runId,
                leaseId,
                status: 'running',
                leaseExpiresAt: { $gt: completedAt },
            } as Filter<StoredAutonomousRun>);
            if (!run) return false;

            const encryptedError = await encryption.encryptJson(
                sanitizeAutonomousRunError(error),
                aad(run, 'error')
            );
            const result = await collection.updateOne(
                {
                    runId,
                    leaseId,
                    status: 'running',
                    leaseExpiresAt: { $gt: completedAt },
                    $expr: { $gt: ['$leaseExpiresAt', '$$NOW'] },
                } as Filter<StoredAutonomousRun>,
                {
                    $set: { status: 'failed', completedAt, error: encryptedError },
                    $unset: { summary: '' },
                }
            );

            return result.matchedCount === 1;
        },
        markAbandoned: async (runId, completedAt) => {
            await ensureIndexes();

            const result = await collection.updateOne(
                { runId, status: 'running' } as Filter<StoredAutonomousRun>,
                { $set: { status: 'abandoned', completedAt } }
            );

            return result.matchedCount === 1;
        },
        recoverExpired: async now => {
            await ensureIndexes();

            const result = await collection.updateMany(
                { status: 'running', leaseExpiresAt: { $lte: now } } as Filter<StoredAutonomousRun>,
                { $set: { status: 'abandoned', completedAt: now } }
            );

            return result.modifiedCount;
        },
    };
};

export const createInMemoryAutonomousRunRepository = (
    initialRuns: AutonomousRun[] = []
): AutonomousRunRepository => {
    const runs = new Map<string, AutonomousRun>();

    for (const run of initialRuns) runs.set(run.runId, cloneRun(run));

    return {
        create: async run => {
            const duplicate = [...runs.values()].some(
                existing =>
                    existing.ownerDid === run.ownerDid &&
                    existing.scheduleId === run.scheduleId &&
                    existing.scheduledFor.getTime() === run.scheduledFor.getTime()
            );
            if (duplicate || runs.has(run.runId)) return false;

            runs.set(run.runId, cloneRun(run));

            return true;
        },
        findByOccurrence: async (ownerDid, scheduleId, scheduledFor) => {
            const run = [...runs.values()].find(
                existing =>
                    existing.ownerDid === ownerDid &&
                    existing.scheduleId === scheduleId &&
                    existing.scheduledFor.getTime() === scheduledFor.getTime()
            );

            return run ? cloneRun(run) : undefined;
        },
        renewLease: async (runId, leaseId, now, leaseExpiresAt) => {
            const run = runs.get(runId);
            if (
                !run ||
                run.leaseId !== leaseId ||
                run.status !== 'running' ||
                run.leaseExpiresAt.getTime() <= now.getTime()
            ) {
                return false;
            }

            runs.set(runId, {
                ...run,
                leaseExpiresAt: new Date(leaseExpiresAt),
            });

            return true;
        },
        markSucceeded: async (runId, leaseId, completedAt, summary) => {
            const run = runs.get(runId);
            if (
                !run ||
                run.leaseId !== leaseId ||
                run.status !== 'running' ||
                run.leaseExpiresAt.getTime() <= completedAt.getTime()
            ) {
                return false;
            }

            runs.set(runId, {
                ...run,
                status: 'succeeded',
                completedAt: new Date(completedAt),
                summary: cloneSummary(summary),
                error: undefined,
            });

            return true;
        },
        markFailed: async (runId, leaseId, completedAt, error) => {
            const run = runs.get(runId);
            if (
                !run ||
                run.leaseId !== leaseId ||
                run.status !== 'running' ||
                run.leaseExpiresAt.getTime() <= completedAt.getTime()
            ) {
                return false;
            }

            runs.set(runId, {
                ...run,
                status: 'failed',
                completedAt: new Date(completedAt),
                summary: undefined,
                error: sanitizeAutonomousRunError(error),
            });

            return true;
        },
        markAbandoned: async (runId, completedAt) => {
            const run = runs.get(runId);
            if (!run || run.status !== 'running') return false;

            runs.set(runId, {
                ...run,
                status: 'abandoned',
                completedAt: new Date(completedAt),
            });

            return true;
        },
        recoverExpired: async now => {
            let recovered = 0;

            for (const [runId, run] of runs) {
                if (run.status !== 'running' || run.leaseExpiresAt.getTime() > now.getTime())
                    continue;

                runs.set(runId, {
                    ...run,
                    status: 'abandoned',
                    completedAt: new Date(now),
                });
                recovered += 1;
            }

            return recovered;
        },
    };
};

export const createMongoAutonomousLeaseRepository = (
    db: Db,
    createId: () => string = randomUUID
): AutonomousLeaseRepository => {
    const collection = db.collection<AutonomousLease>(AGENT_AUTONOMOUS_LEASES_COLLECTION);
    let indexReady: Promise<void> | undefined;

    const ensureIndex = async (): Promise<void> => {
        indexReady ??= collection
            .createIndex({ ownerDid: 1 }, { unique: true })
            .then(() => undefined);
        await indexReady;
    };

    return {
        acquire: async (ownerDid, scheduleId, runId, now, expiresAt) => {
            await ensureIndex();

            const leaseId = createId();

            try {
                const lease = await collection.findOneAndUpdate(
                    {
                        ownerDid,
                        $or: [{ expiresAt: { $lte: now } }, { leaseId }],
                    } as Filter<AutonomousLease>,
                    {
                        $set: { leaseId, runId, scheduleId, acquiredAt: now, expiresAt },
                        $setOnInsert: { ownerDid },
                    },
                    { upsert: true, returnDocument: 'after' }
                );

                return lease?.leaseId === leaseId ? leaseId : undefined;
            } catch (error) {
                if (isDuplicateKeyError(error)) return undefined;

                throw error;
            }
        },
        renew: async (ownerDid, leaseId, now, expiresAt) => {
            await ensureIndex();

            const result = await collection.updateOne(
                {
                    ownerDid,
                    leaseId,
                    expiresAt: { $gt: now },
                    $expr: { $gt: ['$expiresAt', '$$NOW'] },
                },
                { $set: { expiresAt } }
            );

            return result.matchedCount === 1;
        },
        release: async (ownerDid, leaseId) => {
            await ensureIndex();

            const result = await collection.deleteOne({ ownerDid, leaseId });

            return result.deletedCount === 1;
        },
    };
};

export const createInMemoryAutonomousLeaseRepository = (
    createId: () => string = randomUUID
): AutonomousLeaseRepository => {
    const leases = new Map<string, AutonomousLease>();

    return {
        acquire: async (ownerDid, scheduleId, runId, now, expiresAt) => {
            const existing = leases.get(ownerDid);
            if (existing && existing.expiresAt.getTime() > now.getTime()) return undefined;

            const leaseId = createId();
            leases.set(ownerDid, {
                ownerDid,
                leaseId,
                runId,
                scheduleId,
                acquiredAt: new Date(now),
                expiresAt: new Date(expiresAt),
            });

            return leaseId;
        },
        renew: async (ownerDid, leaseId, now, expiresAt) => {
            const existing = leases.get(ownerDid);
            if (
                !existing ||
                existing.leaseId !== leaseId ||
                existing.expiresAt.getTime() <= now.getTime()
            ) {
                return false;
            }

            leases.set(ownerDid, {
                ...existing,
                expiresAt: new Date(expiresAt),
            });

            return true;
        },
        release: async (ownerDid, leaseId) => {
            const existing = leases.get(ownerDid);
            if (!existing || existing.leaseId !== leaseId) return false;

            return leases.delete(ownerDid);
        },
    };
};

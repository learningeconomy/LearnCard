import type { Db } from 'mongodb';
import { describe, expect, it, vi } from 'vitest';

import {
    AGENT_AUTONOMOUS_RUNS_COLLECTION,
    createInMemoryAutonomousLeaseRepository,
    createInMemoryAutonomousRunRepository,
    createMongoAutonomousRunRepository,
    sanitizeAutonomousRunError,
    type AutonomousRun,
    type AutonomousRunSummary,
} from '../../src/autonomy/runs';
import type { EncryptedJsonEnvelopeV1, EncryptionService } from '../../src/security/encryption';

const OWNER_DID = 'did:key:owner';
const OTHER_DID = 'did:key:other';
const STARTED_AT = new Date('2026-07-15T12:00:00.000Z');
const SCHEDULED_FOR = new Date('2026-07-15T11:30:00.000Z');
const LEASE_EXPIRES_AT = new Date('2026-07-15T12:15:00.000Z');

const createRun = (overrides: Partial<AutonomousRun> = {}): AutonomousRun => ({
    runId: 'run-1',
    ownerDid: OWNER_DID,
    scheduleId: 'schedule-1',
    scheduledFor: SCHEDULED_FOR,
    triggerType: 'user-schedule',
    triggerSource: 'manual',
    status: 'running',
    createdAt: STARTED_AT,
    startedAt: STARTED_AT,
    leaseId: 'lease-1',
    leaseExpiresAt: LEASE_EXPIRES_AT,
    ...overrides,
});

const summary: AutonomousRunSummary = {
    agentRunId: 'agent-run-1',
    responsePreview: 'Scheduled result.',
    toolNames: ['webSearch', 'rememberUserMemory'],
    cardIds: ['card-1'],
    retroCompleted: true,
};

describe('autonomous run and lease persistence', () => {
    it('suppresses duplicate occurrences and requires the active lease for terminal writes', async () => {
        const repository = createInMemoryAutonomousRunRepository();
        const run = createRun();

        await expect(repository.create(run)).resolves.toBe(true);
        await expect(repository.create({ ...run, runId: 'run-2' })).resolves.toBe(false);
        const renewedExpiresAt = new Date('2026-07-15T12:30:00.000Z');
        await expect(
            repository.renewLease(run.runId, 'wrong-lease', STARTED_AT, renewedExpiresAt)
        ).resolves.toBe(false);
        await expect(
            repository.renewLease(run.runId, run.leaseId, STARTED_AT, renewedExpiresAt)
        ).resolves.toBe(true);
        await expect(
            repository.findByOccurrence(OWNER_DID, run.scheduleId, run.scheduledFor)
        ).resolves.toMatchObject({ leaseExpiresAt: renewedExpiresAt });
        await expect(
            repository.renewLease(
                run.runId,
                run.leaseId,
                renewedExpiresAt,
                new Date('2026-07-15T12:45:00.000Z')
            )
        ).resolves.toBe(false);
        await expect(
            repository.markSucceeded(run.runId, 'wrong-lease', new Date(), summary)
        ).resolves.toBe(false);
        await expect(
            repository.markSucceeded(
                run.runId,
                run.leaseId,
                new Date('2026-07-15T12:01:00.000Z'),
                summary
            )
        ).resolves.toBe(true);

        await expect(
            repository.findByOccurrence(OWNER_DID, run.scheduleId, run.scheduledFor)
        ).resolves.toMatchObject({
            status: 'succeeded',
            summary,
        });
        await expect(
            repository.markFailed(run.runId, run.leaseId, new Date(), 'late failure')
        ).resolves.toBe(false);

        const expired = createRun({
            runId: 'run-expired',
            scheduleId: 'schedule-expired',
            leaseId: 'lease-expired',
        });
        await expect(repository.create(expired)).resolves.toBe(true);
        await expect(
            repository.markSucceeded(
                expired.runId,
                expired.leaseId,
                expired.leaseExpiresAt,
                summary
            )
        ).resolves.toBe(false);
        await expect(
            repository.markFailed(
                expired.runId,
                expired.leaseId,
                expired.leaseExpiresAt,
                'expired failure'
            )
        ).resolves.toBe(false);
        await expect(
            repository.findByOccurrence(expired.ownerDid, expired.scheduleId, expired.scheduledFor)
        ).resolves.toMatchObject({ status: 'running' });
    });

    it('sanitizes terminal failures and never stores secret-bearing error details', async () => {
        const repository = createInMemoryAutonomousRunRepository();
        const run = createRun();
        const secretError =
            'Provider failed Bearer private-bearer sk-project-secret mongodb://user:password@localhost/db?apiKey=private-key&token=private-token';

        await repository.create(run);
        await repository.markFailed(
            run.runId,
            run.leaseId,
            new Date('2026-07-15T12:01:00.000Z'),
            secretError
        );

        const stored = await repository.findByOccurrence(
            OWNER_DID,
            run.scheduleId,
            run.scheduledFor
        );
        const serialized = JSON.stringify(stored);

        expect(stored?.status).toBe('failed');
        expect(stored?.error).toContain('[REDACTED]');
        expect(serialized).not.toContain('private-bearer');
        expect(serialized).not.toContain('sk-project-secret');
        expect(serialized).not.toContain('user:password');
        expect(serialized).not.toContain('private-key');
        expect(serialized).not.toContain('private-token');
        expect(sanitizeAutonomousRunError('x'.repeat(2_000))).toHaveLength(1_000);
    });

    it('recovers expired running attempts as abandoned without changing terminal attempts', async () => {
        const expired = createRun({ leaseExpiresAt: new Date('2026-07-15T11:59:00.000Z') });
        const terminal = createRun({
            runId: 'run-terminal',
            scheduleId: 'schedule-terminal',
            status: 'succeeded',
            summary,
        });
        const repository = createInMemoryAutonomousRunRepository([expired, terminal]);
        const now = new Date('2026-07-15T12:00:00.000Z');

        await expect(repository.recoverExpired(now)).resolves.toBe(1);
        await expect(
            repository.findByOccurrence(OWNER_DID, expired.scheduleId, expired.scheduledFor)
        ).resolves.toMatchObject({ status: 'abandoned', completedAt: now });
        await expect(
            repository.findByOccurrence(OWNER_DID, terminal.scheduleId, terminal.scheduledFor)
        ).resolves.toMatchObject({ status: 'succeeded' });
    });

    it('serializes one user while allowing different users and protects successor leases', async () => {
        const leaseIds = ['lease-1', 'lease-2', 'lease-3'];
        let leaseIndex = 0;
        const leases = createInMemoryAutonomousLeaseRepository(() => leaseIds[leaseIndex++]!);
        const now = new Date('2026-07-15T12:00:00.000Z');
        const expiresAt = new Date('2026-07-15T12:15:00.000Z');

        await expect(
            leases.acquire(OWNER_DID, 'schedule-1', 'run-1', now, expiresAt)
        ).resolves.toBe('lease-1');
        await expect(
            leases.acquire(OWNER_DID, 'schedule-2', 'run-2', now, expiresAt)
        ).resolves.toBeUndefined();
        await expect(
            leases.acquire(OTHER_DID, 'schedule-3', 'run-3', now, expiresAt)
        ).resolves.toBe('lease-2');

        const renewedExpiresAt = new Date('2026-07-15T12:30:00.000Z');
        await expect(leases.renew(OWNER_DID, 'wrong-lease', now, renewedExpiresAt)).resolves.toBe(
            false
        );
        await expect(leases.renew(OWNER_DID, 'lease-1', now, renewedExpiresAt)).resolves.toBe(true);
        await expect(
            leases.renew(
                OWNER_DID,
                'lease-1',
                renewedExpiresAt,
                new Date('2026-07-15T12:45:00.000Z')
            )
        ).resolves.toBe(false);

        const afterOriginalExpiry = new Date(expiresAt.getTime() + 1);
        await expect(
            leases.acquire(
                OWNER_DID,
                'schedule-2',
                'run-2',
                afterOriginalExpiry,
                new Date(afterOriginalExpiry.getTime() + 900_000)
            )
        ).resolves.toBeUndefined();

        const afterRenewedExpiry = new Date(renewedExpiresAt.getTime() + 1);
        await expect(
            leases.acquire(
                OWNER_DID,
                'schedule-2',
                'run-2',
                afterRenewedExpiry,
                new Date(afterRenewedExpiry.getTime() + 900_000)
            )
        ).resolves.toBe('lease-3');
        await expect(leases.release(OWNER_DID, 'lease-1')).resolves.toBe(false);
        await expect(leases.release(OWNER_DID, 'lease-3')).resolves.toBe(true);
    });

    it('encrypts summaries and sanitized errors with owner/run-scoped AAD', async () => {
        type StoredDocument = Record<string, unknown>;
        type UpdateDocument = {
            $set?: StoredDocument;
            $unset?: StoredDocument;
        };

        const documents: StoredDocument[] = [];
        const encryptedValues = new Map<EncryptedJsonEnvelopeV1, unknown>();
        const encryptedPayloads: Array<{ value: unknown; aad: string }> = [];
        const encryption: EncryptionService = {
            encryptJson: async (value, aad) => {
                const envelope = {
                    __learnCardAiAgentEncrypted: true,
                    version: 1,
                    format: 'dag-jwe',
                    kid: 'test-key',
                    recipientDid: 'did:key:agent',
                    jwe: {},
                } as EncryptedJsonEnvelopeV1;

                encryptedValues.set(envelope, value);
                encryptedPayloads.push({ value, aad });

                return envelope;
            },
            decryptJson: async <T>(envelope: EncryptedJsonEnvelopeV1): Promise<T> =>
                encryptedValues.get(envelope) as T,
            decryptLegacyOrEnvelope: async <T>(value: T | EncryptedJsonEnvelopeV1) => ({
                value: encryptedValues.has(value as EncryptedJsonEnvelopeV1)
                    ? (encryptedValues.get(value as EncryptedJsonEnvelopeV1) as T)
                    : (value as T),
                legacyPlaintext: false,
            }),
        };
        const matches = (document: StoredDocument, filter: StoredDocument): boolean =>
            Object.entries(filter).every(([key, value]) => {
                if (key === '$expr') {
                    const leaseExpiresAt = document.leaseExpiresAt;

                    return (
                        leaseExpiresAt instanceof Date &&
                        leaseExpiresAt.getTime() > STARTED_AT.getTime()
                    );
                }

                const actual = document[key];
                if (
                    value &&
                    typeof value === 'object' &&
                    '$gt' in value &&
                    value.$gt instanceof Date &&
                    actual instanceof Date
                ) {
                    return actual.getTime() > value.$gt.getTime();
                }

                return value instanceof Date && actual instanceof Date
                    ? actual.getTime() === value.getTime()
                    : actual === value;
            });
        const collection = {
            createIndex: vi.fn(async () => 'index'),
            insertOne: vi.fn(async (document: StoredDocument) => {
                documents.push({ ...document });

                return { acknowledged: true };
            }),
            findOne: vi.fn(async (filter: StoredDocument) =>
                documents.find(document => matches(document, filter))
            ),
            updateOne: vi.fn(async (filter: StoredDocument, update: UpdateDocument) => {
                const document = documents.find(candidate => matches(candidate, filter));
                if (!document) return { matchedCount: 0, modifiedCount: 0 };

                Object.assign(document, update.$set ?? {});
                for (const key of Object.keys(update.$unset ?? {})) delete document[key];

                return { matchedCount: 1, modifiedCount: 1 };
            }),
            updateMany: vi.fn(async () => ({ modifiedCount: 0 })),
        };
        const db = { collection: () => collection } as unknown as Db;
        const repository = createMongoAutonomousRunRepository(db, encryption);
        const succeeded = createRun();

        await repository.create(succeeded);
        await repository.markSucceeded(
            succeeded.runId,
            succeeded.leaseId,
            new Date('2026-07-15T12:01:00.000Z'),
            summary
        );

        const summaryPayload = encryptedPayloads.find(payload =>
            payload.aad.endsWith('summary:v1')
        );
        expect(summaryPayload).toEqual({
            value: summary,
            aad: `collection:${AGENT_AUTONOMOUS_RUNS_COLLECTION}:owner:${OWNER_DID}:id:run-1:field:summary:v1`,
        });
        await expect(
            repository.findByOccurrence(OWNER_DID, succeeded.scheduleId, succeeded.scheduledFor)
        ).resolves.toMatchObject({ summary });

        const failed = createRun({
            runId: 'run-failed',
            scheduleId: 'schedule-failed',
            scheduledFor: new Date('2026-07-15T11:45:00.000Z'),
            leaseId: 'lease-failed',
        });
        await repository.create(failed);
        await repository.markFailed(
            failed.runId,
            failed.leaseId,
            new Date('2026-07-15T12:02:00.000Z'),
            'Bearer top-secret sk-private mongodb://user:pass@host/db?secret=hidden'
        );

        const serializedMongo = JSON.stringify(documents);
        const serializedPayloads = JSON.stringify(encryptedPayloads);
        expect(serializedMongo).not.toContain('top-secret');
        expect(serializedMongo).not.toContain('sk-private');
        expect(serializedMongo).not.toContain('user:pass');
        expect(serializedPayloads).not.toContain('top-secret');
        expect(serializedPayloads).not.toContain('sk-private');
        expect(serializedPayloads).not.toContain('user:pass');
        expect(encryptedPayloads.at(-1)?.aad).toBe(
            `collection:${AGENT_AUTONOMOUS_RUNS_COLLECTION}:owner:${OWNER_DID}:id:run-failed:field:error:v1`
        );
    });
});

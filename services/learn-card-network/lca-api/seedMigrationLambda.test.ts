import type { Context } from 'aws-lambda';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SeedMigrationResult } from './src/types/seed-migration';

const mocks = vi.hoisted(() => ({
    connect: vi.fn(),
    close: vi.fn(),
    runBatch: vi.fn(),
    mongodb: {},
}));

vi.mock('./src/mongo', () => ({
    client: { connect: mocks.connect, close: mocks.close },
    mongodb: mocks.mongodb,
}));
vi.mock('./src/config/environment', () => ({
    environment: { SA_SEED_ENCRYPT_WRITES: true },
}));
vi.mock('./src/migrations/signingAuthoritySeeds', async importOriginal => ({
    ...(await importOriginal<typeof import('./src/migrations/signingAuthoritySeeds')>()),
    runSeedMigrationBatch: mocks.runBatch,
}));

import { handler } from './seedMigrationLambda';
import { SeedMigrationError } from './src/migrations/signingAuthoritySeeds';

const result: SeedMigrationResult = {
    phase: 'prepare',
    done: false,
    processed: 1,
    counts: { total: 2, encrypted: 1, legacyOnly: 1, malformed: 0, plaintextRemaining: 2 },
    countsReconciled: false,
};

const context = (): Context => ({
    callbackWaitsForEmptyEventLoop: true,
    functionName: 'seedMigration',
    functionVersion: '$LATEST',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:seedMigration',
    memoryLimitInMB: '1024',
    awsRequestId: 'test-request',
    logGroupName: 'test-group',
    logStreamName: 'test-stream',
    getRemainingTimeInMillis: () => 60_000,
    done: vi.fn(),
    fail: vi.fn(),
    succeed: vi.fn(),
});

beforeEach(() => {
    mocks.connect.mockReset().mockResolvedValue(undefined);
    mocks.close.mockReset().mockResolvedValue(undefined);
    mocks.runBatch.mockReset().mockResolvedValue(result);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => vi.restoreAllMocks());

describe('seed migration Lambda connection lifecycle', () => {
    it('waits for cleanup before returning the batch result', async () => {
        let finishClose!: () => void;
        mocks.close.mockReturnValue(new Promise<void>(resolve => (finishClose = resolve)));
        const resolved = vi.fn();
        const lambdaContext = context();
        const invocation = handler({ phase: 'prepare', batchSize: 1 }, lambdaContext).then(
            resolved
        );

        await vi.waitFor(() => expect(mocks.close).toHaveBeenCalledOnce());
        expect(resolved).not.toHaveBeenCalled();
        expect(mocks.runBatch).toHaveBeenCalledWith(
            mocks.mongodb,
            { phase: 'prepare', batchSize: 1 },
            { encryptedWritesEnabled: true, remainingTime: expect.any(Function) }
        );
        expect(lambdaContext.callbackWaitsForEmptyEventLoop).toBe(false);

        finishClose();
        await invocation;
        expect(resolved).toHaveBeenCalledWith(result);
    });

    it('connects and closes for each sequential warm invocation', async () => {
        await handler({ phase: 'prepare' }, context());
        await handler({ phase: 'prepare' }, context());
        expect(mocks.connect).toHaveBeenCalledTimes(2);
        expect(mocks.runBatch).toHaveBeenCalledTimes(2);
        expect(mocks.close).toHaveBeenCalledTimes(2);
    });

    it('closes after a connection failure without returning connection details', async () => {
        mocks.connect.mockRejectedValue(new Error('mongodb://user:secret@private-host'));
        await expect(handler({ phase: 'prepare' }, context())).rejects.toMatchObject({
            category: 'operation_failed',
            message: 'Signing authority seed migration stopped: operation_failed',
        });
        expect(mocks.runBatch).not.toHaveBeenCalled();
        expect(mocks.close).toHaveBeenCalledOnce();
    });

    it('closes after an unexpected batch failure without returning query details', async () => {
        mocks.runBatch.mockRejectedValue(new Error('sensitive seed query'));
        await expect(handler({ phase: 'prepare' }, context())).rejects.toMatchObject({
            category: 'operation_failed',
            message: 'Signing authority seed migration stopped: operation_failed',
        });
        expect(mocks.close).toHaveBeenCalledOnce();
    });

    it('preserves the migration failure when cleanup also fails', async () => {
        mocks.runBatch.mockRejectedValue(new SeedMigrationError('verification_required'));
        mocks.close.mockRejectedValue(new Error('sensitive cleanup detail'));
        await expect(handler({ phase: 'purge' }, context())).rejects.toMatchObject({
            category: 'verification_required',
        });
        expect(mocks.close).toHaveBeenCalledOnce();
        expect(console.error).toHaveBeenCalledExactlyOnceWith({
            event: 'signing_authority_seed_migration_failure',
            operation: 'migration_connection_cleanup',
            category: 'operation_failed',
        });
    });

    it('sanitizes cleanup errors after an otherwise successful batch', async () => {
        mocks.close.mockRejectedValue(new Error('mongodb://user:secret@private-host'));
        await expect(handler({ phase: 'prepare' }, context())).rejects.toMatchObject({
            category: 'operation_failed',
            message: 'Signing authority seed migration stopped: operation_failed',
        });
        expect(console.error).toHaveBeenCalledExactlyOnceWith({
            event: 'signing_authority_seed_migration_failure',
            operation: 'migration_connection_cleanup',
            category: 'operation_failed',
        });
    });

    it('rejects invalid requests before touching the database', async () => {
        await expect(handler({ phase: 'unknown' }, context())).rejects.toMatchObject({
            category: 'invalid_request',
        });
        expect(mocks.connect).not.toHaveBeenCalled();
        expect(mocks.runBatch).not.toHaveBeenCalled();
        expect(mocks.close).not.toHaveBeenCalled();
    });
});

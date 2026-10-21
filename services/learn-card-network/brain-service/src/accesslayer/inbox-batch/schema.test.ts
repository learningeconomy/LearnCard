import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Driver, ManagedTransaction } from 'neo4j-driver';

vi.mock('@instance', () => ({ neogma: { driver: { session: vi.fn() } } }));
import { createInboxBatchSchemaInitializer } from './schema';

const harness = () => {
    const run = vi.fn().mockResolvedValue({});
    const close = vi.fn().mockResolvedValue(undefined);
    const executeWrite = vi.fn(async (callback: (tx: ManagedTransaction) => unknown) =>
        callback({ run } as unknown as ManagedTransaction)
    );
    const driver = { session: vi.fn(() => ({ run: vi.fn(), executeWrite, close })) };
    const ensure = createInboxBatchSchemaInitializer(driver as unknown as Driver);
    return { run, close, executeWrite, driver, ensure };
};

beforeEach(() => vi.clearAllMocks());

describe('inbox batch schema readiness', () => {
    it('shares in-flight readiness and runs every constraint AND index in its own managed write', async () => {
        const { ensure, driver, executeWrite, run, close } = harness();
        const first = ensure();
        expect(ensure()).toBe(first);
        await first;
        await ensure();
        expect(driver.session).toHaveBeenCalledTimes(1);
        expect(executeWrite).toHaveBeenCalledTimes(10);
        expect(run).toHaveBeenCalledTimes(10);
        expect(
            run.mock.calls.filter(([query]) => query.startsWith('CREATE CONSTRAINT'))
        ).toHaveLength(4);
        expect(run.mock.calls.filter(([query]) => query.startsWith('CREATE INDEX'))).toHaveLength(
            6
        );
        expect(close).toHaveBeenCalledTimes(1);
    });

    it('lets independent API/worker initializers complete through a transient managed-transaction retry', async () => {
        const api = harness();
        const worker = harness();
        // Model the driver re-entering the transaction callback after a DDL deadlock.
        // The real-driver concurrent cold-start regression lives in inbox-batch.spec.ts.
        const deadlock = { code: 'Neo.TransientError.Transaction.DeadlockDetected' };
        api.run.mockRejectedValueOnce(deadlock);
        api.executeWrite.mockImplementationOnce(async callback => {
            await expect(callback({ run: api.run } as unknown as ManagedTransaction)).rejects.toBe(
                deadlock
            );
            return callback({ run: api.run } as unknown as ManagedTransaction);
        });
        await expect(Promise.all([api.ensure(), worker.ensure()])).resolves.toEqual([
            undefined,
            undefined,
        ]);
        expect(api.run.mock.calls[0][0]).toBe(api.run.mock.calls[1][0]);
        expect(api.run).toHaveBeenCalledTimes(11);
        expect(worker.run).toHaveBeenCalledTimes(10);
    });

    it.each([0, 4])('accepts equivalent-schema races for statement %i', async position => {
        const { ensure, run } = harness();
        for (let index = 0; index < position; index++) run.mockResolvedValueOnce({});
        run.mockRejectedValueOnce({
            code: 'Neo.ClientError.Schema.EquivalentSchemaRuleAlreadyExists',
        });
        await expect(ensure()).resolves.toBeUndefined();
        expect(run).toHaveBeenCalledTimes(10);
    });

    it.each([
        'Neo.ClientError.Security.Forbidden',
        'Neo.TransientError.Transaction.DeadlockDetected',
    ])(
        'propagates %s after the managed write fails and allows a later readiness attempt',
        async code => {
            const { ensure, executeWrite, run, close, driver } = harness();
            const failure = { code };
            executeWrite.mockRejectedValueOnce(failure);
            await expect(ensure()).rejects.toBe(failure);
            expect(run).not.toHaveBeenCalled();
            expect(close).toHaveBeenCalledTimes(1);
            await expect(ensure()).resolves.toBeUndefined();
            expect(driver.session).toHaveBeenCalledTimes(2);
            expect(run).toHaveBeenCalledTimes(10);
            expect(close).toHaveBeenCalledTimes(2);
        }
    );
});

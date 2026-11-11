import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    run: vi.fn(),
}));

vi.mock('@instance', () => ({
    neogma: {
        queryRunner: {
            run: mocks.run,
        },
    },
}));

beforeEach(() => {
    vi.resetModules();
    mocks.run.mockReset();
});

describe('credential refresh constraint readiness', () => {
    it('shares one in-flight constraint setup across concurrent callers', async () => {
        let releaseFirstQuery!: () => void;
        const firstQuery = new Promise<void>(resolve => {
            releaseFirstQuery = resolve;
        });

        mocks.run.mockReturnValueOnce(firstQuery).mockResolvedValue(undefined);

        const { ensureCredentialRefreshConstraints } =
            await import('./credential-refresh-constraints');

        const first = ensureCredentialRefreshConstraints();
        const second = ensureCredentialRefreshConstraints();

        expect(second).toBe(first);
        expect(mocks.run).toHaveBeenCalledTimes(1);

        releaseFirstQuery();
        await Promise.all([first, second]);

        expect(mocks.run).toHaveBeenCalledTimes(8);
        expect(mocks.run.mock.calls.map(([query]) => query)).toEqual([
            'CREATE CONSTRAINT inbox_refresh_issue_key_unique IF NOT EXISTS FOR (i:InboxCredential) REQUIRE (i.refreshIssueKey) IS UNIQUE',
            'CREATE CONSTRAINT inbox_refresh_publication_key_unique IF NOT EXISTS FOR (p:InboxRefreshPublication) REQUIRE (p.refreshIdempotencyKey) IS UNIQUE',
            'CREATE CONSTRAINT inbox_refresh_version_key_unique IF NOT EXISTS FOR (p:InboxRefreshPublication) REQUIRE (p.refreshVersionKey) IS UNIQUE',
            'CREATE CONSTRAINT credential_refresh_id_unique IF NOT EXISTS FOR (r:CredentialRefresh) REQUIRE (r.refreshId) IS UNIQUE',
            'CREATE CONSTRAINT credential_refresh_version_key_unique IF NOT EXISTS FOR (c:Credential) REQUIRE (c.refreshVersionKey) IS UNIQUE',
            'CREATE CONSTRAINT credential_refresh_idempotency_key_unique IF NOT EXISTS FOR (c:Credential) REQUIRE (c.refreshIdempotencyKey) IS UNIQUE',
            'CREATE CONSTRAINT credential_refresh_email_delivery_key_unique IF NOT EXISTS FOR (d:CredentialRefreshEmailDelivery) REQUIRE (d.deliveryKey) IS UNIQUE',
            'CREATE CONSTRAINT refresh_send_intent_key_unique IF NOT EXISTS FOR (i:RefreshSendIntent) REQUIRE (i.intentKey) IS UNIQUE',
        ]);
    });

    it('accepts an equivalent-schema-rule race as ready', async () => {
        mocks.run
            .mockRejectedValueOnce({
                code: 'Neo.ClientError.Schema.EquivalentSchemaRuleAlreadyExists',
            })
            .mockResolvedValue(undefined);

        const { ensureCredentialRefreshConstraints } =
            await import('./credential-refresh-constraints');

        await expect(ensureCredentialRefreshConstraints()).resolves.toBeUndefined();
        expect(mocks.run).toHaveBeenCalledTimes(8);
    });

    it('clears failed readiness so a later request can retry', async () => {
        const setupFailure = new Error('neo4j unavailable');
        mocks.run.mockRejectedValueOnce(setupFailure).mockResolvedValue(undefined);

        const { ensureCredentialRefreshConstraints } =
            await import('./credential-refresh-constraints');

        await expect(ensureCredentialRefreshConstraints()).rejects.toBe(setupFailure);
        await expect(ensureCredentialRefreshConstraints()).resolves.toBeUndefined();

        expect(mocks.run).toHaveBeenCalledTimes(9);
    });

    it('runs the constraint setup once per process across many calls', async () => {
        mocks.run.mockResolvedValue(undefined);

        const { ensureCredentialRefreshConstraints } =
            await import('./credential-refresh-constraints');

        // A burst of concurrent callers (cold start plus the first requests) ...
        await Promise.all(Array.from({ length: 50 }, () => ensureCredentialRefreshConstraints()));
        // ... and every later caller in the same process.
        for (let i = 0; i < 200; i++) await ensureCredentialRefreshConstraints();

        expect(mocks.run).toHaveBeenCalledTimes(8);
        expect(new Set(mocks.run.mock.calls.map(([query]) => query)).size).toBe(8);
    });

    it('retries transient errors and deadlocks before giving up on a statement', async () => {
        mocks.run
            .mockRejectedValueOnce({ code: 'Neo.TransientError.Transaction.DeadlockDetected' })
            .mockRejectedValueOnce({
                code: 'Neo.TransientError.Transaction.LockClientStopped',
                retriable: true,
            })
            .mockResolvedValue(undefined);

        const { ensureCredentialRefreshConstraints } =
            await import('./credential-refresh-constraints');

        await expect(ensureCredentialRefreshConstraints()).resolves.toBeUndefined();
        // The first statement took three attempts, the other seven one each
        expect(mocks.run).toHaveBeenCalledTimes(10);
        expect(mocks.run.mock.calls[0]![0]).toBe(mocks.run.mock.calls[2]![0]);
    });

    it('does not retry a non-transient failure', async () => {
        const setupFailure = { code: 'Neo.ClientError.Security.Forbidden' };
        mocks.run.mockRejectedValueOnce(setupFailure).mockResolvedValue(undefined);

        const { ensureCredentialRefreshConstraints } =
            await import('./credential-refresh-constraints');

        await expect(ensureCredentialRefreshConstraints()).rejects.toBe(setupFailure);
        expect(mocks.run).toHaveBeenCalledTimes(1);
    });
});

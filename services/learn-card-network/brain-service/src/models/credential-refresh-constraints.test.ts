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

        expect(mocks.run).toHaveBeenCalledTimes(3);
        expect(mocks.run.mock.calls.map(([query]) => query)).toEqual([
            'CREATE CONSTRAINT credential_refresh_id_unique IF NOT EXISTS FOR (r:CredentialRefresh) REQUIRE (r.refreshId) IS UNIQUE',
            'CREATE CONSTRAINT credential_refresh_version_key_unique IF NOT EXISTS FOR (c:Credential) REQUIRE (c.refreshVersionKey) IS UNIQUE',
            'CREATE CONSTRAINT credential_refresh_idempotency_key_unique IF NOT EXISTS FOR (c:Credential) REQUIRE (c.refreshIdempotencyKey) IS UNIQUE',
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
        expect(mocks.run).toHaveBeenCalledTimes(3);
    });

    it('clears failed readiness so a later request can retry', async () => {
        const setupFailure = new Error('neo4j unavailable');
        mocks.run.mockRejectedValueOnce(setupFailure).mockResolvedValue(undefined);

        const { ensureCredentialRefreshConstraints } =
            await import('./credential-refresh-constraints');

        await expect(ensureCredentialRefreshConstraints()).rejects.toBe(setupFailure);
        await expect(ensureCredentialRefreshConstraints()).resolves.toBeUndefined();

        expect(mocks.run).toHaveBeenCalledTimes(4);
    });
});

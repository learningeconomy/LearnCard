import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TRPCError } from '@trpc/server';
import { SaIssueError } from './signingAuthority.helpers';
import {
    IssueInboxCredentialBatchValidator,
    IssueInboxCredentialBatchItemResultValidator,
} from '@learncard/types';
import type { IssueInboxCredentialBatch } from '@learncard/types';
import type { ProfileType } from 'types/profile';
import type { Context } from '@routes';
import { InboxIssuancePreflightError } from './inbox-issuance-error.helpers';
import { getInboxBatchState } from './inbox-batch-status.helpers';

const mocks = vi.hoisted(() => ({
    get: vi.fn(),
    setIfAbsent: vi.fn(),
    compareAndSet: vi.fn(),
    beforeIssue: vi.fn(),
    issue: vi.fn(),
    resolve: vi.fn(),
    assertRefresh: vi.fn(),
    refreshDigest: vi.fn(),
    skipCheckpoint: false,
}));
vi.mock('./inbox-refresh.helpers', () => ({
    assertInboxRefreshEnabled: mocks.assertRefresh,
    inboxRefreshRequestDigest: mocks.refreshDigest,
}));
vi.mock('./inbox.helpers', () => ({
    issueToInbox: async (...args: Parameters<typeof import('./inbox.helpers').issueToInbox>) => {
        // This fake models delivery after the checkpoint. The container test "retries a transient
        // signing failure before delivery" pins the real helper's signing/checkpoint ordering.
        if (!mocks.skipCheckpoint) await args[5]?.();
        const result = await mocks.issue(...args);
        if (mocks.skipCheckpoint) {
            const { InboxDeliveryCheckpointError } = await import('./inbox-issuance-error.helpers');
            throw new InboxDeliveryCheckpointError({
                issuanceId: result.inboxCredential.id,
                status: result.status,
                claimUrl: result.claimUrl,
                recipientDid: result.recipientDid,
                guardianStatus: result.guardianStatus,
            });
        }
        return result;
    },
    resolveInboxCredentialInput: mocks.resolve,
}));
import { issueInboxBatch } from './inbox-batch.helpers';
import Fastify from 'fastify';
import { configureInboxBatchBodyLimit, INBOX_BATCH_MAX_BYTES } from './inbox-batch-http.helpers';

const profile = { profileId: 'issuer' } as ProfileType;
const ctx = { domain: 'example.test' } as Context;
const credential = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential'],
    issuer: 'did:example:issuer',
    issuanceDate: '2026-01-01T00:00:00Z',
    credentialSubject: { id: 'did:example:holder' },
};
const item = (id = 'a') => ({
    recipient: { type: 'email' as const, value: `${id}@example.test` },
    credential,
});
const run = (batch: IssueInboxCredentialBatch) =>
    issueInboxBatch(profile, batch, ctx, {
        cache: mocks,
        beforeIssue: mocks.beforeIssue,
    });

describe('getInboxBatchState', () => {
    it('does not classify an empty state list as completed', () => {
        expect(getInboxBatchState([])).toBe('QUEUED');
    });

    it('uses reconciliation, completion, and progress precedence', () => {
        expect(getInboxBatchState(['QUEUED', 'NEEDS_RECONCILIATION'])).toBe('NEEDS_RECONCILIATION');
        expect(getInboxBatchState(['COMPLETED', 'COMPLETED'])).toBe('COMPLETED');
        expect(getInboxBatchState(['QUEUED', 'PROCESSING'])).toBe('PROCESSING');
    });
});

describe('inbox batch worker processing', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        mocks.get.mockResolvedValue(null);
        mocks.setIfAbsent.mockResolvedValue('OK');
        mocks.compareAndSet.mockResolvedValue(true);
        mocks.resolve.mockImplementation(async input => ({ credential: input.credential }));
        mocks.skipCheckpoint = false;
        mocks.refreshDigest.mockReturnValue('refresh-digest');
        mocks.issue.mockImplementation(async (_profile, recipient) => ({
            inboxCredential: { id: recipient.value },
            status: 'PENDING',
            claimUrl: 'https://example.test/claim',
        }));
    });

    it.each([
        { status: 400, kind: 'http_4xx' as const, retryable: false },
        { status: 503, kind: 'http_5xx' as const, retryable: true },
        { status: 429, kind: 'http_429' as const, retryable: true },
    ])(
        'preserves signing authority retryability for $status without exposing response details',
        async failure => {
            mocks.resolve.mockRejectedValue(
                new SaIssueError({
                    ...failure,
                    message: 'secret signing endpoint details',
                    body: 'private response',
                })
            );
            const result = await run({ items: [{ ...item(), idempotencyKey: 'signing' }] });
            expect(
                IssueInboxCredentialBatchItemResultValidator.parse(result.results[0])
            ).toMatchObject({
                success: false,
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to issue credential',
                    retryable: failure.retryable,
                },
            });
            expect(mocks.compareAndSet).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(String),
                null,
                259200
            );
        }
    );

    it.each(['BAD_REQUEST', 'UNAUTHORIZED', 'FORBIDDEN', 'NOT_FOUND'] as const)(
        'marks %s failures as non-retryable',
        async code => {
            mocks.resolve.mockRejectedValue(new TRPCError({ code }));
            expect((await run({ items: [item()] })).results[0]).toMatchObject({
                success: false,
                error: { code, retryable: false },
            });
        }
    );

    it('marks unknown failures as retryable', async () => {
        mocks.resolve.mockRejectedValue(new Error('transient failure'));
        expect((await run({ items: [item()] })).results[0]).toMatchObject({
            success: false,
            error: { code: 'INTERNAL_SERVER_ERROR', retryable: true },
        });
    });

    it('inherits refresh and honors item overrides including false and the top-level alias', async () => {
        const batch = IssueInboxCredentialBatchValidator.parse({
            configuration: { refresh: true },
            items: [
                item('inherit'),
                { ...item('off'), configuration: { refresh: false } },
                { ...item('alias'), refresh: false },
                { ...item('explicit'), refresh: false, configuration: { refresh: true } },
            ],
        });
        await run(batch);
        const flags = Object.fromEntries(
            mocks.issue.mock.calls.map(call => [call[1].value, call[3].refresh])
        );
        expect(flags).toEqual({
            'inherit@example.test': true,
            'off@example.test': false,
            'alias@example.test': false,
            'explicit@example.test': true,
        });
        expect(mocks.assertRefresh).toHaveBeenCalledTimes(2);
        await run(
            IssueInboxCredentialBatchValidator.parse({
                configuration: { refresh: false },
                items: [{ ...item('on'), configuration: { refresh: true } }],
            })
        );
        expect(mocks.issue.mock.calls.at(-1)?.[3].refresh).toBe(true);
    });

    it('returns and replays refresh receipts and forwards the template anchor and digest', async () => {
        const refresh = {
            refreshId: 'refresh-id',
            credentialId: 'credential-id',
            issuerDid: 'did:example:issuer',
            refreshService: {
                id: 'https://example.test/refresh',
                type: 'LearnCardCredentialRefresh2026',
            },
        };
        mocks.resolve.mockResolvedValue({ credential, resolvedBoostUri: 'boost:template' });
        mocks.issue.mockResolvedValue({
            inboxCredential: { id: 'issued' },
            status: 'PENDING',
            refresh,
        });
        const batch = IssueInboxCredentialBatchValidator.parse({
            configuration: { refresh: true },
            items: [{ ...item(), idempotencyKey: 'refresh-key' }],
        });
        const result = await run(batch);
        expect(result.results[0]).toMatchObject({ success: true, refresh });
        expect(mocks.issue.mock.calls[0]?.[3]).toMatchObject({
            refresh: true,
            boostUri: 'boost:template',
            refreshRequestDigest: 'refresh-digest',
        });
        mocks.get.mockResolvedValue(mocks.compareAndSet.mock.calls[0]![2]);
        const replay = await run(batch);
        expect(replay.results[0]).toMatchObject({ success: true, refresh, deduplicated: true });
        expect(mocks.issue).toHaveBeenCalledTimes(1);
        const changed = await run({ ...batch, configuration: { refresh: false } });
        expect(changed.results[0]).toMatchObject({
            success: false,
            error: { reason: 'IDEMPOTENCY_MISMATCH' },
        });
    });

    it('rejects unavailable refresh before resolving or issuing an item', async () => {
        mocks.assertRefresh.mockRejectedValue(new TRPCError({ code: 'UNAUTHORIZED' }));
        const result = await run({ configuration: { refresh: true }, items: [item()] });
        expect(result.results[0]).toMatchObject({
            success: false,
            error: { code: 'UNAUTHORIZED' },
        });
        expect(mocks.resolve).not.toHaveBeenCalled();
        expect(mocks.issue).not.toHaveBeenCalled();
    });

    it('isolates disabled refresh failures while issuing opted-out items', async () => {
        mocks.assertRefresh.mockRejectedValue(new TRPCError({ code: 'NOT_FOUND' }));
        const result = await run(
            IssueInboxCredentialBatchValidator.parse({
                configuration: { refresh: true },
                items: [item('refresh'), { ...item('normal'), configuration: { refresh: false } }],
            })
        );
        expect(result.results).toMatchObject([
            { success: false, error: { code: 'NOT_FOUND' } },
            { success: true, recipient: item('normal').recipient },
        ]);
        expect(mocks.issue).toHaveBeenCalledTimes(1);
        expect(mocks.issue.mock.lastCall![3].refresh).toBe(false);
    });

    it.each(['true', 1, null])(
        'rejects invalid refresh value %s at both configuration levels',
        refresh => {
            expect(
                IssueInboxCredentialBatchValidator.safeParse({
                    configuration: { refresh },
                    items: [item()],
                }).success
            ).toBe(false);
            expect(
                IssueInboxCredentialBatchValidator.safeParse({
                    items: [{ ...item(), configuration: { refresh } }],
                }).success
            ).toBe(false);
        }
    );

    it('bounds concurrency and preserves order when work completes out of order', async () => {
        let active = 0;
        let peak = 0;
        mocks.issue.mockImplementation(async (_profile, recipient) => {
            active++;
            peak = Math.max(peak, active);
            await new Promise(resolve =>
                setTimeout(resolve, recipient.value.startsWith('0') ? 20 : 1)
            );
            active--;
            return { inboxCredential: { id: recipient.value }, status: 'PENDING' };
        });
        const batch = await run({ items: Array.from({ length: 12 }, (_, i) => item(String(i))) });
        expect(peak).toBe(10);
        expect(batch.results.map(r => r.success && r.issuanceId)).toEqual(
            Array.from({ length: 12 }, (_, i) => `${i}@example.test`)
        );
    });

    it('isolates missing credentials, TRPC errors and unknown exceptions without leaking internals', async () => {
        mocks.issue
            .mockRejectedValueOnce(
                new TRPCError({ code: 'NOT_FOUND', message: 'Template not found' })
            )
            .mockRejectedValueOnce(new Error('private database connection'))
            .mockResolvedValueOnce({ inboxCredential: { id: 'success' }, status: 'PENDING' });
        const result = await run({
            items: [{ recipient: item().recipient }, item('b'), item('c'), item('d')],
        });
        expect(result.results).toMatchObject([
            { success: false, index: 0, error: { code: 'BAD_REQUEST' } },
            {
                success: false,
                index: 1,
                error: { code: 'NOT_FOUND', message: 'Template not found' },
            },
            {
                success: false,
                index: 2,
                error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to issue credential' },
            },
            { success: true, index: 3 },
        ]);
        expect(result.summary).toEqual({ total: 4, succeeded: 1, failed: 3, deduplicated: 0 });
    });

    it('deep-merges before applying defaults, replaces arrays, and leaves inputs untouched', async () => {
        const batch: IssueInboxCredentialBatch = {
            configuration: {
                signingAuthority: { endpoint: 'https://sa.test', name: 'UPPER' },
                delivery: { suppress: true, template: { model: { issuer: { name: 'Issuer' } } } },
                templateData: { student: { course: 'Math' }, grades: [1, 2] },
            },
            items: [
                {
                    ...item(),
                    configuration: {
                        delivery: { template: { model: { recipient: { name: 'Ada' } } } },
                        templateData: { student: { name: 'Ada' }, grades: [3] },
                    },
                },
            ],
        };
        const original = structuredClone(batch);
        await run(batch);
        expect(mocks.issue.mock.calls[0]?.[3]).toMatchObject({
            signingAuthority: { endpoint: 'https://sa.test', name: 'upper' },
            delivery: {
                suppress: true,
                template: { model: { issuer: { name: 'Issuer' }, recipient: { name: 'Ada' } } },
            },
            templateData: { student: { course: 'Math', name: 'Ada' }, grades: [3] },
        });
        expect(batch).toEqual(original);
    });

    it('caches only successes for 72 hours and replays using the current index', async () => {
        const batch = await run({
            items: [
                { ...item(), idempotencyKey: 'key' },
                { recipient: item('b').recipient, idempotencyKey: 'failed' },
            ],
        });
        expect(mocks.compareAndSet).toHaveBeenCalledTimes(1);
        expect(mocks.compareAndSet).toHaveBeenCalledWith(
            'inbox-batch-idem:issuer:key',
            expect.any(String),
            expect.any(String),
            259200
        );
        expect(JSON.parse(mocks.compareAndSet.mock.calls[0]![2])).toMatchObject(
            JSON.parse(JSON.stringify(batch.results[0]))
        );
        mocks.get.mockResolvedValueOnce(
            JSON.stringify({
                ...JSON.parse(mocks.compareAndSet.mock.calls[0]![2]),
                index: 99,
            })
        );
        mocks.issue.mockClear();
        const replay = await run({ items: [{ ...item(), idempotencyKey: 'key' }] });
        expect(replay.results[0]).toMatchObject({ success: true, index: 0, deduplicated: true });
        expect(mocks.issue).not.toHaveBeenCalled();
    });

    it('does not deduplicate unkeyed items', async () => {
        await run({ items: [item(), item()] });
        expect(mocks.get).not.toHaveBeenCalled();
        expect(mocks.setIfAbsent).not.toHaveBeenCalled();
        expect(mocks.issue).toHaveBeenCalledTimes(2);
    });

    it('fails closed on cache read/reservation errors and invalid replay records', async () => {
        mocks.get.mockResolvedValueOnce(undefined).mockResolvedValueOnce('invalid json');
        const items = [{ ...item(), idempotencyKey: 'a' }];
        expect((await run({ items })).summary.failed).toBe(1);
        expect((await run({ items })).summary.failed).toBe(1);
        mocks.setIfAbsent.mockResolvedValueOnce(undefined);
        expect((await run({ items })).summary.failed).toBe(1);
        expect(mocks.issue).not.toHaveBeenCalled();
    });

    it('releases reservations on preparation failure but retains ambiguous issuance outcomes', async () => {
        const items = [{ ...item(), idempotencyKey: 'a' }];
        mocks.resolve.mockRejectedValueOnce(new TRPCError({ code: 'NOT_FOUND' }));
        expect((await run({ items })).results[0]).toMatchObject({
            success: false,
            error: { code: 'NOT_FOUND' },
        });
        expect(mocks.compareAndSet).toHaveBeenCalledWith(
            expect.any(String),
            expect.any(String),
            null,
            259200
        );
        mocks.compareAndSet.mockClear();
        mocks.issue.mockRejectedValueOnce(new Error('connection lost after write'));
        expect((await run({ items })).results[0]).toMatchObject({
            success: false,
            error: { code: 'CONFLICT' },
        });
        expect(mocks.compareAndSet).not.toHaveBeenCalled();
    });

    it.each([undefined, false])(
        'preserves issuance metadata when replay commit returns %s',
        async saved => {
            mocks.compareAndSet.mockResolvedValue(saved);
            const result = await run({ items: [{ ...item(), idempotencyKey: 'a' }] });
            expect(result.results[0]).toMatchObject({
                success: false,
                error: { code: 'CONFLICT', message: expect.stringContaining('Credential issued') },
                issuanceId: 'a@example.test',
                claimUrl: 'https://example.test/claim',
            });
            expect(mocks.compareAndSet).toHaveBeenCalledTimes(saved === undefined ? 2 : 1);
            expect(mocks.issue).toHaveBeenCalledTimes(1);
        }
    );

    it('retries a transient commit failure once without issuing again', async () => {
        mocks.compareAndSet.mockResolvedValueOnce(undefined).mockResolvedValueOnce(true);
        expect((await run({ items: [{ ...item(), idempotencyKey: 'a' }] })).summary.succeeded).toBe(
            1
        );
        expect(mocks.compareAndSet).toHaveBeenCalledTimes(2);
        expect(mocks.issue).toHaveBeenCalledTimes(1);
    });

    it('recognizes a committed result when the CAS reply was lost', async () => {
        mocks.compareAndSet.mockImplementation(async (_key, _owner, value) => {
            mocks.get.mockResolvedValue(value);
            return undefined;
        });
        expect((await run({ items: [{ ...item(), idempotencyKey: 'a' }] })).summary.succeeded).toBe(
            1
        );
        expect(mocks.issue).toHaveBeenCalledTimes(1);
    });

    it.each(['FORBIDDEN', 'BAD_REQUEST', 'NOT_FOUND'] as const)(
        'releases an explicitly side-effect-free %s and allows the corrected item to retry',
        async code => {
            const items = [{ ...item(), idempotencyKey: 'preflight' }];
            mocks.issue.mockRejectedValueOnce(
                new InboxIssuancePreflightError({ code, message: 'Invalid preflight input' })
            );
            expect((await run({ items })).results[0]).toMatchObject({
                success: false,
                error: { code },
            });
            expect(mocks.compareAndSet).toHaveBeenCalledWith(
                expect.any(String),
                expect.any(String),
                null,
                259200
            );
            expect(
                (
                    await run({
                        items: [{ ...items[0]!, configuration: { delivery: { suppress: true } } }],
                    })
                ).summary.succeeded
            ).toBe(1);
        }
    );

    it('retains reservations for ordinary 4xx failures that may follow a write', async () => {
        mocks.issue.mockRejectedValueOnce(new TRPCError({ code: 'BAD_REQUEST' }));
        expect(
            (await run({ items: [{ ...item(), idempotencyKey: 'a' }] })).results[0]
        ).toMatchObject({
            success: false,
            error: { code: 'CONFLICT' },
        });
        expect(mocks.compareAndSet).not.toHaveBeenCalled();
    });

    it('rejects later duplicate keys deterministically', async () => {
        const result = await run({
            items: [
                { ...item(), idempotencyKey: 'same' },
                { ...item(), idempotencyKey: 'same' },
                { ...item('different'), idempotencyKey: 'same' },
            ],
        });
        expect(result.results).toMatchObject([
            { index: 0, success: true },
            { index: 1, success: false, error: { code: 'CONFLICT' } },
            { index: 2, success: false, error: { code: 'CONFLICT' } },
        ]);
        expect(mocks.issue).toHaveBeenCalledTimes(1);
        expect(mocks.setIfAbsent).toHaveBeenCalledTimes(1);
    });

    it('does not attempt later duplicate keys even if the first item fails validation', async () => {
        const result = await run({
            items: [
                { recipient: item().recipient, idempotencyKey: 'same' },
                { ...item(), idempotencyKey: 'same' },
            ],
        });
        expect(result.results).toMatchObject([
            { success: false, error: { code: 'BAD_REQUEST' } },
            { success: false, error: { code: 'CONFLICT' } },
        ]);
        expect(mocks.issue).not.toHaveBeenCalled();
        expect(mocks.setIfAbsent).not.toHaveBeenCalled();
    });

    it('reports a retryable conflict if the reservation disappears after SET NX contention', async () => {
        mocks.setIfAbsent.mockResolvedValueOnce(null);
        const result = await run({ items: [{ ...item(), idempotencyKey: 'a' }] });
        expect(result.results[0]).toMatchObject({
            success: false,
            error: { code: 'CONFLICT', message: expect.stringContaining('Retry this same key') },
        });
        expect(mocks.issue).not.toHaveBeenCalled();
    });

    it('rejects replay records missing the request fingerprint', async () => {
        mocks.get.mockResolvedValueOnce(
            JSON.stringify({
                success: true,
                index: 0,
                issuanceId: 'old',
                status: 'PENDING',
                recipient: item().recipient,
            })
        );
        expect((await run({ items: [{ ...item(), idempotencyKey: 'a' }] })).summary.failed).toBe(1);
        expect(mocks.issue).not.toHaveBeenCalled();
    });

    it('validates guardian self-approval after merging overrides and allows null to clear it', async () => {
        const result = await run({
            configuration: { guardianEmail: 'A@example.test' },
            items: [
                item(),
                { ...item(), configuration: { guardianEmail: 'guardian@example.test' } },
                { ...item('clear'), configuration: { guardianEmail: null } },
            ],
        });
        expect(result.results).toMatchObject([
            {
                success: false,
                error: { code: 'BAD_REQUEST', message: expect.stringContaining('self-approval') },
            },
            { success: true },
            { success: true },
        ]);
        expect(mocks.issue).toHaveBeenCalledTimes(2);
        expect(mocks.issue.mock.calls[1]?.[3]).not.toHaveProperty('guardianEmail');
    });

    it('checks the durable worker lease before entering issuance', async () => {
        mocks.beforeIssue.mockRejectedValueOnce(new Error('Lease lost'));
        expect(
            (await run({ items: [{ ...item(), idempotencyKey: 'lease' }] })).results[0]
        ).toMatchObject({ success: false });
        expect(mocks.resolve).toHaveBeenCalledTimes(1);
        expect(mocks.issue).not.toHaveBeenCalled();
        expect(mocks.compareAndSet).toHaveBeenCalledWith(
            expect.any(String),
            expect.any(String),
            null,
            259200
        );
    });

    it.each([false, true])(
        'preserves checkpoint reconciliation details when phase persistence fails: %s',
        async fails => {
            mocks.skipCheckpoint = true;
            if (fails) mocks.beforeIssue.mockRejectedValueOnce(new Error('Storage unavailable'));
            const result = await run({
                items: [{ ...item(), idempotencyKey: 'missing-checkpoint' }],
            });

            expect(result.results[0]).toMatchObject({
                success: false,
                error: {
                    code: 'CONFLICT',
                    message: expect.stringContaining('Reconcile using issuanceId'),
                },
                issuanceId: 'a@example.test',
                claimUrl: 'https://example.test/claim',
            });
            expect(mocks.beforeIssue).toHaveBeenCalledTimes(1);
            expect(mocks.compareAndSet).not.toHaveBeenCalled();
        }
    );

    it('preserves preparation errors when releasing a reservation throws', async () => {
        mocks.resolve.mockRejectedValueOnce(
            new TRPCError({ code: 'NOT_FOUND', message: 'Missing template' })
        );
        mocks.compareAndSet.mockRejectedValueOnce(new Error('Storage unavailable'));
        const result = await run({ items: [{ ...item(), idempotencyKey: 'cleanup' }] });
        expect(result.results[0]).toMatchObject({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Missing template' },
        });
        expect(mocks.issue).not.toHaveBeenCalled();
    });

    it('returns the item outcome when the lease checkpoint and cleanup both fail', async () => {
        mocks.beforeIssue.mockRejectedValueOnce(new Error('Inbox item lease lost'));
        mocks.compareAndSet.mockRejectedValueOnce(new Error('Inbox item lease lost'));
        const result = await run({ items: [{ ...item(), idempotencyKey: 'lost' }] });
        expect(result.results[0]).toMatchObject({
            success: false,
            error: { code: 'INTERNAL_SERVER_ERROR' },
        });
        expect(mocks.issue).not.toHaveBeenCalled();
    });

    it('serializes overlapping keys across requests and rejects changed payloads', async () => {
        const values = new Map<string, string>();
        mocks.get.mockImplementation(async key => values.get(key) ?? null);
        mocks.setIfAbsent.mockImplementation(async (key, value) => {
            if (values.has(key)) return null;
            values.set(key, value);
            return 'OK';
        });
        mocks.compareAndSet.mockImplementation(async (key, expected, value) => {
            if (values.get(key) !== expected) return false;
            values.set(key, value);
            return true;
        });
        const items = [{ ...item(), idempotencyKey: 'a' }];
        await Promise.all([run({ items }), run({ items })]);
        expect(mocks.issue).toHaveBeenCalledTimes(1);
        expect((await run({ items })).summary.deduplicated).toBe(1);
        expect(
            (await run({ items: [{ ...item('different'), idempotencyKey: 'a' }] })).results[0]
        ).toMatchObject({ success: false, error: { code: 'CONFLICT' } });
        expect(mocks.issue).toHaveBeenCalledTimes(1);
    });

    it('masks internal TRPC error details', async () => {
        mocks.issue.mockRejectedValueOnce(
            new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'private signing service token',
            })
        );
        expect((await run({ items: [item()] })).results[0]).toMatchObject({
            error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to issue credential' },
        });
    });

    it('applies the tested HTTP parser budget to batch routes only', async () => {
        const server = Fastify();
        configureInboxBatchBodyLimit(server);
        server.post('/api/inbox/issue-batch', async () => ({ accepted: true }));
        server.post('/api/inbox/issue', async () => ({ accepted: true }));
        server.post('/trpc/:path', async () => ({ accepted: true }));
        const payload = {
            padding: 'x'.repeat(
                INBOX_BATCH_MAX_BYTES - Buffer.byteLength(JSON.stringify({ padding: '' }))
            ),
        };
        try {
            expect(
                (await server.inject({ method: 'POST', url: '/api/inbox/issue-batch', payload }))
                    .statusCode
            ).toBe(200);
            expect(
                (await server.inject({ method: 'POST', url: '/trpc/inbox.issueBatch', payload }))
                    .statusCode
            ).toBe(200);
            expect(
                (await server.inject({ method: 'POST', url: '/api/inbox/issue', payload }))
                    .statusCode
            ).toBe(413);
            payload.padding += 'x';
            expect(
                (await server.inject({ method: 'POST', url: '/api/inbox/issue-batch', payload }))
                    .statusCode
            ).toBe(413);
        } finally {
            await server.close();
        }
    });

    it('validates item count and key length', () => {
        expect(IssueInboxCredentialBatchValidator.safeParse({ items: [] }).success).toBe(false);
        expect(
            IssueInboxCredentialBatchValidator.safeParse({ items: Array(101).fill(item()) }).success
        ).toBe(false);
        expect(
            IssueInboxCredentialBatchValidator.safeParse({ items: Array(100).fill(item()) }).success
        ).toBe(true);
        expect(
            IssueInboxCredentialBatchValidator.safeParse({
                items: [{ ...item(), idempotencyKey: 'x'.repeat(257) }],
            }).success
        ).toBe(false);
    });
});

describe('batch admission validation', () => {
    it('reports every invalid item index before processing and honors guardian overrides', () => {
        const result = IssueInboxCredentialBatchValidator.safeParse({
            configuration: { guardianEmail: 'A@example.test' },
            items: [
                { recipient: item('b').recipient },
                item(),
                { ...item(), configuration: { guardianEmail: 'guardian@example.test' } },
                { ...item('clear'), configuration: { guardianEmail: null } },
            ],
        });
        expect(result.success).toBe(false);
        if (!result.success)
            expect(result.error.issues.map(issue => issue.path)).toEqual([
                ['items', 0, 'credential'],
                ['items', 1, 'configuration', 'guardianEmail'],
            ]);
    });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TRPCError } from '@trpc/server';
import { IssueInboxCredentialBatchValidator } from '@learncard/types';
import type { IssueInboxCredentialBatch } from '@learncard/types';
import type { ProfileType } from 'types/profile';
import type { Context } from '@routes';

const mocks = vi.hoisted(() => ({
    get: vi.fn(),
    set: vi.fn(),
    setIfAbsent: vi.fn(),
    compareAndSet: vi.fn(),
    incr: vi.fn(),
    issue: vi.fn(),
    resolve: vi.fn(),
}));
vi.mock('@cache', () => ({
    default: {
        get: mocks.get,
        set: mocks.set,
        incr: mocks.incr,
        setIfAbsent: mocks.setIfAbsent,
        compareAndSet: mocks.compareAndSet,
    },
}));
vi.mock('@environment', () => ({ environment: { NODE_ENV: 'test' } }));
vi.mock('./inbox.helpers', () => ({
    issueToInbox: mocks.issue,
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
    issueInboxBatch(profile, IssueInboxCredentialBatchValidator.parse(batch), ctx);

describe('inbox batch orchestration', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        mocks.get.mockResolvedValue(null);
        mocks.set.mockResolvedValue('OK');
        mocks.setIfAbsent.mockResolvedValue('OK');
        mocks.compareAndSet.mockResolvedValue(true);
        mocks.incr.mockResolvedValue(1);
        mocks.resolve.mockImplementation(async input => ({ credential: input.credential }));
        mocks.issue.mockImplementation(async (_profile, recipient) => ({
            inboxCredential: { id: recipient.value },
            status: 'PENDING',
            claimUrl: 'https://example.test/claim',
        }));
    });
    afterEach(() => vi.unstubAllEnvs());

    it('bounds concurrency and preserves order when work completes out of order', async () => {
        vi.stubEnv('INBOX_BATCH_CONCURRENCY', '2');
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
        const batch = await run({ items: Array.from({ length: 5 }, (_, i) => item(String(i))) });
        expect(peak).toBe(2);
        expect(batch.results.map(r => r.success && r.issuanceId)).toEqual(
            Array.from({ length: 5 }, (_, i) => `${i}@example.test`)
        );
        expect(mocks.incr).toHaveBeenCalledWith('inbox-batch-rate:issuer', 3600, 5);
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

    it('caches only successes for 24 hours and replays using the current index', async () => {
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
            86400
        );
        expect(JSON.parse(mocks.compareAndSet.mock.calls[0]![2])).toMatchObject(
            JSON.parse(JSON.stringify(batch.results[0]))
        );
        mocks.get.mockResolvedValueOnce(JSON.stringify({ ...batch.results[0], index: 99 }));
        mocks.issue.mockClear();
        const replay = await run({ items: [{ ...item(), idempotencyKey: 'key' }] });
        expect(replay.results[0]).toMatchObject({ success: true, index: 0, deduplicated: true });
        expect(mocks.issue).not.toHaveBeenCalled();
    });

    it('does not deduplicate unkeyed items', async () => {
        await run({ items: [item(), item()] });
        expect(mocks.get).not.toHaveBeenCalled();
        expect(mocks.set).not.toHaveBeenCalled();
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
            86400
        );
        mocks.compareAndSet.mockClear();
        mocks.issue.mockRejectedValueOnce(new Error('connection lost after write'));
        expect((await run({ items })).results[0]).toMatchObject({
            success: false,
            error: { code: 'CONFLICT' },
        });
        expect(mocks.compareAndSet).not.toHaveBeenCalled();
    });

    it('does not report durable success if saving the replay result fails', async () => {
        mocks.compareAndSet.mockResolvedValueOnce(undefined);
        const result = await run({ items: [{ ...item(), idempotencyKey: 'a' }] });
        expect(result.results[0]).toMatchObject({ success: false, error: { code: 'CONFLICT' } });
        expect(mocks.issue).toHaveBeenCalledTimes(1);
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

    it('enforces quotas before resolution or issuance and fails closed on cache outages', async () => {
        vi.stubEnv('INBOX_BATCH_ITEMS_PER_HOUR', '2');
        mocks.incr.mockResolvedValueOnce(3).mockResolvedValueOnce(undefined);
        await expect(run({ items: [item(), item(), item()] })).rejects.toMatchObject({
            code: 'TOO_MANY_REQUESTS',
        });
        await expect(run({ items: [item()] })).rejects.toMatchObject({
            code: 'INTERNAL_SERVER_ERROR',
        });
        expect(mocks.resolve).not.toHaveBeenCalled();
        expect(mocks.issue).not.toHaveBeenCalled();
    });

    it('accepts exactly 4 MiB of serialized JSON and rejects one byte more before processing', async () => {
        const batch = { items: [item()], configuration: { templateData: { padding: '' } } };
        batch.configuration.templateData.padding = 'x'.repeat(
            INBOX_BATCH_MAX_BYTES - Buffer.byteLength(JSON.stringify(batch))
        );
        expect(Buffer.byteLength(JSON.stringify(batch))).toBe(INBOX_BATCH_MAX_BYTES);
        expect((await run(batch)).summary.succeeded).toBe(1);
        mocks.issue.mockClear();
        mocks.incr.mockClear();
        batch.configuration.templateData.padding += 'x';
        await expect(run(batch)).rejects.toMatchObject({ code: 'PAYLOAD_TOO_LARGE' });
        expect(mocks.issue).not.toHaveBeenCalled();
        expect(mocks.incr).not.toHaveBeenCalled();
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

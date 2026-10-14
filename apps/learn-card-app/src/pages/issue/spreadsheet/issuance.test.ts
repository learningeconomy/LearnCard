import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    addSubmissionAttempts,
    classifyInboxOutcome,
    executeIssuance,
    type IssuanceTransport,
} from './issuance';
import type { IssuanceRun } from './issuanceTypes';
import { makeRun, statusFor } from './fixtures.test-support';

let stored: IssuanceRun | undefined;
let latest: IssuanceRun;
const transport = (): IssuanceTransport => ({
    createTemplate: vi.fn().mockResolvedValue('lc:network:learncard.com/trpc:boost:template'),
    submit: vi.fn(async body => ({
        batchId: body.requestId!,
        status: 'QUEUED' as const,
        createdAt: new Date().toISOString(),
    })),
    wait: vi.fn(async batchId =>
        statusFor(
            batchId,
            latest.attempts.find(attempt => attempt.batchId === batchId)!.rowIds.length
        )
    ),
    sendProfile: vi.fn().mockResolvedValue({}),
});
const options = (run: IssuanceRun) => ({
    currentScope: () => run.scope,
    onChange: (next: IssuanceRun) => {
        latest = next;
    },
    save: vi.fn(async (next: IssuanceRun) => {
        stored = structuredClone(next);
    }),
    read: vi.fn(async () => stored),
});
beforeEach(() => {
    stored = undefined;
    Object.defineProperty(navigator, 'locks', {
        configurable: true,
        value: {
            request: vi.fn(
                async (_name: string, _options: unknown, callback: (lock: object) => unknown) =>
                    callback({})
            ),
        },
    });
});
describe('durable roster issuance', () => {
    it('chunks by encoded tRPC wire size, including escaped text', () => {
        const run = makeRun(2);
        run.templateUri = 'template';
        run.scopes = { text: 'shared' };
        run.shared = { text: '"'.repeat(500000) };
        expect(addSubmissionAttempts(run).attempts.map(attempt => attempt.rowIds.length)).toEqual([
            1, 1,
        ]);
        run.shared.text = '"'.repeat(1000000);
        expect(() => addSubmissionAttempts(run)).toThrow('oversize');
    });

    it('creates one template and sends 250 people as 100/100/50 with standard evidence', async () => {
        const run = makeRun(250);
        run.draft.evidence['row-0'] = 'https://proof.test/work';
        const api = transport();
        const result = await executeIssuance(run, api, options(run));
        expect(api.createTemplate).toHaveBeenCalledTimes(1);
        expect(result.attempts.map(a => a.rowIds.length)).toEqual([100, 100, 50]);
        expect(result.attempts[0].body.items[0].configuration?.templateData?.evidence).toEqual([
            { id: 'https://proof.test/work', type: ['Evidence'] },
        ]);
        expect(Object.values(result.outcomes).every(row => row.state === 'sent')).toBe(true);
    });
    it('replays the exact body after a lost admission response without recreating the template', async () => {
        const run = makeRun();
        const api = transport();
        const opts = options(run);
        vi.mocked(api.submit).mockRejectedValueOnce(new Error('lost acknowledgement'));
        await expect(executeIssuance(run, api, opts)).rejects.toThrow('lost acknowledgement');
        const first = structuredClone(stored!.attempts[0].body);
        await executeIssuance(stored!, api, opts);
        expect(api.createTemplate).toHaveBeenCalledTimes(1);
        expect(vi.mocked(api.submit).mock.calls[1][0]).toEqual(first);
    });
    it('resumes polling a known receipt after abort, without submitting again', async () => {
        const run = makeRun();
        const api = transport();
        const opts = options(run);
        vi.mocked(api.wait).mockRejectedValueOnce(new Error('aborted'));
        await expect(executeIssuance(run, api, opts)).rejects.toThrow('aborted');
        expect(stored!.attempts[0].batchId).toBeTruthy();
        await executeIssuance(stored!, api, opts);
        expect(api.submit).toHaveBeenCalledTimes(1);
    });
    it('uses a new request attempt and the same item key for definite failures only', async () => {
        const run = makeRun(2);
        const api = transport();
        const opts = options(run);
        vi.mocked(api.wait).mockResolvedValueOnce(statusFor('first', 2, [1]));
        const first = await executeIssuance(run, api, opts);
        const retry = await executeIssuance(first, api, { ...opts, retryFailed: true });
        expect(retry.attempts).toHaveLength(2);
        expect(retry.attempts[1].rowIds).toEqual(['row-1']);
        expect(retry.attempts[1].body.requestId).not.toBe(first.attempts[0].body.requestId);
        expect(retry.attempts[1].body.items[0].idempotencyKey).toBe(
            first.attempts[0].body.items[1].idempotencyKey
        );
    });
    it.each(['IN_PROGRESS', 'UNCONFIRMED', 'IDEMPOTENCY_MISMATCH', 'DUPLICATE_KEY'] as const)(
        'keeps %s out of safe retries',
        reason => {
            const outcome = classifyInboxOutcome({
                index: 0,
                state: 'COMPLETED',
                result: {
                    success: false,
                    index: 0,
                    error: { code: 'CONFLICT', message: 'review', reason },
                },
            });
            expect(outcome.state).toBe('confirming');
            const run = makeRun();
            run.outcomes['row-0'] = outcome;
            run.templateUri = 'template';
            expect(addSubmissionAttempts(run, true).attempts).toHaveLength(0);
        }
    );
    it('treats a reported issuanceId as uncertain even when the item reports failure', () => {
        expect(
            classifyInboxOutcome({
                index: 0,
                state: 'COMPLETED',
                result: {
                    success: false,
                    index: 0,
                    issuanceId: 'created',
                    error: { code: 'INTERNAL_SERVER_ERROR', message: 'storage failed' },
                },
            }).state
        ).toBe('confirming');
    });
    it('fails closed when IndexedDB cannot commit before admission', async () => {
        const run = makeRun();
        const api = transport();
        const opts = options(run);
        opts.save.mockRejectedValue(new Error('disk full'));
        await expect(executeIssuance(run, api, opts)).rejects.toThrow('disk full');
        expect(api.createTemplate).not.toHaveBeenCalled();
        expect(api.submit).not.toHaveBeenCalled();
    });
    it('retains the last committed revision if saving a receipt fails', async () => {
        const run = makeRun();
        const api = transport();
        const opts = options(run);
        opts.save
            .mockImplementationOnce(async next => {
                stored = structuredClone(next);
            })
            .mockImplementationOnce(async next => {
                stored = structuredClone(next);
            })
            .mockImplementationOnce(async next => {
                stored = structuredClone(next);
            })
            .mockRejectedValueOnce(new Error('quota'));
        await expect(executeIssuance(run, api, opts)).rejects.toThrow('quota');
        expect(latest.updatedAt).toBe(stored!.updatedAt);
        await executeIssuance(latest, api, opts);
        expect(api.submit).toHaveBeenCalledTimes(1);
    });
    it('stops before the next chunk when the issuer changes', async () => {
        const run = makeRun(101);
        const api = transport();
        const opts = options(run);
        let scope = run.scope;
        vi.mocked(api.wait).mockImplementationOnce(async batchId => {
            scope = { ...scope, issuer: 'did:web:other.test' };
            return statusFor(batchId, 100);
        });
        await expect(
            executeIssuance(run, api, { ...opts, currentScope: () => scope })
        ).rejects.toThrow('context');
        expect(api.submit).toHaveBeenCalledTimes(1);
    });
    it('does not resend a profile after a lost response', async () => {
        const run = makeRun(0);
        run.draft.recipients = [
            { kind: 'profile', profileId: 'ada', displayName: 'Ada', rowId: 'ada' },
        ];
        const api = transport();
        const opts = options(run);
        vi.mocked(api.sendProfile).mockRejectedValue(new Error('lost'));
        const first = await executeIssuance(run, api, opts);
        expect(first.outcomes.ada.state).toBe('confirming');
        await executeIssuance(first, api, { ...opts, retryFailed: true });
        expect(api.sendProfile).toHaveBeenCalledTimes(1);
    });
    it('refuses expired unacknowledged attempts and concurrent tabs', async () => {
        const run = makeRun();
        run.templateUri = 'template';
        const queued = addSubmissionAttempts(run);
        queued.attempts[0].createdAt = Date.now() - 25 * 3600000;
        const api = transport();
        await expect(executeIssuance(queued, api, options(queued))).rejects.toThrow('expired');
        expect(api.submit).not.toHaveBeenCalled();
        vi.mocked(navigator.locks.request).mockImplementationOnce(
            async (_name: unknown, _opts: unknown, callback: LockGrantedCallback<unknown>) =>
                callback(null)
        );
        await expect(executeIssuance(run, api, options(run))).rejects.toThrow('busy');
    });
});

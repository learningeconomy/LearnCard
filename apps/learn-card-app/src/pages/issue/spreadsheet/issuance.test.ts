import { writeResult } from '../components/resultField';
import { dynamicField } from '../../appStoreDeveloper/partner-onboarding/components/CredentialBuilder/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    addSubmissionAttempts,
    canRemoveIssuanceRow,
    canReplaceIssuanceRecipients,
    classifyInboxOutcome,
    canCheckIssuanceStatus,
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
    it('checks terminal unconfirmed receipts without submitting, retrying, or overwriting a newer attempt', async () => {
        const run = makeRun(2);
        const api = transport();
        const opts = options(run);
        const pending = statusFor('original', 2, [0, 1]);
        pending.items[0].result = {
            success: false,
            index: 0,
            error: { code: 'CONFLICT', reason: 'UNCONFIRMED', message: 'review' },
        };
        vi.mocked(api.wait).mockResolvedValueOnce(pending);
        const initial = await executeIssuance(run, api, opts);
        const retried = await executeIssuance(initial, api, { ...opts, retryFailed: true });
        expect(retried.outcomes['row-1'].state).toBe('sent');
        expect(canCheckIssuanceStatus(retried)).toBe(true);
        // An unrelated unsent row and uncertain profile must not be sent by checking.
        retried.draft.recipients.push({
            kind: 'profile',
            rowId: 'profile',
            profileId: 'profile',
            displayName: 'Profile',
        });
        retried.outcomes.profile = { state: 'confirming' };
        retried.draft.recipients.push({ kind: 'email', rowId: 'new', email: 'new@test.com' });
        retried.outcomes.new = { state: 'ready' };
        const originalBodies = structuredClone(retried.attempts.map(attempt => attempt.body));
        const reconciled = structuredClone(pending);
        reconciled.items[0] = statusFor('original', 2).items[0];
        vi.mocked(api.wait).mockResolvedValueOnce(reconciled);
        const checked = await executeIssuance(retried, api, { ...opts, checkOnly: true });
        expect(checked.outcomes['row-0'].state).toBe('sent');
        expect(checked.outcomes['row-1'].state).toBe('sent');
        expect(checked.outcomes.profile.state).toBe('confirming');
        expect(checked.outcomes.new.state).toBe('ready');
        expect(checked.attempts.map(attempt => attempt.body)).toEqual(originalBodies);
        expect(api.submit).toHaveBeenCalledTimes(2);
        expect(api.createTemplate).toHaveBeenCalledOnce();
        expect(api.sendProfile).not.toHaveBeenCalled();
        expect(canCheckIssuanceStatus(checked)).toBe(false);
    });
    it('Retry Failed leaves newly added email and profile recipients unattempted', async () => {
        const run = makeRun(2);
        run.outcomes['row-0'] = { state: 'failed' };
        run.draft.recipients.push({
            kind: 'profile',
            rowId: 'new-profile',
            profileId: 'new-profile',
            displayName: 'New',
        });
        run.draft.recipients.push({
            kind: 'profile',
            rowId: 'failed-profile',
            profileId: 'failed-profile',
            displayName: 'Failed',
        });
        run.outcomes['failed-profile'] = { state: 'failed' };
        const api = transport();
        const opts = options(run);
        const retried = await executeIssuance(run, api, { ...opts, retryFailed: true });
        expect(retried.attempts.flatMap(attempt => attempt.rowIds)).toEqual(['row-0']);
        expect(api.sendProfile).toHaveBeenCalledExactlyOnceWith(
            'failed-profile',
            expect.any(String),
            expect.any(Object)
        );
        expect(retried.outcomes['row-1']).toBeUndefined();
        expect(retried.outcomes['new-profile']).toBeUndefined();
        const resumed = await executeIssuance(retried, api, opts);
        expect(resumed.outcomes['row-1'].state).toBe('sent');
        expect(resumed.outcomes['new-profile'].state).toBe('sent');
    });
    it.each([false, true])(
        'blocks invalid result ranges at the controller (retry=%s)',
        async retryFailed => {
            const run = makeRun();
            run.template = writeResult(run.template, {
                resultType: 'Percent',
                value: dynamicField('percent'),
                valueMin: '0',
                valueMax: '100',
            });
            run.scopes = { percent: 'perRecipient' };
            run.draft.values = { 'row-0': { percent: '101' } };
            run.outcomes['row-0'] = { state: retryFailed ? 'failed' : 'ready' };
            const api = transport();
            await expect(
                executeIssuance(run, api, { ...options(run), retryFailed })
            ).rejects.toThrow('mapping');
            expect(api.createTemplate).not.toHaveBeenCalled();
            expect(api.submit).not.toHaveBeenCalled();
        }
    );
    it.each([false, true])(
        'blocks over-limit descriptions before submission (retry=%s)',
        async retryFailed => {
            const run = makeRun();
            run.template.credentialSubject.achievement.description = dynamicField('description');
            run.scopes = { description: 'perRecipient' };
            run.draft.values = { 'row-0': { description: 'x'.repeat(5001) } };
            run.outcomes['row-0'] = { state: retryFailed ? 'failed' : 'ready' };
            const api = transport();
            await expect(
                executeIssuance(run, api, { ...options(run), retryFailed })
            ).rejects.toThrow('textLength');
            expect(api.createTemplate).not.toHaveBeenCalled();
            expect(api.submit).not.toHaveBeenCalled();
            expect(run.draft.values['row-0'].description).toHaveLength(5001);
        }
    );
    it('revalidates rows that become failed while polling an existing receipt', async () => {
        let run = makeRun();
        run.templateUri = 'template';
        run = addSubmissionAttempts(run);
        run.attempts[0].batchId = 'existing';
        run.outcomes['row-0'] = { state: 'confirming' };
        run.template = writeResult(run.template, {
            resultType: 'Percent',
            value: dynamicField('percent'),
            valueMin: '0',
            valueMax: '100',
        });
        run.scopes = { percent: 'perRecipient' };
        run.draft.values = { 'row-0': { percent: '101' } };
        const api = transport();
        vi.mocked(api.wait).mockResolvedValue(statusFor('existing', 1, [0]));
        await expect(
            executeIssuance(run, api, { ...options(run), retryFailed: true })
        ).rejects.toThrow('mapping');
        expect(api.wait).toHaveBeenCalledOnce();
        expect(api.submit).not.toHaveBeenCalled();
    });
    it('does not create a template or send a profile while checking an unsent draft', async () => {
        const run = makeRun();
        const api = transport();
        await executeIssuance(run, api, { ...options(run), checkOnly: true });
        expect(api.createTemplate).not.toHaveBeenCalled();
        expect(api.submit).not.toHaveBeenCalled();
        expect(api.wait).not.toHaveBeenCalled();
    });
    it.each(['ready', 'failed', 'confirming'] as const)(
        'validates later results before sending a %s row, including after reconciliation',
        async state => {
            let run = makeRun();
            run.templateUri = 'template';
            run.template = writeResult(run.template, {
                resultType: 'RawScore',
                value: dynamicField('score'),
            });
            run.template = writeResult(
                run.template,
                { resultType: 'Percent', value: dynamicField('percent') },
                1
            );
            run.scopes = { score: 'perRecipient', percent: 'perRecipient' };
            run.draft.values = { 'row-0': { score: '10', percent: '101' } };
            if (state === 'confirming') {
                run = addSubmissionAttempts(run);
                run.attempts[0].batchId = 'existing';
            }
            run.outcomes['row-0'] = { state };
            const api = transport();
            vi.mocked(api.wait).mockResolvedValue(statusFor('existing', 1, [0]));
            await expect(
                executeIssuance(run, api, { ...options(run), retryFailed: state !== 'ready' })
            ).rejects.toThrow('mapping');
            expect(api.submit).not.toHaveBeenCalled();
            expect(api.sendProfile).not.toHaveBeenCalled();
            expect(api.wait).toHaveBeenCalledTimes(state === 'confirming' ? 1 : 0);
        }
    );
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
    it('resumes never-submitted chunks after 25 hours while quarantining the lost acknowledgement', async () => {
        const run = makeRun(250);
        const api = transport();
        const opts = options(run);
        vi.mocked(api.submit).mockRejectedValueOnce(new Error('lost acknowledgement'));
        await expect(executeIssuance(run, api, opts)).rejects.toThrow('lost acknowledgement');
        const frozen = structuredClone(stored!.attempts.map(attempt => attempt.body));
        expect(stored!.attempts.map(attempt => attempt.submissionStartedAt)).toEqual([
            expect.any(Number),
            null,
            null,
        ]);
        stored!.attempts[0].submissionStartedAt = Date.now() - 25 * 3_600_000;
        for (const attempt of stored!.attempts) attempt.createdAt = Date.now() - 25 * 3_600_000;
        const result = await executeIssuance(stored!, api, opts);
        expect(
            Object.values(result.outcomes).filter(row => row.state === 'confirming')
        ).toHaveLength(100);
        expect(Object.values(result.outcomes).filter(row => row.state === 'sent')).toHaveLength(
            150
        );
        expect(vi.mocked(api.submit).mock.calls.map(([body]) => body)).toEqual(frozen);
        expect(result.attempts.map(attempt => attempt.body)).toEqual(frozen);
    });
    it('does not admit frozen but never-submitted chunks through Retry Failed', async () => {
        const run = makeRun(250);
        const api = transport();
        const opts = options(run);
        vi.mocked(api.submit).mockRejectedValueOnce(new Error('lost acknowledgement'));
        await expect(executeIssuance(run, api, opts)).rejects.toThrow('lost acknowledgement');
        stored!.attempts[0].submissionStartedAt = Date.now() - 25 * 3_600_000;
        const retried = await executeIssuance(stored!, api, { ...opts, retryFailed: true });
        expect(api.submit).toHaveBeenCalledOnce();
        expect(retried.attempts.slice(1).map(attempt => attempt.submissionStartedAt)).toEqual([
            null,
            null,
        ]);
        expect(retried.outcomes['row-100'].state).toBe('queued');
    });
    it('requires a durable admission marker before the network call', async () => {
        const run = makeRun();
        const api = transport();
        const opts = options(run);
        opts.save.mockImplementation(async next => {
            if (next.attempts.some(attempt => typeof attempt.submissionStartedAt === 'number'))
                throw new Error('disk full');
            stored = structuredClone(next);
        });
        await expect(executeIssuance(run, api, opts)).rejects.toThrow('disk full');
        expect(api.submit).not.toHaveBeenCalled();
        expect(stored!.attempts[0].submissionStartedAt).toBeNull();
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
    it.each(['BAD_REQUEST', 'UNAUTHORIZED', 'FORBIDDEN', 'TOO_MANY_REQUESTS'])(
        'preserves lost-acknowledgement uncertainty when a replay returns %s',
        async code => {
            const run = makeRun(1);
            const api = transport();
            const opts = options(run);
            vi.mocked(api.submit).mockRejectedValueOnce(new Error('lost acknowledgement'));
            await expect(executeIssuance(run, api, opts)).rejects.toThrow('lost acknowledgement');
            const original = structuredClone(stored!.attempts[0].body);
            const denied = Object.assign(new Error('replay rejected'), { data: { code } });
            vi.mocked(api.submit).mockRejectedValueOnce(denied);
            await expect(executeIssuance(stored!, api, opts)).rejects.toThrow('replay rejected');
            expect(stored!.outcomes['row-0'].state).toBe('queued');
            expect(stored!.attempts[0].done).not.toBe(true);
            expect(stored!.attempts[0].body).toEqual(original);
            stored!.attempts[0].submissionStartedAt = Date.now() - 25 * 3_600_000;
            const expired = await executeIssuance(stored!, api, { ...opts, retryFailed: true });
            expect(expired.outcomes['row-0']).toMatchObject({
                state: 'confirming',
                error: { reason: 'EXPIRED' },
            });
            expect(api.submit).toHaveBeenCalledTimes(2);
            expect(stored!.attempts).toHaveLength(1);
        }
    );
    it('permits a new attempt after a definite rejection of the first submission', async () => {
        const run = makeRun(1);
        const api = transport();
        const opts = options(run);
        vi.mocked(api.submit).mockRejectedValueOnce({ data: { code: 'FORBIDDEN' } });
        const rejected = await executeIssuance(run, api, opts);
        expect(rejected.outcomes['row-0'].state).toBe('failed');
        expect(rejected.attempts[0].done).toBe(true);
        const retried = await executeIssuance(rejected, api, { ...opts, retryFailed: true });
        expect(retried.outcomes['row-0'].state).toBe('sent');
        expect(retried.attempts).toHaveLength(2);
    });
    it('retains attempted failed rows while allowing their corrections and pre-admission skips', async () => {
        const run = makeRun(2);
        expect(canReplaceIssuanceRecipients(run, run.draft.recipients.slice(0, 1))).toBe(true);
        const api = transport();
        vi.mocked(api.wait).mockResolvedValueOnce(statusFor('first', 2, [1]));
        const result = await executeIssuance(run, api, options(run));
        expect(canRemoveIssuanceRow(result, 'row-1')).toBe(false);
        expect(canReplaceIssuanceRecipients(result, result.draft.recipients.slice(0, 1))).toBe(
            false
        );
        const corrected = result.draft.recipients.map(row =>
            row.kind === 'email' && row.rowId === 'row-1'
                ? { ...row, email: 'corrected@test.com' }
                : row
        );
        expect(canReplaceIssuanceRecipients(result, corrected)).toBe(true);
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
    it('continues unrelated retries and new chunks without replaying an expired request', async () => {
        let run = makeRun();
        run.templateUri = 'template';
        run = addSubmissionAttempts(run);
        run.attempts[0].submissionStartedAt = Date.now() - 25 * 3_600_000;
        const frozen = structuredClone(run.attempts[0].body);
        run.draft.recipients.push(
            { kind: 'email', rowId: 'failed', email: 'failed@test.com' },
            { kind: 'email', rowId: 'ready', email: 'ready@test.com' }
        );
        run.outcomes.failed = { state: 'failed' };
        const api = transport();
        const opts = options(run);
        const retried = await executeIssuance(run, api, { ...opts, retryFailed: true });
        expect(retried.outcomes.failed.state).toBe('sent');
        expect(retried.outcomes['row-0'].state).toBe('confirming');
        expect(api.submit).toHaveBeenCalledOnce();
        const resumed = await executeIssuance(retried, api, opts);
        expect(resumed.outcomes.ready.state).toBe('sent');
        expect(resumed.attempts[0].body).toEqual(frozen);
        expect(api.submit).toHaveBeenCalledTimes(2);
        expect(api.submit).not.toHaveBeenCalledWith(frozen);
    });
    it('quarantines expired unacknowledged attempts and rejects concurrent tabs', async () => {
        const run = makeRun();
        run.templateUri = 'template';
        const queued = addSubmissionAttempts(run);
        queued.attempts[0].createdAt = Date.now() - 25 * 3600000;
        delete queued.attempts[0].submissionStartedAt; // Legacy record: admission is unknown.
        const api = transport();
        const expired = await executeIssuance(queued, api, options(queued));
        expect(expired.outcomes['row-0']).toMatchObject({
            state: 'confirming',
            error: { reason: 'EXPIRED' },
        });
        expect(api.submit).not.toHaveBeenCalled();
        vi.mocked(navigator.locks.request).mockImplementationOnce(
            async (_name: unknown, _opts: unknown, callback: LockGrantedCallback<unknown>) =>
                callback(null)
        );
        await expect(executeIssuance(run, api, options(run))).rejects.toThrow('busy');
    });
});

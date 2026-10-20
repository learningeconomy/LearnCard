import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import {
    saveIssuanceRun,
    readIssuanceRun,
    listIssuanceRuns,
    pruneIssuanceRuns,
} from './issuanceStore';
import { addSubmissionAttempts } from './issuance';
import { makeRun } from './fixtures.test-support';

describe('IndexedDB issuance recovery', () => {
    it('commits the draft, raw spreadsheet and outcomes within its issuer/network/tenant scope', async () => {
        const run = makeRun();
        await saveIssuanceRun(run);
        expect(await readIssuanceRun(run.id, run.scope)).toEqual(run);
        expect((await listIssuanceRuns(run.scope)).map(item => item.id)).toContain(run.id);
        for (const field of ['issuer', 'domain', 'tenant'] as const)
            expect(
                await readIssuanceRun(run.id, { ...run.scope, [field]: 'other' })
            ).toBeUndefined();
    });
    it.each([null, 123456, undefined])(
        'preserves admission marker %s, including unknown legacy records',
        async marker => {
            const initial = makeRun();
            initial.templateUri = 'template';
            const run = addSubmissionAttempts(initial);
            if (marker === undefined) delete run.attempts[0].submissionStartedAt;
            else run.attempts[0].submissionStartedAt = marker;
            await saveIssuanceRun(run);
            expect(await readIssuanceRun(run.id, run.scope)).toEqual(run);
        }
    );
    it('rejects corrupt records instead of substituting a fresh run', async () => {
        const run = makeRun();
        await expect(
            saveIssuanceRun({ ...run, version: 2 } as unknown as typeof run)
        ).rejects.toThrow('corrupt');
    });
    it('prunes settled old runs but retains uncertain tombstones', async () => {
        const settled = makeRun();
        settled.updatedAt = Date.now() - 31 * 86400000;
        settled.outcomes = { 'row-0': { state: 'sent' } };
        await saveIssuanceRun(settled);
        const uncertain = makeRun();
        uncertain.updatedAt = settled.updatedAt;
        uncertain.outcomes = { 'row-0': { state: 'confirming' } };
        uncertain.dismissedAt = Date.now();
        await saveIssuanceRun(uncertain);
        await pruneIssuanceRuns(settled.scope);
        expect(await readIssuanceRun(settled.id, settled.scope)).toBeUndefined();
        expect(await readIssuanceRun(uncertain.id, uncertain.scope)).toBeTruthy();
        expect((await readIssuanceRun(uncertain.id, uncertain.scope))?.dismissedAt).toBe(
            uncertain.dismissedAt
        );
    });
});

import { addSubmissionAttempts, canReplaceIssuanceRecipients } from './issuance';
import { mergeSpreadsheet, exportRosterCsv } from './roster';
import { parseSpreadsheet, readSpreadsheetText } from './parseSpreadsheet';
import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import {
    saveIssuanceRun,
    readIssuanceRun,
    listIssuanceRuns,
    pruneIssuanceRuns,
} from './issuanceStore';
import { makeRun } from './fixtures.test-support';

describe('IndexedDB issuance recovery', () => {
    it('retains an explicit unselected template state for spreadsheet-first recovery', async () => {
        const run = makeRun();
        run.templateSelected = false;
        await saveIssuanceRun(run);
        expect((await readIssuanceRun(run.id, run.scope))?.templateSelected).toBe(false);
    });
    it('retains failed row history through correction, recovery and a new retry attempt', async () => {
        const initial = makeRun(2);
        initial.templateUri = 'lc:network:example.com:boost:template';
        const run = addSubmissionAttempts(initial);
        run.attempts[0].done = true;
        run.outcomes = { 'row-0': { state: 'sent' }, 'row-1': { state: 'failed' } };
        await saveIssuanceRun(run);
        expect(canReplaceIssuanceRecipients(run, run.draft.recipients.slice(0, 1))).toBe(false);
        const originalBody = structuredClone(run.attempts[0].body);
        run.draft.recipients = run.draft.recipients.map(row =>
            row.kind === 'email' && row.rowId === 'row-1'
                ? { ...row, email: 'corrected@test.com' }
                : row
        );
        await saveIssuanceRun(run);
        const restored = (await readIssuanceRun(run.id, run.scope))!;
        const retry = addSubmissionAttempts(restored, true);
        expect(retry.attempts[0].body).toEqual(originalBody);
        expect(retry.attempts[1].body.items[0].recipient).toEqual({
            type: 'email',
            value: 'corrected@test.com',
        });
        expect(retry.attempts[1].rowIds).toEqual(['row-1']);
        await expect(saveIssuanceRun(retry)).resolves.toBeUndefined();
    });
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
    it('recovers 250 source rows and exact frozen request bodies without validation defaults changing them', async () => {
        const run = makeRun(0);
        const text =
            'Email,Name,Value\n' +
            Array.from(
                { length: 250 },
                (_, index) =>
                    `person${index}@test.com,Person ${index},${'value'.repeat(200)}${index}`
            ).join('\n');
        run.draft = mergeSpreadsheet(run.draft, parseSpreadsheet(readSpreadsheetText(text)), [
            'Value',
        ]).draft;
        run.scopes = { Value: 'perRecipient' };
        run.templateUri = 'lc:network:example.com:boost:template';
        const queued = addSubmissionAttempts(run);
        await saveIssuanceRun(queued);
        const restored = await readIssuanceRun(run.id, run.scope);
        expect(restored?.attempts.map(attempt => attempt.body)).toEqual(
            queued.attempts.map(attempt => attempt.body)
        );
        expect(restored?.draft.source).toEqual(queued.draft.source);
        const changed = structuredClone(queued);
        changed.attempts[0].rowIds[0] = 'foreign-row';
        await expect(saveIssuanceRun(changed)).rejects.toThrow('corrupt');
    });

    it('retains the reserved table evidence column across CSV import and native recovery', async () => {
        const run = makeRun();
        run.draft.evidence['row-0'] = 'https://proof.test/extra';
        const csv = exportRosterCsv(run.draft, [], {}, {});
        run.draft = mergeSpreadsheet(
            run.draft,
            parseSpreadsheet(readSpreadsheetText(csv)),
            []
        ).draft;
        expect(run.draft.source!.rowEvidenceColumn).toBe('column-2');
        await saveIssuanceRun(run);
        const restored = await readIssuanceRun(run.id, run.scope);
        expect(restored!.draft.source!.rowEvidenceColumn).toBe('column-2');
        expect(restored!.draft.evidence).toEqual(run.draft.evidence);
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

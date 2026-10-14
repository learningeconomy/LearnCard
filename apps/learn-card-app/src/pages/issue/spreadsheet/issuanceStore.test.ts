import { addSubmissionAttempts } from './issuance';
import { mergeSpreadsheet } from './roster';
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
        await saveIssuanceRun(uncertain);
        await pruneIssuanceRuns(settled.scope);
        expect(await readIssuanceRun(settled.id, settled.scope)).toBeUndefined();
        expect(await readIssuanceRun(uncertain.id, uncertain.scope)).toBeTruthy();
    });
});

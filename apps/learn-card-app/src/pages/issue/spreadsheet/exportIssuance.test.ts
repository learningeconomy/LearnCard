import Papa from 'papaparse';
import { describe, expect, it } from 'vitest';
import { exportIssuanceCsv } from './exportIssuance';
import { makeRun } from './fixtures.test-support';
import { EXPORT_ROW_COLUMN, EXPORT_RUN_COLUMN } from './types';

const rows = (csv: string) =>
    Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true }).data;
describe('issuance CSV downloads', () => {
    it('exports only definite failures with friendly problems, stable identities and effective values', () => {
        const run = makeRun(5);
        run.scopes = { course: 'shared', score: 'perRecipient' };
        run.shared = { course: 'Biology' };
        run.draft.values = { 'row-1': { score: '0' } };
        run.draft.evidence = { 'row-1': 'https://proof.test/work' };
        run.outcomes = {
            'row-0': { state: 'sent' },
            'row-1': {
                state: 'failed',
                error: { code: 'BAD_REQUEST', message: 'Recipient not found: internal details' },
            },
            'row-2': { state: 'confirming' },
            'row-3': { state: 'queued' },
            'row-4': { state: 'ready' },
        };
        const output = rows(exportIssuanceCsv(run, ['course', 'score'], true));
        expect(output).toHaveLength(1);
        expect(output[0]).toMatchObject({
            'Recipient Email': 'person1@test.com',
            course: 'Biology',
            score: '0',
            Evidence: 'https://proof.test/work',
            [EXPORT_ROW_COLUMN]: 'row-1',
            [EXPORT_RUN_COLUMN]: run.id,
        });
        expect(output[0].Problem).toBe(
            "We couldn't reach one of your recipients. Double-check the names or emails and try again."
        );
        expect(JSON.stringify(output)).not.toContain('internal details');
    });
    it('does not turn confirming rows into failures or add an example to an empty failure download', () => {
        const run = makeRun();
        run.outcomes = { 'row-0': { state: 'confirming' } };
        expect(rows(exportIssuanceCsv(run, [], true))).toHaveLength(0);
    });
    it('exports every selected row for a normal download without a Problem column', () => {
        const run = makeRun(2);
        run.outcomes = { 'row-0': { state: 'failed' }, 'row-1': { state: 'confirming' } };
        const output = rows(exportIssuanceCsv(run, []));
        expect(output).toHaveLength(2);
        expect(output[0]).not.toHaveProperty('Problem');
    });
    it('keeps admitted values frozen even when a shared value is corrected for failed rows', () => {
        const run = makeRun(3);
        run.scopes = { course: 'shared' };
        run.shared = { course: 'Corrected' };
        run.outcomes = {
            'row-0': { state: 'sent', templateData: { course: 'Original' } },
            'row-1': { state: 'failed', templateData: { course: 'Original' } },
            'row-2': { state: 'confirming' },
        };
        run.attempts = [
            {
                id: 'attempt',
                createdAt: Date.now(),
                rowIds: ['row-2'],
                body: {
                    items: [
                        {
                            recipient: { type: 'email', value: 'person2@test.com' },
                            templateUri: 'template',
                            configuration: { templateData: { course: 'Original' } },
                        },
                    ],
                },
            },
        ];
        expect(rows(exportIssuanceCsv(run, ['course'])).map(row => row.course)).toEqual([
            'Original',
            'Corrected',
            'Original',
        ]);
    });
});
